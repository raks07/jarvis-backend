import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "./enums/user-role.enum";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Create a new user (admin only)" })
  @ApiResponse({ status: 201, description: "User successfully created", type: User })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get all users (admin only)" })
  @ApiResponse({ status: 200, description: "Return all users", type: [User] })
  findAll() {
    return this.usersService.findAll();
  }

  @Get("role/:role")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get users by role (admin only)" })
  @ApiResponse({ status: 200, description: "Return users with specified role", type: [User] })
  @ApiResponse({ status: 400, description: "Invalid role provided" })
  findByRole(@Param("role") role: string) {
    // Validate role parameter
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException(`Invalid role: ${role}. Valid roles are: ${Object.values(UserRole).join(", ")}`);
    }
    return this.usersService.findByRole(role as UserRole);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a user by ID" })
  @ApiResponse({ status: 200, description: "Return the user", type: User })
  @ApiResponse({ status: 404, description: "User not found" })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update a user (admin only)" })
  @ApiResponse({ status: 200, description: "User successfully updated", type: User })
  @ApiResponse({ status: 404, description: "User not found" })
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Delete a user (admin only)" })
  @ApiResponse({ status: 200, description: "User successfully deleted" })
  @ApiResponse({ status: 404, description: "User not found" })
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
