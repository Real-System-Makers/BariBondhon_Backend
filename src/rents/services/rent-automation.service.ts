import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rent, RentDocument } from '../entities/rent.entity';
import { RentConfig, RentConfigDocument } from '../entities/rent-config.entity';
import { Flat, FlatDocument } from '../../flats/entities/flat.entity';
import { RentStatus } from '../types/rent-status.enum';
import { FlatStatus } from '../../flats/types/flat-status.enum';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/types/notification.enum';

@Injectable()
export class RentAutomationService {
  private readonly logger = new Logger(RentAutomationService.name);

  constructor(
    @InjectModel(Rent.name) private rentModel: Model<RentDocument>,
    @InjectModel(RentConfig.name)
    private rentConfigModel: Model<RentConfigDocument>,
    @InjectModel(Flat.name) private flatModel: Model<FlatDocument>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Generate monthly rents automatically
   * TESTING: Runs every 2 minutes for verification
   * PRODUCTION: Should be '1 0 1 * *' (1st of month at 00:01 AM)
   */
  @Cron('*/2 * * * *', {
    name: 'generate-monthly-rents',
    timeZone: 'Asia/Dhaka',
  })
  async handleMonthlyRentGeneration() {
    this.logger.log('Starting automated monthly rent generation...');

    try {
      const configs = await this.rentConfigModel.find({
        autoGenerateRents: true,
      });

      for (const config of configs) {
        await this.generateRentsForOwner(config);
      }

      this.logger.log('Automated monthly rent generation completed');
    } catch (error) {
      this.logger.error('Error in automated rent generation:', error);
    }
  }

  /**
   * Check and update overdue rents
   * Runs daily at 00:05 AM
   */
  @Cron('5 0 * * *', {
    name: 'update-overdue-rents',
    timeZone: 'Asia/Dhaka',
  })
  async handleOverdueRentUpdate() {
    this.logger.log('Starting overdue rent status update...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all pending or partial rents past due date
      const overdueRents = await this.rentModel.find({
        status: { $in: [RentStatus.PENDING, RentStatus.PARTIAL] },
        dueDate: { $lt: today },
      });

      this.logger.log(`Found ${overdueRents.length} overdue rents`);

      for (const rent of overdueRents) {
        await this.updateOverdueRent(rent);
      }

      this.logger.log('Overdue rent status update completed');
    } catch (error) {
      this.logger.error('Error updating overdue rents:', error);
    }
  }

  /**
   * Calculate and apply late fees
   * Runs daily at 00:10 AM
   */
  @Cron('10 0 * * *', {
    name: 'calculate-late-fees',
    timeZone: 'Asia/Dhaka',
  })
  async handleLateFeeCalculation() {
    this.logger.log('Starting late fee calculation...');

    try {
      const configs = await this.rentConfigModel.find({
        lateFeeEnabled: true,
      });

      for (const config of configs) {
        await this.calculateLateFees(config);
      }

      this.logger.log('Late fee calculation completed');
    } catch (error) {
      this.logger.error('Error calculating late fees:', error);
    }
  }

  /**
   * Cleanup orphaned and unpaid rents for vacant flats
   * Runs daily at 00:15 AM
   */
  @Cron('15 0 * * *', {
    name: 'cleanup-orphaned-rents',
    timeZone: 'Asia/Dhaka',
  })
  async handleRentCleanup() {
    this.logger.log('Starting rent cleanup for vacant flats...');

    try {
      let totalDeleted = 0;

      const vacantFlats = await this.flatModel.find({
        status: FlatStatus.VACANT,
      });

      this.logger.log(`Found ${vacantFlats.length} vacant flats`);

      for (const flat of vacantFlats) {
        const result = await this.rentModel.deleteMany({
          flat: flat._id,
          status: { $in: [RentStatus.PENDING, RentStatus.PARTIAL, RentStatus.OVERDUE] },
          dueAmount: { $gt: 0 },
        });

        if (result.deletedCount > 0) {
          totalDeleted += result.deletedCount;
          this.logger.log(
            `Cleaned up ${result.deletedCount} unpaid rent(s) for vacant flat ${flat._id}`,
          );
        }
      }

      const orphanedRents = await this.rentModel.find({
        status: { $in: [RentStatus.PENDING, RentStatus.PARTIAL, RentStatus.OVERDUE] },
        dueAmount: { $gt: 0 },
      }).populate('flat');

      let orphanedDeleted = 0;
      for (const rent of orphanedRents) {
        const flat = rent.flat as any;
        if (!flat || !flat.tenant) {
          await this.rentModel.deleteOne({ _id: rent._id });
          orphanedDeleted++;
        }
      }

      if (orphanedDeleted > 0) {
        totalDeleted += orphanedDeleted;
        this.logger.log(`Cleaned up ${orphanedDeleted} orphaned rent(s)`);
      }

      this.logger.log(
        `Rent cleanup completed. Total deleted: ${totalDeleted}`,
      );
    } catch (error) {
      this.logger.error('Error in rent cleanup:', error);
    }
  }

  /**
   * Generate rents for a specific owner based on their config
   */
  private async generateRentsForOwner(config: RentConfigDocument) {
    const currentDate = new Date();

    // TESTING: Skip generation day check for testing
    // PRODUCTION: Uncomment the following lines
    // const currentDay = currentDate.getDate();
    // if (currentDay !== config.generationDay) {
    //   return;
    // }

    const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const year = currentDate.getFullYear();

    // Calculate due date
    const dueDate = new Date(currentDate);
    dueDate.setDate(config.dueDayOffset);
    // TESTING: Simplified for testing - always set to config offset days from now
    // PRODUCTION: Uncomment check below
    // if (config.dueDayOffset < currentDay) {
    //   dueDate.setMonth(dueDate.getMonth() + 1);
    // }

    // Get owner's house for water/gas bills
    const House = this.flatModel.db.model('House');
    let waterBill = 0;
    let gasBill = 0;
    
    try {
      const house = await House.findOne({ user: config.owner });
      if (house) {
        waterBill = house.waterBill || 0;
        gasBill = house.gasBill || 0;
      }
    } catch (error) {
      this.logger.warn(`Could not fetch house data for owner ${config.owner}`);
    }

    // Find all occupied flats for this owner
    const occupiedFlats = await this.flatModel
      .find({
        user: config.owner,
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

      // Calculate electricity bill from flat readings
      const electricityConsumption = Math.max(
        0,
        (flat.currentElectricityReading || 0) - (flat.previousElectricityReading || 0)
      );
      const electricityBill = electricityConsumption * (flat.electricityRatePerUnit || 8);

      // Calculate total amount
      const baseRent = flat.rent;
      const totalAmount = baseRent + electricityBill + gasBill + waterBill;

      // Create rent
      const newRent = new this.rentModel({
        tenant: flat.tenant,
        flat: flat._id,
        owner: config.owner,
        month,
        year,
        baseRent,
        electricityBill: Math.round(electricityBill),
        gasBill,
        waterBill,
        serviceBill: 0,
        totalAmount: Math.round(totalAmount),
        lateFee: 0,
        adjustedTotalAmount: Math.round(totalAmount),
        paidAmount: 0,
        dueAmount: Math.round(totalAmount),
        status: RentStatus.PENDING,
        dueDate,
        isAutoGenerated: true,
        generatedAt: new Date(),
      });

      await newRent.save();
      created++;

      // Create notification for tenant
      try {
        await this.notificationsService.create({
          recipientId: flat.tenant._id.toString(),
          relatedRentId: (newRent._id as any).toString(),
          title: 'New Rent Generated',
          message: `Your rent for ${month} has been generated. Amount: ৳${Math.round(totalAmount)}`,
          type: NotificationType.RENT_GENERATED,
          priority: NotificationPriority.HIGH,
          channels: ['in-app'],
        });
      } catch (error) {
        this.logger.error('Failed to create notification:', error);
      }
    }

    this.logger.log(
      `Owner ${config.owner}: Generated ${created} rents, skipped ${skipped}`,
    );
  }

  /**
   * Update a rent to overdue status
   */
  private async updateOverdueRent(rent: RentDocument) {
    const config = await this.rentConfigModel.findOne({ owner: rent.owner });
    if (!config) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(rent.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    // Apply grace period
    const gracePeriodEnd = new Date(dueDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + config.gracePeriodDays);

    if (today > gracePeriodEnd && rent.dueAmount > 0) {
      rent.status = RentStatus.OVERDUE;
      await rent.save();
      this.logger.log(`Rent ${rent._id} marked as overdue`);
    }
  }

  /**
   * Calculate and apply late fees for overdue rents
   */
  private async calculateLateFees(config: RentConfigDocument) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all overdue rents for this owner
    const overdueRents = await this.rentModel.find({
      owner: config.owner,
      status: RentStatus.OVERDUE,
      dueAmount: { $gt: 0 },
    });

    for (const rent of overdueRents) {
      const dueDate = new Date(rent.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      // Apply grace period
      const gracePeriodEnd = new Date(dueDate);
      gracePeriodEnd.setDate(
        gracePeriodEnd.getDate() + config.gracePeriodDays,
      );

      // Calculate days overdue (after grace period)
      const daysOverdue = Math.max(
        0,
        Math.floor((today.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24)),
      );

      if (daysOverdue > 0) {
        // Calculate weeks (rounded up)
        const weeks = Math.ceil(daysOverdue / 7);

        // Calculate late fee percentage
        const lateFeePercentage = Math.min(
          weeks * config.lateFeePercentagePerWeek,
          config.maxLateFeePercentage,
        );

        // Calculate late fee amount
        const lateFee = Math.round(
          (rent.totalAmount * lateFeePercentage) / 100,
        );

        // Only update if late fee has changed
        if (lateFee !== rent.lateFee) {
          rent.lateFee = lateFee;
          rent.adjustedTotalAmount = rent.totalAmount + lateFee;
          rent.dueAmount = rent.adjustedTotalAmount - rent.paidAmount;
          await rent.save();

          this.logger.log(
            `Rent ${rent._id}: Applied late fee ৳${lateFee} (${lateFeePercentage}%, ${daysOverdue} days overdue)`,
          );
        }
      }
    }
  }

  /**
   * Manual trigger for rent generation (for testing or manual use)
   */
  async manualGenerateRents(ownerId: string) {
    const config = await this.rentConfigModel.findOne({ owner: ownerId });
    if (!config) {
      throw new Error('Rent configuration not found for owner');
    }

    await this.generateRentsForOwner(config);
  }
}
