import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import * as cheerio from 'cheerio';
import * as dayjs from 'dayjs';
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
import { Stream } from 'stream';

@Injectable()
export class ReceiptsService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  private readonly svgTemplate: string = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400" viewBox="0 0 500 400">
  <rect width="100%" height="100%" fill="#f9f9f9"/>
  
  <!-- Logo -->
  <circle cx="50" cy="50" r="30" fill="#4682b4"/>
  <path d="M35 50 Q50 30 65 50 T85 50" fill="none" stroke="#ffffff" stroke-width="3"/>
  
  <!-- Título -->
  <text x="250" y="40" font-family="Arial, sans-serif" font-size="26" text-anchor="middle" fill="#000080">ASUAPOBLADO</text>
  
  <!-- Información del usuario -->
  <text x="30" y="100" font-family="Arial, sans-serif" font-size="16" fill="#000000">Nombre: <tspan id="fullName">{{fullName}}</tspan></text>
  <text x="30" y="130" font-family="Arial, sans-serif" font-size="16" fill="#000000">Total a pagar: $<tspan id="totalAmount">12000</tspan></text>
  <text x="30" y="160" font-family="Arial, sans-serif" font-size="16" fill="#000000">Fecha pago oportuno: <tspan id="dueDate">{{dueDate}}</tspan></text>
  <text x="30" y="190" font-family="Arial, sans-serif" font-size="16" fill="#000000">Meses de deuda: <tspan id="debtMonths">{{debtMonths}}</tspan></text>
  <text x="30" y="220" font-family="Arial, sans-serif" font-size="16" fill="#000000">Total adeudado: $<tspan id="totalDebt">{{totalDebt}}</tspan></text>
  <text x="30" y="250" font-family="Arial, sans-serif" font-size="16" fill="#000000">Fecha de impresión: <tspan id="printDate">{{printDate}}</tspan></text>
  
  <!-- Línea separadora -->
  <line x1="30" y1="280" x2="470" y2="280" stroke="#000080" stroke-width="2"/>
  
  <!-- Mensaje -->
  <text x="250" y="320" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#000080">Gracias por su pago</text>
</svg>`;

  private async generateReceiptSVG(user: User): Promise<string> {
    const $ = cheerio.load(this.svgTemplate, { xmlMode: true });

    $('#fullName').text(user.fullName);
    $('#totalAmount').text('12000');
    $('#dueDate').text(dayjs().endOf('month').format('DD/MM/YYYY'));
    $('#debtMonths').text((user.debtMonths + 1).toString());
    $('#totalDebt').text((user.pendingBalance + 12000).toString());
    $('#printDate').text(dayjs().format('DD/MM/YYYY'));

    return $.xml();
  }

  async generateAllReceipts(): Promise<Buffer> {
    const users = await this.userModel.find({ isActive: true }).exec();
    console.log('usuarios consultados para recibo', users.length);

    const pdfBuffer: Buffer[] = [];
    const stream = new Stream.Writable({
      write(chunk, _encoding, next) {
        pdfBuffer.push(chunk);
        next();
      },
    });

    const pdfDoc = new PDFDocument();
    pdfDoc.pipe(stream);

    const pageWidth = pdfDoc.page.width;
    const svgWidth = 400;
    const marginLeft = (pageWidth - svgWidth) / 2;

    const receiptPromises = users.map(async (user, index) => {
      const receiptSVG = await this.generateReceiptSVG(user);
      SVGtoPDF(pdfDoc, receiptSVG, marginLeft, 0);
      if (index < users.length - 1) pdfDoc.addPage();
    });

    await Promise.all(receiptPromises);

    pdfDoc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(Buffer.concat(pdfBuffer));
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });
  }
}
