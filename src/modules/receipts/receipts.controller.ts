import { Controller, Get, StreamableFile, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReceiptsService } from './receipts.service';

@Controller('api/v1/receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get('pdf')
  async generateReceipts(@Res({ passthrough: true }) res: Response) {
    const pdfBuffer = await this.receiptsService.generateAllReceipts();
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="receipts.pdf"',
    });

    return new StreamableFile(pdfBuffer);
  }
}