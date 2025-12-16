import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MoveOutRequest,
  MoveOutRequestDocument,
  MoveOutRequestStatus,
} from './entities/move-out-request.entity';
import { CreateMoveOutDto } from './dto/create-move-out.dto';
import { ToLetService } from '../to-let/to-let.service';

@Injectable()
export class MoveOutService {
  constructor(
    @InjectModel(MoveOutRequest.name)
    private moveOutRequestModel: Model<MoveOutRequestDocument>,
    private readonly toLetService: ToLetService,
  ) { }

  const owner = flat.user as unknown as UserDocument;

  // 2. Calculate Earliest Allowed Month
  const minimumNoticePeriod = owner.minimumNoticePeriod || 1;
  const now = new Date();
  const currentDay = now.getDate();
    let startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

// If after the 7th, start counting from next month
if (currentDay > 7) {
  startMonth.setMonth(startMonth.getMonth() + 1);
}

const earliestDate = new Date(startMonth);
earliestDate.setMonth(earliestDate.getMonth() + minimumNoticePeriod);

const requestedDate = new Date(createDto.moveOutMonth);
// Normalize requestedDate to 1st of month just in case
requestedDate.setDate(1);
requestedDate.setHours(0, 0, 0, 0);

// Normalize earliestDate to 1st of month for comparison
earliestDate.setDate(1);
earliestDate.setHours(0, 0, 0, 0);

// 3. Validate
if (requestedDate < earliestDate) {
  if (!createDto.note || createDto.note.trim() === '') {
    throw new BadRequestException(
      `Minimum notice period is ${minimumNoticePeriod} month(s). Earliest valid month is ${earliestDate.toLocaleString('default', { month: 'long', year: 'numeric' })}. Please provide a note for emergency requests.`,
    );
  }
}

// 4. Create Request
const request = new this.moveOutRequestModel({
  tenant: tenantId,
  owner: owner._id,
  flat: flat._id,
  requestDate: new Date(),
  moveOutMonth: requestedDate,
  note: createDto.note,
});

return request.save();
  }

  async findAllForOwner(ownerId: string) {
  return this.moveOutRequestModel
    .find({ owner: ownerId })
    .populate('tenant', 'name email phone')
    .populate('flat', 'name')
    .sort({ requestDate: -1 })
    .exec();
}

  async update(id: string, updateDto: UpdateMoveOutRequestDto, ownerId: string) {
  const request = await this.moveOutRequestModel.findOne({
    _id: id,
    owner: ownerId,
  });

  if (!request) {
    throw new NotFoundException('Request not found');
  }

  request.status = updateDto.status;
  if (updateDto.moveOutMonth) {
    const newDate = new Date(updateDto.moveOutMonth);
    newDate.setDate(1);
    request.moveOutMonth = newDate;
  }

  return request.save();
}
  
  async getNoticePeriod(ownerId: string) {
  const user = await this.userService.findOneUserById(ownerId);
  return { minimumNoticePeriod: user.minimumNoticePeriod || 1 };
}

  async getNoticePeriodForTenant(tenantId: string) {
  const flat = await this.flatModel.findOne({ tenant: tenantId }).populate('user');

  // Check for active request
  const existingRequest = await this.moveOutRequestModel.findOne({
    tenant: tenantId,
    status: { $in: [MoveOutRequestStatus.PENDING, MoveOutRequestStatus.APPROVED] },
  });

  if (!flat) {
    // Fallback if not assigned to a flat, default to 1? Or throw?
    // Default 1 is safe.
    return {
      minimumNoticePeriod: 1,
      hasActiveRequest: !!existingRequest,
      activeRequest: existingRequest
    };
  }
  const owner = flat.user as unknown as UserDocument;
  return {
    minimumNoticePeriod: owner.minimumNoticePeriod || 1,
    hasActiveRequest: !!existingRequest,
    activeRequest: existingRequest
  };
}

  async setNoticePeriod(ownerId: string, period: number) {
  return this.userService.updateUser(ownerId, { minimumNoticePeriod: period });
}
}
