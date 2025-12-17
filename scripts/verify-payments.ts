import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Model } from 'mongoose';
import { Flat, FlatDocument } from '../src/flats/entities/flat.entity';
import { Rent, RentDocument } from '../src/rents/entities/rent.entity';

async function bootstrap() {
  console.log('🔍 Verifying payment data...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const flatModel = app.get<Model<FlatDocument>>('FlatModel');
    const rentModel = app.get<Model<RentDocument>>('RentModel');
    
    // Count occupied flats
    const occupiedFlats = await flatModel
      .find({ tenant: { $exists: true, $ne: null } })
      .exec();
    
    const tenantCount = occupiedFlats.length;
    
    // Count payments for October 2025
    const octoberPayments = await rentModel.find({ month: '2025-10' }).exec();
    
    // Count payments for November 2025
    const novemberPayments = await rentModel.find({ month: '2025-11' }).exec();
    
    // Get total payment count for these months
    const totalPayments = octoberPayments.length + novemberPayments.length;
    const expectedPayments = tenantCount * 2; // 2 months per tenant
    
    console.log('📊 Verification Results:\n');
    console.log(`   Tenants with occupied flats: ${tenantCount}`);
    console.log(`   Payments for October 2025: ${octoberPayments.length}`);
    console.log(`   Payments for November 2025: ${novemberPayments.length}`);
    console.log(`   Total payments created: ${totalPayments}`);
    console.log(`   Expected payments: ${expectedPayments}`);
    
    if (totalPayments === expectedPayments) {
      console.log('\n✅ Verification successful! All tenants have 2 payments.\n');
    } else {
      console.log('\n⚠️  Warning: Payment count mismatch!\n');
    }
    
    // Show sample payment data
    if (octoberPayments.length > 0) {
      console.log('📄 Sample October 2025 Payment:');
      const sample = await rentModel
        .findOne({ month: '2025-10' })
        .populate('tenant', 'name email')
        .populate('flat', 'name')
        .populate('owner', 'name')
        .exec();
      
      if (sample) {
        console.log('   Tenant:', (sample.tenant as any).name);
        console.log('   Flat:', (sample.flat as any).name);
        console.log('   Owner:', (sample.owner as any).name);
        console.log('   Month:', sample.month);
        console.log('   Base Rent:', sample.baseRent, 'BDT');
        console.log('   Electricity Bill:', sample.electricityBill, 'BDT');
        console.log('   Gas Bill:', sample.gasBill, 'BDT');
        console.log('   Water Bill:', sample.waterBill, 'BDT');
        console.log('   Total Amount:', sample.totalAmount, 'BDT');
        console.log('   Status:', sample.status);
        console.log('   Due Date:', sample.dueDate.toISOString().split('T')[0]);
      }
    }
    
    console.log('\n✨ Verification complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
