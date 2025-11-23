import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFlatDto } from './dto/create-flat.dto';
import { UpdateFlatDto } from './dto/update-flat.dto';
import { Flat, FlatDocument } from './entities/flat.entity';

@Injectable()
export class FlatsService {
  constructor(@InjectModel(Flat.name) private flatModel: Model<FlatDocument>) {}

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
}
