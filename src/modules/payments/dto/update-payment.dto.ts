import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentDto } from './create-payment.dto';
import { IsString} from 'class-validator';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
    @IsString()
    _idUser: string;

    idUser: number;

    @IsString()
    fullName: string;

    paymentValue: number;

    previousBalance: number;

    currentBalance: number;

    isRevert: boolean;
}
