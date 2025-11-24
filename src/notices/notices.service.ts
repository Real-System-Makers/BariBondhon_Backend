import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { Notice, NoticeDocument } from './entities/notice.entity';
import { HousesService } from '../houses/houses.service';
import { User, UserDocument } from '../user/entities/user.entity';
import { Flat, FlatDocument } from '../flats/entities/flat.entity';
import { Role } from '../common/types/role.enum';

@Injectable()
export class NoticesService {
  private readonly logger = new Logger(NoticesService.name);

  constructor(
    @InjectModel(Notice.name)
    private noticeModel: Model<NoticeDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Flat.name)
    private flatModel: Model<FlatDocument>,
    private housesService: HousesService,
  ) {}

  async create(
    createNoticeDto: CreateNoticeDto,
    userId: string,
  ): Promise<Notice> {
    const house = await this.housesService.findOrCreate(userId);

    const notice = new this.noticeModel({
      ...createNoticeDto,
      house: house._id,
      createdBy: userId,
      isUrgent: createNoticeDto.isUrgent || false,
    });

    await notice.save();

    this.logger.log(`Notice created by user ${userId}: ${notice.title}`);

    return notice;
  }

  async findAllForTenant(userId: string): Promise<Notice[]> {
    const tenant = await this.userModel.findById(userId).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.flat) {
      return [];
    }

    const flat = await this.flatModel.findById(tenant.flat).exec();
    if (!flat || !flat.user) {
      return [];
    }

    const ownerId = String(flat.user);
    const house = await this.housesService.findOrCreate(ownerId);
    
    if (!house || String(house.user) !== ownerId) {
      this.logger.warn(`House mismatch for tenant ${userId} - owner ${ownerId}`);
      return [];
    }

    return this.noticeModel
      .find({ house: house._id })
      .populate('createdBy', 'name email')
      .sort({ isUrgent: -1, createdAt: -1 })
      .exec();
  }

  async findAllForOwner(userId: string): Promise<Notice[]> {
    const house = await this.housesService.findOrCreate(userId);
    
    if (!house || String(house.user) !== userId) {
      this.logger.warn(`House mismatch for owner ${userId}`);
      return [];
    }

    return this.noticeModel
      .find({ house: house._id })
      .populate('createdBy', 'name email')
      .sort({ isUrgent: -1, createdAt: -1 })
      .exec();
  }

  async findAll(userId: string): Promise<Notice[]> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.TENANT) {
      return this.findAllForTenant(userId);
    } else {
      return this.findAllForOwner(userId);
    }
  }
}

