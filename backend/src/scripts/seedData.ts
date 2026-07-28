import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import Appointment from '../models/Appointment';
import Medicine from '../models/Medicine';
import LabTest from '../models/LabTest';
import MedicalRecord from '../models/MedicalRecord';
import Invoice from '../models/Invoice';
import Employee from '../models/Employee';
import Attendance from '../models/Attendance';
import AuditLog from '../models/AuditLog';
import Admin from '../models/Admin';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://admin:password@localhost:27017/hci-hms?authSource=admin');
        console.log('Connected to MongoDB');

        // Preserving existing data
        console.log('Seeding demo data without clearing existing collections...');

        const doctor = await Doctor.findOne();
        const patient = await Patient.findOne();
        const admin = await Admin.findOne();

        if (!doctor || !patient || !admin) {
            console.error('Core users not found. Run seedRoles.ts first.');
            process.exit(1);
        }

        // Seed Employee
        const employee = await Employee.create({
            employeeId: 'EMP-1001',
            name: patient.name,
            department: 'Production',
            plant: 'Damoh',
            designation: 'Shift Supervisor',
            gender: patient.gender,
            dob: patient.dob,
            bloodGroup: patient.bloodGroup,
            phone: patient.phone,
            email: patient.email,
            emergencyContact: patient.emergencyContact,
            address: patient.address,
            shift: 'Morning',
            joiningDate: new Date('2020-01-15'),
            status: 'Active'
        });

        patient.employeeId = employee._id as mongoose.Types.ObjectId;
        await patient.save();

        // Seed Appointments
        const appointment1 = await Appointment.create({
            patientId: patient._id,
            doctorId: doctor._id,
            appointmentDate: new Date(), // Today
            appointmentTime: '10:00',
            type: 'Checkup',
            status: 'Scheduled',
            reason: 'Annual Health Checkup'
        });

        await Appointment.create({
            patientId: patient._id,
            doctorId: doctor._id,
            appointmentDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
            appointmentTime: '14:30',
            type: 'Follow-up',
            status: 'Completed',
            reason: 'Fever and Cough'
        });

        // Seed Medicine
        const med1 = await Medicine.create({
            name: 'Paracetamol 500mg',
            genericName: 'Paracetamol',
            category: 'Tablet',
            manufacturer: 'GSK',
            stockQuantity: 1500,
            unitPrice: 2.5,
            expiryDate: new Date('2025-12-31'),
            minimumStockLevel: 200,
            batchNumber: 'BT-20394'
        });

        const med2 = await Medicine.create({
            name: 'Azithromycin 250mg',
            genericName: 'Azithromycin',
            category: 'Tablet',
            manufacturer: 'Pfizer',
            stockQuantity: 400,
            unitPrice: 15.0,
            expiryDate: new Date('2024-10-15'),
            minimumStockLevel: 50,
            batchNumber: 'BT-10293'
        });

        // Seed Lab Test
        await LabTest.create({
            patientId: patient._id,
            doctorId: doctor._id,
            testName: 'Complete Blood Count (CBC)',
            category: 'Hematology',
            testDate: new Date(),
            status: 'Pending',
            results: '',
            remarks: 'Urgent for annual review'
        });

        await LabTest.create({
            patientId: patient._id,
            doctorId: doctor._id,
            testName: 'Lipid Profile',
            category: 'Biochemistry',
            testDate: new Date(Date.now() - 86400000 * 5),
            status: 'Completed',
            results: 'Total Cholesterol: 180 mg/dL (Normal)',
            remarks: 'All parameters within normal limits'
        });

        // Seed Medical Record
        await MedicalRecord.create({
            patientId: patient._id,
            doctorId: doctor._id,
            appointmentId: appointment1._id,
            diagnosis: 'Viral Pharyngitis',
            prescription: [{
                medicineId: med1._id,
                medicineName: med1.name,
                dosage: '500mg',
                frequency: 'Twice a day',
                duration: '5 days'
            }],
            notes: 'Patient advised to rest and drink plenty of fluids.',
            attachments: []
        });

        // Seed Invoice
        await Invoice.create({
            invoiceNumber: 'INV-10001',
            patientId: patient._id,
            type: 'Consultation',
            subTotal: 500.0,
            gstAmount: 25.0,
            totalAmount: 525.0,
            status: 'Paid',
            date: new Date(),
            items: [{
                description: 'General OPD Consultation',
                quantity: 1,
                unitPrice: 500.0,
                amount: 500.0
            }]
        });

        // Seed Attendance
        await Attendance.create({
            employeeId: employee._id,
            date: new Date(),
            status: 'Present',
            checkIn: new Date(new Date().setHours(8, 0, 0, 0)),
            checkOut: new Date(new Date().setHours(17, 30, 0, 0)),
            shift: 'General',
            remarks: 'On Time'
        });

        // Seed Audit Log
        await AuditLog.create({
            userId: admin._id,
            action: 'USER_LOGIN',
            entity: 'Admin',
            entityId: admin._id.toString(),
            details: 'Super Admin logged into the system.',
            ipAddress: '192.168.1.1'
        });

        await AuditLog.create({
            userId: doctor._id,
            action: 'APPOINTMENT_COMPLETED',
            entity: 'Appointment',
            entityId: appointment1._id.toString(),
            details: 'Doctor completed appointment.',
            ipAddress: '192.168.1.15'
        });

        console.log('Successfully seeded application demo data.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
