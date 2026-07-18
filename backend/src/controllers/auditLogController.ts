import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(100); // Pagination in real world
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
