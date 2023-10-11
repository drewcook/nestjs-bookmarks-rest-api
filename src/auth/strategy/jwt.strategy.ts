import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

type UserAuthPayload = { sub: number; email: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'jwt',
) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  // This will append the payload to the request.user field
  async validate(payload: UserAuthPayload) {
    // perform custom validation for the token
    // get user info
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });
    // transform
    delete user.hash;
    return user;
  }
}
