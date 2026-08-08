import React, { useState, useEffect } from 'react';
import { PrintableFormHeader } from '../../components/ohs/PrintableFormHeader';
import { FileCheck, Printer, Save, CheckCircle2, AlertTriangle, User, Edit3, Scissors, Building2, Check, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

export const Form32Generator: React.FC = () => {
    const { token } = useAuth();
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmpId, setSelectedEmpId] = useState<string>('');
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form 32 State - All Details Editable
    const [formData, setFormData] = useState<any>({
        serialNumber: `F32-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        workerName: 'SUNIL KUMAR SHARMA',
        fatherName: 'SHRI HARISH CHANDRA SHARMA',
        sex: 'Male',
        designation: 'Kiln & Crusher Operator',
        address: 'House No. 42, Sector-B, Narsingarh Plant Colony, Damoh (MP)',
        factoryName: 'HeidelbergCement India Ltd. (Unit Damoh)',
        processOrDepartment: 'Crusher & Cement Manufacturing / Dangerous Operation (Sec 87)',
        certificateGranted: true,
        declaredUnfitAndRefused: false,
        previousCertificateRefNo: 'F32-881023',
        fitnessStatus: 'Fit',
        nonHazardousOperationsAllowed: 'Non-dusty administrative & material coordination duties',
        reexaminationPeriodMonths: 12,
        furtherExaminationAdvised: 'Annual spirometry & audiometry follow-up',
        treatmentAdvised: 'Routine protective eyewear & earmuff usage',
        certifyingSurgeonName: 'Dr ANIL RAPELLIWAR',
        place: 'DAMOH'
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/employees?limit=100`, {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            });
            const empList = Array.isArray(res.data) ? res.data : (res.data?.employees || []);
            setEmployees(empList);
            if (empList.length > 0) {
                setSelectedEmpId(empList[0]._id);
                loadEmployee(empList[0]);
            }
        } catch (err) {
            console.error('Failed to load employees', err);
            setEmployees([]);
        }
    };

    const handleEmployeeChange = (empId: string) => {
        setSelectedEmpId(empId);
        const emp = (Array.isArray(employees) ? employees : []).find((e) => e._id === empId);
        if (emp) loadEmployee(emp);
    };

    const loadEmployee = (emp: any) => {
        setEmployee(emp);
        setFormData((prev: any) => ({
            ...prev,
            employeeId: emp._id,
            workerName: emp.name || prev.workerName || '',
            fatherName: emp.fatherName || prev.fatherName || 'Father Name',
            sex: emp.gender || prev.sex || 'Male',
            designation: emp.designation || prev.designation || 'Worker',
            address: emp.address || prev.address || 'Damoh Plant Site',
            processOrDepartment: `${emp.department || 'Manufacturing'} / Dangerous Operations (Sec 87)`
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = { 
                ...formData, 
                employeeId: selectedEmpId || undefined 
            };
            await axios.post(`${API_BASE_URL}/api/ohs/form-32`, payload, {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            });
            setMessage({ type: 'success', text: 'Form 32 Certificate & Counterfoil saved successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save Form 32' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 bg-slate-50/70 min-h-screen">
            
            {/* ========================================================================= */}
            {/* SCREEN INTERACTIVE FORM UI (HIDDEN DURING PRINT) */}
            {/* ========================================================================= */}
            <div className="print:hidden space-y-6">
                
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700">
                            <FileCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                Form 32 — Certificate of Fitness
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                                    Rule 107 / Sec 87
                                </span>
                            </h1>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Dangerous Operations Fitness Certificate & Counterfoil. Click "Print A4 Certificate" for output.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Printer className="w-4 h-4 text-emerald-400" />
                            Print A4 Certificate
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                        >
                            <Save className="w-3.5 h-3.5" />
                            Save Form 32
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl flex items-center justify-between gap-3 ${
                        message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                        <div className="flex items-center gap-2.5">
                            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                            <span className="text-xs font-bold">{message.text}</span>
                        </div>
                        <button onClick={() => setMessage(null)} className="text-xs font-bold text-slate-400">✕</button>
                    </div>
                )}

                {/* Worker Selection & Form Overrides Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-emerald-600" /> Worker Details & Certificate Data
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            <Edit3 className="w-3 h-3 inline mr-1" /> Live Editable
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Select Factory Worker</label>
                            <select
                                value={selectedEmpId}
                                onChange={(e) => handleEmployeeChange(e.target.value)}
                                className="w-full text-xs font-bold text-slate-800 border border-slate-300 rounded-xl p-2.5 bg-slate-50/50"
                            >
                                <option value="">-- Select Worker --</option>
                                {employees.map((emp) => (
                                    <option key={emp._id} value={emp._id}>
                                        {emp.name} ({emp.employeeId}) - {emp.department}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Worker Full Name</label>
                            <input
                                type="text"
                                value={formData.workerName}
                                onChange={(e) => setFormData({ ...formData, workerName: e.target.value })}
                                className="w-full text-xs font-bold text-slate-800 border border-slate-300 rounded-xl p-2.5 bg-slate-50/50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Father's Name</label>
                            <input
                                type="text"
                                value={formData.fatherName}
                                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                className="w-full text-xs font-bold text-slate-800 border border-slate-300 rounded-xl p-2.5 bg-slate-50/50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                            <label className="block font-bold text-slate-600 mb-1">Sex</label>
                            <select
                                value={formData.sex}
                                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                                className="w-full p-2 border rounded-xl font-semibold"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-bold text-slate-600 mb-1">Designation</label>
                            <input
                                type="text"
                                value={formData.designation}
                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                className="w-full p-2 border rounded-xl font-semibold"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-600 mb-1">Fitness Outcome</label>
                            <select
                                value={formData.fitnessStatus}
                                onChange={(e) => setFormData({ ...formData, fitnessStatus: e.target.value })}
                                className="w-full p-2 border rounded-xl font-bold text-emerald-900"
                            >
                                <option value="Fit">Fit for Employment</option>
                                <option value="Unfit">Unfit</option>
                                <option value="FitForNonHazardousOnly">Fit for Non-Hazardous Only</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t">
                        <div>
                            <label className="block font-bold text-slate-600 mb-1">Address</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full p-2 border rounded-xl font-semibold"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-slate-600 mb-1">Process / Department</label>
                            <input
                                type="text"
                                value={formData.processOrDepartment}
                                onChange={(e) => setFormData({ ...formData, processOrDepartment: e.target.value })}
                                className="w-full p-2 border rounded-xl font-semibold"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* DEDICATED STUNNING A4 PRINT DOCUMENT (ONLY VISIBLE ON PRINT) */}
            {/* ========================================================================= */}
            <div className="hidden print:block w-full max-w-full box-border bg-white text-slate-950 p-1 mx-auto font-sans leading-relaxed print-page-a4">
                
                {/* Official Outer Certificate Border Frame */}
                <div className="border-4 border-slate-950 p-5 rounded-2xl print:border-2 print:border-slate-950 space-y-4">
                    
                    <PrintableFormHeader
                        formNumber="[Form 32]"
                        ruleSubtitle="(Prescribed under Rule 107 of M.P. Factories Rules 1962 / Section 87 Factories Act)"
                        title="Certificate of Fitness for Dangerous Operations"
                        certificateNo={formData.serialNumber}
                    />

                    {/* PART A: COUNTERFOIL (SURGEON RECORD) */}
                    <div className="border-2 border-emerald-950 p-4 rounded-xl bg-emerald-50/50 my-3 text-xs space-y-2">
                        <div className="flex justify-between items-center border-b-2 border-emerald-900 pb-1.5">
                            <span className="font-black text-emerald-950 uppercase tracking-wider text-xs">
                                PART A: COUNTERFOIL (To be retained by Certifying Surgeon)
                            </span>
                            <span className="font-mono font-black text-slate-900 text-xs">Date: {formData.date}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 pt-1 text-xs">
                            <p><span className="font-extrabold text-slate-700 uppercase text-[10px] block">1. Serial Number:</span> <span className="font-mono font-black text-emerald-950 text-xs">{formData.serialNumber}</span></p>
                            <p><span className="font-extrabold text-slate-700 uppercase text-[10px] block">2. Worker Name:</span> <span className="font-black text-slate-950 text-xs">{formData.workerName}</span></p>
                            <p><span className="font-extrabold text-slate-700 uppercase text-[10px] block">3. Father's Name:</span> <span className="font-bold text-slate-900">{formData.fatherName}</span></p>
                            <p><span className="font-extrabold text-slate-700 uppercase text-[10px] block">4. Sex / Gender:</span> <span className="font-bold text-slate-900">{formData.sex}</span></p>
                            <p className="col-span-2"><span className="font-extrabold text-slate-700 uppercase text-[10px] block">5. Factory Name & Address:</span> <span className="font-bold text-emerald-950">{formData.factoryName}</span></p>
                            <p className="col-span-2"><span className="font-extrabold text-slate-700 uppercase text-[10px] block">6. Process / Department:</span> <span className="font-bold text-slate-900">{formData.processOrDepartment}</span></p>
                        </div>

                        <div className="pt-1.5 border-t-2 border-emerald-300 flex justify-between items-center text-xs font-bold">
                            <span>Fitness Finding: <span className="font-black uppercase text-emerald-950 px-2 py-0.5 bg-emerald-200/80 rounded">{formData.fitnessStatus}</span></span>
                            <span>Surgeon Signature: <span className="font-black text-slate-950">{formData.certifyingSurgeonName}</span></span>
                        </div>
                    </div>

                    {/* Perforation Cut Line */}
                    <div className="relative flex items-center justify-center my-4">
                        <div className="border-t-2 border-dashed border-slate-400 w-full"></div>
                        <span className="absolute bg-white px-3 text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 rounded-full border border-slate-300">
                            <Scissors className="w-3.5 h-3.5" /> PERFORATION CUTTING LINE
                        </span>
                    </div>

                    {/* PART B: MAIN CERTIFICATE */}
                    <div className="border-2 border-slate-950 p-5 rounded-2xl space-y-4 text-xs text-justify leading-relaxed">
                        <div className="flex justify-between items-center border-b-2 border-slate-950 pb-2">
                            <h3 className="font-black uppercase tracking-widest text-xs text-slate-950">CERTIFICATE OF FITNESS</h3>
                            <span className="font-mono font-black text-emerald-950 text-xs px-2.5 py-0.5 bg-emerald-100 rounded-md">Serial No: {formData.serialNumber}</span>
                        </div>

                        <div className="text-xs leading-loose text-slate-950">
                            <p className="mb-2">
                                1. Certify that I have personally examined <span className="font-black text-xs px-1.5 text-slate-950 bg-slate-100 rounded">{formData.workerName}</span> son of <span className="font-black px-1.5 text-slate-950 bg-slate-100 rounded">{formData.fatherName}</span> residing at <span className="font-black px-1.5 text-slate-950 bg-slate-100 rounded">{formData.address}</span> who is desirous of being employed as <span className="font-black text-xs px-1.5 text-slate-950 bg-slate-100 rounded">{formData.designation}</span> in <span className="font-black uppercase text-emerald-950 px-1.5 bg-emerald-50 rounded">{formData.factoryName}</span> in department/process <span className="font-black px-1.5 text-slate-950 bg-slate-100 rounded">{formData.processOrDepartment}</span>.
                            </p>
                            <p>
                                And that as nearly as can be ascertained from my examination, is <span className="font-black text-xs uppercase text-emerald-950 px-2.5 py-0.5 bg-emerald-100/80 rounded-md border border-emerald-300">{formData.fitnessStatus}</span> for employment at the above noted factory.
                            </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-100/80 border-2 border-slate-300 space-y-0.5">
                            <p className="font-black text-slate-950 text-[11px] uppercase tracking-wider">2. Non-Hazardous Work Allowance:</p>
                            <p className="text-slate-900 font-bold text-xs">
                                {formData.nonHazardousOperationsAllowed || 'Fit for regular dangerous operations as specified.'}
                            </p>
                        </div>

                        <div className="font-bold text-xs pt-0.5">
                            3. Re-examination Period: Worker to be produced for further medical examination after a period of <span className="font-black text-xs px-1.5 bg-slate-100 rounded">{formData.reexaminationPeriodMonths} Months</span>.
                        </div>

                        {/* Signatures & Seal Block */}
                        <div className="pt-6 mt-4 border-t-2 border-slate-950 grid grid-cols-2 gap-8 items-end text-xs">
                            <div>
                                <div className="border-b-2 border-slate-950 pb-1 w-48 text-center font-black text-xs text-slate-950">
                                    {formData.workerName}
                                </div>
                                <p className="text-[10px] text-slate-800 font-black mt-1">Signature or L.T.I. of Person Examined</p>
                            </div>

                            <div className="text-right">
                                <div className="border-b-2 border-slate-950 pb-1 w-52 ml-auto text-center font-black text-xs text-emerald-950">
                                    {formData.certifyingSurgeonName}
                                </div>
                                <p className="text-[10px] text-slate-800 font-black mt-1 uppercase">Signature of Certifying Surgeon</p>
                                <p className="text-[10px] text-slate-700 font-bold mt-0.5">Place: {formData.place} | Date: {formData.date}</p>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};



