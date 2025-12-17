import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFlatDto } from './dto/create-flat.dto';
import { UpdateFlatDto } from './dto/update-flat.dto';
import { Flat, FlatDocument } from './entities/flat.entity';
import { Rent, RentDocument } from '../rents/entities/rent.entity';
import { RentStatus } from '../rents/types/rent-status.enum';
import { FlatStatus } from './types/flat-status.enum';
import { User, UserDocument } from 'src/user/entities/user.entity';
import { ToLetService } from '../to-let/to-let.service';
import { MoveOutRequest, MoveOutRequestDocument, MoveOutRequestStatus } from '../move-out/entities/move-out-request.entity';


@Injectable()
export class FlatsService {
  private readonly logger = new Logger(FlatsService.name);

  constructor(
    @InjectModel(Flat.name) private flatModel: Model<FlatDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Rent.name) private rentModel: Model<RentDocument>,
    @InjectModel(MoveOutRequest.name) private moveOutRequestModel: Model<MoveOutRequestDocument>,
    private readonly toLetService: ToLetService,
  ) { }

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

  async findVacant() {
    return this.flatModel
      .find({ status: FlatStatus.VACANT })
      .populate('user', 'name phone email -_id')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: string,
    updateFlatDto: UpdateFlatDto,
    userId: string,
  ): Promise<Flat> {
    const currentFlat = await this.flatModel.findOne({
      _id: id,
      user: userId,
    });

    if (!currentFlat) {
      throw new NotFoundException(`Flat with ID ${id} not found`);
    }

    // NOTICE PERIOD ENFORCEMENT: Prevent premature vacancy
    if (updateFlatDto.status === FlatStatus.VACANT) {
      // Check if there's an APPROVED moveout request for this flat
      const approvedRequest = await this.moveOutRequestModel.findOne({
        flat: id,
        status: MoveOutRequestStatus.APPROVED,
      });

      if (approvedRequest) {
        const moveOutDate = new Date(approvedRequest.moveOutMonth);
        const now = new Date();

        // Normalize both dates to first of month for comparison
        moveOutDate.setDate(1);
        moveOutDate.setHours(0, 0, 0, 0);
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        if (currentMonth < moveOutDate) {
          throw new BadRequestException(
            `Cannot mark flat as vacant until moveout date: ${moveOutDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Notice period must be respected.`,
          );
        }
      }

      // Ensure data consistency: Remove this flat from ANY user who claims it
      await this.userModel.updateMany({ flat: id }, { flat: null });

      if (currentFlat.status !== FlatStatus.VACANT) {
        await this.cleanupUnpaidRentsForFlat(id);
      }

      // Ensure tenant is removed when flat becomes vacant
      (updateFlatDto as any).tenant = null;
    }

    // Handle tenant assignment/unassignment
    if (updateFlatDto.tenant !== undefined) {
      // If there was a previous tenant, remove the flat from their record
      if (currentFlat.tenant) {
        await this.userModel.findByIdAndUpdate(currentFlat.tenant, {
          flat: null,
        });
      }

      // If a new tenant is being assigned, add the flat to their record
      if (updateFlatDto.tenant) {
        await this.userModel.findByIdAndUpdate(updateFlatDto.tenant, {
          flat: id,
        });
      }
    }

    const updatedFlat = await this.flatModel
      .findOneAndUpdate({ _id: id, user: userId }, updateFlatDto, { new: true })
      .populate('tenant', 'name email')
      .exec();
    if (!updatedFlat) {
      throw new NotFoundException(`Flat with ID ${id} not found`);
    }

    // Real-time To-Let update
    await this.toLetService.updateVacancyStatus(id);

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

  /**
   * Cleanup unpaid rents for a flat when it becomes vacant
   */
  private async cleanupUnpaidRentsForFlat(flatId: string): Promise<void> {
    try {
      const result = await this.rentModel.deleteMany({
        flat: flatId,
        status: { $in: [RentStatus.PENDING, RentStatus.PARTIAL, RentStatus.OVERDUE] },
        dueAmount: { $gt: 0 },
      });

      if (result.deletedCount > 0) {
        this.logger.log(
          `Cleaned up ${result.deletedCount} unpaid rent(s) for flat ${flatId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error cleaning up rents for flat ${flatId}:`,
        error,
      );
    }
  }
}

