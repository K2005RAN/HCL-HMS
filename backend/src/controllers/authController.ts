import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import Staff from '../models/Staff';
import LabUser from '../models/LabUser';
import PharmacyUser from '../models/PharmacyUser';
import Attendance from '../models/Attendance';
import Appointment from '../models/Appointment';
import MedicalRecord from '../models/MedicalRecord';
import Employee from '../models/Employee';
import AuditLog from '../models/AuditLog';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_for_hci_hms_development';

// Helper to wipe all non-admin data in background for operational hospital deployment
export const executeDatabaseWipe = async () => {
    try {
        await Doctor.deleteMany({});
        await Staff.deleteMany({});
        await LabUser.deleteMany({});
        await PharmacyUser.deleteMany({});
        await Attendance.deleteMany({});
        await Appointment.deleteMany({});
        await MedicalRecord.deleteMany({});
        await Employee.deleteMany({});
        console.log('✔ Background database reset completed successfully! Kept Admin accounts; wiped all doctors, staff, lab/pharmacy users, and attendance records.');
    } catch (err) {
        console.error('Error during background database reset:', err);
    }
};

const getModelByRole = (role: string) => {
    switch (role.toLowerCase()) {
        case 'admin': return Admin;
        case 'doctor': return Doctor;
        case 'patient': return Patient;
        case 'staff': return Staff;
        case 'lab': return LabUser;
        case 'pharmacy': return PharmacyUser;
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

        let user = await Model.findOne({ email });
        if (!user && (role.toLowerCase() === 'lab' || role.toLowerCase() === 'pharmacy')) {
            user = await Staff.findOne({ email }) as any;
        }

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

        // Record successful login in background (non-blocking for faster login response)
        AuditLog.create({
            userId: user._id,
            userName: (user as any).name,
            userRole: role.toLowerCase(),
            action: 'Login',
            details: `Successful login as ${role}`,
            ipAddress: req.ip || req.connection?.remoteAddress || 'Unknown'
        }).catch(err => console.error('Audit Log login recording error:', err));

        const userObj = user.toObject();
        delete userObj.passwordHash;
        userObj.role = role.toLowerCase();

        res.json({
            token,
            user: userObj
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
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password || 'Password123!', salt);

        // Generate custom ID safely without duplicate collisions
        let customIdField = {};
        const roleLower = role.toLowerCase();
        let prefix = 'PAT';
        let idKey = 'patientId';

        if (roleLower === 'doctor') { prefix = 'DOC'; idKey = 'doctorId'; }
        else if (roleLower === 'patient') { prefix = 'PAT'; idKey = 'patientId'; }
        else if (roleLower === 'staff') { prefix = 'STF'; idKey = 'staffId'; }
        else if (roleLower === 'lab') { prefix = 'LAB'; idKey = 'labId'; }
        else if (roleLower === 'pharmacy') { prefix = 'PHM'; idKey = 'pharmacyId'; }
        else if (roleLower === 'admin') { prefix = 'ADM'; idKey = 'adminId'; }
        else if (roleLower === 'employee') { prefix = 'EMP'; idKey = 'employeeId'; }

        let count = await Model.countDocuments() + 1;
        let idFound = false;
        while (!idFound) {
            const candidateId = `${prefix}-${count.toString().padStart(4, '0')}`;
            const exists = await Model.findOne({ [idKey]: candidateId });
            if (!exists) {
                customIdField = { [idKey]: candidateId };
                idFound = true;
            } else {
                count++;
            }
        }

        const roleSpecificData: any = {};

        if (roleLower === 'doctor') {
            roleSpecificData.specialization = otherData.specialization || 'General Physician';
            roleSpecificData.department = department || 'OPD';
            roleSpecificData.availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            roleSpecificData.availableTimeStart = '09:00';
            roleSpecificData.availableTimeEnd = '17:00';
        } else if (roleLower === 'staff') {
            roleSpecificData.department = department || 'Emergency';
            roleSpecificData.designation = otherData.designation || 'Nurse';
        } else if (roleLower === 'lab') {
            roleSpecificData.department = 'Laboratory';
            roleSpecificData.designation = 'Lab Incharge';
        } else if (roleLower === 'pharmacy') {
            roleSpecificData.department = 'Pharmacy';
            roleSpecificData.designation = 'Pharmacy Incharge';
        } else if (roleLower === 'patient') {
            roleSpecificData.gender = otherData.gender || 'Male';
            roleSpecificData.dob = otherData.dob || new Date('1990-01-01');
            roleSpecificData.address = otherData.address || 'N/A';
            roleSpecificData.emergencyContact = otherData.emergencyContact || 'N/A';
        }

        const newUser = new Model({
            email,
            passwordHash,
            name,
            ...customIdField,
            ...roleSpecificData,
            ...otherData
        });

        await newUser.save();

        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error: any) {
        console.error('Error in adminCreateUser:', error);
        res.status(400).json({ message: error.message || 'Server error', error });
    }
};

// Reset Database: Keep Admin accounts and wipe non-admin users, attendance, and records
export const resetDatabase = async (req: Request, res: Response): Promise<void> => {
    try {
        await executeDatabaseWipe();
        res.json({ message: 'Database reset successfully! Kept Admin accounts; wiped all doctors, staff, lab/pharmacy users, and attendance records.' });
    } catch (error: any) {
        console.error('Database reset error:', error);
        res.status(500).json({ message: error.message || 'Failed to reset database', error });
    }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user || (!req.user.id && !req.user._id)) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        const userId = req.user.id || req.user._id;
        const userRole = req.user.role || 'user';

        const models = [Admin, Doctor, Patient, Staff];
        let foundUser: any = null;

        const PrimaryModel = getModelByRole(userRole);
        if (PrimaryModel) {
            foundUser = await PrimaryModel.findById(userId).select('-passwordHash');
        }

        if (!foundUser) {
            for (const Model of models) {
                foundUser = await Model.findById(userId).select('-passwordHash');
                if (foundUser) break;
            }
        }

        if (foundUser) {
            const userObj = foundUser.toObject();
            userObj.role = userRole;
            res.json(userObj);
            return;
        }

        res.json({
            id: userId,
            name: req.user.name || 'User',
            email: req.user.email || 'N/A',
            role: userRole
        });
    } catch (error) {
        console.error('Error in getMe:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateProfile = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user || (!req.user.id && !req.user._id)) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        const userId = req.user.id || req.user._id;
        const userRole = req.user.role || 'user';
        const { name, phone, address, emergencyContact, bloodGroup, department, specialization } = req.body;

        const PrimaryModel = getModelByRole(userRole);
        const models = [Admin, Doctor, Patient, Staff];

        let targetModel = PrimaryModel;
        let foundUser: any = targetModel ? await targetModel.findById(userId) : null;

        if (!foundUser) {
            for (const Model of models) {
                foundUser = await Model.findById(userId);
                if (foundUser) {
                    targetModel = Model;
                    break;
                }
            }
        }

        if (!foundUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Update provided fields
        if (name !== undefined) foundUser.name = name;
        if (phone !== undefined) foundUser.phone = phone;
        if (address !== undefined) foundUser.address = address;
        if (emergencyContact !== undefined) foundUser.emergencyContact = emergencyContact;
        if (bloodGroup !== undefined) foundUser.bloodGroup = bloodGroup;
        if (department !== undefined) foundUser.department = department;
        if (specialization !== undefined) foundUser.specialization = specialization;

        await foundUser.save();

        const updatedObj = foundUser.toObject();
        delete updatedObj.passwordHash;
        updatedObj.role = userRole;

        res.json({ message: 'Profile updated successfully', user: updatedObj });
    } catch (error: any) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({ message: error.message || 'Server error', error });
    }
};

export const changePassword = async (req: any, res: Response): Promise<void> => {
    try {
        if (!req.user || (!req.user.id && !req.user._id)) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        const userId = req.user.id || req.user._id;
        const userRole = req.user.role || 'user';
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            res.status(400).json({ message: 'Old password and new password are required' });
            return;
        }

        if (newPassword.length < 6) {
            res.status(400).json({ message: 'New password must be at least 6 characters long' });
            return;
        }

        const PrimaryModel = getModelByRole(userRole);
        const models = [Admin, Doctor, Patient, Staff];

        let foundUser: any = PrimaryModel ? await PrimaryModel.findById(userId) : null;

        if (!foundUser) {
            for (const Model of models) {
                foundUser = await Model.findById(userId);
                if (foundUser) break;
            }
        }

        if (!foundUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, foundUser.passwordHash);
        if (!isMatch) {
            res.status(400).json({ message: 'Incorrect old password' });
            return;
        }

        // Hash new password and save
        const salt = await bcrypt.genSalt(10);
        foundUser.passwordHash = await bcrypt.hash(newPassword, salt);
        await foundUser.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Error in changePassword:', error);
        res.status(500).json({ message: error.message || 'Server error', error });
    }
};
