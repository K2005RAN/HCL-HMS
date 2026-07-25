import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import LabTest from '../models/LabTest';

// @route   POST /api/lab/order
// @desc    Order lab test for patient (by Doctor)
export const orderLabTest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { patientId, testName, category, remarks } = req.body;
        const doctorId = req.user?.id;

        if (!patientId || !testName) {
            res.status(400).json({ message: 'Patient and Test Name are required' });
            return;
        }

        const newTest = new LabTest({
            patientId,
            ...(doctorId && { doctorId }),
            testName,
            category: category || 'General',
            remarks: remarks || '',
            status: 'Pending'
        });

        await newTest.save();
        res.status(201).json({ message: 'Lab test ordered successfully', test: newTest });
    } catch (error: any) {
        console.error('Error in orderLabTest:', error);
        res.status(400).json({ message: error.message || 'Failed to order lab test', error });
    }
};

// @route   GET /api/lab/tests
// @desc    Get all lab tests for lab dashboard
export const getLabTests = async (req: Request, res: Response): Promise<void> => {
    try {
        const tests = await LabTest.find()
            .populate('patientId', 'name patientId dob gender phone bloodGroup employeeId')
            .populate('doctorId', 'name specialization')
            .sort({ createdAt: -1 });
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   GET /api/lab/patient/:patientId
// @desc    Get all lab tests for a specific patient
export const getPatientLabTests = async (req: Request, res: Response): Promise<void> => {
    try {
        const tests = await LabTest.find({ patientId: req.params.patientId })
            .populate('doctorId', 'name specialization')
            .sort({ createdAt: -1 });
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   PUT /api/lab/tests/:id/status
// @desc    Update lab test status (Sample Collected, Completed)
export const updateTestStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, resultNotes, pdfReportUrl } = req.body;
        const updateData: any = { status };

        if (status === 'Sample Collected') {
            updateData.sampleCollectedAt = new Date();
        } else if (status === 'Completed') {
            updateData.resultsCompletedAt = new Date();
            if (resultNotes !== undefined) updateData.resultNotes = resultNotes;
            if (pdfReportUrl !== undefined) updateData.pdfReportUrl = pdfReportUrl;
        }

        const test = await LabTest.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate('patientId', 'name patientId dob gender phone')
            .populate('doctorId', 'name specialization');
        
        if (!test) {
            res.status(404).json({ message: 'Test not found' });
            return;
        }
        
        res.json(test);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
