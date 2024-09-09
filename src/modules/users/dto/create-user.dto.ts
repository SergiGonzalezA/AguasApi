import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  identification: string;

  fullName: string;

  @IsString()
  phone: string;

  pendingBalance: number;

  debtMonths: number;

  isActive: boolean;

  @IsString()
  areaId: string;
}
