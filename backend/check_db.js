const mongoose = require('mongoose');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Customer = mongoose.model('Customer', new mongoose.Schema({}, {strict: false}));
        const docs = await Customer.find({name: /jhdsfsj/i});
        console.log(JSON.stringify(docs, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
