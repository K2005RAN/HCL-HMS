import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Appointment from '../models/Appointment';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import Employee from '../models/Employee';

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
        const patients = await Patient.find().select('name phone dob chronicDiseases allergies gender bloodGroup patientId employeeId');
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const searchPatient = async (req: Request, res: Response): Promise<void> => {
    try {
        const queryParam = (req.query.query as string || '').trim();
        if (!queryParam) {
            res.status(400).json({ message: 'Search query is required' });
            return;
        }

        const escaped = queryParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const exactRegex = new RegExp(`^${escaped}$`, 'i');
        const partialRegex = new RegExp(escaped, 'i');
        const empIdWithPrefixRegex = new RegExp(`^EMP-?${escaped}$`, 'i');

        // 1. Search in Patient collection first (by patientId, phone)
        let patient = await Patient.findOne({
            $or: [
                { patientId: exactRegex },
                { patientId: empIdWithPrefixRegex },
                { phone: queryParam },
                { phone: partialRegex }
            ]
        }).select('-passwordHash');

        if (patient) {
            res.json(patient);
            return;
        }

        // 2. Search in Employee collection by employeeId, phone, email, or name
        const employee = await Employee.findOne({
            $or: [
                { employeeId: exactRegex },
                { employeeId: empIdWithPrefixRegex },
                { employeeId: partialRegex },
                { phone: queryParam },
                { phone: partialRegex },
                { email: exactRegex }
            ]
        });

        if (employee) {
            // Check if a Patient record already exists for this Employee
            patient = await Patient.findOne({
                $or: [
                    { employeeId: employee._id },
                    { patientId: employee.employeeId },
                    { email: employee.email },
                    { phone: employee.phone }
                ]
            }).select('-passwordHash');

            if (patient) {
                // Link employeeId if not set
                if (!patient.employeeId) {
                    patient.employeeId = employee._id as any;
                    await patient.save();
                }
                res.json(patient);
                return;
            }

            // Auto-create a Patient document for this Employee
            const hashedPassword = await bcrypt.hash('Employee@123', 10);
            const cleanPhone = (val?: string): string => {
                if (!val) return '';
                const trimmed = val.trim();
                if (/^[a-zA-Z]+$/.test(trimmed) || trimmed === '0000000000' || trimmed.toLowerCase() === 'unknown' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'na') {
                    return '';
                }
                return trimmed;
            };
            const cleanText = (val?: string): string => {
                if (!val) return '';
                const trimmed = val.trim();
                if (trimmed.toLowerCase() === 'unknown' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'na' || trimmed === '0000000000') {
                    return '';
                }
                return trimmed;
            };

            const newPatient = new Patient({
                patientId: employee.employeeId,
                employeeId: employee._id,
                name: employee.name,
                gender: employee.gender || 'Unknown',
                dob: employee.dob || new Date('1990-01-01'),
                bloodGroup: employee.bloodGroup || '',
                phone: cleanPhone(employee.phone),
                email: employee.email || `${employee.employeeId.toLowerCase()}@hospital.com`,
                passwordHash: hashedPassword,
                address: cleanText(employee.address),
                emergencyContact: cleanPhone(employee.emergencyContact),
                chronicDiseases: [],
                allergies: [],
                familyHistory: '',
                vaccinationHistory: []
            });

            try {
                const savedPatient = await newPatient.save();
                const result = savedPatient.toObject();
                delete (result as any).passwordHash;
                res.json(result);
                return;
            } catch (err: any) {
                if (err.code === 11000) {
                    const existing = await Patient.findOne({
                        $or: [{ email: employee.email }, { phone: employee.phone }]
                    }).select('-passwordHash');
                    if (existing) {
                        existing.employeeId = employee._id as any;
                        await existing.save();
                        res.json(existing);
                        return;
                    }
                }
                throw err;
            }
        }

        // 3. Fallback: Search Patient by name
        patient = await Patient.findOne({
            name: partialRegex
        }).select('-passwordHash');

        if (patient) {
            res.json(patient);
            return;
        }

        res.status(404).json({ message: 'Patient or Employee not found' });
    } catch (error) {
        console.error('Error searching patient/employee:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   PUT /api/appointments/meta/patient/:id
// @desc    Update all patient metadata when scheduling appointment
export const updatePatientMeta = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { age, dob, gender, bloodGroup, phone, name, email, emergencyContact, chronicDiseases, allergies, address } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (gender) updateData.gender = gender;
        if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
        if (phone) updateData.phone = phone;
        if (email) updateData.email = email;
        if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
        if (address !== undefined) updateData.address = address;

        if (chronicDiseases !== undefined) {
            updateData.chronicDiseases = Array.isArray(chronicDiseases)
                ? chronicDiseases
                : typeof chronicDiseases === 'string'
                ? chronicDiseases.split(',').map((s: string) => s.trim()).filter(Boolean)
                : [];
        }

        if (allergies !== undefined) {
            updateData.allergies = Array.isArray(allergies)
                ? allergies
                : typeof allergies === 'string'
                ? allergies.split(',').map((s: string) => s.trim()).filter(Boolean)
                : [];
        }

        if (age !== undefined && age !== '' && age !== null) {
            const ageNum = parseInt(age as string, 10);
            if (!isNaN(ageNum) && ageNum >= 0) {
                const currentYear = new Date().getFullYear();
                const birthYear = currentYear - ageNum;
                updateData.dob = new Date(birthYear, 0, 1);
            }
        } else if (dob) {
            updateData.dob = new Date(dob);
        }

        const patient = await Patient.findByIdAndUpdate(id, updateData, { new: true }).select('-passwordHash');
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }

        // Also sync update to linked Employee model if applicable
        if (patient.employeeId) {
            await Employee.findByIdAndUpdate(patient.employeeId, updateData);
        }

        res.json(patient);
    } catch (error) {
        console.error('Error updating patient metadata:', error);
        res.status(500).json({ message: 'Server error updating patient metadata', error });
    }
};


