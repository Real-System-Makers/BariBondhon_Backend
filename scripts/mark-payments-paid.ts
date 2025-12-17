import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Model } from 'mongoose';
import { Rent, RentDocument } from '../src/rents/entities/rent.entity';
import { RentStatus } from '../src/rents/types/rent-status.enum';

async function bootstrap() {
  console.log('💳 Marking fake payments as paid...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const rentModel = app.get<Model<RentDocument>>('RentModel');
    
    // Find all pending payments for October and November 2025
    const pendingPayments = await rentModel.find({
      month: { $in: ['2025-10', '2025-11'] },
      status: RentStatus.PENDING,
    }).exec();
    
    console.log(`📊 Found ${pendingPayments.length} pending payments for Oct/Nov 2025\n`);
    
    if (pendingPayments.length === 0) {
      console.log('ℹ️  No pending payments to update.');
      await app.close();
      return;
    }
    
    const updateResults: RentDocument[] = [];
    
    for (const payment of pendingPayments) {
      // Set payment date to a realistic date (few days after due date)
      const paidDate = new Date(payment.dueDate);
      paidDate.setDate(paidDate.getDate() + Math.floor(Math.random() * 5)); // 0-4 days after due date
      
      const update = await rentModel.findByIdAndUpdate(
        payment._id,
        {
          status: RentStatus.PAID,
          paidAmount: payment.adjustedTotalAmount,
          dueAmount: 0,
          paidDate: paidDate,
          paymentMethod: 'bKash', // Realistic payment method for Bangladesh
        },
        { new: true }
      );
      
      if (update) {
        updateResults.push(update);
        console.log(`✅ Marked payment as PAID - Month: ${payment.month}, Amount: ${payment.adjustedTotalAmount} BDT`);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   - Payments updated: ${updateResults.length}`);
    console.log(`   - Total amount paid: ${updateResults.reduce((sum, p) => sum + p.adjustedTotalAmount, 0)} BDT`);
    console.log(`   - Payment method: bKash`);
    console.log(`   - All payments marked as PAID\n`);
    
    console.log('✨ Done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
