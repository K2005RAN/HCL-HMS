import { Response } from 'express';
import Patient from '../models/Patient';
import Employee from '../models/Employee';
import MedicalRecord from '../models/MedicalRecord';
import LabTest from '../models/LabTest';
import { AuthRequest } from '../middlewares/authMiddleware';

import Invoice from '../models/Invoice';

// @route   GET /api/patient/dashboard
// @desc    Get patient profile and medical history
export const getPatientDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const userEmail = req.user?.email;

        let patientProfile: any = null;
        if (userId) {
            patientProfile = await Patient.findById(userId).select('-passwordHash').lean().catch(() => null);
        }
        if (!patientProfile && userEmail) {
            patientProfile = await Patient.findOne({ email: { $regex: new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }).select('-passwordHash').lean().catch(() => null);
        }
        if (!patientProfile && userEmail) {
            patientProfile = await Employee.findOne({ email: { $regex: new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }).select('-passwordHash').lean().catch(() => null);
        }

        const queryOr: any[] = [];
        if (userId) {
            queryOr.push({ patientId: userId });
        }
        if (patientProfile?._id) {
            queryOr.push({ patientId: patientProfile._id });
        }

        if (patientProfile?.email) {
            const matchingPatients = await Patient.find({ email: patientProfile.email }).select('_id').lean().catch(() => []);
            matchingPatients.forEach((p: any) => queryOr.push({ patientId: p._id }));
        }

        const medicalHistory = queryOr.length > 0
            ? await MedicalRecord.find({ $or: queryOr })
                .populate('patientId', 'name phone email dob gender patientId bloodGroup address emergencyContact chronicDiseases allergies')
                .populate('doctorId', 'name specialization department phone')
                .sort({ createdAt: -1 })
                .lean()
                .catch(() => [])
            : await MedicalRecord.find()
                .populate('patientId', 'name phone email dob gender patientId bloodGroup address emergencyContact chronicDiseases allergies')
                .populate('doctorId', 'name specialization department phone')
                .sort({ createdAt: -1 })
                .limit(20)
                .lean()
                .catch(() => []);

        const allLabTests = queryOr.length > 0
            ? await LabTest.find({ $or: queryOr }).lean().catch(() => [])
            : await LabTest.find().limit(20).lean().catch(() => []);

        const invoices = queryOr.length > 0
            ? await Invoice.find({ $or: queryOr }).sort({ createdAt: -1 }).lean().catch(() => [])
            : await Invoice.find().limit(20).sort({ createdAt: -1 }).lean().catch(() => []);

        const historyWithLabStatus = (medicalHistory || []).map((record: any) => {
            const pIdStr = record.patientId?._id?.toString() || record.patientId?.toString();
            const pTests = (allLabTests || []).filter((lt: any) => lt.patientId?.toString() === pIdStr);
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

        const isEmployee = !!(patientProfile?.employeeId || patientProfile?.employeeCode || (req.user?.role === 'employee'));
        const enrichedProfile = {
            ...(patientProfile || {}),
            name: patientProfile?.name || req.user?.name || 'Patient',
            email: patientProfile?.email || userEmail || '',
            role: req.user?.role || 'patient',
            patientType: isEmployee ? 'Employee' : 'General',
            isEmployee
        };

        res.json({
            profile: enrichedProfile,
            history: historyWithLabStatus,
            labTests: allLabTests || [],
            invoices: invoices || []
        });
    } catch (error: any) {
        console.error('getPatientDashboard error:', error);
        res.status(200).json({
            profile: { name: req.user?.name || 'Patient', email: req.user?.email || '', role: 'patient' },
            history: [],
            labTests: []
        });
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
