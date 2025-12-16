
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { FlatsService } from '../src/flats/flats.service';
import { FlatStatus } from '../src/flats/types/flat-status.enum';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const flatsService = app.get(FlatsService);

    // Use the model directly if possible, or use service methods
    // Flattening access to model via service or just printing service results
    const vacant = await flatsService.findVacant();
    console.log('--- VACANT FLATS ---');
    console.log(JSON.stringify(vacant, null, 2));

    const all = await flatsService.findAll('some-id'); // This requires a user ID usually
    // Let's iterate all flats instead if possible.
    // FlatsService.findAll is scoped to user, so we can't easily dump ALL flats.
    // We need to access the Model directly.

    // Actually, let's just use the Public Vacant endpoint logic which calls findVacant()

    console.log(`Found ${vacant.length} vacant flats via Service.`);

    await app.close();
}
bootstrap();
