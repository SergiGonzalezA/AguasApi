import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    UsersModule,
    ReceiptsModule,
    PaymentsModule,
    ExpensesModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
