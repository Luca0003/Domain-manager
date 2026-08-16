import { IsString, MaxLength, MinLength } from "class-validator";

export class AcceptInvitationDto {
  @IsString()
  @MinLength(24)
  @MaxLength(256)
  token!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;
}
