import { Request, Response } from 'express';
import Appointment from '../models/Appointment';

// @route   GET /api/appointments
// @desc    Get all appointments (filter by doctor, date)
export const getAppointments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date, doctorId } = req.query;
        const query: any = {};
        
        if (date) {
            const startDate = new Date(date as string);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date as string);
            endDate.setHours(23, 59, 59, 999);
            query.appointmentDate = { $gte: startDate, $lte: endDate };
        }
        
        if (doctorId) {
            query.doctorId = doctorId;
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name employeeId phone')
            .populate('doctorId', 'name specialization')
            .sort({ appointmentTime: 1, queueNumber: 1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   POST /api/appointments
// @desc    Create a new appointment
export const createAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
        const newAppointment = new Appointment(req.body);
        
        // Auto-assign queue number if walk-in or today
        const today = new Date();
        const apptDate = new Date(newAppointment.appointmentDate);
        
        if (today.toDateString() === apptDate.toDateString()) {
            const count = await Appointment.countDocuments({
                doctorId: newAppointment.doctorId,
                appointmentDate: {
                    $gte: new Date(today.setHours(0,0,0,0)),
                    $lte: new Date(today.setHours(23,59,59,999))
                }
            });
            newAppointment.queueNumber = count + 1;
        }

        const saved = await newAppointment.save();
        res.status(201).json(saved);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
export const updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!appointment) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   PUT /api/appointments/:id/vitals
// @desc    Record/Update appointment vitals by Nurse or Staff
export const updateAppointmentVitals = async (req: Request, res: Response): Promise<void> => {
    try {
        const { vitals } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { vitals },
            { new: true }
        );
        
        if (!appointment) {
            res.status(404).json({ message: 'Appointment not found' });
            return;
        }
        
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


import Doctor from '../models/Doctor';
import Patient from '../models/Patient';

export const getDoctors = async (req: Request, res: Response): Promise<void> => {
    try {
        const doctors = await Doctor.find().select('name specialization');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getPatients = async (req: Request, res: Response): Promise<void> => {
    try {
        const patients = await Patient.find().select('name phone dob chronicDiseases allergies gender bloodGroup patientId');
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const searchPatient = async (req: Request, res: Response): Promise<void> => {
    try {
        const queryParam = req.query.query as string;
        if (!queryParam) {
            res.status(400).json({ message: 'Search query is required' });
            return;
        }

        // Search in Patient collection by phone or employeeId (which is stored as patientId)
        const patient = await Patient.findOne({ 
            $or: [
                { phone: queryParam },
                { patientId: queryParam }
            ]
        }).select('-passwordHash');
        
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }

        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
