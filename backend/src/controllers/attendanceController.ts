import { Request, Response } from 'express';
import Attendance from '../models/Attendance';

export const markAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        const { employeeId, status, shift } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const newAttendance = new Attendance({
            employeeId,
            date: today,
            clockIn: new Date(),
            status,
            shift
        });

        const saved = await newAttendance.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        const dateStr = req.query.date as string;
        const query: any = {};
        
        if (dateStr) {
            const start = new Date(dateStr);
            start.setHours(0,0,0,0);
            const end = new Date(dateStr);
            end.setHours(23,59,59,999);
            query.date = { $gte: start, $lte: end };
        }

        const records = await Attendance.find(query).populate('employeeId', 'name department');
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
