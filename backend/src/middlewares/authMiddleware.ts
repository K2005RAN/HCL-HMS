import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: any;
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_for_hci_hms_development';

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        const userRole = req.user?.role?.toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());
        
        // Admin / Super Admin always bypasses specific role restrictions
        if (!req.user || (!allowedRoles.includes(userRole) && userRole !== 'admin' && userRole !== 'super admin')) {
            res.status(403).json({ message: 'User role not authorized' });
            return;
        }
        next();
    };
};
