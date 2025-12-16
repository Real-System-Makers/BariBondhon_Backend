import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { House, HouseDocument } from '../houses/entities/house.entity';
import { Role } from '../common/types/role.enum';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(House.name) private readonly houseModel: Model<HouseDocument>,
  ) { }

  async getPublicStats() {
    const [ownersCount, tenantsCount, districts] = await Promise.all([
      this.userModel.countDocuments({ role: Role.OWNER }),
      this.userModel.countDocuments({ role: Role.TENANT }),
      this.houseModel.distinct('district'),
    ]);

    return {
      owners: ownersCount,
      tenants: tenantsCount,
      cities: districts.length,
      services: 0,
      reviews: 0,
    };
  }
}

