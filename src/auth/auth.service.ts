import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { UsersService } from "../users/users.service";
import { User } from "../users/entities/user.entity";
import { LoginDto } from "./dto/login.dto";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { UserRole } from "../users/enums/user-role.enum";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    // console.log(user);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = { sub: user.id, email: user.email, username: user.username, role: user.role };

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto, UserRole.ADMIN);

    const payload = { sub: user.id, email: user.email, username: user.username, role: user.role };

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token: this.jwtService.sign(payload),
    };
  }

  async validateToken(token: string) {
    try {
      // The JwtStrategy already handles verification and user validation
      // This method is kept for backward compatibility
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOne(payload.sub);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
