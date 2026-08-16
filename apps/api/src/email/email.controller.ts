import { Body, Controller, Delete, Get, Headers, Post, Put, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { ConfigureEmailProviderDto } from "./dto/configure-email-provider.dto.js";
import { SendEmailDto } from "./dto/send-email.dto.js";
import { EmailService } from "./email.service.js";

@Controller("email")
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  private authorize(key: string | undefined): void {
    const expected = this.config.get<string>("INTERNAL_API_KEY")?.trim();
    if (!expected || key !== expected) {
      throw new UnauthorizedException("Internal API key non valida.");
    }
  }

  @Get("status")
  async status(@Headers("x-domain-manager-internal-key") key: string | undefined) {
    this.authorize(key);
    return this.emailService.status();
  }

  @Get("config")
  async configuration(@Headers("x-domain-manager-internal-key") key: string | undefined) {
    this.authorize(key);
    return this.emailService.configuration();
  }

  @Put("config")
  async configure(
    @Headers("x-domain-manager-internal-key") key: string | undefined,
    @Body() dto: ConfigureEmailProviderDto,
  ) {
    this.authorize(key);
    return this.emailService.configure(dto);
  }

  @Delete("config")
  async disconnect(@Headers("x-domain-manager-internal-key") key: string | undefined) {
    this.authorize(key);
    return this.emailService.disconnect();
  }

  @Post("send")
  async send(
    @Headers("x-domain-manager-internal-key") key: string | undefined,
    @Headers("x-idempotency-key") idempotencyKey: string | undefined,
    @Body() dto: SendEmailDto,
  ) {
    this.authorize(key);
    return this.emailService.send(dto, idempotencyKey?.trim() || `domain-manager/${randomUUID()}`);
  }
}
