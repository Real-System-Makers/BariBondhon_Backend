import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AddReplyDto } from './dto/add-reply.dto';
import {
  MaintenanceRequest,
  MaintenanceRequestDocument,
} from './entities/maintenance-request.entity';
import { HousesService } from '../houses/houses.service';
import { User, UserDocument } from '../user/entities/user.entity';
import { Flat, FlatDocument } from '../flats/entities/flat.entity';
import { Role } from '../common/types/role.enum';
import { MaintenanceStatus } from './types/maintenance-status.enum';
import * as mongoose from 'mongoose';

@Injectable()
export class MaintenanceService {
  private getIdString(value: any): string {
    if (value instanceof mongoose.Types.ObjectId) {
      return value.toString();
    }
    if (typeof value === 'object' && value !== null && '_id' in value) {
      const obj = value as { _id: unknown };
      return String(obj._id);
    }
    return String(value);
  }
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    @InjectModel(MaintenanceRequest.name)
    private maintenanceRequestModel: Model<MaintenanceRequestDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Flat.name)
    private flatModel: Model<FlatDocument>,
    private housesService: HousesService,
  ) {}

  async create(
    createMaintenanceRequestDto: CreateMaintenanceRequestDto,
    tenantId: string,
  ): Promise<MaintenanceRequest> {
    const tenant = await this.userModel.findById(tenantId).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.flat) {
      throw new NotFoundException('Tenant is not assigned to any flat');
    }

    const flat = await this.flatModel.findById(tenant.flat).exec();
    if (!flat) {
      throw new NotFoundException('Flat not found');
    }

    const ownerId = this.getIdString(flat.user);
    const house = await this.housesService.findOrCreate(ownerId);

    this.logger.log(
      `Creating maintenance request - tenant: ${tenantId}, owner: ${ownerId}, house: ${String(house._id)}`,
    );

    const maintenanceRequest = new this.maintenanceRequestModel({
      ...createMaintenanceRequestDto,
      tenant: tenantId,
      flat: flat._id,
      owner: ownerId,
      house: house._id,
      status: MaintenanceStatus.PENDING,
      statusHistory: [
        {
          status: MaintenanceStatus.PENDING,
          changedAt: new Date(),
        },
      ],
      replies: [],
    });

    await maintenanceRequest.save();

    this.logger.log(
      `Maintenance request created by tenant ${tenantId}: ${createMaintenanceRequestDto.issueType}, request ID: ${String(maintenanceRequest._id)}, house ID: ${String(house._id)}`,
    );

    return maintenanceRequest.populate([
      { path: 'tenant', select: 'name email phone' },
      { path: 'flat', select: 'name' },
      { path: 'owner', select: 'name email' },
    ]);
  }

  async findAllForTenant(tenantId: string): Promise<MaintenanceRequest[]> {
    const tenant = await this.userModel.findById(tenantId).exec();
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.maintenanceRequestModel
      .find({ tenant: tenantId })
      .populate('tenant', 'name email phone')
      .populate('flat', 'name')
      .populate('owner', 'name email')
      .populate('replies.sender', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllForOwner(
    ownerId: string,
    status?: MaintenanceStatus,
  ): Promise<MaintenanceRequest[]> {
    const house = await this.housesService.findOrCreate(ownerId);

    if (!house) {
      this.logger.warn(`House not found for owner ${ownerId}`);
      return [];
    }

    const query: { house: any; status?: MaintenanceStatus } = {
      house: house._id,
    };

    if (status) {
      query.status = status;
    }

    this.logger.log(
      `Finding maintenance requests for owner ${ownerId}, house: ${String(house._id)}, status: ${status || 'all'}`,
    );

    const requests = await this.maintenanceRequestModel
      .find(query)
      .populate('tenant', 'name email phone')
      .populate('flat', 'name')
      .populate('owner', 'name email')
      .populate('replies.sender', 'name email role')
      .populate('statusHistory.changedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();

    this.logger.log(
      `Found ${requests.length} maintenance requests for owner ${ownerId}`,
    );

    return requests;
  }

  async getStats(ownerId: string) {
    const house = await this.housesService.findOrCreate(ownerId);

    if (!house) {
      this.logger.warn(`House not found for owner ${ownerId}`);
      return {
        pending: 0,
        in_progress: 0,
        resolved: 0,
        total: 0,
      };
    }

    const [pending, inProgress, resolved, total] = await Promise.all([
      this.maintenanceRequestModel.countDocuments({
        house: house._id,
        status: MaintenanceStatus.PENDING,
      }),
      this.maintenanceRequestModel.countDocuments({
        house: house._id,
        status: MaintenanceStatus.IN_PROGRESS,
      }),
      this.maintenanceRequestModel.countDocuments({
        house: house._id,
        status: MaintenanceStatus.RESOLVED,
      }),
      this.maintenanceRequestModel.countDocuments({ house: house._id }),
    ]);

    this.logger.log(
      `Stats for owner ${ownerId}: pending=${pending}, in_progress=${inProgress}, resolved=${resolved}, total=${total}`,
    );

    return {
      pending,
      in_progress: inProgress,
      resolved,
      total,
    };
  }

  async findOne(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<MaintenanceRequest> {
    const request = await this.maintenanceRequestModel
      .findById(id)
      .populate('tenant', 'name email phone')
      .populate('flat', 'name')
      .populate('owner', 'name email')
      .populate('replies.sender', 'name email role')
      .populate('statusHistory.changedBy', 'name email')
      .exec();

    if (!request) {
      throw new NotFoundException('Maintenance request not found');
    }

    if (userRole === Role.TENANT) {
      const requestTenantId = this.getIdString(request.tenant);
      if (requestTenantId !== userId) {
        throw new ForbiddenException(
          'You do not have access to this maintenance request',
        );
      }
    } else if (userRole === Role.OWNER) {
      const house = await this.housesService.findOrCreate(userId);
      const requestHouseId = this.getIdString(request.house);
      if (requestHouseId !== String(house._id)) {
        throw new ForbiddenException(
          'You do not have access to this maintenance request',
        );
      }
    }

    return request;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    userId: string,
  ): Promise<MaintenanceRequest> {
    const request = await this.maintenanceRequestModel.findById(id).exec();

    if (!request) {
      throw new NotFoundException('Maintenance request not found');
    }

    const house = await this.housesService.findOrCreate(userId);
    const requestHouseId = this.getIdString(request.house);
    if (requestHouseId !== String(house._id)) {
      throw new ForbiddenException(
        'You do not have permission to update this maintenance request',
      );
    }

    const oldStatus = request.status;
    request.status = updateStatusDto.status;

    request.statusHistory.push({
      status: updateStatusDto.status,
      changedAt: new Date(),
      changedBy: userId,
    });

    await request.save();

    this.logger.log(
      `Maintenance request ${id} status updated from ${oldStatus} to ${updateStatusDto.status} by ${userId}`,
    );

    const updatedRequest = await this.maintenanceRequestModel
      .findById(id)
      .populate('tenant', 'name email phone')
      .populate('flat', 'name')
      .populate('owner', 'name email')
      .populate('replies.sender', 'name email role')
      .populate('statusHistory.changedBy', 'name email')
      .exec();

    if (!updatedRequest) {
      throw new NotFoundException('Maintenance request not found after update');
    }

    return updatedRequest;
  }

  async addReply(
    id: string,
    addReplyDto: AddReplyDto,
    userId: string,
  ): Promise<MaintenanceRequest> {
    const request = await this.maintenanceRequestModel.findById(id).exec();

    if (!request) {
      throw new NotFoundException('Maintenance request not found');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.TENANT) {
      const requestTenantId = this.getIdString(request.tenant);
      if (requestTenantId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to reply to this maintenance request',
        );
      }
    } else if (user.role === Role.OWNER) {
      const house = await this.housesService.findOrCreate(userId);
      const requestHouseId = this.getIdString(request.house);
      if (requestHouseId !== String(house._id)) {
        throw new ForbiddenException(
          'You do not have permission to reply to this maintenance request',
        );
      }
    } else {
      throw new ForbiddenException('Invalid user role');
    }

    request.replies.push({
      message: addReplyDto.message,
      sender: userId,
      senderRole: user.role,
      createdAt: new Date(),
    });

    await request.save();

    this.logger.log(
      `Reply added to maintenance request ${id} by ${userId} (${user.role})`,
    );

    const updatedRequest = await this.maintenanceRequestModel
      .findById(id)
      .populate('tenant', 'name email phone')
      .populate('flat', 'name')
      .populate('owner', 'name email')
      .populate('replies.sender', 'name email role')
      .populate('statusHistory.changedBy', 'name email')
      .exec();

    if (!updatedRequest) {
      throw new NotFoundException(
        'Maintenance request not found after adding reply',
      );
    }

    return updatedRequest;
  }
}
