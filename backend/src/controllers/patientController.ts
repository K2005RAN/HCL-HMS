import { Response } from 'express';
import Patient from '../models/Patient';
import Employee from '../models/Employee';
import MedicalRecord from '../models/MedicalRecord';
import LabTest from '../models/LabTest';
import { AuthRequest } from '../middlewares/authMiddleware';

// @route   GET /api/patient/dashboard
// @desc    Get patient profile and medical history
export const getPatientDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const userEmail = req.user?.email;

        let patientProfile: any = null;
        if (userId) {
            patientProfile = await Patient.findById(userId).select('-passwordHash').lean();
        }
        if (!patientProfile && userEmail) {
            patientProfile = await Patient.findOne({ email: userEmail }).select('-passwordHash').lean();
        }
        if (!patientProfile && userEmail) {
            patientProfile = await Employee.findOne({ email: userEmail }).select('-passwordHash').lean();
        }

        const targetPatientId = patientProfile?._id || userId;

        const medicalHistory = await MedicalRecord.find({
            $or: [
                { patientId: targetPatientId },
                { patientId: userId }
            ]
        })
        .populate('doctorId', 'name specialization department phone')
        .sort({ createdAt: -1 })
        .lean();

        // Fetch corresponding lab tests for the patient
        const allLabTests = await LabTest.find({
            $or: [
                { patientId: targetPatientId },
                { patientId: userId }
            ]
        }).lean();

        const historyWithLabStatus = medicalHistory.map((record: any) => {
            const pTests = allLabTests;
            let labStatus = 'No Record';
            if (pTests.length > 0) {
                const hasCompleted = pTests.some((lt: any) => lt.status === 'Completed' || !!lt.pdfReportUrl);
                const hasPending = pTests.some((lt: any) => lt.status === 'Pending' || lt.status === 'Sample Collected');
                if (hasCompleted) labStatus = 'Completed';
                else if (hasPending) labStatus = 'Pending';
            } else if (Array.isArray(record.labRequests) && record.labRequests.length > 0) {
                labStatus = 'Pending';
            }

            return {
                ...record,
                labStatus,
                labTests: pTests
            };
        });

        res.json({
            profile: patientProfile || { name: req.user?.name, email: userEmail, role: 'patient' },
            history: historyWithLabStatus,
            labTests: allLabTests
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   GET /api/patient/history/:id
// @desc    Get a specific medical record details
export const getPatientMedicalRecord = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const recordId = req.params.id;

        const record = await MedicalRecord.findById(recordId)
            .populate('patientId', 'name phone dob gender bloodGroup allergies chronicDiseases patientId email')
            .populate('doctorId', 'name specialization department phone email');
            
        if (!record) {
            res.status(404).json({ message: 'Record not found' });
            return;
        }

        res.json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};
