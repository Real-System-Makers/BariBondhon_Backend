import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        configService: ConfigService,
        private readonly authService: AuthService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.getOrThrow('AT_SECRET_KEY'),
        });
    }

    async validate(payload: any) {
        // const userAuth = await this.authService.findByUserId(payload['userId']);

        // if (!userAuth?.refreshToken) {
        //     throw new UnauthorizedException();
        // }

        return {
            ...payload,
            // ...userAuth.user,
        };
    }
}
