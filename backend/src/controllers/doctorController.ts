import { Request, Response } from 'express';
import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';
import MedicalRecord from '../models/MedicalRecord';
import { AuthRequest } from '../middlewares/authMiddleware';

// @route   GET /api/doctor/dashboard
// @desc    Get dashboard data for a doctor
export const getDoctorDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const doctorId = req.user?.id;

        let doctor = await Doctor.findById(doctorId).select('-passwordHash');
        if (!doctor) {
            const firstDoctor = await Doctor.findOne();
            if (firstDoctor) {
                doctor = firstDoctor;
            } else {
                doctor = {
                    _id: doctorId,
                    name: req.user?.name || 'Administrator',
                    specialization: 'General Practice',
                    department: 'OPD',
                    phone: '9876543210'
                } as any;
            }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endToday = new Date();
        endToday.setHours(23, 59, 59, 999);

        const filter: any = {
            appointmentDate: { $gte: today, $lte: endToday },
            status: 'Pending'
        };

        if (req.user?.role?.toLowerCase() !== 'admin') {
            filter.doctorId = doctorId;
        }

        const appointmentsToday = await Appointment.find(filter)
            .populate('patientId', 'name phone dob gender')
            .sort({ queueNumber: 1, appointmentTime: 1 });

        const countFilter: any = { appointmentDate: { $gte: today, $lte: endToday } };
        if (req.user?.role?.toLowerCase() !== 'admin') {
            countFilter.doctorId = doctorId;
        }

        const totalPatientsToday = await Appointment.countDocuments(countFilter);

        res.json({
            doctor,
            currentQueue: appointmentsToday,
            totalPatientsToday,
            pendingReports: 0,
            fitnessCertsIssued: 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   GET /api/doctor/appointment/:id
// @desc    Get specific appointment details for consultation
export const getAppointmentDetails = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const appointmentId = req.params.id;
        const doctorId = req.user?.id;

        let appointment;
        if (req.user?.role?.toLowerCase() === 'admin') {
            appointment = await Appointment.findById(appointmentId)
                .populate('patientId', 'name phone dob gender bloodGroup allergies chronicDiseases patientId');
        } else {
            appointment = await Appointment.findOne({ _id: appointmentId, doctorId })
                .populate('patientId', 'name phone dob gender bloodGroup allergies chronicDiseases patientId');
            if (!appointment) {
                appointment = await Appointment.findById(appointmentId)
                    .populate('patientId', 'name phone dob gender bloodGroup allergies chronicDiseases patientId');
            }
        }
            
        if (!appointment) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }

        res.json(appointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   POST /api/doctor/consultation/:id
// @desc    Complete consultation and save medical record
export const completeConsultation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const appointmentId = req.params.id;
        const doctorId = req.user?.id;
        const { vitals, symptoms, diagnosis, notes, prescription } = req.body;

        let appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }

        if (appointment.status === 'Completed') {
            res.status(400).json({ message: 'Consultation already completed for this appointment' });
            return;
        }

        const effectiveDoctorId = appointment.doctorId || doctorId;

        // Clean prescription array
        const finalPrescriptions = Array.isArray(prescription) ? prescription.filter((p: any) => p && p.medicineName) : [];

        // Fallback to vitals captured during appointment/triage by Nurse Staff
        const apptVitals: any = appointment.vitals || {};
        const effectiveVitals = {
            bp: vitals?.bp || apptVitals.bp || '',
            pulse: vitals?.pulse || apptVitals.pulse || '',
            weight: vitals?.weight || apptVitals.weight || '',
            temp: vitals?.temp || apptVitals.temp || ''
        };

        // Create Medical Record
        const newRecord = new MedicalRecord({
            patientId: appointment.patientId,
            doctorId: effectiveDoctorId,
            appointmentId: appointment._id,
            bloodPressure: effectiveVitals.bp,
            pulse: effectiveVitals.pulse,
            weight: effectiveVitals.weight,
            temperature: effectiveVitals.temp,
            symptoms: symptoms ? (Array.isArray(symptoms) ? symptoms : symptoms.split(',').map((s: string) => s.trim())) : [],
            diagnosis: diagnosis || 'Not specified',
            prescription: finalPrescriptions,
            pharmacyStatus: finalPrescriptions.length > 0 ? 'Pending' : 'N/A'
        });

        if (notes) {
            newRecord.diagnosis += `\n\nNotes: ${notes}`;
        }

        await newRecord.save();

        // Update Appointment Status
        appointment.status = 'Completed';
        await appointment.save();

        res.status(201).json({ message: 'Consultation completed successfully', record: newRecord });
    } catch (error) {
        console.error("Error in completeConsultation:", error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   GET /api/doctor/history
// @desc    Get all past consultations
export const getDoctorHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const doctorId = req.user?.id;
        const userRole = req.user?.role?.toLowerCase();
        const { patientId, global } = req.query;

        const query: any = {};
        
        // Admin or explicitly global search fetches all records; otherwise filter by doctorId
        if (userRole !== 'admin' && global !== 'true') {
            query.doctorId = doctorId;
        }
        
        if (patientId) {
            query.patientId = patientId;
        }

        const history = await MedicalRecord.find(query)
            .populate('patientId', 'name phone email dob gender patientId bloodGroup address emergencyContact chronicDiseases allergies')
            .populate('doctorId', 'name specialization department phone email')
            .sort({ createdAt: -1 });

        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   GET /api/doctor/history/:id
// @desc    Get specific medical record details for viewing/printing
export const getMedicalRecordDetails = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const recordId = req.params.id;
        const doctorId = req.user?.id;

        const record = await MedicalRecord.findOne({ _id: recordId }) // Removed doctorId filter so they can view global history details
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
