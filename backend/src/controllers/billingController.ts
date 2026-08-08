import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Invoice from '../models/Invoice';
import Patient from '../models/Patient';
import MedicalRecord from '../models/MedicalRecord';
import LabTest from '../models/LabTest';
import Employee from '../models/Employee';

// Helper to safely check if a patient is an employee
const resolveEmployeeInfo = async (patient: any) => {
    if (!patient) return { isEmp: false, empObj: null };

    // 1. Direct employeeId ObjectId link
    if (patient.employeeId && mongoose.isValidObjectId(patient.employeeId)) {
        const emp = await Employee.findById(patient.employeeId).catch(() => null);
        if (emp) return { isEmp: true, empObj: emp };
    }

    // 2. By patientId string matching employeeId
    if (patient.patientId) {
        const cleanId = patient.patientId.replace(/^EMP-/i, '').trim();
        const emp = await Employee.findOne({
            $or: [
                { employeeId: patient.patientId },
                { employeeId: `EMP-${cleanId}` },
                { employeeId: cleanId },
                { email: patient.email }
            ]
        }).catch(() => null);
        if (emp) return { isEmp: true, empObj: emp };
    }

    // 3. By email or phone
    if (patient.email || patient.phone) {
        const emp = await Employee.findOne({
            $or: [
                ...(patient.email ? [{ email: patient.email }] : []),
                ...(patient.phone ? [{ phone: patient.phone }] : [])
            ]
        }).catch(() => null);
        if (emp) return { isEmp: true, empObj: emp };
    }

    return { isEmp: false, empObj: null };
};

// @route   GET /api/billing/invoices
// @desc    Get all hospital invoices & pending billable visits with full itemized breakdown (Consultation + Lab @ 300 + Medicines)
export const getInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
        const rawInvoices = await Invoice.find()
            .populate('patientId', 'name phone patientId employeeId email')
            .populate('employeeId', 'name employeeId department designation')
            .sort({ createdAt: -1 });

        const invoicedPatientIds = new Set<string>();
        const invoicedAppointmentIds = new Set<string>();

        const processedInvoices = await Promise.all(rawInvoices.map(async (inv: any) => {
            try {
                const obj = inv.toObject();
                const p = obj.patientId;

                if (p && p._id) invoicedPatientIds.add(p._id.toString());
                if (obj.appointmentId) invoicedAppointmentIds.add(obj.appointmentId.toString());

                const { isEmp, empObj } = await resolveEmployeeInfo(p);
                const isEmployeeType = isEmp || obj.patientType === 'Employee' || obj.status === 'Salary Deduction' || obj.paymentMethod === 'Salary Deduction';

                if (isEmployeeType) {
                    obj.patientType = 'Employee';
                    if (obj.status !== 'Pending') {
                        obj.status = 'Salary Deduction';
                        obj.paymentMethod = 'Salary Deduction';
                    }
                } else {
                    obj.patientType = 'General';
                }

                // Auto-reconsolidate incomplete invoices (e.g. ones with missing consultation/lab charges)
                const hasConsultation = obj.consultationCharges > 0 || obj.items?.some((i: any) => i.type === 'Consultation');
                if (!hasConsultation && p && mongoose.isValidObjectId(p._id)) {
                    const labTests = await LabTest.find({ patientId: p._id }).catch(() => []);
                    const labCount = labTests.length;
                    const labCharges = labCount * 300;
                    const consultationCharges = 500;
                    const medicineCharges = obj.medicineCharges || obj.subTotal || 120;

                    const labItems = labTests.map((lt: any) => ({
                        description: `Lab Report: ${lt.testName} (${lt.category || 'General'})`,
                        amount: 300,
                        type: 'Lab'
                    }));

                    const consultationItem = {
                        description: `Doctor Consultation Fee`,
                        amount: consultationCharges,
                        type: 'Consultation'
                    };

                    const medicineItem = {
                        description: `Dispensed Medicines Total`,
                        amount: medicineCharges,
                        type: 'Medicine'
                    };

                    const newItems = [...labItems, medicineItem, consultationItem];
                    const newSubTotal = labCharges + medicineCharges + consultationCharges;
                    const newGst = Math.round(newSubTotal * 0.05);
                    const newTotal = newSubTotal + newGst;

                    obj.labCharges = labCharges;
                    obj.consultationCharges = consultationCharges;
                    obj.medicineCharges = medicineCharges;
                    obj.items = newItems;
                    obj.subTotal = newSubTotal;
                    obj.gstAmount = newGst;
                    obj.totalAmount = newTotal;

                    // Update in background
                    Invoice.findByIdAndUpdate(inv._id, {
                        patientType: isEmployeeType ? 'Employee' : 'General',
                        status: isEmployeeType ? 'Salary Deduction' : inv.status,
                        paymentMethod: isEmployeeType ? 'Salary Deduction' : inv.paymentMethod,
                        labCharges,
                        consultationCharges,
                        medicineCharges,
                        items: newItems,
                        subTotal: newSubTotal,
                        gstAmount: newGst,
                        totalAmount: newTotal
                    }).catch(() => {});
                }

                return obj;
            } catch (itemErr) {
                console.error('Error processing individual invoice:', itemErr);
                return inv.toObject();
            }
        }));

        // Include all recent medical records / visits that don't have a generated invoice yet (e.g. new patients like raman)
        const recentMedicalRecords = await MedicalRecord.find()
            .populate('patientId', 'name phone patientId employeeId email')
            .populate('doctorId', 'name specialization department')
            .sort({ createdAt: -1 })
            .limit(20)
            .catch(() => []);

        const pendingVisitInvoices: any[] = [];

        for (const rec of recentMedicalRecords) {
            const p: any = rec.patientId;
            if (!p || !p._id) continue;

            const recKey = rec._id.toString();
            const apptKey = rec.appointmentId ? rec.appointmentId.toString() : '';

            // Check if already in processedInvoices
            const alreadyInvoiced = processedInvoices.some((inv: any) => 
                (inv.appointmentId && apptKey && inv.appointmentId.toString() === apptKey) ||
                (inv.patientId?._id && inv.patientId._id.toString() === p._id.toString() && inv.totalAmount > 150)
            );

            if (!alreadyInvoiced) {
                const { isEmp, empObj } = await resolveEmployeeInfo(p);
                const labTests = await LabTest.find({ patientId: p._id }).catch(() => []);
                const labCount = labTests.length;
                const labCharges = labCount * 300;

                let medicineCharges = 0;
                const medicineItems: any[] = [];
                if (rec.prescription && rec.prescription.length > 0) {
                    rec.prescription.forEach((m: any) => {
                        const itemCost = m.price !== undefined ? (parseFloat(m.price) || 0) : 150;
                        medicineCharges += itemCost;
                        medicineItems.push({
                            description: `Medicine: ${m.medicineName} (${m.dosage || '1-0-1'}, ${m.duration || '5 days'})`,
                            amount: itemCost,
                            type: 'Medicine'
                        });
                    });
                } else if (rec.pharmacyBilledAmount) {
                    medicineCharges = rec.pharmacyBilledAmount;
                    medicineItems.push({
                        description: `Dispensed Medicines Total`,
                        amount: medicineCharges,
                        type: 'Medicine'
                    });
                }

                const consultationCharges = 500;
                const labItems = labTests.map((lt: any) => ({
                    description: `Lab Report: ${lt.testName} (${lt.category || 'General'})`,
                    amount: 300,
                    type: 'Lab'
                }));

                const consultationItem = {
                    description: `Doctor Consultation Fee (Dr. ${rec.doctorId?.name || 'Physician'})`,
                    amount: consultationCharges,
                    type: 'Consultation'
                };

                const allItems = [...labItems, ...medicineItems, consultationItem];
                const subTotal = labCharges + medicineCharges + consultationCharges;
                const gstAmount = Math.round(subTotal * 0.05);
                const totalAmount = subTotal + gstAmount;

                pendingVisitInvoices.push({
                    _id: `pending-${rec._id}`,
                    isPendingVisit: true,
                    patientId: p,
                    employeeId: empObj,
                    appointmentId: rec.appointmentId,
                    medicalRecordId: rec._id,
                    invoiceNumber: `VISIT-${p.patientId || p._id.toString().slice(-4)}`,
                    date: rec.createdAt || new Date(),
                    patientType: isEmp ? 'Employee' : 'General',
                    items: allItems,
                    labCharges,
                    medicineCharges,
                    consultationCharges,
                    subTotal,
                    gstAmount,
                    totalAmount,
                    status: isEmp ? 'Salary Deduction' : 'Pending',
                    paymentMethod: isEmp ? 'Salary Deduction' : 'Cash'
                });
            }
        }

        const combined = [...processedInvoices, ...pendingVisitInvoices];
        res.json(combined);
    } catch (error: any) {
        console.error('Error in getInvoices:', error);
        res.status(500).json({ message: 'Server error fetching invoices', error: error.message || error });
    }
};

// @route   GET /api/billing/patient-records
// @desc    Search patients/employees and auto-aggregate visit billing details (Lab reports @ 300, Medicines with pharmacist rates, Consultation, Employee Status)
export const getPatientBillableRecords = async (req: Request, res: Response): Promise<void> => {
    try {
        const queryStr = (req.query.query as string || '').trim();
        let patients: any[] = [];
        let employees: any[] = [];

        if (queryStr) {
            const safeRegexStr = queryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(safeRegexStr, 'i');

            patients = await Patient.find({
                $or: [
                    { name: regex },
                    { phone: regex },
                    { patientId: regex },
                    { email: regex }
                ]
            }).limit(10).catch(() => []);

            employees = await Employee.find({
                $or: [
                    { employeeId: regex },
                    { name: regex },
                    { phone: regex }
                ]
            }).limit(10).catch(() => []);
        } else {
            patients = await Patient.find().sort({ createdAt: -1 }).limit(10).catch(() => []);
            employees = await Employee.find().sort({ createdAt: -1 }).limit(10).catch(() => []);
        }

        // Auto-link/merge matching patients from employee search
        for (const emp of employees) {
            let matchedP = patients.find(p => p.employeeId?.toString() === emp._id.toString() || p.patientId === emp.employeeId);
            if (!matchedP) {
                matchedP = await Patient.findOne({
                    $or: [
                        { employeeId: emp._id },
                        { patientId: emp.employeeId },
                        { email: emp.email }
                    ]
                }).catch(() => null);
                if (matchedP) {
                    patients.push(matchedP);
                }
            }
        }

        const results: any[] = [];
        const processedIds = new Set<string>();

        for (const p of patients) {
            const pKey = p._id.toString();
            if (processedIds.has(pKey)) continue;
            processedIds.add(pKey);

            const { isEmp: isEmployee, empObj } = await resolveEmployeeInfo(p);

            // If employeeId is missing on Patient doc, link it
            if (empObj && !p.employeeId) {
                p.employeeId = empObj._id;
                await p.save().catch(() => {});
            }

            // Query latest medical record (Doctor Consultation & Prescription) safely
            const latestRecord: any = await MedicalRecord.findOne({ patientId: p._id })
                .populate('doctorId', 'name department')
                .sort({ createdAt: -1 })
                .catch(() => null);

            // Query Lab Tests safely using patient._id
            const labTests = await LabTest.find({ patientId: p._id }).catch(() => []);
            const labCount = labTests.length;
            const labCharges = labCount * 300; // Fixed ₹300 per lab report type

            // Prescription / medicine charges calculation using rates set by pharmacist
            let medicineCharges = 0;
            const medicineItems: any[] = [];

            if (latestRecord && latestRecord.prescription && latestRecord.prescription.length > 0) {
                latestRecord.prescription.forEach((m: any) => {
                    const itemCost = m.price !== undefined ? (parseFloat(m.price) || 0) : 150;
                    medicineCharges += itemCost;
                    medicineItems.push({
                        description: `Medicine: ${m.medicineName} (${m.dosage || '1-0-1'}, ${m.duration || '5 days'})`,
                        amount: itemCost,
                        type: 'Medicine'
                    });
                });
            } else if (latestRecord && latestRecord.pharmacyBilledAmount) {
                medicineCharges = latestRecord.pharmacyBilledAmount;
                medicineItems.push({
                    description: `Dispensed Medicines Total`,
                    amount: medicineCharges,
                    type: 'Medicine'
                });
            }

            const consultationCharges = 500; // Default Doctor OPD Consultation Fee

            // Lab items line details
            const labItems = labTests.map((lt: any) => ({
                description: `Lab Report: ${lt.testName} (${lt.category || 'General'})`,
                amount: 300,
                type: 'Lab'
            }));

            const consultationItem = {
                description: `Doctor Consultation Fee (${latestRecord?.doctorId?.name ? 'Dr. ' + latestRecord.doctorId.name : 'OPD Consultation'})`,
                amount: consultationCharges,
                type: 'Consultation'
            };

            const allItems = [...labItems, ...medicineItems, consultationItem];
            const subTotal = labCharges + medicineCharges + consultationCharges;
            const gstAmount = Math.round(subTotal * 0.05); // 5% GST
            const totalAmount = subTotal + gstAmount;

            results.push({
                patient: {
                    _id: p._id,
                    patientId: empObj?.employeeId || p.patientId || `PAT-${p._id.toString().slice(-4)}`,
                    name: p.name,
                    phone: p.phone,
                    email: p.email,
                    isEmployee,
                    employeeId: empObj ? empObj._id : null,
                    employeeIdStr: empObj ? empObj.employeeId : p.patientId
                },
                appointmentId: latestRecord ? latestRecord.appointmentId : null,
                patientType: isEmployee ? 'Employee' : 'General',
                latestVisitDate: latestRecord ? latestRecord.createdAt : p.createdAt,
                doctorName: latestRecord?.doctorId?.name ? `Dr. ${latestRecord.doctorId.name}` : 'General Physician',
                diagnosis: latestRecord?.diagnosis || 'Routine Health Checkup',
                labCount,
                labCharges,
                medicineCharges,
                consultationCharges,
                subTotal,
                gstAmount,
                totalAmount,
                allItems,
                suggestedPaymentMethod: isEmployee ? 'Salary Deduction' : 'Cash',
                suggestedStatus: isEmployee ? 'Salary Deduction' : 'Paid'
            });
        }

        res.json(results);
    } catch (error: any) {
        console.error('Error in getPatientBillableRecords:', error);
        res.status(500).json({ message: 'Server error fetching patient billable records', error: error.message || error });
    }
};

// @route   POST /api/billing/create
// @desc    Create / Generate / Overwrite Invoice (Auto-handles Employee Salary Deduction vs General Pay Now)
export const createInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            patientId,
            appointmentId,
            patientType,
            items,
            labCharges,
            medicineCharges,
            consultationCharges,
            subTotal,
            gstAmount,
            totalAmount,
            paymentMethod
        } = req.body;

        if (!patientId || !mongoose.isValidObjectId(patientId)) {
            res.status(400).json({ message: 'Valid Patient ID is required for invoice creation' });
            return;
        }

        const patientObj = await Patient.findById(patientId);
        if (!patientObj) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }

        const { isEmp, empObj } = await resolveEmployeeInfo(patientObj);
        const isEmployeeFinal = isEmp || patientType === 'Employee';

        const isSalaryDeduction = isEmployeeFinal || paymentMethod === 'Salary Deduction';
        const finalStatus = isSalaryDeduction ? 'Salary Deduction' : (paymentMethod === 'Pending' ? 'Pending' : 'Paid');
        const finalPaymentMethod = isSalaryDeduction ? 'Salary Deduction' : (paymentMethod || 'Cash');

        const existingInvoice = await Invoice.findOne({ patientId: patientObj._id }).sort({ createdAt: -1 });
        let invoiceToSave: any = null;

        if (existingInvoice && (existingInvoice.consultationCharges === 0 || !existingInvoice.items?.some((i: any) => i.type === 'Consultation'))) {
            invoiceToSave = existingInvoice;
            invoiceToSave.items = items || [];
            invoiceToSave.labCharges = labCharges || 0;
            invoiceToSave.medicineCharges = medicineCharges || 0;
            invoiceToSave.consultationCharges = consultationCharges || 0;
            invoiceToSave.subTotal = subTotal || (labCharges + medicineCharges + consultationCharges);
            invoiceToSave.gstAmount = gstAmount || 0;
            invoiceToSave.totalAmount = totalAmount || subTotal;
            invoiceToSave.status = finalStatus;
            invoiceToSave.paymentMethod = finalPaymentMethod;
            invoiceToSave.patientType = isEmployeeFinal ? 'Employee' : 'General';
        } else {
            const count = await Invoice.countDocuments() + 10001;
            const invoiceNumber = `INV-${count}`;
            invoiceToSave = new Invoice({
                patientId: patientObj._id,
                appointmentId: appointmentId && mongoose.isValidObjectId(appointmentId) ? appointmentId : undefined,
                employeeId: patientObj.employeeId || empObj?._id,
                invoiceNumber,
                date: new Date(),
                patientType: isEmployeeFinal ? 'Employee' : 'General',
                items: items || [],
                labCharges: labCharges || 0,
                medicineCharges: medicineCharges || 0,
                consultationCharges: consultationCharges || 0,
                subTotal: subTotal || (labCharges + medicineCharges + consultationCharges),
                gstAmount: gstAmount || 0,
                totalAmount: totalAmount || subTotal,
                status: finalStatus,
                paymentMethod: finalPaymentMethod
            });
        }

        const saved = await invoiceToSave.save();

        res.status(201).json({
            message: isSalaryDeduction 
                ? `Invoice generated successfully! Total ₹${totalAmount} routed to Employee Salary Deduction.` 
                : `Invoice generated & marked as ${finalStatus}!`,
            invoice: saved
        });
    } catch (error: any) {
        console.error('Error in createInvoice:', error);
        res.status(500).json({ message: error.message || 'Server error creating invoice', error: error.message || error });
    }
};

// @route   GET /api/billing/patient-invoices/:patientId
// @desc    Get invoices for a specific patient/employee to display on their login portal
export const getPatientInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patientId } = req.params;
        if (!patientId || !mongoose.isValidObjectId(patientId)) {
            res.json([]);
            return;
        }
        const invoices = await Invoice.find({ patientId })
            .populate('patientId', 'name patientId')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error fetching patient invoices', error });
    }
};
