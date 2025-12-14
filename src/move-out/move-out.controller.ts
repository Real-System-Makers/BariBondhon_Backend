import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { MoveOutService } from './move-out.service';
import { CreateMoveOutRequestDto } from './dto/create-move-out-request.dto';
import { UpdateMoveOutRequestDto } from './dto/update-move-out-request.dto';
import { Role } from '../common/types/role.enum';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('move-out')
export class MoveOutController {
  constructor(private readonly moveOutService: MoveOutService) {}

  @Post('request')
  create(
    @GetCurrentUser() user: User,
    @Body() createDto: CreateMoveOutRequestDto,
  ) {
    if (user.role !== Role.TENANT) {
      throw new ForbiddenException('Only tenants can submit move out requests');
    }
    return this.moveOutService.create(createDto, user._id as string);
  }

  @Get('requests')
  findAll(@GetCurrentUser() user: User) {
    if (user.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can view requests');
    }
    return this.moveOutService.findAllForOwner(user._id as string);
  }

  @Patch('request/:id')
  update(
    @GetCurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateMoveOutRequestDto,
  ) {
    if (user.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can update requests');
    }
    return this.moveOutService.update(id, updateDto, user._id as string);
  }

  @Get('config')
  getNoticePeriod(@GetCurrentUser() user: User) {
    if (user.role === Role.TENANT) {
        return this.moveOutService.getNoticePeriodForTenant(user._id as string);
    }
    
    if (user.role !== Role.OWNER) {
         throw new ForbiddenException('Only owners and tenants can access notice period settings');
    }
    return this.moveOutService.getNoticePeriod(user._id as string);
  }

  @Patch('config')
  setNoticePeriod(
    @GetCurrentUser() user: User,
    @Body('minimumNoticePeriod') period: number,
  ) {
    if (user.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can set notice period');
    }
    return this.moveOutService.setNoticePeriod(user._id as string, period);
  }
}
