import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty()
  email!: string;

  @ApiProperty()
  password!: string;

  @ApiProperty({ required: false })
  fullName?: string;
}

export class LoginDto {
  @ApiProperty()
  email!: string;

  @ApiProperty()
  password!: string;
}
