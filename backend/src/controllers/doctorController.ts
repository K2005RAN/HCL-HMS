import { Request, Response } from 'express';
import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';
import MedicalRecord from '../models/MedicalRecord';
import { AuthRequest } from '../middlewares/authMiddleware';

// @route   GET /api/doctor/dashboard
// @desc    Get dashboard data for a doctor
export const getDoctorDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const doctorId = req.user?.id; // Assuming token contains the doctor's ObjectId

        const doctor = await Doctor.findById(doctorId).select('-passwordHash');
        if (!doctor) {
            res.status(404).json({ message: 'Doctor not found' });
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endToday = new Date();
        endToday.setHours(23, 59, 59, 999);

        const appointmentsToday = await Appointment.find({
            doctorId: doctorId,
            appointmentDate: { $gte: today, $lte: endToday },
            status: 'Pending'
        })
        .populate('patientId', 'name phone dob gender')
        .sort({ queueNumber: 1, appointmentTime: 1 });

        const totalPatientsToday = await Appointment.countDocuments({
            doctorId: doctorId,
            appointmentDate: { $gte: today, $lte: endToday }
        });

        res.json({
            doctor,
            currentQueue: appointmentsToday,
            totalPatientsToday,
            pendingReports: 0, // Mock
            fitnessCertsIssued: 0 // Mock
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

        const appointment = await Appointment.findOne({ _id: appointmentId, doctorId })
            .populate('patientId', 'name phone dob gender bloodGroup allergies chronicDiseases patientId');
            
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

        const appointment = await Appointment.findOne({ _id: appointmentId, doctorId });
        if (!appointment) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }

        if (appointment.status === 'Completed') {
            res.status(400).json({ message: 'Consultation already completed for this appointment' });
            return;
        }

        // Create Medical Record
        const newRecord = new MedicalRecord({
            patientId: appointment.patientId,
            doctorId: doctorId,
            appointmentId: appointment._id,
            bloodPressure: vitals?.bp,
            pulse: vitals?.pulse,
            weight: vitals?.weight,
            temperature: vitals?.temp,
            symptoms: symptoms ? symptoms.split(',').map((s: string) => s.trim()) : [],
            diagnosis: diagnosis || 'Not specified',
            prescription: prescription || [],
            // other fields like notes could be added if schema supports it, for now storing in diagnosis if needed
            // wait, MedicalRecord schema doesn't have "notes" field explicitly, I'll append to diagnosis if present
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
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   GET /api/doctor/history
// @desc    Get all past consultations by the doctor
export const getDoctorHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const doctorId = req.user?.id;
        const { patientId, global } = req.query;

        const query: any = {};
        
        if (global !== 'true') {
            query.doctorId = doctorId;
        }
        
        if (patientId) {
            query.patientId = patientId;
        }

        const history = await MedicalRecord.find(query)
            .populate('patientId', 'name phone dob gender patientId bloodGroup')
            .populate('doctorId', 'name specialization') // needed for global history to see which doctor
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
