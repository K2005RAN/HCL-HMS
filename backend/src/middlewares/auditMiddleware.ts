import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import AuditLog from '../models/AuditLog';

export const auditLogger = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // Only log state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        // We'll hook into the response finish event so it runs in background
        res.on('finish', async () => {
            // Ignore /api/auth/login since authController handles that manually
            if (req.originalUrl.includes('/api/auth/login')) return;

            try {
                let action = `${req.method} ${req.originalUrl}`;
                
                // Make it more human readable
                if (req.originalUrl.includes('/appointments')) action = `Appointment Activity (${req.method})`;
                else if (req.originalUrl.includes('/employees')) action = `Employee Activity (${req.method})`;
                else if (req.originalUrl.includes('/pharmacy')) action = `Pharmacy Activity (${req.method})`;
                else if (req.originalUrl.includes('/lab')) action = `Laboratory Activity (${req.method})`;
                else if (req.originalUrl.includes('/doctor')) action = `Doctor Activity (${req.method})`;
                else if (req.originalUrl.includes('/attendance')) action = `Attendance Activity (${req.method})`;

                const details = JSON.stringify(req.body || {}).substring(0, 500); // cap size

                await AuditLog.create({
                    userId: req.user?.id || null,
                    userName: req.user?.name || 'System',
                    userRole: req.user?.role || 'System',
                    action,
                    details: details === '{}' ? 'No payload' : details,
                    ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown'
                });
            } catch (error) {
                console.error('Audit Log Error:', error);
            }
        });
    }
    next();
};
