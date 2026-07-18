import { Request, Response } from 'express';
import Medicine from '../models/Medicine';

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
