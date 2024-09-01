import { IsNotEmpty, IsString } from 'class-validator';

export class CreateExpenseDto {
    @IsString()
    @IsNotEmpty()
    beneficiaryName: string;

    @IsString()
    @IsNotEmpty()
    beneficiaryNIT: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNotEmpty()
    paymentAmount: number;

    isCancelled: boolean;
}
