import { IsEmail, IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class ConfigureEmailProviderDto {
  @IsIn(["postfix"])
  provider!: "postfix";

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  fromName!: string;

  @IsEmail()
  @MaxLength(320)
  fromEmail!: string;
}
