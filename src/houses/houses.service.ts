import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { House, HouseDocument } from './entities/house.entity';
import { UpdateHouseDto } from './dto/update-house.dto';

@Injectable()
export class HousesService {
  constructor(
    @InjectModel(House.name) private houseModel: Model<HouseDocument>,
  ) {}

  async findOrCreate(userId: string): Promise<HouseDocument> {
    const existingHouse = await this.houseModel
      .findOne({ user: userId })
      .exec();

    if (existingHouse) {
      return existingHouse as HouseDocument;
    }

    const newHouse = await this.houseModel.create({
      user: userId,
      waterBill: 0,
      gasBill: 0,
    });

    return newHouse as HouseDocument;
  }

  async update(
    userId: string,
    updateHouseDto: UpdateHouseDto,
  ): Promise<HouseDocument> {
    const house = await this.findOrCreate(userId);

    const updated = await this.houseModel
      .findByIdAndUpdate(house._id, updateHouseDto, { new: true })
      .exec();

    if (!updated) {
      throw new Error('Failed to update house');
    }

    return updated as HouseDocument;
  }
}
