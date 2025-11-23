import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HashService } from 'src/common/services/hash.service';
import {
  PaginationService,
  PaginatedResult,
} from 'src/common/services/pagination.service';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly hashService: HashService,
    private readonly paginationService: PaginationService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
    ownerId?: string,
  ): Promise<User> {
    const hashedPassword = await this.hashService.hashString(
      createUserDto.password,
    );

    const user = new this.userModel({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      phone: createUserDto.phone,
      role: createUserDto.role,
      address: createUserDto.address,
      owner: ownerId,
    });

    try {
      await user.save();
      return user;
    } catch {
      throw new ForbiddenException('user creation failed');
    }
  }

  async findAllUsers(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<User>> {
    return this.paginationService.paginate<User>(this.userModel, paginationDto);
  }

  async findOneUserById(userId: string): Promise<User> {
    try {
      const user = await this.userModel.findById(userId).populate('flat');
      if (!user) {
        throw new NotFoundException('user not found');
      }
      return user;
    } catch {
      throw new InternalServerErrorException('failed to find user');
    }
  }

  async findOneUserByUserProperty(
    property: keyof User,
    value: User[keyof User],
    withPassword?: boolean,
  ): Promise<User> {
    try {
      const query = this.userModel.findOne({ [property]: value });
      if (withPassword) {
        query.select('+password');
      }
      const user = await query.populate('flat').exec();
      if (!user) {
        throw new NotFoundException('user not found');
      }
      return user;
    } catch {
      throw new InternalServerErrorException('failed to find user');
    }
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findOneUserById(userId);

    if (updateUserDto.email) {
      user.email = updateUserDto.email;
    }

    if (updateUserDto.name) {
      user.name = updateUserDto.name;
    }

    try {
      await this.userModel.findByIdAndUpdate(userId, user);
      return await this.findOneUserById(userId);
    } catch {
      throw new InternalServerErrorException('failed to update user');
    }
  }

  async removeUser(userId: string): Promise<User> {
    const user = await this.findOneUserById(userId);
    try {
      await this.userModel.findByIdAndDelete(userId);
      return user;
    } catch {
      throw new InternalServerErrorException('failed to remove user');
    }
  }
  async findAllByRole(role: string): Promise<User[]> {
    return this.userModel.find({ role }).exec();
  }

  async findAllByRoleAndOwner(role: string, ownerId: string): Promise<User[]> {
    return this.userModel.find({ role, owner: ownerId }).exec();
  }
}
