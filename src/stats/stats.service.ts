import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Role } from '../common/types/role.enum';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getPublicStats() {
    const [ownersCount, tenantsCount] = await Promise.all([
      this.userModel.countDocuments({ role: Role.OWNER }),
      this.userModel.countDocuments({ role: Role.TENANT }),
    ]);

    return {
      owners: ownersCount,
      tenants: tenantsCount,
      cities: 0,
      services: 0,
      reviews: 0,
    };
  }
}

