import { Module } from '@nestjs/common';
import { ParametersService } from './parameters.service';
import { ParametersController } from './parameters.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Parameter, ParameterSchema } from 'src/schemas/parameters.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Parameter.name, schema: ParameterSchema }]),
  ],
  controllers: [ParametersController],
  providers: [ParametersService],
})
export class ParametersModule {}
