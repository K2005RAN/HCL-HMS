import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Attendance from '../models/Attendance';
import Staff from '../models/Staff';
import Employee from '../models/Employee';
import Doctor from '../models/Doctor';
import Admin from '../models/Admin';
import LabUser from '../models/LabUser';
import PharmacyUser from '../models/PharmacyUser';

// Helper to format today's date range
const getTodayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

// Helper to format Doctor Name cleanly without duplicate "Dr. Dr."
const cleanDoctorName = (name: string) => {
    if (!name) return 'Dr. User';
    const stripped = name.replace(/^(Dr\.\s*)+/i, '').trim();
    return `Dr. ${stripped}`;
};

// Auto-close any unclosed shifts from previous days
const autoCloseUnsignedShifts = async () => {
    try {
        const { start } = getTodayRange();
        const unclosedRecords = await Attendance.find({
            date: { $lt: start },
            status: 'Present'
        });

        for (const record of unclosedRecords) {
            const shiftEnd = new Date(record.date);
            shiftEnd.setHours(23, 59, 59, 999);
            record.clockOut = shiftEnd;
            record.status = 'Signed Off';
            await record.save();
        }
    } catch (err) {
        console.error('Error in autoCloseUnsignedShifts:', err);
    }
};

// @route   GET /api/attendance/search-staff
// @desc    Get staff members with today's attendance status (Admins/Staff get all; Doctor/Lab/Pharmacy get ONLY their own record)
export const searchStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        await autoCloseUnsignedShifts();

        const queryStr = (req.query.query as string || '').trim();
        const currentUser = (req as any).user;
        const userRole = (currentUser?.role || '').toLowerCase();
        const isSelfOnlyRole = ['doctor', 'pharmacy', 'lab'].includes(userRole);

        const { start, end } = getTodayRange();

        // Self-Only Roles (Doctor, Pharmacy, Lab): Fetch ONLY their own profile directly from DB
        if (isSelfOnlyRole && currentUser) {
            const currentUserId = (currentUser.id || currentUser._id || '').toString();
            const currentEmail = (currentUser.email || '').toLowerCase();

            let dbUser: any = null;
            if (userRole === 'doctor') {
                dbUser = await Doctor.findById(currentUserId) || (currentEmail ? await Doctor.findOne({ email: currentEmail }) : null);
            } else if (userRole === 'lab') {
                dbUser = await LabUser.findById(currentUserId) 
                    || (currentEmail ? await LabUser.findOne({ email: currentEmail }) : null)
                    || await Staff.findById(currentUserId);
            } else if (userRole === 'pharmacy') {
                dbUser = await PharmacyUser.findById(currentUserId) 
                    || (currentEmail ? await PharmacyUser.findOne({ email: currentEmail }) : null)
                    || await Staff.findById(currentUserId);
            } else {
                dbUser = await Staff.findById(currentUserId) 
                    || await Employee.findById(currentUserId)
                    || (currentEmail ? (await Staff.findOne({ email: currentEmail }) || await Employee.findOne({ email: currentEmail })) : null);
            }

            let results: any[] = [];

            if (dbUser) {
                const isDoc = userRole === 'doctor' || !!dbUser.specialization || !!dbUser.doctorId;
                const isLab = userRole === 'lab' || !!dbUser.labId;
                const isPhm = userRole === 'pharmacy' || !!dbUser.pharmacyId;

                const prefix = isDoc ? 'DOC' : isLab ? 'LAB' : isPhm ? 'PHM' : 'STF';
                const sId = dbUser.doctorId || dbUser.labId || dbUser.pharmacyId || dbUser.staffId || dbUser.employeeId || `${prefix}-${dbUser._id.toString().slice(-4)}`;
                const nameStr = isDoc ? cleanDoctorName(dbUser.name) : dbUser.name;
                const deptStr = dbUser.department || (isDoc ? 'Medical / OPD' : isLab ? 'Laboratory' : isPhm ? 'Pharmacy' : 'Nursing');
                
                const todayLog = await Attendance.findOne({ staffId: sId, date: { $gte: start, $lte: end } });

                results = [{
                    _id: dbUser._id,
                    staffId: sId,
                    name: nameStr,
                    email: dbUser.email,
                    department: deptStr,
                    role: isDoc ? 'Doctor' : isLab ? 'Lab Specialist' : isPhm ? 'Pharmacist' : (dbUser.designation || 'Staff Nurse'),
                    phone: dbUser.phone || 'N/A',
                    todayStatus: todayLog ? todayLog.status : 'Not Marked',
                    clockIn: todayLog ? todayLog.clockIn : null,
                    clockOut: todayLog ? todayLog.clockOut : null
                }];
            } else {
                // Fallback entry if user record is transient
                const isDoc = userRole === 'doctor';
                const isLab = userRole === 'lab';
                const isPhm = userRole === 'pharmacy';
                const prefix = isDoc ? 'DOC' : isLab ? 'LAB' : isPhm ? 'PHM' : 'STF';
                
                const sId = currentUser.doctorId || currentUser.labId || currentUser.pharmacyId || currentUser.staffId || `${prefix}-${currentUserId.slice(-4)}`;
                const todayLog = await Attendance.findOne({ staffId: sId, date: { $gte: start, $lte: end } });
                const nameStr = isDoc ? cleanDoctorName(currentUser.name || currentUser.username) : (currentUser.name || currentUser.username || 'Staff User');

                results = [{
                    _id: currentUserId,
                    staffId: sId,
                    name: nameStr,
                    email: currentUser.email || 'N/A',
                    department: isDoc ? 'Medical / OPD' : isLab ? 'Laboratory' : isPhm ? 'Pharmacy' : 'Nursing',
                    role: userRole.toUpperCase(),
                    phone: currentUser.phone || 'N/A',
                    todayStatus: todayLog ? todayLog.status : 'Not Marked',
                    clockIn: todayLog ? todayLog.clockIn : null,
                    clockOut: todayLog ? todayLog.clockOut : null
                }];
            }

            res.json(results);
            return;
        }

        let staffMembers: any[] = [];
        let employees: any[] = [];
        let doctors: any[] = [];
        let labUsers: any[] = [];
        let pharmacyUsers: any[] = [];

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

            labUsers = await LabUser.find({
                $or: [
                    { labId: regex },
                    { name: regex },
                    { phone: regex },
                    { email: regex }
                ]
            }).select('-passwordHash');

            pharmacyUsers = await PharmacyUser.find({
                $or: [
                    { pharmacyId: regex },
                    { name: regex },
                    { phone: regex },
                    { email: regex }
                ]
            }).select('-passwordHash');
        } else {
            staffMembers = await Staff.find().select('-passwordHash').sort({ createdAt: -1 });
            employees = await Employee.find().sort({ createdAt: -1 });
            doctors = await Doctor.find().select('-passwordHash').sort({ createdAt: -1 });
            labUsers = await LabUser.find().select('-passwordHash').sort({ createdAt: -1 });
            pharmacyUsers = await PharmacyUser.find().select('-passwordHash').sort({ createdAt: -1 });
        }

        const todayAttendanceLogs = await Attendance.find({ date: { $gte: start, $lte: end } });
        const attendanceMap = new Map<string, any>();
        todayAttendanceLogs.forEach(log => {
            attendanceMap.set(log.staffId, log);
        });

        const doctorNamesSet = new Set(doctors.map(d => d.name.replace(/^(Dr\.\s*)+/i, '').toLowerCase()));

        let results: any[] = [];

        // 1. Doctors
        doctors.forEach(d => {
            const dId = d.doctorId || `DOC-${d._id.toString().slice(-4)}`;
            const todayLog = attendanceMap.get(dId);
            results.push({
                _id: d._id,
                staffId: dId,
                name: cleanDoctorName(d.name),
                email: d.email,
                department: d.department || 'Doctor',
                role: 'Doctor',
                phone: d.phone || 'N/A',
                todayStatus: todayLog ? todayLog.status : 'Not Marked',
                clockIn: todayLog ? todayLog.clockIn : null,
                clockOut: todayLog ? todayLog.clockOut : null
            });
        });

        // 2. Staff Members (Nurses, Compounders, Receptionists)
        staffMembers.forEach(s => {
            const cleanName = s.name.replace(/^(Dr\.\s*)+/i, '').toLowerCase();
            if (doctorNamesSet.has(cleanName)) return; // Skip duplicate staff entry for Doctors

            const sId = s.staffId || `STF-${s._id.toString().slice(-4)}`;
            const todayLog = attendanceMap.get(sId);
            results.push({
                _id: s._id,
                staffId: sId,
                name: s.name,
                email: s.email,
                department: s.department || 'Nursing / Compounder',
                role: 'Hospital Staff',
                phone: (s as any).phone || 'N/A',
                todayStatus: todayLog ? todayLog.status : 'Not Marked',
                clockIn: todayLog ? todayLog.clockIn : null,
                clockOut: todayLog ? todayLog.clockOut : null
            });
        });

        // 3. Lab Users
        labUsers.forEach(l => {
            const lId = l.labId || `LAB-${l._id.toString().slice(-4)}`;
            const todayLog = attendanceMap.get(lId);
            results.push({
                _id: l._id,
                staffId: lId,
                name: l.name,
                email: l.email,
                department: l.department || 'Laboratory',
                role: 'Lab Technician',
                phone: l.phone || 'N/A',
                todayStatus: todayLog ? todayLog.status : 'Not Marked',
                clockIn: todayLog ? todayLog.clockIn : null,
                clockOut: todayLog ? todayLog.clockOut : null
            });
        });

        // 4. Pharmacy Users
        pharmacyUsers.forEach(p => {
            const pId = p.pharmacyId || `PHM-${p._id.toString().slice(-4)}`;
            const todayLog = attendanceMap.get(pId);
            results.push({
                _id: p._id,
                staffId: pId,
                name: p.name,
                email: p.email,
                department: p.department || 'Pharmacy',
                role: 'Pharmacist',
                phone: p.phone || 'N/A',
                todayStatus: todayLog ? todayLog.status : 'Not Marked',
                clockIn: todayLog ? todayLog.clockIn : null,
                clockOut: todayLog ? todayLog.clockOut : null
            });
        });

        // 5. Employees
        employees.forEach(e => {
            const eId = e.employeeId || `EMP-${e._id.toString().slice(-4)}`;
            const todayLog = attendanceMap.get(eId);
            results.push({
                _id: e._id,
                staffId: eId,
                name: e.name,
                email: e.email,
                department: e.department || 'General',
                role: e.designation || 'Employee',
                phone: e.phone || 'N/A',
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

        const cleanName = staffName.startsWith('Dr.') || staffId.startsWith('DOC-') 
            ? cleanDoctorName(staffName) 
            : staffName;

        const now = new Date();
        const newRecord = new Attendance({
            staffId,
            staffName: cleanName,
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
// @desc    Get attendance logs (Admins/Staff get all; Doctor/Lab/Pharmacy get ONLY their own history)
export const getAdminAttendanceLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        await autoCloseUnsignedShifts();

        const monthStr = req.query.month as string;       // e.g. '2026-07'
        const dateStr = req.query.date as string;         // e.g. '2026-07-26'
        const staffIdFilter = req.query.staffId as string; // e.g. 'STF-0001'
        const search = (req.query.search as string || '').trim();

        const currentUser = (req as any).user;
        const userRole = (currentUser?.role || '').toLowerCase();
        const isSelfOnlyRole = ['doctor', 'pharmacy', 'lab'].includes(userRole);
        const isAdmin = ['admin', 'super admin', 'hr'].includes(userRole);

        const query: any = {};

        // Self-Only Roles (Doctor, Pharmacy, Lab): ONLY get their own attendance history records!
        if (isSelfOnlyRole && currentUser) {
            const currentUserId = (currentUser.id || currentUser._id || '').toString();
            const currentEmail = (currentUser.email || '').toLowerCase();
            const currentName = (currentUser.name || currentUser.username || '').replace(/^(Dr\.\s*)+/i, '').trim();

            let foundStaff: any = null;
            if (userRole === 'doctor') {
                foundStaff = await Doctor.findById(currentUserId) || (currentEmail ? await Doctor.findOne({ email: currentEmail }) : null);
            } else if (userRole === 'lab') {
                foundStaff = await LabUser.findById(currentUserId) || (currentEmail ? await LabUser.findOne({ email: currentEmail }) : null) || await Staff.findById(currentUserId);
            } else if (userRole === 'pharmacy') {
                foundStaff = await PharmacyUser.findById(currentUserId) || (currentEmail ? await PharmacyUser.findOne({ email: currentEmail }) : null) || await Staff.findById(currentUserId);
            } else {
                foundStaff = await Staff.findById(currentUserId) 
                    || await Doctor.findById(currentUserId) 
                    || await Employee.findById(currentUserId)
                    || (currentEmail ? (await Staff.findOne({ email: currentEmail }) || await Doctor.findOne({ email: currentEmail }) || await Employee.findOne({ email: currentEmail })) : null);
            }

            const candidateIds: string[] = [];
            if (foundStaff?.doctorId) candidateIds.push(foundStaff.doctorId);
            if (foundStaff?.labId) candidateIds.push(foundStaff.labId);
            if (foundStaff?.pharmacyId) candidateIds.push(foundStaff.pharmacyId);
            if (foundStaff?.staffId) candidateIds.push(foundStaff.staffId);
            if (foundStaff?.employeeId) candidateIds.push(foundStaff.employeeId);
            if (currentUser.doctorId) candidateIds.push(currentUser.doctorId);
            if (currentUser.labId) candidateIds.push(currentUser.labId);
            if (currentUser.pharmacyId) candidateIds.push(currentUser.pharmacyId);
            if (currentUser.staffId) candidateIds.push(currentUser.staffId);
            if (currentUserId) {
                candidateIds.push(`STF-${currentUserId.slice(-4)}`);
                candidateIds.push(`DOC-${currentUserId.slice(-4)}`);
                candidateIds.push(`LAB-${currentUserId.slice(-4)}`);
                candidateIds.push(`PHM-${currentUserId.slice(-4)}`);
            }

            const nameParts = (foundStaff?.name || currentName || '').replace(/^(Dr\.\s*)+/i, '').trim();
            
            query.$or = [
                { staffId: { $in: candidateIds } }
            ];
            if (nameParts && nameParts.length >= 2) {
                query.$or.push({ staffName: new RegExp(nameParts, 'i') });
            }
        } else if (staffIdFilter && staffIdFilter !== 'all') {
            query.staffId = staffIdFilter;
        }

        // Date / Month filter
        if (dateStr && dateStr !== 'all') {
            const start = new Date(dateStr);
            start.setHours(0, 0, 0, 0);
            const end = new Date(dateStr);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        } else if (monthStr && monthStr !== 'all') {
            let year: number | undefined;
            let month: number | undefined;
            if (monthStr.includes('-')) {
                [year, month] = monthStr.split('-').map(Number);
            } else {
                const dateObj = new Date(monthStr);
                if (!isNaN(dateObj.getTime())) {
                    year = dateObj.getFullYear();
                    month = dateObj.getMonth() + 1;
                }
            }
            if (year && month) {
                const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
                const end = new Date(year, month, 0, 23, 59, 59, 999);
                query.date = { $gte: start, $lte: end };
            }
        }

        if (search && (isAdmin || userRole === 'staff')) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { staffId: regex },
                { staffName: regex },
                { department: regex },
                { status: regex }
            ];
        }

        const records = await Attendance.find(query).sort({ date: -1, clockIn: -1 });

        const totalRecords = records.length;
        const presentCount = records.filter(r => r.status === 'Present').length;
        const signedOffCount = records.filter(r => r.status === 'Signed Off').length;
        
        const uniqueDatesSet = new Set(
            records.map(r => new Date(r.date).toISOString().slice(0, 10))
        );
        const markedDaysCount = uniqueDatesSet.size;

        let daysInPeriod = 30;
        if (monthStr && monthStr !== 'all') {
            let y: number | undefined, m: number | undefined;
            if (monthStr.includes('-')) {
                [y, m] = monthStr.split('-').map(Number);
            } else {
                const dObj = new Date(monthStr);
                if (!isNaN(dObj.getTime())) {
                    y = dObj.getFullYear();
                    m = dObj.getMonth() + 1;
                }
            }
            if (y && m) {
                daysInPeriod = new Date(y, m, 0).getDate();
            }
        } else {
            daysInPeriod = new Date().getDate();
        }

        const absentCount = Math.max(0, daysInPeriod - markedDaysCount);
        const attendancePercentage = daysInPeriod > 0
            ? ((markedDaysCount / daysInPeriod) * 100).toFixed(1)
            : '0.0';

        const totalDbRecords = await Attendance.countDocuments();
        const totalStaffCount = (await Staff.countDocuments()) + (await Employee.countDocuments()) + (await Doctor.countDocuments()) + (await LabUser.countDocuments()) + (await PharmacyUser.countDocuments());

        res.json({
            records,
            stats: {
                totalCount: totalRecords,
                totalDbRecords,
                totalStaffCount,
                presentCount,
                signedOffCount,
                markedDaysCount,
                absentCount,
                daysInPeriod,
                attendancePercentage
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

// @route   POST /api/attendance/delete-staff
// @desc    Delete a staff member (requires Admin password confirmation)
export const deleteStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const { staffId, adminPassword } = req.body;

        if (!staffId) {
            res.status(400).json({ message: 'Staff ID is required for deletion' });
            return;
        }

        if (!adminPassword) {
            res.status(400).json({ message: 'Admin password is required to confirm deletion' });
            return;
        }

        const adminUserId = (req as any).user?.id || (req as any).user?._id;
        const adminRole = ((req as any).user?.role || '').toLowerCase();

        if (!['admin', 'super admin', 'hr'].includes(adminRole)) {
            res.status(403).json({ message: 'Unauthorized. Only admin users can delete staff members.' });
            return;
        }

        const models = [Admin, Staff, Doctor, LabUser, PharmacyUser];
        let foundAdmin: any = null;
        for (const Model of models) {
            foundAdmin = await Model.findById(adminUserId);
            if (foundAdmin && foundAdmin.passwordHash) break;
        }

        if (!foundAdmin || !foundAdmin.passwordHash) {
            res.status(404).json({ message: 'Admin user account not found or invalid' });
            return;
        }

        const isMatch = await bcrypt.compare(adminPassword, foundAdmin.passwordHash);
        if (!isMatch) {
            res.status(401).json({ message: 'Incorrect admin password. Staff deletion cancelled.' });
            return;
        }

        let deleted = false;
        const sRes = await Staff.deleteOne({ $or: [{ staffId }, { _id: staffId }] });
        if (sRes.deletedCount > 0) deleted = true;

        if (!deleted) {
            const eRes = await Employee.deleteOne({ $or: [{ employeeId: staffId }, { _id: staffId }] });
            if (eRes.deletedCount > 0) deleted = true;
        }

        if (!deleted) {
            const dRes = await Doctor.deleteOne({ $or: [{ doctorId: staffId }, { _id: staffId }] });
            if (dRes.deletedCount > 0) deleted = true;
        }

        if (!deleted) {
            const lRes = await LabUser.deleteOne({ $or: [{ labId: staffId }, { _id: staffId }] });
            if (lRes.deletedCount > 0) deleted = true;
        }

        if (!deleted) {
            const pRes = await PharmacyUser.deleteOne({ $or: [{ pharmacyId: staffId }, { _id: staffId }] });
            if (pRes.deletedCount > 0) deleted = true;
        }

        if (!deleted) {
            res.status(404).json({ message: 'Staff member not found in database' });
            return;
        }

        await Attendance.deleteMany({ staffId });

        res.json({ message: `Staff member ${staffId} deleted successfully` });
    } catch (error: any) {
        console.error('Error in deleteStaff:', error);
        res.status(500).json({ message: error.message || 'Server error deleting staff', error });
    }
};
