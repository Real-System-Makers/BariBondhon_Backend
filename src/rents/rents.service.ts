import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRentDto } from './dto/create-rent.dto';
import { UpdateRentDto } from './dto/update-rent.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { GenerateRentsDto } from './dto/generate-rents.dto';
import { Rent, RentDocument } from './entities/rent.entity';
import { Flat, FlatDocument } from '../flats/entities/flat.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { RentStatus } from './types/rent-status.enum';
import { FlatStatus } from '../flats/types/flat-status.enum';

@Injectable()
export class RentsService {
  constructor(
    @InjectModel(Rent.name) private rentModel: Model<RentDocument>,
    @InjectModel(Flat.name) private flatModel: Model<FlatDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createRentDto: CreateRentDto, ownerId: string): Promise<Rent> {
    const { tenantId, flatId, ...rentData } = createRentDto;

    // Verify flat belongs to owner
    const flat = await this.flatModel.findOne({ _id: flatId, user: ownerId });
    if (!flat) {
      throw new NotFoundException('Flat not found or you do not own it');
    }

    // Verify tenant
    const tenant = await this.userModel.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if rent already exists for this month
    const existingRent = await this.rentModel.findOne({
      flat: flatId,
      month: createRentDto.month,
      year: createRentDto.year,
    });

    if (existingRent) {
      throw new BadRequestException(
        'Rent for this flat and month already exists',
      );
    }

    // Calculate total and due amount
    const baseRent = flat.rent;
    const electricityBill = rentData.electricityBill || 0;
    const gasBill = rentData.gasBill || 0;
    const waterBill = rentData.waterBill || 0;
    const serviceBill = rentData.serviceBill || 0;
    const totalAmount =
      baseRent + electricityBill + gasBill + waterBill + serviceBill;

    const createdRent = new this.rentModel({
      ...rentData,
      tenant: tenantId,
      flat: flatId,
      owner: ownerId,
      baseRent,
      electricityBill,
      gasBill,
      waterBill,
      serviceBill,
      totalAmount,
      lateFee: 0,
      adjustedTotalAmount: totalAmount,
      paidAmount: 0,
      dueAmount: totalAmount,
      status: RentStatus.PENDING,
    });

    return createdRent.save();
  }

  async findAll(
    ownerId: string,
    filters?: {
      month?: string;
      year?: number;
      status?: RentStatus;
      tenantId?: string;
    },
  ): Promise<Rent[]> {
    const query: any = { owner: ownerId };

    if (filters?.month) query.month = filters.month;
    if (filters?.year) query.year = filters.year;
    if (filters?.status) query.status = filters.status;
    if (filters?.tenantId) query.tenant = filters.tenantId;

    return this.rentModel
      .find(query)
      .populate('tenant', 'name email phone')
      .populate('flat', 'name')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .exec();
  }

  async findOne(id: string, ownerId: string): Promise<Rent> {
    const rent = await this.rentModel
      .findOne({ _id: id, owner: ownerId })
      .populate('tenant', 'name email phone')
      .populate('flat', 'name bedrooms bathrooms')
      .exec();

    if (!rent) {
      throw new NotFoundException(`Rent with ID ${id} not found`);
    }
    return rent;
  }

  async findByTenant(tenantId: string): Promise<Rent[]> {
    return this.rentModel
      .find({ tenant: tenantId })
      .populate('flat', 'name')
      .populate('owner', 'name phone email address')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .exec();
  }

  async getPaymentHistory(
    tenantId: string,
    filters?: {
      status?: string[];
      limit?: number;
      offset?: number;
    },
  ): Promise<{ data: Rent[]; total: number }> {
    const query: any = { tenant: tenantId };

    if (filters?.status && filters.status.length > 0) {
      query.status = { $in: filters.status };
    }

    const total = await this.rentModel.countDocuments(query);

    let queryBuilder = this.rentModel
      .find(query)
      .populate('flat', 'name')
      .populate('owner', 'name phone email address')
      .sort({ year: -1, month: -1, createdAt: -1 });

    if (filters?.limit) {
      queryBuilder = queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder = queryBuilder.skip(filters.offset);
    }

    const data = await queryBuilder.exec();

    return { data, total };
  }

  async update(
    id: string,
    updateRentDto: UpdateRentDto,
    ownerId: string,
  ): Promise<Rent> {
    const rent = await this.rentModel.findOne({ _id: id, owner: ownerId });
    if (!rent) {
      throw new NotFoundException(`Rent with ID ${id} not found`);
    }

    // Recalculate if utility bills changed
    if (
      updateRentDto.electricityBill !== undefined ||
      updateRentDto.gasBill !== undefined ||
      updateRentDto.waterBill !== undefined ||
      updateRentDto.serviceBill !== undefined
    ) {
      const electricityBill =
        updateRentDto.electricityBill ?? rent.electricityBill;
      const gasBill = updateRentDto.gasBill ?? rent.gasBill;
      const waterBill = updateRentDto.waterBill ?? rent.waterBill;
      const serviceBill = updateRentDto.serviceBill ?? rent.serviceBill;

      const totalAmount =
        rent.baseRent + electricityBill + gasBill + waterBill + serviceBill;
      const adjustedTotalAmount = totalAmount + (rent.lateFee || 0);
      const dueAmount = adjustedTotalAmount - rent.paidAmount;

      Object.assign(rent, updateRentDto, { totalAmount, adjustedTotalAmount, dueAmount });
    } else {
      Object.assign(rent, updateRentDto);
    }

    return rent.save();
  }

  async recordPayment(
    id: string,
    recordPaymentDto: RecordPaymentDto,
    userId: string,
  ): Promise<Rent> {
    const rent = await this.rentModel.findOne({
      _id: id,
      $or: [{ owner: userId }, { tenant: userId }],
    });
    if (!rent) {
      throw new NotFoundException(`Rent with ID ${id} not found or access denied`);
    }

    const { amount, paymentMethod, note } = recordPaymentDto;

    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    const newPaidAmount = rent.paidAmount + amount;
    const adjustedTotal = rent.adjustedTotalAmount || rent.totalAmount;

    if (newPaidAmount > adjustedTotal) {
      throw new BadRequestException(
        'Payment amount exceeds total rent amount',
      );
    }

    const dueAmount = adjustedTotal - newPaidAmount;
    let status: RentStatus;

    if (dueAmount === 0) {
      status = RentStatus.PAID;
      rent.paidDate = new Date();
    } else {
      status = RentStatus.PARTIAL;
    }

    rent.paidAmount = newPaidAmount;
    rent.dueAmount = dueAmount;
    rent.status = status;
    if (paymentMethod) rent.paymentMethod = paymentMethod;
    if (note) rent.note = note;

    return rent.save();
  }

  async remove(id: string, ownerId: string): Promise<Rent> {
    const deletedRent = await this.rentModel
      .findOneAndDelete({ _id: id, owner: ownerId })
      .exec();

    if (!deletedRent) {
      throw new NotFoundException(`Rent with ID ${id} not found`);
    }
    return deletedRent;
  }

  async getMonthlyStats(
    ownerId: string,
    month: string,
    year: number,
  ): Promise<{
    totalCollected: number;
    totalPending: number;
    totalOverdue: number;
    totalRent: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
    partialCount: number;
  }> {
    const rents = await this.rentModel.find({
      owner: ownerId,
      month,
      year,
    });

    const stats = {
      totalCollected: 0,
      totalPending: 0,
      totalOverdue: 0,
      totalRent: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
      partialCount: 0,
    };

    rents.forEach((rent) => {
      stats.totalRent += rent.totalAmount;
      stats.totalCollected += rent.paidAmount;

      if (rent.status === RentStatus.PAID) {
        stats.paidCount++;
      } else if (rent.status === RentStatus.PENDING) {
        stats.pendingCount++;
        stats.totalPending += rent.dueAmount;
      } else if (rent.status === RentStatus.PARTIAL) {
        stats.partialCount++;
        stats.totalPending += rent.dueAmount;
      } else if (rent.status === RentStatus.OVERDUE) {
        stats.overdueCount++;
        stats.totalOverdue += rent.dueAmount;
      }
    });

    return stats;
  }

  async generateMonthlyRents(
    generateRentsDto: GenerateRentsDto,
    ownerId: string,
  ): Promise<{ created: number; skipped: number; message: string }> {
    const { month, year, dueDate } = generateRentsDto;

    // Find all occupied flats owned by this owner
    const occupiedFlats = await this.flatModel
      .find({
        user: ownerId,
        status: FlatStatus.OCCUPIED,
        tenant: { $ne: null },
      })
      .populate('tenant');

    let created = 0;
    let skipped = 0;

    for (const flat of occupiedFlats) {
      // Check if rent already exists
      const existingRent = await this.rentModel.findOne({
        flat: flat._id,
        month,
        year,
      });

      if (existingRent) {
        skipped++;
        continue;
      }

      // Create rent
      const totalAmount = flat.rent;
      const newRent = new this.rentModel({
        tenant: flat.tenant,
        flat: flat._id,
        owner: ownerId,
        month,
        year,
        baseRent: flat.rent,
        electricityBill: 0,
        gasBill: 0,
        waterBill: 0,
        serviceBill: 0,
        totalAmount,
        lateFee: 0,
        adjustedTotalAmount: totalAmount,
        paidAmount: 0,
        dueAmount: totalAmount,
        status: RentStatus.PENDING,
        dueDate,
      });

      await newRent.save();
      created++;
    }

    return {
      created,
      skipped,
      message: `Generated ${created} rent entries. Skipped ${skipped} existing entries.`,
    };
  }
}
