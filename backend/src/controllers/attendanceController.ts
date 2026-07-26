import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Attendance from '../models/Attendance';
import Staff from '../models/Staff';
import Employee from '../models/Employee';
import Doctor from '../models/Doctor';

// Helper to format today's date range
const getTodayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

// @route   GET /api/attendance/search-staff
// @desc    Get all staff members (or search by query) with today's attendance status
export const searchStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const queryStr = (req.query.query as string || '').trim();

        let staffMembers: any[] = [];
        let employees: any[] = [];
        let doctors: any[] = [];

        if (queryStr) {
            const regex = new RegExp(queryStr, 'i');
            staffMembers = await Staff.find({
                $or: [
                    { staffId: regex },
                    { name: regex },
                    { phone: regex },
                    { email: regex }
                ]
            }).select('-passwordHash');

            employees = await Employee.find({
                $or: [
                    { employeeId: regex },
                    { name: regex },
                    { phone: regex }
                ]
            });

            doctors = await Doctor.find({
                $or: [
                    { doctorId: regex },
                    { name: regex },
                    { phone: regex }
                ]
            }).select('-passwordHash');
        } else {
            // Return ALL staff members when query is empty
            staffMembers = await Staff.find().select('-passwordHash').sort({ createdAt: -1 });
            employees = await Employee.find().sort({ createdAt: -1 });
            doctors = await Doctor.find().select('-passwordHash').sort({ createdAt: -1 });
        }

        // Fetch today's attendance records to attach live status
        const { start, end } = getTodayRange();
        const todayAttendanceLogs = await Attendance.find({ date: { $gte: start, $lte: end } });
        const attendanceMap = new Map<string, any>();
        todayAttendanceLogs.forEach(log => {
            attendanceMap.set(log.staffId, log);
        });

        const results: any[] = [];

        staffMembers.forEach(s => {
            const sId = s.staffId || `STF-${s._id.toString().slice(-4)}`;
            const todayLog = attendanceMap.get(sId);
            results.push({
                _id: s._id,
                staffId: sId,
                name: s.name,
                department: s.department || 'Staff',
                role: 'Staff',
                phone: (s as any).phone || 'N/A',
                todayStatus: todayLog ? todayLog.status : 'Not Marked',
                clockIn: todayLog ? todayLog.clockIn : null,
                clockOut: todayLog ? todayLog.clockOut : null
            });
        });

        employees.forEach(e => {
            const eId = e.employeeId || `EMP-${e._id.toString().slice(-4)}`;
            const todayLog = attendanceMap.get(eId);
            results.push({
                _id: e._id,
                staffId: eId,
                name: e.name,
                department: e.department || 'General',
                role: e.designation || 'Employee',
                phone: e.phone || 'N/A',
                todayStatus: todayLog ? todayLog.status : 'Not Marked',
                clockIn: todayLog ? todayLog.clockIn : null,
                clockOut: todayLog ? todayLog.clockOut : null
            });
        });

        doctors.forEach(d => {
            const dId = d.doctorId || `DOC-${d._id.toString().slice(-4)}`;
            const todayLog = attendanceMap.get(dId);
            results.push({
                _id: d._id,
                staffId: dId,
                name: `Dr. ${d.name}`,
                department: d.department || 'Doctor',
                role: 'Doctor',
                phone: d.phone || 'N/A',
                todayStatus: todayLog ? todayLog.status : 'Not Marked',
                clockIn: todayLog ? todayLog.clockIn : null,
                clockOut: todayLog ? todayLog.clockOut : null
            });
        });

        res.json(results);
    } catch (error: any) {
        console.error('Error in searchStaff:', error);
        res.status(500).json({ message: 'Server error searching staff', error });
    }
};

// @route   POST /api/attendance/give-attendance
// @desc    Mark attendance (Clock In) for a staff member
export const giveAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        const { staffId, staffName, department, shift } = req.body;

        if (!staffId || !staffName) {
            res.status(400).json({ message: 'Staff ID and Staff Name are required' });
            return;
        }

        const { start, end } = getTodayRange();

        // Check if attendance already marked today for this staffId
        const existingRecord = await Attendance.findOne({
            staffId,
            date: { $gte: start, $lte: end }
        });

        if (existingRecord) {
            res.status(400).json({ 
                message: `Attendance already given for today! Current status: ${existingRecord.status}`,
                record: existingRecord 
            });
            return;
        }

        const now = new Date();
        const newRecord = new Attendance({
            staffId,
            staffName,
            department: department || 'General',
            date: start,
            clockIn: now,
            status: 'Present',
            shift: shift || 'Morning'
        });

        await newRecord.save();
        res.status(201).json({ message: 'Attendance marked as Present!', record: newRecord });
    } catch (error: any) {
        console.error('Error in giveAttendance:', error);
        res.status(500).json({ message: error.message || 'Server error', error });
    }
};

// @route   POST /api/attendance/sign-off
// @desc    Sign Off (Clock Out) for a staff member who is currently Present
export const signOff = async (req: Request, res: Response): Promise<void> => {
    try {
        const { staffId } = req.body;

        if (!staffId) {
            res.status(400).json({ message: 'Staff ID is required for sign off' });
            return;
        }

        const { start, end } = getTodayRange();

        const record = await Attendance.findOne({
            staffId,
            date: { $gte: start, $lte: end }
        });

        if (!record) {
            res.status(404).json({ message: 'No active attendance record found for today. Please give attendance first.' });
            return;
        }

        if (record.status === 'Signed Off') {
            res.status(400).json({ message: 'Already signed off for today!', record });
            return;
        }

        record.clockOut = new Date();
        record.status = 'Signed Off';
        await record.save();

        res.json({ message: 'Signed off successfully!', record });
    } catch (error: any) {
        console.error('Error in signOff:', error);
        res.status(500).json({ message: error.message || 'Server error', error });
    }
};

// @route   GET /api/attendance/admin-logs
// @desc    Get all attendance logs for Admin view (filterable by date/search)
export const getAdminAttendanceLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const dateStr = req.query.date as string;
        const search = (req.query.search as string || '').trim();

        const query: any = {};

        if (dateStr && dateStr !== 'all') {
            const start = new Date(dateStr);
            start.setHours(0, 0, 0, 0);
            const end = new Date(dateStr);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }

        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { staffId: regex },
                { staffName: regex },
                { department: regex },
                { status: regex }
            ];
        }

        const records = await Attendance.find(query).sort({ clockIn: -1, createdAt: -1 });

        // Calculate today's stats and overall DB stats
        const { start, end } = getTodayRange();
        const todayRecords = await Attendance.find({ date: { $gte: start, $lte: end } });
        
        const totalStaffCount = (await Staff.countDocuments()) + (await Employee.countDocuments()) + (await Doctor.countDocuments());
        const totalDbRecords = await Attendance.countDocuments();
        const presentCount = todayRecords.filter(r => r.status === 'Present').length;
        const signedOffCount = todayRecords.filter(r => r.status === 'Signed Off').length;

        res.json({
            records,
            stats: {
                totalCount: records.length,
                totalDbRecords,
                totalStaffCount,
                presentCount,
                signedOffCount
            }
        });
    } catch (error: any) {
        console.error('Error in getAdminAttendanceLogs:', error);
        res.status(500).json({ message: 'Server error fetching logs', error });
    }
};

// @route   POST /api/attendance/add-staff
// @desc    Admin manually add hospital staff
export const addStaffManual = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, phone, department, shift, designation, password } = req.body;

        if (!name || !department) {
            res.status(400).json({ message: 'Name and Department are required' });
            return;
        }

        const staffEmail = email || `${name.toLowerCase().replace(/\s+/g, '')}${Date.now().toString().slice(-4)}@hospital.com`;
        
        // Generate unique staff ID
        let count = await Staff.countDocuments() + 1;
        let candidateId = `STF-${count.toString().padStart(4, '0')}`;
        while (await Staff.findOne({ staffId: candidateId })) {
            count++;
            candidateId = `STF-${count.toString().padStart(4, '0')}`;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password || 'Password123!', salt);

        const newStaff = new Staff({
            staffId: candidateId,
            name,
            email: staffEmail,
            passwordHash,
            department: department || 'General',
            phone: phone || 'N/A',
            isActive: true
        });

        await newStaff.save();

        res.status(201).json({ message: 'Hospital staff added successfully!', staff: newStaff });
    } catch (error: any) {
        console.error('Error in addStaffManual:', error);
        res.status(500).json({ message: error.message || 'Failed to add staff', error });
    }
};

// @route   POST /api/attendance/bulk-staff
// @desc    Admin upload hospital staff via CSV
export const bulkUploadStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const { staffList } = req.body;

        if (!Array.isArray(staffList) || staffList.length === 0) {
            res.status(400).json({ message: 'No staff data provided in CSV' });
            return;
        }

        let addedCount = 0;
        const salt = await bcrypt.genSalt(10);
        const defaultHash = await bcrypt.hash('Password123!', salt);

        for (const item of staffList) {
            if (!item.name) continue;

            let count = await Staff.countDocuments() + 1;
            let candidateId = item.staffId || `STF-${count.toString().padStart(4, '0')}`;
            while (await Staff.findOne({ staffId: candidateId })) {
                count++;
                candidateId = `STF-${count.toString().padStart(4, '0')}`;
            }

            const staffEmail = item.email || `${item.name.toLowerCase().replace(/\s+/g, '')}${Date.now().toString().slice(-4)}@hospital.com`;

            const newStaff = new Staff({
                staffId: candidateId,
                name: item.name,
                email: staffEmail,
                passwordHash: defaultHash,
                department: item.department || 'General',
                phone: item.phone || 'N/A',
                isActive: true
            });

            await newStaff.save();
            addedCount++;
        }

        res.json({ message: `Successfully imported ${addedCount} hospital staff members!`, count: addedCount });
    } catch (error: any) {
        console.error('Error in bulkUploadStaff:', error);
        res.status(500).json({ message: error.message || 'Failed to bulk import staff', error });
    }
};
