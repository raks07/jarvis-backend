import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../enums/user-role.enum";

export class CreateUserDto {
  @ApiProperty({ description: "Username of the user", example: "johndoe" })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ description: "Email of the user", example: "john.doe@example.com" })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: "Password of the user (min 8 characters)", example: "password123" })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: "Role of the user",
    enum: UserRole,
    example: UserRole.ADMIN,
    default: UserRole.ADMIN,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.ADMIN;
}
