import { Request, Response } from 'express';
import LabTest from '../models/LabTest';

// @route   GET /api/lab/tests
// @desc    Get all lab tests
export const getLabTests = async (req: Request, res: Response): Promise<void> => {
    try {
        const tests = await LabTest.find()
            .populate('patientId', 'name employeeId')
            .populate('doctorId', 'name')
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
            if (resultNotes) updateData.resultNotes = resultNotes;
            if (pdfReportUrl) updateData.pdfReportUrl = pdfReportUrl;
        }

        const test = await LabTest.findByIdAndUpdate(req.params.id, updateData, { new: true });
        
        if (!test) {
            res.status(404).json({ message: 'Test not found' });
            return;
        }
        
        res.json(test);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
