import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MoveOutRequest, MoveOutRequestDocument, MoveOutRequestStatus } from './entities/move-out-request.entity';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class MoveOutScheduler {
  private readonly logger = new Logger(MoveOutScheduler.name);

  constructor(
    @InjectModel(MoveOutRequest.name)
    private moveOutRequestModel: Model<MoveOutRequestDocument>,
    private tenantsService: TenantsService,
  ) {}

  // Run at midnight on the 1st of every month
  @Cron('0 0 1 * *')
  async handleScheduledVacates() {
    this.logger.log('Running scheduled vacate check...');

    const now = new Date();
    // Normalization not strictly needed if we compare < FirstDayOfCurrentMonth
    // But safer:
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
        
        // Use tenantsService to remove/vacate
        // Note: remove() expects Tenant ID (User ID)
        // Ensure tenant is populated or just use the ID
        await this.tenantsService.remove(req.tenant.toString());

        // Update request status to 'COMPLETED' or delete?
        // Let's add a COMPLETED status or just keep it Approved but processed?
        // Better to mark processed. But Enum might need update.
        // For now, let's just log. If we don't change status/flag, it might run again?
        // Wait, tenantsService.remove DELETES the user. 
        // So req.tenant (User) will be gone.
        // But the Request document remains.
        // If User is gone, TenantsService.remove might fail if it tries to find User?
        // TenantsService.remove:
        // 1. flatModel.updateMany({tenant: id}, {unset, status: VACANT})
        // 2. userService.removeUser(id)
        // It relies on ID. It should be fine if called once.
        // But if we run this again next month, we might try to remove a non-existent user.
        // We should delete the request or status update.
        
        // Let's delete the request after processing to keep it clean? 
        // Or keep history? If history, we need a PROCESSED status.
        // Let's delete for now as per "Request" lifecycle usually ends.
        // Or update to REJECTED/ARCHIVED?
        // Re-using APPROVED is risky if we don't flag "processed".
        
        // Simple fix: delete the request.
        await this.moveOutRequestModel.deleteOne({ _id: req._id });
        
        this.logger.log(`Vacated Tenant ${req.tenant} successfully.`);
      } catch (error) {
        this.logger.error(`Failed to vacate Tenant ${req.tenant}:`, error);
      }
    }
  }
}
