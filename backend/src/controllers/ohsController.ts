import { Request, Response } from 'express';
import FormO from '../models/FormO';
import Form32 from '../models/Form32';
import Form21 from '../models/Form21';
import Employee from '../models/Employee';
import LabTest from '../models/LabTest';

// ==================== FORM O CONTROLLERS ====================

export const createOrUpdateFormO = async (req: Request, res: Response) => {
    try {
        const { certificateNo, employeeId } = req.body;

        if (!employeeId) {
            return res.status(400).json({ message: 'Employee ID is required' });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        let existingForm = null;
        if (certificateNo) {
            existingForm = await FormO.findOne({ certificateNo });
        }

        if (!existingForm) {
            // Generate auto Certificate No if not provided
            const certNo = certificateNo || `FO-${Date.now().toString().slice(-6)}`;
            const newForm = new FormO({
                ...req.body,
                certificateNo: certNo,
                doctorName: (req as any).user?.name || req.body.doctorName || 'Dr. Certifying Surgeon',
            });
            await newForm.save();
            return res.status(201).json({ message: 'Form O saved successfully', data: newForm });
        } else {
            Object.assign(existingForm, req.body);
            await existingForm.save();
            return res.status(200).json({ message: 'Form O updated successfully', data: existingForm });
        }
    } catch (error: any) {
        console.error('Error saving Form O:', error);
        return res.status(500).json({ message: 'Failed to save Form O', error: error.message });
    }
};

export const getFormOByEmployeeId = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        const forms = await FormO.find({ employeeId }).populate('employeeId').sort({ examinationDate: -1 });
        return res.status(200).json(forms);
    } catch (error: any) {
        return res.status(500).json({ message: 'Error fetching Form O records', error: error.message });
    }
};

// ==================== FORM 32 CONTROLLERS ====================

export const createOrUpdateForm32 = async (req: Request, res: Response) => {
    try {
        const { serialNumber, employeeId } = req.body;

        if (!employeeId) {
            return res.status(400).json({ message: 'Employee ID is required' });
        }

        let existing = null;
        if (serialNumber) {
            existing = await Form32.findOne({ serialNumber });
        }

        if (!existing) {
            const serialNo = serialNumber || `F32-${Date.now().toString().slice(-6)}`;
            const newForm = new Form32({
                ...req.body,
                serialNumber: serialNo,
                certifyingSurgeonName: (req as any).user?.name || req.body.certifyingSurgeonName || 'Certifying Surgeon',
            });
            await newForm.save();
            return res.status(201).json({ message: 'Form 32 generated successfully', data: newForm });
        } else {
            Object.assign(existing, req.body);
            await existing.save();
            return res.status(200).json({ message: 'Form 32 updated successfully', data: existing });
        }
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to save Form 32', error: error.message });
    }
};

export const getForm32ByEmployeeId = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;
        const forms = await Form32.find({ employeeId }).populate('employeeId').sort({ date: -1 });
        return res.status(200).json(forms);
    } catch (error: any) {
        return res.status(500).json({ message: 'Error fetching Form 32 records', error: error.message });
    }
};

// ==================== FORM 21 CONTROLLERS ====================

export const createOrUpdateForm21 = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.body;

        if (!employeeId) {
            return res.status(400).json({ message: 'Employee ID is required' });
        }

        const count = await Form21.countDocuments();
        const srNo = req.body.srNo || count + 1;

        const newForm = new Form21({
            ...req.body,
            srNo,
            certifyingSurgeonName: (req as any).user?.name || req.body.certifyingSurgeonName || 'Dr ANIL RAPELLIWAR',
        });

        await newForm.save();
        return res.status(201).json({ message: 'Form 21 entry added successfully', data: newForm });
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to save Form 21', error: error.message });
    }
};

export const getForm21Register = async (req: Request, res: Response) => {
    try {
        const records = await Form21.find().populate('employeeId').sort({ srNo: 1 });
        return res.status(200).json(records);
    } catch (error: any) {
        return res.status(500).json({ message: 'Error fetching Form 21 register', error: error.message });
    }
};

// ==================== AUTO-FILL LAB & DIAGNOSTIC BRIDGE ====================

export const autoFillLabData = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Fetch recent completed lab tests for this employee
        const labTests = await LabTest.find({
            $or: [{ patientId: employeeId }, { 'patientId.employeeId': employeeId }]
        }).sort({ createdAt: -1 }).limit(10);

        return res.status(200).json({
            employee,
            recentLabTests: labTests,
            suggestedDefaults: {
                mineName: 'DIAMOND PATHARIYA LIME STONE MINES',
                factoryName: 'HeidelbergCement India Ltd. (Unit Damoh)',
                certifyingSurgeons: ['Dr ANIL RAPELLIWAR', 'Dr GAURAV KUMAR', 'Dr RUCHI DEWANGAN']
            }
        });
    } catch (error: any) {
        return res.status(500).json({ message: 'Error fetching lab auto-fill data', error: error.message });
    }
};
