import { Injectable, NotFoundException, ConflictException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserRole } from "./enums/user-role.enum";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto, role: UserRole = UserRole.ADMIN): Promise<User> {
    // Check if user with the same email or username already exists
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: createUserDto.email }, { username: createUserDto.username }],
    });

    if (existingUser) {
      throw new ConflictException("User with this email or username already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create new user
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.usersRepository.find({ where: { role } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}, DTO: ${JSON.stringify(updateUserDto)}`);

    const user = await this.findOne(id);
    this.logger.log(`Found user: ${JSON.stringify(user)}`);

    // If email or username is being updated, check for conflicts
    if (updateUserDto.email || updateUserDto.username) {
      const existingUser = await this.usersRepository.findOne({
        where: [...(updateUserDto.email ? [{ email: updateUserDto.email }] : []), ...(updateUserDto.username ? [{ username: updateUserDto.username }] : [])],
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException("User with this email or username already exists");
      }
    }

    // Hash password if it's being updated
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user - explicitly create an object with only the fields that are changing
    this.logger.log(`Before update: ${JSON.stringify(user)}`);

    // Create a clean update object with only the properties that are being updated
    const updateData = {};
    if (updateUserDto.username) updateData["username"] = updateUserDto.username;
    if (updateUserDto.email) updateData["email"] = updateUserDto.email;
    if (updateUserDto.password) updateData["password"] = updateUserDto.password;
    if (updateUserDto.role) updateData["role"] = updateUserDto.role;

    // Apply the changes
    Object.assign(user, updateData);
    this.logger.log(`After update with Object.assign: ${JSON.stringify(user)}`);
    this.logger.log(`Update data being applied: ${JSON.stringify(updateData)}`);

    try {
      // Use save method with explicit entity
      const result = await this.usersRepository.save(user);
      this.logger.log(`Save result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error saving user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}
