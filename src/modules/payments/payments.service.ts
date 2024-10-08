import { Injectable,
  NotFoundException,
  BadRequestException,
 } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Payment } from 'src/schemas/payments.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class PaymentsService {

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    private usersService: UsersService,
  ) {}
  
  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const createdPayment = new this.paymentModel(createPaymentDto);
    await createdPayment.save();
    await this.updateUserData(createPaymentDto, false);
    return createdPayment;
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentModel.find().exec();
  }

  async getActivePayments(): Promise<Payment[]> {
    return this.paymentModel.find({ isRevert: false }).exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} payment`;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    this.validateObjectId(id);
    const updatedPayment = await this.paymentModel
      .findByIdAndUpdate(id, updatePaymentDto, { new: true })
      .exec();
    if (!updatedPayment) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    await this.updateUserData(updatePaymentDto, true);
    return updatedPayment;
  }

  remove(id: number) {
    return `This action removes a #${id} payment`;
  }

  private validateObjectId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ObjectId: "${id}"`);
    }
  }

  private async updateUserData(createPaymentDto: CreatePaymentDto, isReverse:boolean) {
    try {
      const userId = createPaymentDto._idUser; 
      const user = await this.usersService.findOne(userId);
      const paymentAdjustment = isReverse ? createPaymentDto.paymentValue : -createPaymentDto.paymentValue;
      const updatedUserDto = {
        pendingBalance: user.pendingBalance + paymentAdjustment,
        debtMonths:  Math.ceil((user.pendingBalance + paymentAdjustment) / 12000),
      };
      await this.usersService.update(userId, updatedUserDto);
    } catch (error) {
      console.error('Error actualizando los datos del usuario:', error);
    }
  }
}
