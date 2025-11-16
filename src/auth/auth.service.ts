import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Auth, AuthDocument } from './entities/auth.entity';
import { TokenSecret, Tokens } from './types/tokens.type';
import { SignUpDto } from './dto/sign-up.dto';
import { UserService } from 'src/user/user.service';
import { HashService } from 'src/common/services/hash.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenExpiration, TokenType } from './types/tokens.type';
import { JwtPayload } from './types/jwt-payload.type';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private jwtService: JwtService,
    private readonly userService: UserService,
    private readonly hashService: HashService,
    @InjectModel(Auth.name) private readonly authModel: Model<AuthDocument>,
  ) {}

  async findWithUser(
    filter: {
      auth?: Partial<Record<keyof Auth, any>>;
      user?: Partial<Record<keyof User, any>>;
    },
    projection: {
      auth?: Partial<Record<keyof Auth, 1 | 0 | true | false>>;
      user?: Partial<Record<keyof User, 1 | 0 | true | false>>;
    } = {},
  ): Promise<AuthDocument & { user: User }> {
    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ];

    const matchStage: Record<string, any> = {};

    if (filter.auth) {
      Object.entries(filter.auth).forEach(([key, val]) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        matchStage[key] = val;
      });
    }

    if (filter.user) {
      Object.entries(filter.user).forEach(([key, val]) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        matchStage[`user.${key}`] = val;
      });
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    const projectStage: Record<string, any> = {};

    if (projection.auth) {
      Object.entries(projection.auth).forEach(([key, val]) => {
        projectStage[key] = val;
      });
    }

    if (projection.user) {
      Object.entries(projection.user).forEach(([key, val]) => {
        projectStage[`user.${key}`] = val;
      });
    }

    if (Object.keys(projectStage).length > 0) {
      pipeline.push({ $project: projectStage });
    }

    const result = await this.authModel.aggregate(pipeline).exec();
    const authWithUser = result[0] as (AuthDocument & { user: User }) | null;

    if (!authWithUser) {
      throw new ForbiddenException('invalid credentials');
    }

    return authWithUser;
  }

  async signup(signUpDto: SignUpDto): Promise<Tokens> {
    if (signUpDto.password !== signUpDto.confirmPassword) {
      throw new ForbiddenException({
        confirmPassword: 'passwords do not match',
      });
    }

    const user = await this.userService.createUser(signUpDto);

    const tokens = await this.getTokens(user._id);
    const hashedRefreshToken = await this.hashService.hashString(
      tokens.refresh_token,
    );

    const auth = new this.authModel({ user, refreshToken: hashedRefreshToken });

    try {
      await auth.save();
      return tokens;
    } catch {
      throw new ForbiddenException('signup failed');
    }
  }

  async login(loginDto: LoginDto): Promise<Tokens> {
    const auth = await this.findWithUser(
      { user: { email: loginDto.email } },
      {
        auth: { refreshToken: 1 },
        user: { _id: 1, name: 1, email: 1, password: 1 },
      },
    );

    if (!auth) {
      throw new ForbiddenException('invalid credentials');
    }

    const { user } = auth;

    const isPasswordMatch = await this.hashService.compareWithHash(
      loginDto.password,
      user.password,
    );
    if (!isPasswordMatch) {
      throw new ForbiddenException('invalid credentials');
    }

    const expiresIn = loginDto.remember
      ? TokenExpiration.REFRESH
      : TokenExpiration.ACCESS;
    const tokens = await this.getTokens(user._id.toString(), expiresIn);
    const hashedRefreshToken = await this.hashService.hashString(
      tokens.refresh_token,
    );

    auth.refreshToken = hashedRefreshToken;
    await auth.save();

    return tokens;
  }

  async logout(userId: string): Promise<Tokens> {
    await this.authModel.updateOne({ user: userId }, { refreshToken: null });
    return { access_token: '', refresh_token: '' };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<Tokens> {
    const extractedData = this.extractDataFromToken(
      refreshTokenDto.refreshToken,
      TokenType.REFRESH,
    ) as { userId: string };

    const userId = extractedData.userId;

    const auth = await this.authModel.findOne({
      user: userId,
    });

    if (!auth?.refreshToken) {
      throw new ForbiddenException('invalid credentials');
    }

    const isRefreshTokenMatch = await this.hashService.compareWithHash(
      refreshTokenDto.refreshToken,
      auth.refreshToken,
    );
    if (!isRefreshTokenMatch) {
      throw new ForbiddenException('invalid refresh token');
    }

    const tokens = await this.getTokens(userId);
    const hashedRefreshToken = await this.hashService.hashString(
      tokens.refresh_token,
    );

    auth.refreshToken = hashedRefreshToken;
    await auth.save();

    return tokens;
  }

  private async getTokens(
    userId: string,
    expiresIn?: TokenExpiration,
  ): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      // access token
      this.jwtService.signAsync(
        {
          userId,
        },
        {
          secret: this.configService.getOrThrow<string>(TokenSecret.ACCESS),
          expiresIn: expiresIn || TokenExpiration.ACCESS, // 1 week
        },
      ),

      // refresh token
      this.jwtService.signAsync(
        {
          userId,
        },
        {
          secret: this.configService.getOrThrow<string>(TokenSecret.REFRESH),
          expiresIn: TokenExpiration.REFRESH,
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  private extractDataFromToken(token: string, type: TokenType): JwtPayload {
    try {
      const secret =
        type === TokenType.ACCESS ? TokenSecret.ACCESS : TokenSecret.REFRESH;

      const data = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>(secret),
      });
      return data;
    } catch {
      throw new ForbiddenException('invalid token');
    }
  }
}
