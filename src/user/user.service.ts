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
import { HousesService } from '../houses/houses.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly hashService: HashService,
    private readonly paginationService: PaginationService,
    private readonly housesService: HousesService,
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
      const user = await this.userModel
        .findById(userId)
        .populate('flat')
        .populate('owner')
        .exec();
      if (!user) {
        throw new NotFoundException('user not found');
      }

      // If user has an owner (tenant), populate owner's house
      if (user.owner && typeof user.owner === 'object' && '_id' in user.owner) {
        try {
          const ownerHouse = await this.housesService.findOrCreate(
            (user.owner as any)._id.toString(),
          );
          // Attach house to owner object
          (user.owner as any).house = ownerHouse;
        } catch {
          // If house doesn't exist or error occurs, continue without house
        }
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
      const user = await query.populate('flat').populate('owner').exec();
      if (!user) {
        throw new NotFoundException('user not found');
      }

      // If user has an owner (tenant), populate owner's house
      if (user.owner && typeof user.owner === 'object' && '_id' in user.owner) {
        try {
          const ownerHouse = await this.housesService.findOrCreate(
            (user.owner as any)._id.toString(),
          );
          // Attach house to owner object
          (user.owner as any).house = ownerHouse;
        } catch {
          // If house doesn't exist or error occurs, continue without house
        }
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

  async assignFlat(userId: string, flatId: string): Promise<User> {
    const user = await this.findOneUserById(userId);
    user.flat = flatId;
    try {
      await this.userModel.findByIdAndUpdate(userId, user);
      return await this.findOneUserById(userId);
    } catch {
      throw new InternalServerErrorException('failed to assign flat to user');
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
    return this.userModel.find({ role }).populate('flat').populate('owner').exec();
  }

  async findAllByRoleAndOwner(role: string, ownerId: string): Promise<User[]> {
    return this.userModel
      .find({ role, owner: ownerId })
      .populate('flat')
      .populate('owner')
      .exec();
  }
}
