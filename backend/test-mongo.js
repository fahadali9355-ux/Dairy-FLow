import mongoose from 'mongoose';

const uri = "mongodb+srv://fahadali9355_db_user:5cHhzRIHWMVlPe8g@cluster0.5phlhkj.mongodb.net/?appName=Cluster0";
const directUri = "mongodb://fahadali9355_db_user:5cHhzRIHWMVlPe8g@ac-zzg8osy-shard-00-00.5phlhkj.mongodb.net:27017,ac-zzg8osy-shard-00-01.5phlhkj.mongodb.net:27017,ac-zzg8osy-shard-00-02.5phlhkj.mongodb.net:27017/?ssl=true&replicaSet=atlas-1428hk-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function testConnection(connectionString, name) {
  try {
    console.log(`Connecting to ${name}...`);
    await mongoose.connect(connectionString, { serverSelectionTimeoutMS: 5000, family: 4 });
    console.log(`SUCCESS! Connected via ${name}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error(`FAILED via ${name}: ${error.message}`);
  }
}

async function run() {
  await testConnection(directUri, "DIRECT_URI");
  await testConnection(uri, "SRV_URI");
}

run();
