import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded from backend directory regardless of process.cwd()
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password@localhost:27017/hci-hms?authSource=admin';
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected: ${conn.connection.host} | Database: ${conn.connection.name}`);
    } catch (error: any) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;

