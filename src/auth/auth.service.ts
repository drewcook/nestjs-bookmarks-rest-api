import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as argon from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import { ConfigService } from '@nestjs/config';

type JWTResponse = Promise<{ access_token: string }>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto): JWTResponse {
    // generate the password hash
    const hash = await argon.hash(dto.password);
    try {
      // save the new user in the db
      const user = await this.prisma.user.create({
        data: { email: dto.email, hash },
      });
      // return the JWT
      return this.signToken(user.id, user.email);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        // duplicate field
        if (e.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
        throw e;
      }
    }
  }

  async signin(dto: AuthDto): JWTResponse {
    // find the user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // if it does not exist, throw exception
    if (!user)
      throw new ForbiddenException('Credentials incorrect');
    // compare password
    const pwMatches = await argon.verify(
      user.hash,
      dto.password,
    );
    // if incorrect, throw exception
    if (!pwMatches)
      throw new ForbiddenException('Credentials incorrect');
    // return the JWT
    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string,
  ): JWTResponse {
    const payload = {
      sub: userId, // unique identifier for sub field
      email,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });

    return {
      access_token: token,
    };
  }
}
