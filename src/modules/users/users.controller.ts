import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      const users: CreateUserDto[] = [];
  
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);
  
      bufferStream
        .pipe(csv())
        .on('data', (row) => {
          const rowValues = Object.values(row);
          const user: CreateUserDto = {
            identification: typeof rowValues[0] === 'string' ? rowValues[0].trim() : '',
            fullName: typeof rowValues[1] === 'string' ? rowValues[1].trim().toUpperCase() : '',
            phone: typeof rowValues[2] === 'string' ? rowValues[2].trim() : '',
            pendingBalance: 0,
            debtMonths: 0,
            isActive: true,
            areaId: null
          };
  
          console.log('user csv creado:', user);
          users.push(user);
        })
        .on('end', async () => {
          try {
            await this.usersService.bulkCreate(users);
            resolve({ message: 'archivo procesado correctamente' });
          } catch (error) {
            reject(error);
          }
        });
    });
  }
}
