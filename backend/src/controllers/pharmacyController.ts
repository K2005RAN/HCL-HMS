import { Request, Response } from 'express';
import Medicine from '../models/Medicine';
import MedicalRecord from '../models/MedicalRecord';

// @route   GET /api/pharmacy/medicines
// @desc    Get list of all active medicines
export const getMedicines = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query.search ? { name: new RegExp(req.query.search as string, 'i') } : {};
        const medicines = await Medicine.find({ ...query, isActive: true }).sort({ name: 1 });
        res.json(medicines);
    } catch (error: any) {
        console.error('Error in getMedicines:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   POST /api/pharmacy/medicines
// @desc    Add a new medicine to inventory
export const addMedicine = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, genericName, category, batchNumber, expiryDate, quantity, unitPrice, lowStockThreshold } = req.body;

        if (!name) {
            res.status(400).json({ message: 'Medicine name is required' });
            return;
        }

        const newMed = new Medicine({
            name,
            genericName: genericName || name,
            category: category || 'Tablet',
            batchNumber: batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
            expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            quantity: Number(quantity) || 100,
            unitPrice: Number(unitPrice) || 10,
            lowStockThreshold: Number(lowStockThreshold) || 50,
            isActive: true
        });

        await newMed.save();
        res.status(201).json(newMed);
    } catch (error: any) {
        console.error('Error in addMedicine:', error);
        res.status(500).json({ message: error.message || 'Server error', error });
    }
};

// @route   POST /api/pharmacy/medicines/issue
// @desc    Issue/deduct medicine quantity from inventory
export const issueMedicine = async (req: Request, res: Response): Promise<void> => {
    try {
        const { medicineId, quantity } = req.body;
        const qtyNum = Number(quantity) || 1;

        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            res.status(404).json({ message: 'Medicine not found' });
            return;
        }

        if (medicine.quantity < qtyNum) {
            res.status(400).json({ message: 'Insufficient stock' });
            return;
        }

        medicine.quantity -= qtyNum;
        await medicine.save();

        res.json({ message: 'Medicine issued successfully', medicine });
    } catch (error: any) {
        console.error('Error in issueMedicine:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   GET /api/pharmacy/prescriptions
// @desc    Get all doctor prescription records for dispensing
export const getPrescriptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const records = await MedicalRecord.find({
            prescription: { $exists: true, $not: { $size: 0 } }
        })
            .populate('patientId', 'name patientId phone dob gender employeeId bloodGroup')
            .populate('doctorId', 'name specialization department')
            .sort({ createdAt: -1 });

        res.json(records);
    } catch (error: any) {
        console.error('Error in getPrescriptions:', error);
        res.status(500).json({ message: 'Server error fetching prescriptions', error });
    }
};

// @route   POST /api/pharmacy/dispense-and-bill
// @desc    Pharmacist enters medicine rates & dispenses prescription (Routes charges to central billing / salary deduction)
export const dispenseAndBill = async (req: Request, res: Response): Promise<void> => {
    try {
        const { recordId, medicinesWithPrices, totalBilledAmount } = req.body;

        const record = await MedicalRecord.findById(recordId)
            .populate('patientId', 'name patientId');
            
        if (!record) {
            res.status(404).json({ message: 'Medical record not found' });
            return;
        }

        const totalAmountNum = parseFloat(totalBilledAmount) || 0;

        // Update medicine prices in prescription array
        if (Array.isArray(medicinesWithPrices) && medicinesWithPrices.length > 0) {
            record.prescription = record.prescription.map((m: any, idx: number) => {
                const itemPrice = medicinesWithPrices[idx]?.price !== undefined 
                    ? parseFloat(medicinesWithPrices[idx].price) || 0 
                    : (m.price || 0);
                return {
                    medicineName: m.medicineName,
                    dosage: m.dosage,
                    duration: m.duration,
                    instructions: m.instructions,
                    price: itemPrice
                };
            });
        }

        record.pharmacyStatus = 'Dispensed';
        record.pharmacyBilledAmount = totalAmountNum;
        record.dispensedAt = new Date();
        await record.save();

        res.json({ 
            message: `Prescription for ${record.patientId?.name || 'patient'} dispensed & medicine rates (₹${totalAmountNum}) recorded! Routed to Central Billing / Employee Salary Deduction.`, 
            record 
        });
    } catch (error: any) {
        console.error('Error in dispenseAndBill:', error);
        res.status(500).json({ message: error.message || 'Server error', error });
    }
};
