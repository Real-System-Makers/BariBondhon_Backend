import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Flat, FlatDocument } from '../flats/entities/flat.entity';
import { FlatStatus } from '../flats/types/flat-status.enum';
import {
  MoveOutRequest,
  MoveOutRequestDocument,
  MoveOutRequestStatus,
} from '../move-out/entities/move-out-request.entity';
import { ToLetPost, ToLetPostDocument } from './entities/to-let-post.entity';

@Injectable()
export class ToLetService implements OnModuleInit {
  constructor(
    @InjectModel(Flat.name) private flatModel: Model<FlatDocument>,
    @InjectModel(MoveOutRequest.name)
    private moveOutRequestModel: Model<MoveOutRequestDocument>,
    @InjectModel(ToLetPost.name) private toLetPostModel: Model<ToLetPostDocument>,
  ) { }

  async onModuleInit() {
    console.log(`ToLetService initialized. Connected to DB: "${this.flatModel.db.name}"`);
    await this.syncPosts();
  }

  async syncPosts() {
    console.log('--- ToLetService: Starting Sync ---');
    const stats: { vacant: number; upcoming: number; errors: string[] } = { vacant: 0, upcoming: 0, errors: [] };

    try {
      // Clear existing posts
      await this.toLetPostModel.deleteMany({});

      // 1. Vacant Flats (Case Insensitive)
      const vacantFlats = await this.flatModel.find({
        status: { $regex: new RegExp('^vacant$', 'i') }
      }).exec();
      console.log(`ToLetService: Found ${vacantFlats.length} Vacant flats in DB "${this.flatModel.db.name}".`);

      for (const flat of vacantFlats) {
        await this.toLetPostModel.create({
          flat: flat._id,
          availabilityStatus: 'Vacant',
          isAvailable: true,
        });
        stats.vacant++;
      }

      // 2. Upcoming (Approved MoveOuts)
      const futureMoveOuts = await this.moveOutRequestModel.find({ status: MoveOutRequestStatus.APPROVED }).exec();
      console.log(`ToLetService: Found ${futureMoveOuts.length} Approved MoveOut requests.`);

      for (const request of futureMoveOuts) {
        // Find if we already created a post for this flat (from vacant loop)
        const match = await this.toLetPostModel.findOne({ flat: request.flat });

        // If matched flat was already added as 'Vacant', we might want to keep it as 'Vacant' (available now)
        // rather than 'Available from future'. Available Now > Future.

        if (!match) {
          // Verify flat exists? logic is handled by populate generally, but for creation we assume it might.
          // If we want to be safe:
          // const flatExists = await this.flatModel.findById(request.flat);

          await this.toLetPostModel.create({
            flat: request.flat,
            availabilityStatus: `Available from ${new Date(request.moveOutMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
            isAvailable: true,
            availableFromDate: request.moveOutMonth,
          });
          stats.upcoming++;
        }
      }
    } catch (error) {
      console.error('ToLetService Sync Error:', error);
      stats.errors.push(error.message);
    }

    return {
      message: 'Sync complete',
      stats,
      db: this.flatModel.db.name
    };
  }

  // Reactive Update Logic
  async updateVacancyStatus(flatId: string) {
    console.log(`ToLetService: Re-evaluating status for flat ${flatId}`);

    // 1. Check if Flat is Vacant
    const flat = await this.flatModel.findById(flatId).exec();
    const isVacant = flat && flat.status === FlatStatus.VACANT;

    // 2. Check for APPROVED Move-Out Request (not COMPLETED)
    // Only APPROVED requests represent pending future vacancies
    const activeRequest = await this.moveOutRequestModel.findOne({
      flat: flatId,
      status: MoveOutRequestStatus.APPROVED,
    }).sort({ moveOutMonth: 1 }).exec();

    if (isVacant) {
      // Priority 1: Currently Vacant
      await this.toLetPostModel.findOneAndUpdate(
        { flat: flatId },
        {
          flat: flatId,
          availabilityStatus: 'Vacant',
          isAvailable: true,
          availableFromDate: new Date(), // Available Now
        },
        { upsert: true, new: true }
      );
      console.log(`ToLetService: Flat ${flatId} marked as Vacant.`);
    } else if (activeRequest) {
      // Priority 2: Upcoming Vacancy (APPROVED but not yet moved out)
      await this.toLetPostModel.findOneAndUpdate(
        { flat: flatId },
        {
          flat: flatId,
          availabilityStatus: `Available from ${new Date(activeRequest.moveOutMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          isAvailable: true,
          availableFromDate: activeRequest.moveOutMonth,
        },
        { upsert: true, new: true }
      );
      console.log(`ToLetService: Flat ${flatId} marked as Upcoming (from ${activeRequest.moveOutMonth}).`);
    } else {
      // Not Vacant AND No Active Request -> Remove from ToLet
      await this.toLetPostModel.findOneAndDelete({ flat: flatId });
      console.log(`ToLetService: Flat ${flatId} removed from To-Let list.`);
    }
  }

  async findAll() {
    // Simply return the posts, populated with Flat details
    const posts = await this.toLetPostModel
      .find()
      .populate({
        path: 'flat',
        populate: { path: 'user', select: 'name phone email -_id' },
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Map back to the structure frontend expects (Flat object with extra fields)
    return posts.map((post) => {
      if (!post.flat) return null;
      return {
        ...(post.flat as any),
        availabilityStatus: post.availabilityStatus,
        isAvailable: post.isAvailable,
      };
    }).filter(p => p !== null);
  }
}
