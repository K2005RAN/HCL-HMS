import { Response } from 'express';
import Patient from '../models/Patient';
import MedicalRecord from '../models/MedicalRecord';
import { AuthRequest } from '../middlewares/authMiddleware';

// @route   GET /api/patient/dashboard
// @desc    Get patient profile and medical history
export const getPatientDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const patientId = req.user?.id;

        const patientProfile = await Patient.findById(patientId).select('-passwordHash');
        
        if (!patientProfile) {
            res.status(404).json({ message: 'Patient profile not found' });
            return;
        }

        const medicalHistory = await MedicalRecord.find({ patientId: patientId })
            .populate('doctorId', 'name specialization department phone')
            .sort({ createdAt: -1 });

        res.json({
            profile: patientProfile,
            history: medicalHistory
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
        const patientId = req.user?.id;

        const record = await MedicalRecord.findOne({ _id: recordId, patientId })
            .populate('patientId', 'name phone dob gender bloodGroup allergies chronicDiseases patientId')
            .populate('doctorId', 'name specialization department phone');
            
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
