import { Body, Controller, Get, Headers, Post, Put, Query, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service.js";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto.js";
import { CompletePasswordResetDto } from "./dto/complete-password-reset.dto.js";
import { CreateInvitationDto } from "./dto/create-invitation.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto.js";
import { UpdateRecoveryEmailDto } from "./dto/update-recovery-email.dto.js";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private authorize(key: string | undefined): void {
    const expected = this.config.get<string>("INTERNAL_API_KEY")?.trim();
    if (!expected || key !== expected) {
      throw new UnauthorizedException("Internal API key non valida.");
    }
  }

  @Post("login")
  async login(@Headers("x-domain-manager-internal-key") key: string | undefined, @Body() dto: LoginDto) {
    this.authorize(key);
    return this.authService.login(dto);
  }

  @Get("recovery-email")
  async recoveryEmail(@Headers("x-domain-manager-internal-key") key: string | undefined) {
    this.authorize(key);
    return this.authService.recoveryEmail();
  }

  @Put("recovery-email")
  async updateRecoveryEmail(
    @Headers("x-domain-manager-internal-key") key: string | undefined,
    @Body() dto: UpdateRecoveryEmailDto,
  ) {
    this.authorize(key);
    return this.authService.updateRecoveryEmail(dto);
  }

  @Post("invitations")
  async createInvitation(
    @Headers("x-domain-manager-internal-key") key: string | undefined,
    @Body() dto: CreateInvitationDto,
  ) {
    this.authorize(key);
    return this.authService.createInvitation(dto);
  }

  @Get("invitations/validate")
  async validateInvitation(
    @Headers("x-domain-manager-internal-key") key: string | undefined,
    @Query("token") token: string,
  ) {
    this.authorize(key);
    return this.authService.validateInvitation(token);
  }

  @Post("invitations/accept")
  async acceptInvitation(
    @Headers("x-domain-manager-internal-key") key: string | undefined,
    @Body() dto: AcceptInvitationDto,
  ) {
    this.authorize(key);
    return this.authService.acceptInvitation(dto);
  }

  @Post("password-reset/request")
  async requestPasswordReset(
    @Headers("x-domain-manager-internal-key") key: string | undefined,
    @Body() dto: RequestPasswordResetDto,
  ) {
    this.authorize(key);
    return this.authService.requestPasswordReset(dto);
  }

  @Get("password-reset/validate")
  async validatePasswordReset(
    @Headers("x-domain-manager-internal-key") key: string | undefined,
    @Query("token") token: string,
  ) {
    this.authorize(key);
    return this.authService.validatePasswordReset(token);
  }

  @Post("password-reset/complete")
  async completePasswordReset(
    @Headers("x-domain-manager-internal-key") key: string | undefined,
    @Body() dto: CompletePasswordResetDto,
  ) {
    this.authorize(key);
    return this.authService.completePasswordReset(dto);
  }
}
