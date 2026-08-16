import { IsEmail } from "class-validator";

export class UpdateRecoveryEmailDto {
  @IsEmail()
  email!: string;
}
