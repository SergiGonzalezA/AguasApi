import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ParameterDocument = HydratedDocument<Parameter>;

@Schema({ timestamps: true })
export class Parameter {
  @Prop({ required: true})
  name: string;

  @Prop({ required: true })
  value: string;

  @Prop({ required: true })
  description: string;
}

export const ParameterSchema = SchemaFactory.createForClass(Parameter);
