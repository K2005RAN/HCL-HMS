import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { startDate, endDate, search } = req.query;
        const filter: any = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                const start = new Date(startDate as string);
                start.setHours(0, 0, 0, 0);
                filter.createdAt.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate as string);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        if (search && typeof search === 'string' && search.trim() !== '') {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { userName: regex },
                { userRole: regex },
                { action: regex },
                { details: regex },
                { ipAddress: regex }
            ];
        }

        const logs = await AuditLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(200);

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
