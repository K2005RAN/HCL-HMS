import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import Admin from '../models/Admin';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import Staff from '../models/Staff';
import LabUser from '../models/LabUser';
import PharmacyUser from '../models/PharmacyUser';
import Employee from '../models/Employee';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const fixPasswords = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://raik182005_db_user:karanrai182005@cluster0.dathtt5.mongodb.net/hci-hms?appName=Cluster0';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        // Ensure default accounts exist and updated with password123
        const defaultAccounts = [
            { model: Admin, email: 'admin@heidelberg.in', name: 'Super Admin', role: 'admin' },
            { model: Doctor, email: 'doctor@heidelberg.in', name: 'Dr. Rahul Sharma', specialization: 'General Physician', department: 'OPD', phone: '9876543210', availableDays: ['Monday', 'Wednesday', 'Friday'], availableTimeStart: '09:00', availableTimeEnd: '17:00' },
            { model: Patient, email: 'patient@heidelberg.in', name: 'Amit Kumar', gender: 'Male', dob: new Date('1985-06-15'), bloodGroup: 'O+', phone: '9876543211', address: 'Damoh Plant Quarter', emergencyContact: '9876543212' },
            { model: Staff, email: 'staff@heidelberg.in', name: 'Hospital Staff', department: 'Emergency', staffId: 'STF-0001' },
            { model: LabUser, email: 'lab@heidelberg.in', name: 'Raman (Lab Incharge)', department: 'Laboratory', labId: 'LAB-0001' },
            { model: PharmacyUser, email: 'pharmacy@heidelberg.in', name: 'Rahul (Pharmacy Incharge)', department: 'Pharmacy', pharmacyId: 'PHM-0001' },
        ];

        for (const item of defaultAccounts) {
            let user: any = await item.model.findOne({ email: item.email });
            if (!user) {
                user = new item.model({
                    ...item,
                    passwordHash,
                    isActive: true
                });
                await user.save();
                console.log(`Created default user: ${item.email}`);
            } else {
                user.passwordHash = passwordHash;
                user.isActive = true;
                await user.save();
                console.log(`Updated password for: ${item.email}`);
            }
        }

        // Also update all existing users across all collections to password123 and active
        const db = mongoose.connection.db;
        if (db) {
            const collections = ['admins', 'doctors', 'patients', 'staffs', 'labusers', 'pharmacyusers', 'employees'];
            for (const col of collections) {
                const res = await db.collection(col).updateMany({}, { $set: { passwordHash: passwordHash, isActive: true } });
                console.log(`Collection [${col}] updated count: ${res.modifiedCount}`);
            }
        }

        console.log('All user account passwords reset to password123 successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error fixing passwords:', err);
        process.exit(1);
    }
};

fixPasswords();
