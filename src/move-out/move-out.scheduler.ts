import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MoveOutRequest, MoveOutRequestDocument, MoveOutRequestStatus } from './entities/move-out-request.entity';
import { Flat, FlatDocument } from '../flats/entities/flat.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { FlatStatus } from '../flats/types/flat-status.enum';
import { ToLetService } from '../to-let/to-let.service';

@Injectable()
export class MoveOutScheduler {
  private readonly logger = new Logger(MoveOutScheduler.name);

  constructor(
    @InjectModel(MoveOutRequest.name)
    private moveOutRequestModel: Model<MoveOutRequestDocument>,
    @InjectModel(Flat.name)
    private flatModel: Model<FlatDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly toLetService: ToLetService,
  ) {}

  // Run at midnight on the 1st of every month
  @Cron('0 0 1 * *')
  async handleScheduledVacates() {
    this.logger.log('Running scheduled vacate check...');

    const now = new Date();
    // Normalize to start of current month
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Find APPROVED requests where moveOutMonth < Current Month
    // Example: MoveOutMonth: Dec 2024. Current: Jan 2025.
    // Dec < Jan. Should vacate.
    const requests = await this.moveOutRequestModel.find({
      status: MoveOutRequestStatus.APPROVED,
      moveOutMonth: { $lt: startOfCurrentMonth },
    });

    this.logger.log(`Found ${requests.length} pending vacates.`);

    for (const req of requests) {
      try {
        this.logger.log(`Processing vacate for Tenant ${req.tenant} (Flat ${req.flat})`);
        
        // Vacate the flat and remove tenant assignment
        await this.flatModel.findByIdAndUpdate(req.flat, {
          status: FlatStatus.VACANT,
          $unset: { tenant: '' },
        });

        // Remove flat assignment from tenant user (preserve the account)
        await this.userModel.findByIdAndUpdate(req.tenant, {
          $unset: { flat: '' },
        });

        // Mark request as COMPLETED to prevent reprocessing
        await this.moveOutRequestModel.findByIdAndUpdate(req._id, {
          status: MoveOutRequestStatus.COMPLETED,
        });

        // Trigger ToLet feed update so the flat appears as vacant
        await this.toLetService.updateVacancyStatus(req.flat.toString());
        
        this.logger.log(`Vacated Tenant ${req.tenant} successfully. Tenant account preserved.`);
      } catch (error) {
        this.logger.error(`Failed to vacate Tenant ${req.tenant}:`, error);
      }
    }
  }
}
