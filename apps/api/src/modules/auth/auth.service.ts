import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(data: {
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await this.userService.findByPhone(data.phone);
    if (existing) {
      throw new ConflictException('این شماره قبلاً ثبت شده است');
    }

    const user = await this.userService.create(data);

    const token = this.jwtService.sign({
      sub: user.id,
      phone: user.phone,
      roles: [user.primaryRole, ...(user.secondaryRoles || [])],
    });

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        primaryRole: user.primaryRole,
        secondaryRoles: user.secondaryRoles || [],
        isProfileComplete: user.isProfileComplete,
        verificationStatus: user.verificationStatus,
      },
    };
  }

  async login(phone: string, password: string) {
    const user = await this.userService.findByPhone(phone);
    console.log('LOGIN DEBUG - user found:', !!user);
    console.log('LOGIN DEBUG - password exists:', !!user?.password);
    console.log('LOGIN DEBUG - password length:', user?.password?.length ?? 0);

    if (!user) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است');
    }

    const isValid = await this.userService.validatePassword(password, user.password);
    console.log('LOGIN DEBUG - isValid:', isValid);

    if (!isValid) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      phone: user.phone,
      primaryRole: user.primaryRole,
      roles: [user.primaryRole, ...(user.secondaryRoles || [])],
    });

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        primaryRole: user.primaryRole,
        secondaryRoles: user.secondaryRoles || [],
        isProfileComplete: user.isProfileComplete,
        verificationStatus: user.verificationStatus,
      },
    };
  }
}