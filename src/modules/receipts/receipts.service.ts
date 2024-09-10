import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import * as cheerio from 'cheerio';
import * as dayjs from 'dayjs';
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
import { Stream } from 'stream';
import { Payment } from 'src/schemas/payments.schema';
import { Parameter } from 'src/schemas/parameters.schema';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Parameter.name) private parameterModel: Model<Parameter>
  ) { }

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

  private readonly svgPaymentTemplate: string = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400" viewBox="0 0 500 400">
  <rect width="100%" height="100%" fill="#f9f9f9"/>
  
  <!-- Logo -->
  <circle cx="50" cy="50" r="30" fill="#4682b4"/>
  <path d="M35 50 Q50 30 65 50 T85 50" fill="none" stroke="#ffffff" stroke-width="3"/>
  
  <!-- Título -->
  <text x="250" y="40" font-family="Arial, sans-serif" font-size="22" text-anchor="middle" fill="#000080">ASUAPOBLADO - Factura de Pago</text>
  
  <!-- Información del pago -->
  <text x="30" y="100" font-family="Arial, sans-serif" font-size="16" fill="#000000">Nombre: <tspan id="fullName">{{fullName}}</tspan></text>
  <text x="30" y="130" font-family="Arial, sans-serif" font-size="16" fill="#000000">Identificación: <tspan id="idUser">{{idUser}}</tspan></text>
  <text x="30" y="160" font-family="Arial, sans-serif" font-size="16" fill="#000000">Valor del pago: $<tspan id="paymentValue">{{paymentValue}}</tspan></text>
  <text x="30" y="190" font-family="Arial, sans-serif" font-size="16" fill="#000000">Saldo anterior: $<tspan id="previousBalance">{{previousBalance}}</tspan></text>
  <text x="30" y="220" font-family="Arial, sans-serif" font-size="16" fill="#000000">Saldo actual: $<tspan id="currentBalance">{{currentBalance}}</tspan></text>
  <text x="30" y="250" font-family="Arial, sans-serif" font-size="16" fill="#000000">Fecha de pago: <tspan id="paymentDate">{{paymentDate}}</tspan></text>
  
  <!-- Línea separadora -->
  <line x1="30" y1="280" x2="470" y2="280" stroke="#000080" stroke-width="2"/>
  
  <!-- Mensaje -->
  <text x="250" y="320" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#000080">Gracias por su pago</text>
</svg>`;

  private async generatePaymentReceiptSVG(payment: Payment): Promise<string> {
    const $ = cheerio.load(this.svgPaymentTemplate, { xmlMode: true });

    $('#fullName').text(payment.fullName);
    $('#idUser').text(payment.idUser.toString());
    $('#paymentValue').text(payment.paymentValue.toString());
    $('#previousBalance').text(payment.previousBalance.toString());
    $('#currentBalance').text(payment.currentBalance.toString());
    $('#paymentDate').text(dayjs(payment.createdAt).format('DD/MM/YYYY'));

    return $.xml();
  }

  private async generateSingleReceiptSVG(user: User): Promise<string> {
    const $ = cheerio.load(this.svgTemplate, { xmlMode: true });
    const monthlyValueParameter = await this.parameterModel.find({ name: 'VALOR_MES' }).exec();

    $('#fullName').text(user.fullName);
    $('#totalAmount').text(monthlyValueParameter[0].value);
    $('#dueDate').text(dayjs().endOf('month').format('DD/MM/YYYY'));
    $('#debtMonths').text((user.debtMonths).toString());
    $('#totalDebt').text((user.pendingBalance).toString());
    $('#printDate').text(dayjs().format('DD/MM/YYYY'));

    return $.xml();
  }

  private async generateDualReceiptSVG(user1: User, user2?: User): Promise<string> {
    const monthlyValueParameter = await this.parameterModel.find({ name: 'VALOR_MES' }).exec();

    const generateSingleReceiptSVG = (user: User, yOffset: number = 0) => {
      const $ = cheerio.load(this.svgTemplate, { xmlMode: true });

      $('svg').attr('height', '850');
      $('svg').attr('viewBox', `0 0 500 850`);

      const groupElement = $('<g></g>');
      groupElement.attr('transform', `translate(0, ${yOffset})`);

      $('svg > *').each((_, elem) => {
        groupElement.append($(elem).clone());
      });

      $('svg').empty().append(groupElement);

      $('#fullName', groupElement).text(user.fullName);
      $('#totalAmount', groupElement).text(monthlyValueParameter[0].value);
      $('#dueDate', groupElement).text(dayjs().endOf('month').format('DD/MM/YYYY'));
      $('#debtMonths', groupElement).text((user.debtMonths).toString());
      $('#totalDebt', groupElement).text((user.pendingBalance).toString());
      $('#printDate', groupElement).text(dayjs().format('DD/MM/YYYY'));

      return $.xml();
    };

    const svg1 = generateSingleReceiptSVG(user1);
    let combinedSVG = svg1;

    if (user2) {
      const svg2 = generateSingleReceiptSVG(user2, 425);
      const $combined = cheerio.load(svg1, { xmlMode: true });
      const $svg2 = cheerio.load(svg2, { xmlMode: true });
      $combined('svg').append($svg2('svg > g'));
      combinedSVG = $combined.xml();
    }

    return combinedSVG;
  }

  async generateAllReceipts(): Promise<Buffer> {
    const monthlyValueParameter = await this.parameterModel.findOne({ name: 'VALOR_MES' }).exec();
    const zones = await this.parameterModel.find({ name: 'ZONA_COBRO' }).exec();
    const users = await this.userModel.find({ isActive: true }).exec();
    const currentMonth = dayjs().month();

    const usersByZone = this.groupUsersByZone(users, zones);

    const pdfBuffer: Buffer[] = [];
    const stream = new Stream.Writable({
      write(chunk, _encoding, next) {
        pdfBuffer.push(chunk);
        next();
      },
    });

    const pdfDoc = new PDFDocument({ size: 'A4' });
    pdfDoc.pipe(stream);

    const pageWidth = pdfDoc.page.width;
    const svgWidth = 500;
    const marginLeft = (pageWidth - svgWidth) / 2;

    for (const [zoneId, zoneUsers] of Object.entries(usersByZone)) {
      if (zoneUsers.length === 0) continue;

      pdfDoc.addPage();
      const zoneName = zones.find(z => z._id.toString() === zoneId)?.value || 'SIN ZONA';
      pdfDoc.fontSize(32).text(zoneName.toUpperCase(), 100, 100);

      for (let i = 0; i < zoneUsers.length; i += 2) {
        if (i === 0) pdfDoc.addPage();

        const user1 = zoneUsers[i];
        const user2 = zoneUsers[i + 1];

        await this.updateUserBalances([user1, user2], monthlyValueParameter?.value || '0', currentMonth);

        const dualReceiptSVG = await this.generateDualReceiptSVG(user1, user2);
        SVGtoPDF(pdfDoc, dualReceiptSVG, marginLeft, 50, { width: svgWidth, height: 800 });

        if (i < zoneUsers.length - 2) {
          pdfDoc.addPage();
        }
      }
    }

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

  private groupUsersByZone(users: User[], zones: Parameter[]): Record<string, User[]> {
    const usersByZone: Record<string, User[]> = {
      unassigned: []
    };

    zones.forEach(zone => {
      usersByZone[zone._id.toString()] = [];
    });

    users.forEach(user => {
      if (user.areaId && usersByZone[user.areaId]) {
        usersByZone[user.areaId].push(user);
      } else {
        usersByZone.unassigned.push(user);
      }
    });

    return usersByZone;
  }

  private async updateUserBalances(users: (User | undefined)[], monthlyValue: string, currentMonth: number): Promise<void> {
    for (const user of users) {
      if (user) {
        const lastReceiptGeneratedAt = user.lastReceiptGeneratedAt
          ? dayjs(user.lastReceiptGeneratedAt)
          : null;

        if (!lastReceiptGeneratedAt || lastReceiptGeneratedAt.month() !== currentMonth) {
          user.pendingBalance += Number(monthlyValue);
          user.debtMonths += 1;
          user.lastReceiptGeneratedAt = dayjs().toDate();
          await this.userModel.updateOne(
            { _id: user._id },
            {
              $set: {
                pendingBalance: user.pendingBalance,
                debtMonths: user.debtMonths,
                lastReceiptGeneratedAt: user.lastReceiptGeneratedAt
              }
            }
          );
        }
      }
    }
  }

  async generateSinglePaymentReceipt(paymentId: string): Promise<Buffer> {
    const payment = await this.paymentModel.findById(paymentId).exec();
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

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

    const receiptSVG = await this.generatePaymentReceiptSVG(payment);
    SVGtoPDF(pdfDoc, receiptSVG, marginLeft, 0);

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

  async generateSingleReceipt(userId: string): Promise<Buffer> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

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

    const receiptSVG = await this.generateSingleReceiptSVG(user);
    SVGtoPDF(pdfDoc, receiptSVG, marginLeft, 0);

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
