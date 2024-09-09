import { IsNotEmpty, IsString } from 'class-validator';

export class CreateParameterDto {
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  description: string;

}
