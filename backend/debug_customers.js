import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Customer from './src/models/Customer.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const customers = await Customer.find({});
        console.log('--- ALL CUSTOMERS ---');
        customers.forEach(c => {
            console.log(`Name: ${c.name}`);
            console.log(`Raw Object: ${JSON.stringify(c, null, 2)}`);
            console.log('---------------------');
        });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
