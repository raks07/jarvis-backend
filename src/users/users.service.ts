import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserRole } from "./enums/user-role.enum";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto, role: UserRole = UserRole.VIEWER): Promise<User> {
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
      role,
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
    const user = await this.findOne(id);

    // If email or username is being updated, check for conflicts
    if (updateUserDto.email || updateUserDto.username) {
      const existingUser = await this.usersRepository.findOne({
        where: [{ email: updateUserDto.email }, { username: updateUserDto.username }],
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException("User with this email or username already exists");
      }
    }

    // Hash password if it's being updated
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}
