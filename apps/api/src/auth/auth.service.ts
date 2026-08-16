import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { EmailService } from "../email/email.service.js";
import type { AcceptInvitationDto } from "./dto/accept-invitation.dto.js";
import type { CompletePasswordResetDto } from "./dto/complete-password-reset.dto.js";
import type { CreateInvitationDto } from "./dto/create-invitation.dto.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { RequestPasswordResetDto } from "./dto/request-password-reset.dto.js";
import type { UpdateRecoveryEmailDto } from "./dto/update-recovery-email.dto.js";

type Role = "Organization Administrator" | "Domain Manager" | "Viewer";

type PasswordRecord = {
  salt: string;
  hash: string;
};

type UserRecord = {
  email: string;
  name: string;
  role: Role;
  organization: string;
  password: PasswordRecord;
  recoveryEmail: string;
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
};

type InvitationRecord = {
  tokenHash: string;
  email: string;
  name: string;
  role: Role;
  organization: string;
  personalMessage: string;
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
};

type ResetRecord = {
  tokenHash: string;
  userEmail: string;
  expiresAt: string;
  createdAt: string;
};

type LegacyStoredAuthState = {
  version: 1;
  email: string;
  password: PasswordRecord;
  recoveryEmail?: string;
  reset?: { tokenHash: string; expiresAt: string } | null;
  updatedAt: string;
};

type StoredAuthState = {
  version: 2;
  users: UserRecord[];
  invitations: InvitationRecord[];
  resets: ResetRecord[];
  updatedAt: string;
};

export type LoginResult = {
  authenticated: boolean;
  user?: {
    email: string;
    name: string;
    role: Role;
    organization: string;
  };
  message?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  private statePath(): string {
    return this.config.get<string>("AUTH_STATE_PATH")?.trim() || "/var/lib/domain-manager/demo-auth.json";
  }

  private adminEmail(): string {
    return (this.config.get<string>("DEMO_ADMIN_EMAIL")?.trim() || "admin@domainmanager.local").toLowerCase();
  }

  private initialPassword(): string {
    return this.config.get<string>("DEMO_ADMIN_INITIAL_PASSWORD")?.trim() || "Admin123!";
  }

  private publicWebUrl(): string {
    return (this.config.get<string>("WEB_PUBLIC_URL")?.trim() || "http://localhost:3000").replace(/\/$/, "");
  }

  private hashPassword(password: string, salt = randomBytes(16).toString("hex")): PasswordRecord {
    const hash = scryptSync(password, salt, 64).toString("hex");
    return { salt, hash };
  }

  private verifyPassword(password: string, record: PasswordRecord): boolean {
    const expected = Buffer.from(record.hash, "hex");
    const actual = scryptSync(password, record.salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private passwordPolicy(password: string): boolean {
    return password.length >= 10
      && /[a-z]/.test(password)
      && /[A-Z]/.test(password)
      && /\d/.test(password)
      && /[^A-Za-z0-9]/.test(password);
  }

  private async writeState(state: StoredAuthState): Promise<void> {
    const path = this.statePath();
    const temporaryPath = `${path}.${process.pid}.tmp`;
    await mkdir(dirname(path), { recursive: true });
    await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temporaryPath, path);
  }

  private initialAdmin(): UserRecord {
    const now = new Date().toISOString();
    return {
      email: this.adminEmail(),
      name: "Mario Rossi",
      role: "Organization Administrator",
      organization: "Acme S.p.A.",
      password: this.hashPassword(this.initialPassword()),
      recoveryEmail: this.config.get<string>("DEMO_ADMIN_RECOVERY_EMAIL")?.trim().toLowerCase() || "",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
  }

  private async ensureState(): Promise<StoredAuthState> {
    try {
      const raw = await readFile(this.statePath(), "utf8");
      const parsed = JSON.parse(raw) as StoredAuthState | LegacyStoredAuthState;
      if (parsed.version === 2 && Array.isArray(parsed.users)) {
        return {
          ...parsed,
          invitations: Array.isArray(parsed.invitations) ? parsed.invitations : [],
          resets: Array.isArray(parsed.resets) ? parsed.resets : [],
        };
      }
      if (parsed.version === 1 && parsed.email && parsed.password?.salt && parsed.password?.hash) {
        const now = new Date().toISOString();
        const migrated: StoredAuthState = {
          version: 2,
          users: [{
            email: parsed.email.toLowerCase(),
            name: "Mario Rossi",
            role: "Organization Administrator",
            organization: "Acme S.p.A.",
            password: parsed.password,
            recoveryEmail: typeof parsed.recoveryEmail === "string" ? parsed.recoveryEmail : "",
            status: "active",
            createdAt: now,
            updatedAt: parsed.updatedAt || now,
          }],
          invitations: [],
          resets: parsed.reset ? [{
            tokenHash: parsed.reset.tokenHash,
            userEmail: parsed.email.toLowerCase(),
            expiresAt: parsed.reset.expiresAt,
            createdAt: now,
          }] : [],
          updatedAt: now,
        };
        await this.writeState(migrated);
        return migrated;
      }
    } catch {
      // First start or invalid demo state: initialize a clean persistent state.
    }

    const now = new Date().toISOString();
    const state: StoredAuthState = {
      version: 2,
      users: [this.initialAdmin()],
      invitations: [],
      resets: [],
      updatedAt: now,
    };
    await this.writeState(state);
    return state;
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const state = await this.ensureState();
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = state.users.find((item) => item.email === normalizedEmail && item.status === "active");
    if (!user || !this.verifyPassword(dto.password, user.password)) {
      return { authenticated: false, message: "Credenziali non valide." };
    }

    return {
      authenticated: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
      },
    };
  }

  async recoveryEmail(): Promise<{ email: string }> {
    const state = await this.ensureState();
    const admin = state.users.find((user) => user.email === this.adminEmail());
    return { email: admin?.recoveryEmail ?? "" };
  }

  async updateRecoveryEmail(dto: UpdateRecoveryEmailDto): Promise<{ email: string; message: string }> {
    const state = await this.ensureState();
    const email = dto.email.trim().toLowerCase();
    const users = state.users.map((user) => user.email === this.adminEmail()
      ? { ...user, recoveryEmail: email, updatedAt: new Date().toISOString() }
      : user);
    await this.writeState({ ...state, users, updatedAt: new Date().toISOString() });
    return { email, message: "Email di recupero salvata." };
  }

  async createInvitation(dto: CreateInvitationDto) {
    const state = await this.ensureState();
    const email = dto.email.trim().toLowerCase();
    const now = new Date();
    const expiresInDays = Math.max(1, Math.min(dto.expiresInDays, 30));
    const expiresAt = new Date(now.getTime() + expiresInDays * 86_400_000);
    const token = randomBytes(32).toString("base64url");
    const tokenHash = this.hashToken(token);
    const displayName = dto.name?.trim() || email.split("@")[0]?.replaceAll(".", " ") || "Nuovo utente";

    const invitation: InvitationRecord = {
      tokenHash,
      email,
      name: displayName,
      role: dto.role,
      organization: "Acme S.p.A.",
      personalMessage: dto.personalMessage?.trim() || "",
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      usedAt: null,
    };

    const invitations = [
      invitation,
      ...state.invitations.filter((item) => item.email !== email || item.usedAt !== null),
    ].slice(0, 100);
    await this.writeState({ ...state, invitations, updatedAt: now.toISOString() });

    const acceptUrl = `${this.publicWebUrl()}/accept-invite?token=${encodeURIComponent(token)}`;
    const text = [
      `Ciao ${displayName},`,
      "Hai ricevuto un invito per accedere a Domain Manager. Completa la registrazione per entrare nel workspace e iniziare a gestire le attività assegnate.",
      [
        "Dettagli invito:",
        "Workspace: Acme S.p.A.",
        `Ruolo: ${dto.role}`,
        `Scadenza: ${expiresAt.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}`,
      ].join("\n"),
      invitation.personalMessage
        ? ["Messaggio dell'amministratore:", invitation.personalMessage].join("\n")
        : "",
      "Usa il pulsante qui sotto per completare la registrazione e scegliere la tua password personale.",
      acceptUrl,
      "Se non riconosci questo invito, puoi ignorare questa email in sicurezza.",
    ].filter(Boolean).join("\n\n");

    const result = await this.emailService.send(
      { to: email, subject: "Invito al workspace Domain Manager", text },
      `invite/${tokenHash.slice(0, 24)}`,
    );

    return {
      created: true,
      queued: result.sent,
      email,
      expiresAt: expiresAt.toISOString(),
      message: result.sent
        ? "Invito creato e accettato da Postfix per la consegna."
        : `Invito creato, ma l'email non è partita: ${result.message}`,
    };
  }

  async validateInvitation(token: string) {
    if (!token) return { valid: false, message: "Token invito mancante." };
    const state = await this.ensureState();
    const tokenHash = this.hashToken(token);
    const invitation = state.invitations.find((item) => item.tokenHash === tokenHash);
    if (!invitation) return { valid: false, message: "Invito non valido." };
    if (invitation.usedAt) return { valid: false, message: "Questo invito è già stato utilizzato." };
    if (new Date(invitation.expiresAt).getTime() <= Date.now()) return { valid: false, message: "Questo invito è scaduto." };

    return {
      valid: true,
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      organization: invitation.organization,
      expiresAt: invitation.expiresAt,
      personalMessage: invitation.personalMessage,
    };
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    if (!this.passwordPolicy(dto.password)) {
      return {
        registered: false,
        message: "La password deve contenere almeno 10 caratteri, maiuscola, minuscola, numero e simbolo.",
      };
    }

    const state = await this.ensureState();
    const tokenHash = this.hashToken(dto.token);
    const invitation = state.invitations.find((item) => item.tokenHash === tokenHash);
    if (!invitation || invitation.usedAt || new Date(invitation.expiresAt).getTime() <= Date.now()) {
      return { registered: false, message: "Invito non valido, scaduto o già utilizzato." };
    }

    const now = new Date().toISOString();
    const existing = state.users.find((user) => user.email === invitation.email);
    if (existing?.status === "active") {
      return { registered: false, message: "Esiste già un account attivo con questa email." };
    }

    const newUser: UserRecord = {
      email: invitation.email,
      name: dto.name.trim(),
      role: invitation.role,
      organization: invitation.organization,
      password: this.hashPassword(dto.password),
      recoveryEmail: invitation.email,
      status: "active",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const users = [newUser, ...state.users.filter((user) => user.email !== invitation.email)];
    const invitations = state.invitations.map((item) => item.tokenHash === tokenHash ? { ...item, usedAt: now } : item);
    await this.writeState({ ...state, users, invitations, updatedAt: now });

    return {
      registered: true,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      organization: newUser.organization,
      message: "Account attivato. Ora puoi accedere con la password appena scelta.",
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const state = await this.ensureState();
    const email = dto.email.trim().toLowerCase();
    const user = state.users.find((item) => {
      if (item.status !== "active") return false;
      const recoveryEmail = item.recoveryEmail.trim().toLowerCase();
      return item.email === email || (recoveryEmail.length > 0 && recoveryEmail === email);
    });

    // Accept both the login email and the configured recovery email. The generic
    // response for unknown addresses still avoids exposing whether an account exists.
    if (!user) {
      return { accepted: true, queued: false, message: "Se l'account esiste, il link verrà inviato alla casella di recupero configurata." };
    }

    const destination = user.recoveryEmail.trim().toLowerCase() || user.email;
    if (!destination || destination.endsWith(".local")) {
      return {
        accepted: true,
        queued: false,
        message: "Account trovato, ma non è configurata una casella reale per il recupero.",
      };
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = this.hashToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    const reset: ResetRecord = {
      tokenHash,
      userEmail: user.email,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };
    const resets = [reset, ...state.resets.filter((item) => item.userEmail !== user.email)].slice(0, 100);
    await this.writeState({ ...state, resets, updatedAt: now.toISOString() });

    const resetUrl = `${this.publicWebUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    const result = await this.emailService.send(
      {
        to: destination,
        subject: "Reimposta la password di Domain Manager",
        text: [
          `Ciao ${user.name},`,
          "Abbiamo ricevuto una richiesta per modificare la password del tuo account Domain Manager.",
          [
            "Dettagli richiesta:",
            `Account: ${user.email}`,
            "Validità link: 30 minuti",
            "Utilizzo: una sola volta",
          ].join("\n"),
          "Usa il pulsante qui sotto per scegliere una nuova password.",
          resetUrl,
          "Se non hai richiesto tu questa modifica, puoi ignorare questa email: la password attuale resterà invariata.",
        ].join("\n\n"),
      },
      `password-reset/${tokenHash.slice(0, 24)}`,
    );

    return {
      accepted: true,
      queued: result.sent,
      message: result.sent
        ? "Richiesta ricevuta. Controlla la casella di recupero per il link monouso."
        : `Richiesta ricevuta, ma l'email non è partita: ${result.message}`,
    };
  }

  async validatePasswordReset(token: string) {
    if (!token) return { valid: false, message: "Token mancante." };
    const state = await this.ensureState();
    const reset = state.resets.find((item) => item.tokenHash === this.hashToken(token));
    if (!reset) return { valid: false, message: "Link non valido o già utilizzato." };
    if (new Date(reset.expiresAt).getTime() <= Date.now()) return { valid: false, message: "Il link di recupero è scaduto." };
    const user = state.users.find((item) => item.email === reset.userEmail);
    return {
      valid: Boolean(user),
      email: user?.email,
      name: user?.name,
      expiresAt: reset.expiresAt,
      message: user ? "Link valido." : "Account non disponibile.",
    };
  }

  async completePasswordReset(dto: CompletePasswordResetDto) {
    if (!this.passwordPolicy(dto.password)) {
      return {
        reset: false,
        message: "La password deve contenere almeno 10 caratteri, maiuscola, minuscola, numero e simbolo.",
      };
    }

    const state = await this.ensureState();
    const tokenHash = this.hashToken(dto.token);
    const reset = state.resets.find((item) => item.tokenHash === tokenHash);
    if (!reset) return { reset: false, message: "Link di recupero non valido o già utilizzato." };
    if (new Date(reset.expiresAt).getTime() <= Date.now()) return { reset: false, message: "Il link di recupero è scaduto." };

    const now = new Date().toISOString();
    let updated = false;
    const users = state.users.map((user) => {
      if (user.email !== reset.userEmail) return user;
      updated = true;
      return { ...user, password: this.hashPassword(dto.password), updatedAt: now };
    });
    if (!updated) return { reset: false, message: "Account non disponibile." };

    const resets = state.resets.filter((item) => item.tokenHash !== tokenHash && item.userEmail !== reset.userEmail);
    await this.writeState({ ...state, users, resets, updatedAt: now });
    return { reset: true, message: "Password aggiornata correttamente. Ora puoi accedere con la nuova password." };
  }
}
