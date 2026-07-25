import { Request, Response } from 'express';
import Employee from '../models/Employee';
import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';
import HospitalSetting from '../models/HospitalSetting';
import AuditLog from '../models/AuditLog';

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

        // Get Available Beds setting from DB
        let bedSetting = await HospitalSetting.findOne({ key: 'availableBeds' });
        if (!bedSetting) {
            bedSetting = await HospitalSetting.create({ key: 'availableBeds', value: 42 });
        }
        const availableBeds = typeof bedSetting.value === 'number' ? bedSetting.value : Number(bedSetting.value) || 0;

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

// @route   PUT /api/dashboard/beds
// @desc    Update available beds count (Admin Only)
export const updateAvailableBeds = async (req: any, res: Response): Promise<void> => {
    try {
        const { availableBeds } = req.body;

        if (availableBeds === undefined || isNaN(Number(availableBeds)) || Number(availableBeds) < 0) {
            res.status(400).json({ message: 'Please provide a valid non-negative number for available beds' });
            return;
        }

        const bedCount = Math.floor(Number(availableBeds));

        const updatedSetting = await HospitalSetting.findOneAndUpdate(
            { key: 'availableBeds' },
            { value: bedCount },
            { new: true, upsert: true }
        );

        // Record Audit Log
        await AuditLog.create({
            userId: req.user?.id || req.user?._id,
            userName: req.user?.name || req.user?.username || 'Admin',
            userRole: req.user?.role || 'admin',
            action: 'Update Available Beds',
            details: `Updated available beds count to ${bedCount}`,
            ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown'
        });

        res.json({
            message: 'Available beds count updated successfully',
            availableBeds: updatedSetting.value
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating available beds', error });
    }
};
