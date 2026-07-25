import { Request, Response } from 'express';
import Medicine from '../models/Medicine';
import MedicalRecord from '../models/MedicalRecord';
import Invoice from '../models/Invoice';

// @route   GET /api/pharmacy/medicines
// @desc    Get all medicines
export const getMedicines = async (req: Request, res: Response): Promise<void> => {
    try {
        const medicines = await Medicine.find().sort({ name: 1 });
        res.json(medicines);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   POST /api/pharmacy/medicines
// @desc    Add a new medicine to inventory
export const addMedicine = async (req: Request, res: Response): Promise<void> => {
    try {
        const newMedicine = new Medicine(req.body);
        const saved = await newMedicine.save();
        res.status(201).json(saved);
    } catch (error: any) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Medicine with this name already exists' });
        } else {
            res.status(500).json({ message: 'Server error', error });
        }
    }
};

// @route   POST /api/pharmacy/medicines/issue
// @desc    Issue medicine (reduce stock)
export const issueMedicine = async (req: Request, res: Response): Promise<void> => {
    try {
        const { medicineId, quantityIssued } = req.body;
        
        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            res.status(404).json({ message: 'Medicine not found' });
            return;
        }

        if (medicine.quantity < quantityIssued) {
            res.status(400).json({ message: 'Insufficient stock' });
            return;
        }

        medicine.quantity -= quantityIssued;
        await medicine.save();

        res.json({ message: 'Medicine issued successfully', medicine });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   GET /api/pharmacy/prescriptions
// @desc    Get all prescribed medical records for pharmacy queue
export const getPrescriptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const records = await MedicalRecord.find({
            prescription: { $exists: true, $not: { $size: 0 } }
        })
        .populate('patientId', 'name patientId phone dob gender bloodGroup')
        .populate('doctorId', 'name specialization')
        .sort({ createdAt: -1 });

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   POST /api/pharmacy/dispense-and-bill
// @desc    Dispense medicine, generate invoice & record billing
export const dispenseAndBill = async (req: Request, res: Response): Promise<void> => {
    try {
        const { recordId, billedAmount, paymentMethod } = req.body;

        const record = await MedicalRecord.findById(recordId)
            .populate('patientId', 'name patientId');
            
        if (!record) {
            res.status(404).json({ message: 'Medical record not found' });
            return;
        }

        const amountNum = parseFloat(billedAmount) || 0;

        record.pharmacyStatus = 'Dispensed';
        record.pharmacyBilledAmount = amountNum;
        record.dispensedAt = new Date();
        await record.save();

        // Create an Invoice for the patient
        const count = await Invoice.countDocuments() + 10001;
        const invoiceNumber = `INV-${count}`;

        const items = record.prescription.map((m: any) => ({
            description: `${m.medicineName} (${m.dosage}, ${m.duration})`,
            amount: amountNum / (record.prescription.length || 1)
        }));

        await Invoice.create({
            patientId: record.patientId,
            appointmentId: record.appointmentId,
            invoiceNumber,
            date: new Date(),
            items,
            subTotal: amountNum,
            gstAmount: 0,
            totalAmount: amountNum,
            status: 'Paid',
            paymentMethod: paymentMethod || 'Cash'
        });

        res.json({ message: 'Medicines dispensed & billed successfully', record });
    } catch (error: any) {
        console.error('Error in dispenseAndBill:', error);
        res.status(500).json({ message: error.message || 'Server error', error });
    }
};
