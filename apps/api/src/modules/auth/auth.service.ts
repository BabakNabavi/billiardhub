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
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const existing = await this.userService.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('این ایمیل قبلاً ثبت شده است');
    }

    const user = await this.userService.create(data);

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roles: [user.primaryRole, ...user.secondaryRoles],
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: [user.primaryRole, ...user.secondaryRoles],
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('ایمیل یا رمز عبور اشتباه است');
    }

    const isValid = await this.userService.validatePassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('ایمیل یا رمز عبور اشتباه است');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roles: [user.primaryRole, ...user.secondaryRoles],
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: [user.primaryRole, ...user.secondaryRoles],
      },
    };
  }
}