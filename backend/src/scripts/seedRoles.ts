import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import Admin from '../models/Admin';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import Staff from '../models/Staff';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://admin:password@localhost:27017/hci-hms?authSource=admin');
        console.log('Connected to MongoDB');

        // Preserving existing collections
        console.log('Seeding roles without wiping existing data...');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        // 1. Seed Admin
        await Admin.create({
            name: 'Super Admin',
            email: 'admin@heidelberg.in',
            passwordHash,
            isActive: true
        });
        console.log('Seeded Admin');

        // 2. Seed Doctor
        await Doctor.create({
            name: 'Dr. Rahul Sharma',
            specialization: 'General Physician',
            department: 'OPD',
            phone: '9876543210',
            email: 'doctor@heidelberg.in',
            passwordHash,
            availableDays: ['Monday', 'Wednesday', 'Friday'],
            availableTimeStart: '09:00',
            availableTimeEnd: '17:00',
            roomNumber: '101',
            isActive: true
        });
        console.log('Seeded Doctor');

        // 3. Seed Patient
        await Patient.create({
            name: 'Amit Kumar',
            gender: 'Male',
            dob: new Date('1985-06-15'),
            bloodGroup: 'O+',
            phone: '9876543211',
            email: 'patient@heidelberg.in',
            passwordHash,
            address: 'Damoh Plant Quarter',
            emergencyContact: '9876543212',
            chronicDiseases: [],
            allergies: [],
            familyHistory: 'None',
            vaccinationHistory: ['Covid-19']
        });
        console.log('Seeded Patient');

        // 4. Seed Staff (Pharmacy)
        await Staff.create({
            staffId: 'STF-0001',
            name: 'Priya Patel',
            email: 'pharmacy@heidelberg.in',
            passwordHash,
            department: 'Pharmacy',
            isActive: true
        });

        // 5. Seed Staff (Lab Incharge)
        await Staff.create({
            staffId: 'STF-0002',
            name: 'Lab Incharge',
            email: 'lab@heidelberg.in',
            passwordHash,
            department: 'Laboratory',
            isActive: true
        });
        console.log('Seeded Staff & Lab Incharge');

        console.log('Successfully seeded database with role-based auth.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding roles:', error);
        process.exit(1);
    }
};

seedRoles();
