import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateParameterDto } from './dto/create-parameter.dto';
import { UpdateParameterDto } from './dto/update-parameter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Parameter } from 'src/schemas/parameters.schema';

@Injectable()
export class ParametersService {
  constructor(
    @InjectModel(Parameter.name) private parameterModel: Model<Parameter>
  ) {}

  async create(createParameterDto: CreateParameterDto): Promise<Parameter> {
    const createdParameter = new this.parameterModel(createParameterDto);
    return createdParameter.save();
  }

  async findAll(): Promise<Parameter[]> {
    return this.parameterModel.find().exec();
  }

  async findOne(id: string): Promise<Parameter> {
    this.validateObjectId(id);
    const parameter = await this.parameterModel.findById(id).exec();
    if (!parameter) {
      throw new NotFoundException(`Parameter with ID "${id}" not found`);
    }
    return parameter;
  }

  async update(id: string, updateParameterDto: UpdateParameterDto): Promise<Parameter> {
    this.validateObjectId(id);
    const updatedParameter = await this.parameterModel
      .findByIdAndUpdate(id, updateParameterDto, { new: true })
      .exec();
    if (!updatedParameter) {
      throw new NotFoundException(`Parameter with ID "${id}" not found`);
    }
    return updatedParameter;
  }

  async remove(id: string): Promise<Parameter> {
    this.validateObjectId(id);
    const deletedParameter = await this.parameterModel.findByIdAndDelete(id).exec();
    if (!deletedParameter) {
      throw new NotFoundException(`Parameter with ID "${id}" not found`);
    }
    return deletedParameter;
  }

  private validateObjectId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ObjectId: "${id}"`);
    }
  }
}
