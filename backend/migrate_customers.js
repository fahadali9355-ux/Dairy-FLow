import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const customerSchema = new mongoose.Schema({
  name: String,
  defaultMilkPerDay: Number,
  defaultMilkQuantity: Number, // Old field
  ratePerKg: Number,
}, { strict: false });

const Customer = mongoose.model('Customer', customerSchema);

const migrate = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        const customers = await Customer.find({});
        console.log(`Found ${customers.length} customers. Starting migration...`);

        for (const c of customers) {
            let updated = false;

            // 1. Handle name migration if needed (none needed here)

            // 2. Handle default milk
            if (c.defaultMilkQuantity !== undefined && (c.defaultMilkPerDay === undefined || c.defaultMilkPerDay === 0)) {
                console.log(`Migrating default milk for ${c.name}: ${c.defaultMilkQuantity}`);
                c.defaultMilkPerDay = c.defaultMilkQuantity;
                updated = true;
            }

            // 3. Handle rate
            if (c.ratePerKg === undefined || c.ratePerKg === 0) {
                console.log(`Setting default rate for ${c.name} to 250`);
                c.ratePerKg = 250;
                updated = true;
            }

            if (updated) {
                await Customer.updateOne({ _id: c._id }, { 
                    $set: { 
                        defaultMilkPerDay: c.defaultMilkPerDay, 
                        ratePerKg: c.ratePerKg 
                    },
                    $unset: { defaultMilkQuantity: "" } // Clean up old field
                });
                console.log(`Updated ${c.name}`);
            }
        }

        console.log('Migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
