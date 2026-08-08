import { Request, Response } from 'express';
import Employee, { IEmployee } from '../models/Employee';
import Patient from '../models/Patient';
import bcrypt from 'bcrypt';

// @route   GET /api/employees
// @desc    Get all employees with pagination and search
export const getEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 100;
        const search = (req.query.search as string || '').trim();

        const query: any = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
                { designation: { $regex: search, $options: 'i' } },
                { plant: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // If collection is empty, seed default employees including Lekhraj
        const count = await Employee.countDocuments();
        if (count === 0) {
            const defaultEmployees = [
                {
                    employeeId: 'EMP-1001',
                    name: 'Lekhraj Patel',
                    department: 'Mines Site Ops',
                    plant: 'Damoh Plant',
                    designation: 'Heavy Equipment Operator',
                    gender: 'Male',
                    dob: new Date('1988-04-12'),
                    bloodGroup: 'B+',
                    phone: '9826123456',
                    email: 'lekhraj.patel@heidelberg.in',
                    emergencyContact: '9826123457',
                    address: 'Mines Colony Qtr 14, Damoh',
                    shift: 'Shift A (Mines)',
                    joiningDate: new Date('2018-05-10'),
                    status: 'Active'
                },
                {
                    employeeId: 'EMP-1002',
                    name: 'Ramji Verma',
                    department: 'Mechanical Maintenance',
                    plant: 'Damoh Plant',
                    designation: 'Sr. Plant Technician',
                    gender: 'Male',
                    dob: new Date('1985-08-20'),
                    bloodGroup: 'AB+',
                    phone: '9876543211',
                    email: 'ramji.verma@heidelberg.in',
                    emergencyContact: '9876543299',
                    address: 'Plant Staff Colony, Damoh',
                    shift: 'General Shift',
                    joiningDate: new Date('2019-01-15'),
                    status: 'Active'
                },
                {
                    employeeId: 'EMP-1003',
                    name: 'Suresh Chandra',
                    department: 'Kiln & Raw Mill',
                    plant: 'Damoh Plant',
                    designation: 'Process Controller',
                    gender: 'Male',
                    dob: new Date('1990-11-03'),
                    bloodGroup: 'O+',
                    phone: '9827011223',
                    email: 'suresh.chandra@heidelberg.in',
                    emergencyContact: '9827011224',
                    address: 'OHC Housing Block 4, Damoh',
                    shift: 'Shift B',
                    joiningDate: new Date('2020-03-01'),
                    status: 'Active'
                },
                {
                    employeeId: 'EMP-1004',
                    name: 'Pooja Sharma',
                    department: 'Quality & Lab',
                    plant: 'Damoh Plant',
                    designation: 'Chemist Specialist',
                    gender: 'Female',
                    dob: new Date('1993-02-17'),
                    bloodGroup: 'A+',
                    phone: '9826900112',
                    email: 'pooja.sharma@heidelberg.in',
                    emergencyContact: '9826900113',
                    address: 'Damoh City, MP',
                    shift: 'General Shift',
                    joiningDate: new Date('2021-07-15'),
                    status: 'Active'
                }
            ];

            await Employee.insertMany(defaultEmployees).catch(err => console.error('Error seeding default employees:', err));
        }

        const employees = await Employee.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Employee.countDocuments(query);

        res.json({
            employees,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   POST /api/employees
// @desc    Create a new employee
export const createEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            employeeId,
            name,
            department,
            plant = 'Damoh Plant',
            designation,
            gender = 'Male',
            dob = new Date('1990-01-01'),
            bloodGroup = 'B+',
            phone = '0000000000',
            email,
            address = 'Plant Colony',
            emergencyContact = '0000000000',
            shift = 'General Shift',
            status = 'Active'
        } = req.body;

        if (!employeeId || !name || !email) {
            res.status(400).json({ message: 'Employee ID, Name, and Email are required.' });
            return;
        }

        const newEmployee = new Employee({
            employeeId,
            name,
            department: department || 'General Operations',
            plant,
            designation: designation || 'Technician',
            gender,
            dob: new Date(dob),
            bloodGroup,
            phone,
            email,
            address,
            emergencyContact,
            shift,
            joiningDate: new Date(),
            status
        });

        const savedEmployee = await newEmployee.save();

        // Also sync or create a Patient record for this employee
        const existingPatient = await Patient.findOne({ email });
        if (!existingPatient) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('HCIL2026', salt);
            await Patient.create({
                patientId: employeeId,
                employeeId: savedEmployee._id,
                name: savedEmployee.name,
                gender: savedEmployee.gender || 'Male',
                dob: savedEmployee.dob || new Date('1990-01-01'),
                bloodGroup: savedEmployee.bloodGroup || 'B+',
                phone: savedEmployee.phone || '0000000000',
                email: savedEmployee.email,
                passwordHash,
                address: savedEmployee.address || 'Plant Quarter',
                emergencyContact: savedEmployee.emergencyContact || '0000000000',
                chronicDiseases: [],
                allergies: [],
                familyHistory: 'None',
                vaccinationHistory: ['Covid-19']
            }).catch(e => console.error('Patient auto-create error:', e));
        }

        res.status(201).json(savedEmployee);
    } catch (error: any) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Employee ID or email already exists.' });
            return;
        }
        res.status(500).json({ message: 'Server error', error });
    }
};

// @route   POST /api/employees/bulk-upload
// @desc    Bulk upload employees from CSV JSON payload
export const bulkUploadEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
        const employeesData = req.body.employees;
        if (!employeesData || !Array.isArray(employeesData)) {
            res.status(400).json({ message: 'Invalid payload. Expected array of employees.' });
            return;
        }

        const employeeOps = [];
        const salt = await bcrypt.genSalt(10);
        const defaultPasswordHash = await bcrypt.hash('HCIL2026', salt);

        for (const row of employeesData) {
            // Map CSV row to Employee Schema
            let empId = row['Employee ID']?.trim() || row['employeeId']?.trim();
            const email = row['Email Address']?.trim() || row['email']?.trim();
            if (!email) continue;
            
            if (!empId || empId.toLowerCase() === 'contract' || empId.toLowerCase() === 'na') {
                empId = `EMP-${email.split('@')[0].toUpperCase()}`;
            }
            
            const name = `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim() || row['User Name'] || row['name'] || 'Employee';
            
            const empDoc = {
                employeeId: empId,
                name: name,
                department: row['Department'] || row['department'] || 'Plant Operations',
                plant: row['Plant'] || row['plant'] || 'Damoh Plant',
                designation: row['Title'] || row['designation'] || 'Staff',
                email: email,
                phone: row['Domain ID'] || row['phone'] || '9800000000',
                gender: row['Gender'] || row['gender'] || 'Male',
                dob: new Date(row['DOB'] || '1988-01-01'),
                address: row['Address'] || 'Plant Colony',
                emergencyContact: row['Emergency Contact'] || '0000000000',
                shift: row['Shift'] || 'General Shift',
                joiningDate: new Date()
            };

            employeeOps.push({
                updateOne: {
                    filter: { employeeId: empId },
                    update: { $set: empDoc },
                    upsert: true
                }
            });

            // Also create/sync patient account
            Patient.updateOne(
                { email },
                {
                    $setOnInsert: {
                        patientId: empId,
                        name: empDoc.name,
                        gender: empDoc.gender,
                        dob: empDoc.dob,
                        bloodGroup: 'B+',
                        phone: empDoc.phone,
                        email: empDoc.email,
                        passwordHash: defaultPasswordHash,
                        address: empDoc.address,
                        emergencyContact: empDoc.emergencyContact,
                        chronicDiseases: [],
                        allergies: [],
                        familyHistory: 'None',
                        vaccinationHistory: ['Covid-19']
                    }
                },
                { upsert: true }
            ).catch(e => console.error('Patient bulk sync error:', e));
        }

        const empResult = await Employee.bulkWrite(employeeOps);

        res.json({
            message: 'Bulk upload successful',
            insertedCount: empResult.upsertedCount || 0,
            modifiedCount: empResult.modifiedCount || 0,
            matchedCount: empResult.matchedCount || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during bulk upload', error });
    }
};
