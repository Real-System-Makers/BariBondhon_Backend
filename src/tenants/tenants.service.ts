import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { AuthService } from '../auth/auth.service';
import { Flat, FlatDocument } from '../flats/entities/flat.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Role } from '../common/types/role.enum';
import { FlatStatus } from '../flats/types/flat-status.enum';
import { UserDocument } from '../user/entities/user.entity';

@Injectable()
export class TenantsService {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    @InjectModel(Flat.name) private flatModel: Model<FlatDocument>,
  ) {}

  async create(createTenantDto: CreateTenantDto, ownerId: string) {
    const { name, email, phone } = createTenantDto;

    try {
        const user = await this.userService.findOneUserByUserProperty('email', email);
        if (user) {
           throw new BadRequestException('User with this email already exists');
        }
    } catch (error) {
        if (error instanceof BadRequestException) throw error;
    }
    
    try {
        const userByPhone = await this.userService.findOneUserByUserProperty('phone', phone);
        if (userByPhone) {
            throw new BadRequestException('User with this phone number already exists');
        }
    } catch (error) {
        if (error instanceof BadRequestException) throw error;
    }

    await this.authService.signup({
        name,
        email,
        phone,
        password: phone,
        confirmPassword: phone,
        role: Role.TENANT,
        address: '',
    }, ownerId);

    const newUser = await this.userService.findOneUserByUserProperty('email', email);
    return newUser;
  }

  async assign(tenantId: string, flatId: string, ownerId: string) {
      const flat = await this.flatModel.findOne({ _id: flatId, user: ownerId });
      if (!flat) {
        throw new NotFoundException('Flat not found or you do not own it');
      }
      if (flat.status === FlatStatus.OCCUPIED) {
        throw new BadRequestException('Flat is already occupied');
      }

      const tenant = await this.userService.findOneUserById(tenantId);
      if (!tenant) {
          throw new NotFoundException('Tenant not found');
      }
      flat.tenant = tenant;
      flat.status = FlatStatus.OCCUPIED;
      await flat.save();

      await this.userService.assignFlat(tenantId, flatId);

      return flat;
  }

  async findAll(ownerId: string) {
    const tenants = await this.userService.findAllByRoleAndOwner(Role.TENANT, ownerId);
    
    const tenantsWithFlats = await Promise.all(
      tenants.map(async (tenant) => {
        const flat = await this.flatModel.findOne({ tenant: tenant._id }).select('name _id');
        return {
          ...(tenant as unknown as UserDocument).toObject(),
          flat: flat ? { _id: flat._id, name: flat.name } : null,
        };
      })
    );

    return tenantsWithFlats;
  }

  async update(id: string, updateTenantDto: any) {
    return this.userService.updateUser(id, updateTenantDto);
  }

  async remove(id: string) {
    await this.flatModel.updateMany(
      { tenant: id },
      { $unset: { tenant: "" }, status: FlatStatus.VACANT }
    );
    return this.userService.removeUser(id);
  }
}
