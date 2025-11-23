import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFlatDto } from './dto/create-flat.dto';
import { UpdateFlatDto } from './dto/update-flat.dto';
import { Flat, FlatDocument } from './entities/flat.entity';

import { User, UserDocument } from 'src/user/entities/user.entity';


@Injectable()
export class FlatsService {
  constructor(
    @InjectModel(Flat.name) private flatModel: Model<FlatDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createFlatDto: CreateFlatDto, userId: string): Promise<Flat> {
    const createdFlat = new this.flatModel({
      ...createFlatDto,
      user: userId,
    });
    return createdFlat.save();
  }

  async findAll(userId: string): Promise<Flat[]> {
    return this.flatModel
      .find({ user: userId })
      .populate('tenant', 'name email')
      .exec();
  }

  async findOne(id: string, userId: string): Promise<Flat> {
    const flat = await this.flatModel
      .findOne({ _id: id, user: userId })
      .populate('tenant', 'name email')
      .exec();
    if (!flat) {
      throw new NotFoundException(`Flat with ID ${id} not found`);
    }
    return flat;
  }

  async update(
    id: string,
    updateFlatDto: UpdateFlatDto,
    userId: string,
  ): Promise<Flat> {
    if (updateFlatDto.tenant !== undefined) {
      const currentFlat = await this.flatModel.findOne({
        _id: id,
        user: userId,
      });

      if (currentFlat) {
        if (currentFlat.tenant) {
          await this.userModel.findByIdAndUpdate(currentFlat.tenant, {
            flat: null,
          });
        }

        if (updateFlatDto.tenant) {
          await this.userModel.findByIdAndUpdate(updateFlatDto.tenant, {
            flat: id,
          });
        }
      }
    }

    const updatedFlat = await this.flatModel
      .findOneAndUpdate({ _id: id, user: userId }, updateFlatDto, { new: true })
      .populate('tenant', 'name email')
      .exec();
    if (!updatedFlat) {
      throw new NotFoundException(`Flat with ID ${id} not found`);
    }
    return updatedFlat;
  }

  async remove(id: string, userId: string): Promise<Flat> {
    const deletedFlat = await this.flatModel
      .findOneAndDelete({ _id: id, user: userId })
      .exec();
    if (!deletedFlat) {
      throw new NotFoundException(`Flat with ID ${id} not found`);
    }
    return deletedFlat;
  }

  /**
   * Update electricity reading for a single flat
   */
  async updateElectricityReading(
    flatId: string,
    currentReading: number,
    userId: string,
    ratePerUnit?: number,
  ): Promise<Flat> {
    const flat = await this.flatModel.findOne({ _id: flatId, user: userId });
    if (!flat) {
      throw new NotFoundException(`Flat with ID ${flatId} not found`);
    }

    // Move current to previous and update current
    flat.previousElectricityReading = flat.currentElectricityReading;
    flat.currentElectricityReading = currentReading;
    flat.lastElectricityUpdateDate = new Date();
    
    if (ratePerUnit !== undefined) {
      flat.electricityRatePerUnit = ratePerUnit;
    }

    return flat.save();
  }

  /**
   * Batch update electricity readings for multiple flats
   */
  async batchUpdateElectricity(
    updates: { flatId: string; currentReading: number }[],
    userId: string,
  ): Promise<{ updated: number; failed: string[] }> {
    let updated = 0;
    const failed: string[] = [];

    for (const update of updates) {
      try {
        await this.updateElectricityReading(
          update.flatId,
          update.currentReading,
          userId,
        );
        updated++;
      } catch (error) {
        failed.push(update.flatId);
      }
    }

    return { updated, failed };
  }

  /**
   * Calculate electricity bill for a flat based on consumption
   */
  calculateElectricityBill(flat: Flat): number {
    const consumption =
      flat.currentElectricityReading - flat.previousElectricityReading;
    return Math.max(0, consumption * flat.electricityRatePerUnit);
  }
}

