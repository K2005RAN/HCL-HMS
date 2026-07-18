import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import Staff from '../models/Staff';
import AuditLog from '../models/AuditLog';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_for_hci_hms_development';

const getModelByRole = (role: string) => {
    switch (role.toLowerCase()) {
        case 'admin': return Admin;
        case 'doctor': return Doctor;
        case 'patient': return Patient;
        case 'staff': return Staff;
        default: return null;
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, role } = req.body;

        if (!role) {
            res.status(400).json({ message: 'Role must be specified' });
            return;
        }

        const Model = getModelByRole(role);
        if (!Model) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }

        const user = await Model.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const isMatch = await bcrypt.compare(password, (user as any).passwordHash);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        if ((user as any).isActive === false) {
            res.status(403).json({ message: 'Account is disabled' });
            return;
        }

        const token = jwt.sign(
            { 
                id: user._id, 
                role: role.toLowerCase(),
                name: (user as any).name,
                email: (user as any).email
            },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        // Record successful login
        await AuditLog.create({
            userId: user._id,
            userName: (user as any).name,
            userRole: role.toLowerCase(),
            action: 'Login',
            details: `Successful login as ${role}`,
            ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown'
        });

        res.json({
            token,
            user: {
                id: user._id,
                name: (user as any).name,
                email: (user as any).email,
                role: role.toLowerCase(),
                ...(role.toLowerCase() === 'staff' && { department: (user as any).department })
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, role, name, department, ...otherData } = req.body;

        const Model = getModelByRole(role);
        if (!Model) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }

        const existingUser = await Model.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new Model({
            email,
            passwordHash,
            name,
            ...(role.toLowerCase() === 'staff' && { department }),
            ...otherData
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const adminCreateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, role, name, department, ...otherData } = req.body;

        const Model = getModelByRole(role);
        if (!Model) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }

        const existingUser = await Model.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate custom ID based on role
        let customIdField = {};
        const count = await Model.countDocuments() + 1;
        const paddedCount = count.toString().padStart(4, '0');
        
        if (role.toLowerCase() === 'doctor') {
            customIdField = { doctorId: `DOC-${paddedCount}` };
        } else if (role.toLowerCase() === 'patient') {
            customIdField = { patientId: `PAT-${paddedCount}` };
        } else if (role.toLowerCase() === 'staff') {
            customIdField = { staffId: `STF-${paddedCount}` };
        } else if (role.toLowerCase() === 'admin') {
            customIdField = { adminId: `ADM-${paddedCount}` };
        } else if (role.toLowerCase() === 'employee') {
            customIdField = { employeeId: `EMP-${paddedCount}` };
        }

        const newUser = new Model({
            email,
            passwordHash,
            name,
            ...(role.toLowerCase() === 'staff' && { department }),
            ...customIdField,
            ...otherData
        });

        await newUser.save();

        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
