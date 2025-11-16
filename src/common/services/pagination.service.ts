import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { PaginationDto } from '../dtos/pagination.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface MongooseModel {
  find(filter?: unknown): {
    skip(count: number): {
      limit(count: number): {
        exec(): Promise<unknown[]>;
      };
    };
  };
  countDocuments(filter?: unknown): {
    exec(): Promise<number>;
  };
}

@Injectable()
export class PaginationService {
  async paginate<T>(
    model: MongooseModel,
    paginationDto: PaginationDto,
    filter: FilterQuery<T> = {},
  ): Promise<PaginatedResult<T>> {
    const { page, limit, skip } = paginationDto;

    try {
      const data = await model.find(filter).skip(skip).limit(limit).exec();
      const total = await model.countDocuments(filter).exec();

      return {
        data: data as T[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch {
      throw new InternalServerErrorException('failed to fetch paginated data');
    }
  }
}
