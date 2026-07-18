import { Request, Response } from 'express';
import Employee, { IEmployee } from '../models/Employee';
import Patient from '../models/Patient';
import bcrypt from 'bcrypt';

// @route   GET /api/employees
// @desc    Get all employees with pagination and search
export const getEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const query: any = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } }
            ];
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
        const newEmployee = new Employee(req.body);
        const savedEmployee = await newEmployee.save();
        res.status(201).json(savedEmployee);
    } catch (error: any) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Employee ID already exists' });
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

        for (const row of employeesData) {
            // Map CSV row to Employee Schema
            let empId = row['Employee ID']?.trim();
            const email = row['Email Address']?.trim();
            if (!email) continue;
            
            if (!empId || empId.toLowerCase() === 'contract' || empId.toLowerCase() === 'na') {
                empId = `EMP-${email}`;
            }
            
            const name = `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim();
            
            const empDoc = {
                employeeId: empId,
                name: name || row['User Name'] || 'Unknown',
                department: row['Department'] || 'Unknown',
                plant: row['Plant'] || 'Unknown',
                designation: row['Title'] || 'Unknown',
                email: email,
                phone: row['Domain ID'] || '0000000000', // required
                gender: 'Unknown',
                dob: new Date('1980-01-01'),
                address: 'Unknown',
                emergencyContact: 'Unknown',
                shift: 'General',
                joiningDate: new Date()
            };

            employeeOps.push({
                updateOne: {
                    filter: { employeeId: empId },
                    update: { $set: empDoc },
                    upsert: true
                }
            });
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
