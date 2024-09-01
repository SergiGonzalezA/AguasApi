import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  _idUser: string;

  @Prop({ required: true })
  idUser: number;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  paymentValue: number;

  @Prop()
  previousBalance: number;

  @Prop()
  currentBalance: number;

  @Prop({ default: false })
  isRevert: boolean;

}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
