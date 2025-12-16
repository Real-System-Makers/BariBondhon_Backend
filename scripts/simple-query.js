
require('dotenv').config();
const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
    name: String,
    status: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { strict: false });

const Flat = mongoose.model('Flat', flatSchema);

async function run() {
    try {
        const uri = process.env.DB_URI || process.env.MONGODB_URI;
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);

        console.log('--- ALL FLATS ---');
        const flats = await Flat.find({});
        console.log(`Total Flats: ${flats.length}`);

        flats.forEach(f => {
            console.log(`Flat: ${f.name}, Status: '${f.status}' (Type: ${typeof f.status})`);
        });

        console.log('--- VACANT QUERY ---');
        const vacant = await Flat.find({ status: 'Vacant' });
        console.log(`Found ${vacant.length} via { status: 'Vacant' }`);

        console.log('--- CASE INSENSITIVE CHECK ---');
        const vacantLower = await Flat.find({ status: { $regex: new RegExp('vacant', 'i') } });
        console.log(`Found ${vacantLower.length} via regex 'vacant'`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
