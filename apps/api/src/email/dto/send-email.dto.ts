import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class SendEmailDto {
  @IsEmail()
  to!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(12000)
  text!: string;
}
