import { Request, Response } from 'express';
import Employee from '../models/Employee';
import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';

// @route   GET /api/dashboard/stats
// @desc    Get stats for super admin dashboard
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalEmployees = await Employee.countDocuments();
        const activeDoctors = await Doctor.countDocuments();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endToday = new Date();
        endToday.setHours(23, 59, 59, 999);
        
        const appointmentsToday = await Appointment.countDocuments({
            appointmentDate: { $gte: today, $lte: endToday }
        });

        // Mock data for Available Beds since there's no Bed model
        const availableBeds = 42;

        res.json({
            totalEmployees,
            activeDoctors,
            appointmentsToday,
            availableBeds
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
