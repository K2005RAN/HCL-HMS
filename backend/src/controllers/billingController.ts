import { Request, Response } from 'express';
import Invoice from '../models/Invoice';

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const invoiceCount = await Invoice.countDocuments();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;
        
        const newInvoice = new Invoice({
            ...req.body,
            invoiceNumber
        });

        const saved = await newInvoice.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
        const invoices = await Invoice.find()
            .populate('patientId', 'name phone')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
