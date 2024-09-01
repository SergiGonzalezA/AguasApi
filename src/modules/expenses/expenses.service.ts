import { Injectable,
  NotFoundException,
  BadRequestException,
 } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Expense } from 'src/schemas/expenses.schema';

@Injectable()
export class ExpensesService {

  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<Expense>
  ) {}

  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    const createdExpense = new this.expenseModel(createExpenseDto);
    return createdExpense.save();
  }

  async findAll(): Promise<Expense[]> {
    return this.expenseModel.find().exec();;
  }

  async getActiveExpenses(): Promise<Expense[]> {
    return this.expenseModel.find({ isCancelled: false }).exec();
  }

  async findOne(id: string): Promise<Expense> {
    this.validateObjectId(id);
    const expense = await this.expenseModel.findById(id).exec();
    if (!expense) {
      throw new NotFoundException(`Expense with ID "${id}" not found`);
    }
    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto): Promise<Expense> {
    this.validateObjectId(id);
    const updatedExpense = await this.expenseModel
      .findByIdAndUpdate(id, updateExpenseDto, { new: true })
      .exec();
    if (!updatedExpense) {
      throw new NotFoundException(`Expense with ID "${id}" not found`);
    }
    return updatedExpense;
  }

 async remove(id: string) {
    this.validateObjectId(id);
    const deletedExpense = await this.expenseModel.findByIdAndDelete(id).exec();
    if (!deletedExpense) {
      throw new NotFoundException(`Expense with ID "${id}" not found`);
    }
    return deletedExpense;
  }

  private validateObjectId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ObjectId: "${id}"`);
    }
  }
}
