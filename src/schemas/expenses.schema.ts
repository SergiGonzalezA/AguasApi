import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ExpenseDocument = HydratedDocument<Expense>;

@Schema({ timestamps: true })
export class Expense {
 
  @Prop({ required: true })
  beneficiaryName: string;

  @Prop({ required: true })
  beneficiaryNIT: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  paymentAmount: number;

  @Prop({ default: false })
  isCancelled: boolean;

}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
