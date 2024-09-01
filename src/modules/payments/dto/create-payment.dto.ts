import { IsNotEmpty, IsString} from 'class-validator';
export class CreatePaymentDto {
    @IsNotEmpty()
    @IsString()
    _idUser: string;

    @IsNotEmpty()
    idUser: number;

    @IsNotEmpty()
    @IsString()
    fullName: string;

    @IsNotEmpty()
    paymentValue: number;

    previousBalance: number;

    currentBalance: number;

    isRevert: boolean;
}
