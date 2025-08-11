import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

interface JwtPayload {
  sub: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(data: { email: string; password: string; fullName?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException('Email already in use');
    
    const hash = await argon2.hash(data.password);
    const user = await this.prisma.user.create({
      data: { 
        email: data.email, 
        passwordHash: hash, 
        fullName: data.fullName, 
        role: 'user' 
      }
    });
    
    return this.signTokens(user.id, user.role);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    return this.signTokens(user.id, user.role);
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');
    
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'devrefresh',
      }) as JwtPayload;
      
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');
      
      return this.signTokens(user.id, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  private async signTokens(userId: string, role: string) {
    const payload: JwtPayload = { sub: userId, role };
    
    const access = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'devsecret',
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m'
    });
    
    const refresh = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'devrefresh',
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d'
    });
    
    return { accessToken: access, refreshToken: refresh };
  }
}
