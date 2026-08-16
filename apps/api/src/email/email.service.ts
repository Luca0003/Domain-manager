import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import nodemailer from "nodemailer";
import type { ConfigureEmailProviderDto } from "./dto/configure-email-provider.dto.js";
import type { SendEmailDto } from "./dto/send-email.dto.js";

export type EmailProviderStatus = {
  provider: "postfix";
  configured: boolean;
  reachable: boolean;
  from: string;
  transport: "smtp-local";
  source: "interface" | "environment" | "none";
  host: string;
  port: number;
  message?: string;
};

export type EmailProviderConfiguration = EmailProviderStatus & {
  fromName: string;
  fromEmail: string;
};

export type EmailSendResult = {
  sent: boolean;
  configured: boolean;
  provider: "postfix";
  id?: string;
  message: string;
};

type StoredEmailProviderConfiguration = {
  version: 2;
  provider: "postfix";
  fromName: string;
  fromEmail: string;
  updatedAt: string;
};

type EffectiveEmailConfiguration = {
  fromName: string;
  fromEmail: string;
  source: "interface" | "environment";
};

type EmailVisualPreset = {
  eyebrow: string;
  title: string;
  accent: string;
  accentDark: string;
  soft: string;
  border: string;
  actionLabel?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function presetForSubject(subject: string): EmailVisualPreset {
  const normalized = subject.toLowerCase();
  if (normalized.includes("invito")) {
    return {
      eyebrow: "INVITO AL WORKSPACE",
      title: "Sei stato invitato in Domain Manager",
      accent: "#2563eb",
      accentDark: "#1d4ed8",
      soft: "#eff6ff",
      border: "#bfdbfe",
      actionLabel: "Completa registrazione",
    };
  }
  if (normalized.includes("password") || normalized.includes("reimposta")) {
    return {
      eyebrow: "SICUREZZA ACCOUNT",
      title: "Reimposta la tua password",
      accent: "#7c3aed",
      accentDark: "#6d28d9",
      soft: "#f5f3ff",
      border: "#ddd6fe",
      actionLabel: "Reimposta password",
    };
  }
  if (normalized.includes("test")) {
    return {
      eyebrow: "VERIFICA CONFIGURAZIONE",
      title: "Email di test Domain Manager",
      accent: "#059669",
      accentDark: "#047857",
      soft: "#ecfdf5",
      border: "#a7f3d0",
    };
  }
  return {
    eyebrow: "DOMAIN MANAGER",
    title: subject,
    accent: "#2563eb",
    accentDark: "#1d4ed8",
    soft: "#eff6ff",
    border: "#bfdbfe",
  };
}

function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>]+/i);
  return match?.[0]?.replace(/[),.;]+$/, "") ?? null;
}

function renderTextParagraph(paragraph: string): string {
  return `<p style="margin:0 0 18px;color:#475569;font-size:15px;line-height:1.72;">${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`;
}

function renderEmailBlocks(value: string, preset: EmailVisualPreset): string {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const lines = paragraph.split("\n").map((line) => line.trim()).filter(Boolean);
      const heading = lines[0] ?? "";

      if (heading.toLowerCase().startsWith("dettagli") && lines.length > 1) {
        const rows = lines.slice(1).map((line) => {
          const separator = line.indexOf(":");
          if (separator <= 0) {
            return `<tr><td colspan="2" style="padding:8px 0;color:#334155;font-size:14px;line-height:1.5;">${escapeHtml(line)}</td></tr>`;
          }
          const label = line.slice(0, separator).trim();
          const content = line.slice(separator + 1).trim();
          return `<tr>
            <td style="padding:7px 18px 7px 0;color:#8491a5;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
            <td style="padding:7px 0;color:#26354d;font-size:14px;font-weight:650;line-height:1.45;vertical-align:top;">${escapeHtml(content)}</td>
          </tr>`;
        }).join("");
        return `<div style="margin:24px 0;padding:19px 21px;border:1px solid ${preset.border};border-radius:14px;background:${preset.soft};">
          <div style="margin-bottom:10px;color:${preset.accentDark};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">${escapeHtml(heading.replace(/:$/, ""))}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </div>`;
      }

      if (heading.toLowerCase().startsWith("messaggio dell'amministratore")) {
        const message = lines.slice(1).join(" ").trim();
        if (!message) return "";
        return `<div style="margin:22px 0;padding:17px 18px;border:1px solid ${preset.border};border-left:4px solid ${preset.accent};border-radius:12px;background:${preset.soft};">
          <div style="margin-bottom:6px;color:${preset.accentDark};font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">Messaggio dell'amministratore</div>
          <div style="color:#41526c;font-size:14px;line-height:1.65;">${escapeHtml(message)}</div>
        </div>`;
      }

      if (/^(se non|se non hai|se non riconosci)/i.test(paragraph)) {
        return `<p style="margin:22px 0 0;padding-top:20px;border-top:1px solid #edf1f6;color:#7b8798;font-size:13px;line-height:1.65;">${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`;
      }

      return renderTextParagraph(paragraph);
    })
    .join("");
}

function buildBrandedHtml(subject: string, text: string): string {
  const preset = presetForSubject(subject);
  const actionUrl = extractFirstUrl(text);
  let beforeAction = text;
  let afterAction = "";

  if (actionUrl) {
    const urlIndex = text.indexOf(actionUrl);
    beforeAction = text.slice(0, urlIndex).trim();
    afterAction = text.slice(urlIndex + actionUrl.length).trim();
  }

  const beforeBody = renderEmailBlocks(beforeAction, preset);
  const afterBody = renderEmailBlocks(afterAction, preset);
  const action = actionUrl && preset.actionLabel
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 26px;"><tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:12px;background:${preset.accent};box-shadow:0 10px 24px rgba(15,35,65,.16);">
          <a href="${escapeHtml(actionUrl)}" style="display:inline-block;min-width:210px;padding:15px 24px;color:#ffffff;font-size:14px;font-weight:800;text-align:center;text-decoration:none;letter-spacing:-.1px;">${escapeHtml(preset.actionLabel)}</a>
        </td></tr></table>
      </td></tr></table>`
    : "";

  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
</head>
<body style="margin:0;padding:0;background:#edf2f7;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf2f7;padding:42px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #dbe4ee;border-radius:18px;overflow:hidden;box-shadow:0 18px 44px rgba(7,27,51,.10);">
        <tr><td style="height:5px;background:${preset.accent};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:25px 34px;border-bottom:1px solid #102b4c;background:#071b33;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:42px;vertical-align:middle;">
              <span style="display:inline-block;width:40px;height:40px;line-height:40px;text-align:center;border-radius:11px;background:#2563eb;color:#ffffff;font-size:17px;font-weight:800;box-shadow:0 6px 16px rgba(37,99,235,.25);">DM</span>
            </td>
            <td style="padding-left:12px;vertical-align:middle;">
              <div style="color:#ffffff;font-size:16px;font-weight:800;letter-spacing:-.25px;">Domain Manager</div>
              <div style="margin-top:3px;color:#9fb3ca;font-size:10px;font-weight:750;letter-spacing:.10em;text-transform:uppercase;">Portfolio Control Center</div>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:38px 38px 34px;background:#ffffff;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 13px;"><tr><td style="padding:6px 10px;border:1px solid ${preset.border};border-radius:999px;background:${preset.soft};color:${preset.accentDark};font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;">${escapeHtml(preset.eyebrow)}</td></tr></table>
          <h1 style="margin:0 0 25px;color:#0f2238;font-size:28px;line-height:1.22;font-weight:800;letter-spacing:-.7px;">${escapeHtml(preset.title)}</h1>
          ${beforeBody}
          ${action}
          ${afterBody}
          <div style="margin-top:30px;padding:16px 18px;border-radius:12px;background:#fff8e8;border:1px solid #fde68a;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td style="width:28px;vertical-align:top;color:#d97706;font-size:17px;line-height:1;">●</td>
              <td style="color:#7c5a17;font-size:12px;line-height:1.6;">
                <strong style="display:block;margin-bottom:2px;color:#9a6508;font-size:12px;">Sicurezza Domain Manager</strong>
                I pulsanti di invito e recupero password sono personali e possono avere una scadenza. Non inoltrare questa email ad altre persone.
              </td>
            </tr></table>
          </div>
        </td></tr>
        <tr><td style="padding:21px 34px;border-top:1px solid #e4ebf2;background:#f8fafc;text-align:center;">
          <div style="color:#64748b;font-size:11px;line-height:1.6;font-weight:650;">Domain Manager · Scadenze, rinnovi e controllo del portafoglio domini</div>
          <div style="margin-top:4px;color:#94a3b8;font-size:10px;line-height:1.5;">Messaggio automatico generato dalla piattaforma.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

@Injectable()
export class EmailService {
  constructor(private readonly config: ConfigService) {}

  private configPath(): string {
    return this.config.get<string>("EMAIL_CONFIG_PATH")?.trim() || "/var/lib/domain-manager/email-provider.json";
  }

  private smtpHost(): string {
    return this.config.get<string>("POSTFIX_SMTP_HOST")?.trim() || "postfix";
  }

  private smtpPort(): number {
    const value = Number(this.config.get<string>("POSTFIX_SMTP_PORT") ?? "25");
    return Number.isFinite(value) && value > 0 ? value : 25;
  }

  private transporter() {
    return nodemailer.createTransport({
      host: this.smtpHost(),
      port: this.smtpPort(),
      secure: false,
      ignoreTLS: true,
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 15_000,
    });
  }

  private async postfixReachable(): Promise<boolean> {
    try {
      await this.transporter().verify();
      return true;
    } catch {
      return false;
    }
  }

  private async readStoredConfiguration(): Promise<EffectiveEmailConfiguration | null> {
    try {
      const raw = await readFile(this.configPath(), "utf8");
      const stored = JSON.parse(raw) as StoredEmailProviderConfiguration;
      if (stored.version !== 2 || stored.provider !== "postfix") return null;
      if (!stored.fromEmail.trim()) return null;
      return {
        fromName: stored.fromName.trim() || "Domain Manager",
        fromEmail: stored.fromEmail.trim().toLowerCase(),
        source: "interface",
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      return null;
    }
  }

  private environmentConfiguration(): EffectiveEmailConfiguration | null {
    const fromEmail = this.config.get<string>("EMAIL_FROM_ADDRESS")?.trim().toLowerCase() ?? "";
    if (!fromEmail) return null;
    return {
      fromName: this.config.get<string>("EMAIL_FROM_NAME")?.trim() || "Domain Manager",
      fromEmail,
      source: "environment",
    };
  }

  private async effectiveConfiguration(): Promise<EffectiveEmailConfiguration | null> {
    return (await this.readStoredConfiguration()) ?? this.environmentConfiguration();
  }

  private formatFrom(configuration: Pick<EffectiveEmailConfiguration, "fromName" | "fromEmail">): string {
    return `${configuration.fromName} <${configuration.fromEmail}>`;
  }

  async status(): Promise<EmailProviderStatus> {
    const [configuration, reachable] = await Promise.all([
      this.effectiveConfiguration(),
      this.postfixReachable(),
    ]);

    if (!configuration) {
      return {
        provider: "postfix",
        configured: false,
        reachable,
        from: "",
        transport: "smtp-local",
        source: "none",
        host: this.smtpHost(),
        port: this.smtpPort(),
        message: reachable
          ? "Postfix è attivo. Configura l'indirizzo mittente dall'interfaccia."
          : "Postfix non è raggiungibile dalla API.",
      };
    }

    return {
      provider: "postfix",
      configured: reachable,
      reachable,
      from: this.formatFrom(configuration),
      transport: "smtp-local",
      source: configuration.source,
      host: this.smtpHost(),
      port: this.smtpPort(),
      message: reachable
        ? "Postfix è raggiungibile ed è pronto ad accettare messaggi."
        : "Mittente configurato, ma Postfix non è raggiungibile.",
    };
  }

  async configuration(): Promise<EmailProviderConfiguration> {
    const configuration = await this.effectiveConfiguration();
    const status = await this.status();
    return {
      ...status,
      fromName: configuration?.fromName ?? "Domain Manager",
      fromEmail: configuration?.fromEmail ?? "",
    };
  }

  async configure(dto: ConfigureEmailProviderDto): Promise<EmailProviderConfiguration> {
    const record: StoredEmailProviderConfiguration = {
      version: 2,
      provider: "postfix",
      fromName: dto.fromName.trim() || "Domain Manager",
      fromEmail: dto.fromEmail.trim().toLowerCase(),
      updatedAt: new Date().toISOString(),
    };

    const path = this.configPath();
    const temporaryPath = `${path}.${process.pid}.tmp`;
    await mkdir(dirname(path), { recursive: true });
    await writeFile(temporaryPath, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temporaryPath, path);
    return this.configuration();
  }

  async disconnect(): Promise<EmailProviderConfiguration> {
    await rm(this.configPath(), { force: true });
    return this.configuration();
  }

  async send(dto: SendEmailDto, idempotencyKey: string): Promise<EmailSendResult> {
    const configuration = await this.effectiveConfiguration();
    if (!configuration) {
      return {
        sent: false,
        configured: false,
        provider: "postfix",
        message: "Configura prima il mittente in Impostazioni → Email.",
      };
    }

    if (!(await this.postfixReachable())) {
      return {
        sent: false,
        configured: false,
        provider: "postfix",
        message: "Postfix non è raggiungibile. Controlla il container mail.",
      };
    }

    try {
      const info = await this.transporter().sendMail({
        from: this.formatFrom(configuration),
        to: dto.to,
        subject: dto.subject,
        text: dto.text,
        html: buildBrandedHtml(dto.subject, dto.text),
        headers: {
          "X-Domain-Manager-Idempotency-Key": idempotencyKey,
        },
      });

      return {
        sent: true,
        configured: true,
        provider: "postfix",
        id: info.messageId,
        message: "Email accettata da Postfix e messa in coda per la consegna.",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore SMTP sconosciuto";
      return {
        sent: false,
        configured: true,
        provider: "postfix",
        message: `Postfix non ha accettato il messaggio: ${message}`,
      };
    }
  }
}
