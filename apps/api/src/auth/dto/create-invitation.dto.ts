import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateInvitationDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsIn(["Organization Administrator", "Domain Manager", "Viewer"])
  role!: "Organization Administrator" | "Domain Manager" | "Viewer";

  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  personalMessage?: string;
}
