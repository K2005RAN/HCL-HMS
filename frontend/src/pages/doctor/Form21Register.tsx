import React, { useState, useEffect } from 'react';
import { PrintableFormHeader } from '../../components/ohs/PrintableFormHeader';
import { Table, Download, Search, Plus, Filter, FileSpreadsheet, Edit3, X, Save, CheckCircle2, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

export const Form21Register: React.FC = () => {
    const { token } = useAuth();
    const [records, setRecords] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Modal state for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
    const [selectedEmpId, setSelectedEmpId] = useState<string>('');

    // Modal Form State - 100% Editable
    const [modalData, setModalData] = useState<any>({
        srNo: '',
        workerEmpId: '',
        workerName: '',
        sex: 'Male',
        age: 35,
        dateOfEmploymentOnPresentWork: new Date().toISOString().split('T')[0],
        dateOfLeavingOrTransfer: '',
        reasonForLeavingOrTransfer: '',
        natureOfJobOrOccupation: 'Crusher Operator',
        rawMaterialOrByproductHandled: 'Limestone / Clinker / Cement Dust',
        resultOfMedicalExamination: 'Fit',
        suspensionDetailsReason: '',
        recertifiedFitDate: '',
        certificateOfUnfitnessIssued: false,
        medicalExamDate: new Date().toISOString().split('T')[0],
        certifyingSurgeonName: 'Dr ANIL RAPELLIWAR'
    });

    useEffect(() => {
        fetchRegisterData();
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/employees?limit=100`, {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            });
            const list = Array.isArray(res.data) ? res.data : (res.data?.employees || []);
            setEmployees(list);
        } catch (err) {
            console.error('Error fetching employees for Form 21', err);
        }
    };

    const fetchRegisterData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/ohs/form-21/register`, {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            });
            setRecords(res.data || []);
        } catch (err) {
            console.error('Error loading Form 21 health register', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeSelect = (empId: string) => {
        setSelectedEmpId(empId);
        const emp = employees.find((e) => e._id === empId);
        if (emp) {
            let ageVal = 35;
            if (emp.dob) {
                const birthYear = new Date(emp.dob).getFullYear();
                ageVal = new Date().getFullYear() - birthYear;
            }
            setModalData((prev: any) => ({
                ...prev,
                employeeId: emp._id,
                workerEmpId: emp.employeeId || prev.workerEmpId,
                workerName: emp.name || prev.workerName,
                sex: emp.gender || prev.sex,
                age: ageVal,
                natureOfJobOrOccupation: emp.designation || emp.department || prev.natureOfJobOrOccupation
            }));
        }
    };

    const openAddModal = () => {
        setEditingRecordId(null);
        setSelectedEmpId('');
        setModalData({
            srNo: records.length + 1,
            workerEmpId: '',
            workerName: '',
            sex: 'Male',
            age: 35,
            dateOfEmploymentOnPresentWork: new Date().toISOString().split('T')[0],
            dateOfLeavingOrTransfer: '',
            reasonForLeavingOrTransfer: '',
            natureOfJobOrOccupation: 'Crusher & Mill Operation',
            rawMaterialOrByproductHandled: 'Limestone / Cement Dust',
            resultOfMedicalExamination: 'Fit',
            suspensionDetailsReason: '',
            recertifiedFitDate: '',
            certificateOfUnfitnessIssued: false,
            medicalExamDate: new Date().toISOString().split('T')[0],
            certifyingSurgeonName: 'Dr ANIL RAPELLIWAR'
        });
        setIsModalOpen(true);
    };

    const openEditModal = (rec: any) => {
        setEditingRecordId(rec._id);
        setSelectedEmpId(rec.employeeId?._id || rec.employeeId || '');
        setModalData({
            srNo: rec.srNo,
            employeeId: rec.employeeId?._id || rec.employeeId,
            workerEmpId: rec.workerEmpId || '',
            workerName: rec.workerName || '',
            sex: rec.sex || 'Male',
            age: rec.age || 35,
            dateOfEmploymentOnPresentWork: rec.dateOfEmploymentOnPresentWork ? new Date(rec.dateOfEmploymentOnPresentWork).toISOString().split('T')[0] : '',
            dateOfLeavingOrTransfer: rec.dateOfLeavingOrTransfer ? new Date(rec.dateOfLeavingOrTransfer).toISOString().split('T')[0] : '',
            reasonForLeavingOrTransfer: rec.reasonForLeavingOrTransfer || '',
            natureOfJobOrOccupation: rec.natureOfJobOrOccupation || '',
            rawMaterialOrByproductHandled: rec.rawMaterialOrByproductHandled || '',
            resultOfMedicalExamination: rec.resultOfMedicalExamination || 'Fit',
            suspensionDetailsReason: rec.suspensionDetailsReason || '',
            recertifiedFitDate: rec.recertifiedFitDate ? new Date(rec.recertifiedFitDate).toISOString().split('T')[0] : '',
            certificateOfUnfitnessIssued: rec.certificateOfUnfitnessIssued || false,
            medicalExamDate: rec.medicalExamDate ? new Date(rec.medicalExamDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            certifyingSurgeonName: rec.certifyingSurgeonName || 'Dr ANIL RAPELLIWAR'
        });
        setIsModalOpen(true);
    };

    const handleSaveEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalData.workerName || !modalData.workerEmpId) {
            setMessage({ type: 'error', text: 'Worker Name and Worker Emp ID are required.' });
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...modalData,
                employeeId: modalData.employeeId || selectedEmpId || undefined
            };

            await axios.post(`${API_BASE_URL}/api/ohs/form-21`, payload, {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            });

            setMessage({ type: 'success', text: 'Form 21 Health Register entry saved successfully!' });
            setIsModalOpen(false);
            fetchRegisterData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save Form 21 entry' });
        } finally {
            setSaving(false);
        }
    };

    const filteredRecords = records.filter((rec) => {
        const matchesSearch = 
            rec.workerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rec.workerEmpId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rec.natureOfJobOrOccupation?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || rec.resultOfMedicalExamination === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const exportToCSV = () => {
        if (filteredRecords.length === 0) return;
        const headers = ['Sr No', 'Emp ID', 'Name', 'Sex', 'Age', 'Employment Date', 'Job Nature', 'Raw Material', 'Medical Exam Result', 'Suspension Details', 'Surgeon Signature Date'];
        const rows = filteredRecords.map((r) => [
            r.srNo,
            r.workerEmpId,
            r.workerName,
            r.sex,
            r.age,
            r.dateOfEmploymentOnPresentWork ? new Date(r.dateOfEmploymentOnPresentWork).toLocaleDateString() : '',
            r.natureOfJobOrOccupation,
            r.rawMaterialOrByproductHandled || 'Limestone/Cement',
            r.resultOfMedicalExamination,
            r.suspensionDetailsReason || 'None',
            new Date(r.medicalExamDate).toLocaleDateString(),
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Form_21_Health_Register_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 bg-slate-50/70 min-h-screen">
            
            {/* ========================================================================= */}
            {/* SCREEN INTERACTIVE REGISTER UI (HIDDEN DURING PRINT) */}
            {/* ========================================================================= */}
            <div className="print:hidden space-y-6">
                
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700">
                            <Table className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                Form ‘21’ — Statutory Health Register
                                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                                    Sec 87 Dangerous Operations
                                </span>
                            </h1>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Prescribed under Rule 19 & Rule 107 of M.P. Factories Rules 1962 / Factories Act 1948.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Entry
                        </button>
                        <button
                            type="button"
                            onClick={exportToCSV}
                            className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            Export CSV
                        </button>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Download className="w-4 h-4 text-emerald-400" />
                            Print A4 Register
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

                {/* Filter Controls Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                            type="text"
                            placeholder="Search Worker ID, Name, Occupation..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5 text-emerald-600" /> Filter Status:
                        </span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-xs font-bold border border-slate-300 rounded-xl p-2 bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="ALL">All Workers ({records.length})</option>
                            <option value="Fit">Fit Workers</option>
                            <option value="Unfit">Unfit Workers</option>
                            <option value="Suspended">Suspended Workers</option>
                        </select>
                    </div>
                </div>

                {/* REGISTER TABLE CARD */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="overflow-x-auto border border-slate-300 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-emerald-800 text-white font-black text-[10px] uppercase tracking-wider">
                                    <th className="p-2.5 border-b border-r border-emerald-700 text-center">Sr (1)</th>
                                    <th className="p-2.5 border-b border-r border-emerald-700">Emp ID (2)</th>
                                    <th className="p-2.5 border-b border-r border-emerald-700">Name (3)</th>
                                    <th className="p-2.5 border-b border-r border-emerald-700 text-center">Sex (4)</th>
                                    <th className="p-2.5 border-b border-r border-emerald-700 text-center">Age (5)</th>
                                    <th className="p-2.5 border-b border-r border-emerald-700">Present Work Date (6)</th>
                                    <th className="p-2.5 border-b border-r border-emerald-700">Job Nature (9)</th>
                                    <th className="p-2.5 border-b border-r border-emerald-700">Raw Material (10)</th>
                                    <th className="p-2.5 border-b border-r border-emerald-700">Exam Date & Result (11)</th>
                                    <th className="p-2.5 border-b border-r border-emerald-700">Suspension Details (12)</th>
                                    <th className="p-2.5 border-b text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={11} className="p-8 text-center text-slate-500 font-bold">
                                            Loading Form 21 Health Register entries...
                                        </td>
                                    </tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="p-8 text-center text-slate-500 font-bold">
                                            No health register entries recorded yet. Click "Add New Entry" to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((r) => (
                                        <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-2.5 border-r text-center font-black text-slate-600">{r.srNo}</td>
                                            <td className="p-2.5 border-r font-mono text-emerald-800 font-black">{r.workerEmpId}</td>
                                            <td className="p-2.5 border-r font-black text-slate-900">{r.workerName}</td>
                                            <td className="p-2.5 border-r text-center">{r.sex}</td>
                                            <td className="p-2.5 border-r text-center">{r.age}</td>
                                            <td className="p-2.5 border-r">{r.dateOfEmploymentOnPresentWork ? new Date(r.dateOfEmploymentOnPresentWork).toLocaleDateString() : 'N/A'}</td>
                                            <td className="p-2.5 border-r font-bold text-slate-800">{r.natureOfJobOrOccupation}</td>
                                            <td className="p-2.5 border-r">{r.rawMaterialOrByproductHandled || 'Limestone / Clinker'}</td>
                                            <td className="p-2.5 border-r">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                                    r.resultOfMedicalExamination === 'Fit' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                                                    r.resultOfMedicalExamination === 'Suspended' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-rose-100 text-rose-900 border border-rose-200'
                                                }`}>
                                                    {new Date(r.medicalExamDate).toLocaleDateString()} - {r.resultOfMedicalExamination}
                                                </span>
                                            </td>
                                            <td className="p-2.5 border-r text-rose-700 font-bold">{r.suspensionDetailsReason || 'Nil'}</td>
                                            <td className="p-2.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(r)}
                                                    className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* DEDICATED STUNNING A4 LANDSCAPE PRINT DOCUMENT (ONLY VISIBLE ON PRINT) */}
            {/* ========================================================================= */}
            <div className="hidden print:block w-full max-w-full box-border bg-white text-slate-950 p-1 mx-auto font-sans leading-snug print-page-a4">
                
                {/* Official Outer Document Border Frame */}
                <div className="border-4 border-slate-950 p-4 rounded-2xl print:border-2 print:border-slate-950 space-y-3">

                    <PrintableFormHeader
                        formNumber="Form – ‘21’"
                        ruleSubtitle="(The Factories Act.1948 / M.P. Factories Rules 1962 / Prescribed Under Rule – 19 & 107)"
                        title="Health Register in Respect of Persons Employed in Dangerous Operations (Sec 87)"
                    />

                    {/* Surgeon Panel Header */}
                    <div className="border-2 border-emerald-950 p-3 rounded-xl bg-emerald-50/50 mb-3 text-[10px] grid grid-cols-3 gap-3">
                        <div>
                            <span className="font-black text-emerald-950 block uppercase">Certifying Surgeons:</span>
                            <p className="font-bold text-slate-900">Dr ANIL RAPELLIWAR | Dr GAURAV KUMAR | Dr RUCHI DEWANGAN</p>
                        </div>
                        <div>
                            <span className="font-black text-emerald-950 block uppercase">Plant / Unit Location:</span>
                            <p className="font-bold text-slate-900">HeidelbergCement India Ltd. (Unit Damoh)</p>
                        </div>
                        <div>
                            <span className="font-black text-emerald-950 block uppercase">Operations & Process:</span>
                            <p className="font-bold text-slate-900">Diamond Pathariya Lime Stone Mines / Crusher & Cement Plant</p>
                        </div>
                    </div>

                    {/* 15 Column Statutory Table */}
                    <table className="w-full text-left border-collapse border-2 border-slate-950 text-[10px]">
                        <thead>
                            <tr className="bg-slate-950 text-white font-black uppercase text-[9px]">
                                <th className="p-2 border-b border-r border-slate-700 text-center">Sr (1)</th>
                                <th className="p-2 border-b border-r border-slate-700">Emp ID (2)</th>
                                <th className="p-2 border-b border-r border-slate-700">Name (3)</th>
                                <th className="p-2 border-b border-r border-slate-700 text-center">Sex (4)</th>
                                <th className="p-2 border-b border-r border-slate-700 text-center">Age (5)</th>
                                <th className="p-2 border-b border-r border-slate-700">Present Work Date (6)</th>
                                <th className="p-2 border-b border-r border-slate-700">Leaving/ Transfer Date (7)</th>
                                <th className="p-2 border-b border-r border-slate-700">Reason (8)</th>
                                <th className="p-2 border-b border-r border-slate-700">Job Nature (9)</th>
                                <th className="p-2 border-b border-r border-slate-700">Raw Material (10)</th>
                                <th className="p-2 border-b border-r border-slate-700">Exam Date & Result (11)</th>
                                <th className="p-2 border-b border-r border-slate-700">Suspension Period (12)</th>
                                <th className="p-2 border-b border-r border-slate-700">Recertified Date (13)</th>
                                <th className="p-2 border-b border-r border-slate-700 text-center">Unfitness Cert (14)</th>
                                <th className="p-2 border-b text-center">Surgeon Signature (15)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 font-semibold">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={15} className="p-4 text-center text-slate-500 italic">No health register records available.</td>
                                </tr>
                            ) : (
                                records.map((r, index) => (
                                    <tr key={r._id} className="hover:bg-slate-50 border-b border-slate-300">
                                        <td className="p-2 border-r text-center font-bold text-slate-900">{index + 1}</td>
                                        <td className="p-2 border-r font-mono font-bold text-slate-900">{r.employeeId}</td>
                                        <td className="p-2 border-r font-black text-slate-950">{r.workerName}</td>
                                        <td className="p-2 border-r text-center">{r.sex}</td>
                                        <td className="p-2 border-r text-center">{r.age}</td>
                                        <td className="p-2 border-r">{r.dateOfEmploymentPresentWork ? new Date(r.dateOfEmploymentPresentWork).toLocaleDateString() : '---'}</td>
                                        <td className="p-2 border-r">{r.dateOfLeavingOrTransfer ? new Date(r.dateOfLeavingOrTransfer).toLocaleDateString() : '---'}</td>
                                        <td className="p-2 border-r">{r.reasonForLeavingOrTransfer || 'Nil'}</td>
                                        <td className="p-2 border-r font-bold text-emerald-950">{r.natureOfJobOrJobCode}</td>
                                        <td className="p-2 border-r">{r.rawMaterialOrByProductHandled}</td>
                                        <td className="p-2 border-r">
                                            <span className="font-bold">{r.medicalExaminationDate ? new Date(r.medicalExaminationDate).toLocaleDateString() : '---'}</span>
                                            <span className={`block font-black uppercase text-[9px] ${r.fitnessStatus === 'Fit' ? 'text-emerald-800' : 'text-rose-800'}`}>
                                                Result: {r.fitnessStatus}
                                            </span>
                                        </td>
                                        <td className="p-2 border-r font-bold text-rose-700">{r.suspensionDetailsReason || 'Nil'}</td>
                                        <td className="p-2 border-r">{r.recertifiedFitDate ? new Date(r.recertifiedFitDate).toLocaleDateString() : '---'}</td>
                                        <td className="p-2 border-r text-center">{r.certificateOfUnfitnessIssued ? 'Yes' : 'No'}</td>
                                        <td className="p-2 text-center font-bold text-slate-900">Signed</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="pt-4 mt-4 border-t-2 border-slate-950 flex justify-between items-end text-xs">
                        <p className="text-[10px] text-slate-700 font-bold">Generated from Occupational Health Management System (OHMS)</p>
                        <div className="text-right">
                            <div className="border-b-2 border-slate-950 pb-1 w-48 ml-auto text-center font-black text-slate-950">
                                Dr ANIL RAPELLIWAR
                            </div>
                            <p className="text-[10px] font-bold text-slate-800 uppercase mt-0.5">Signature of Certifying Surgeon</p>
                        </div>
                    </div>

                </div>

            </div>

            {/* ADD / EDIT HEALTH REGISTER ENTRY MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-emerald-600" />
                                {editingRecordId ? 'Edit Form 21 Entry' : 'Add New Form 21 Entry'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Quick Auto-Fetch Picker */}
                        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-2">
                            <label className="block text-xs font-bold uppercase text-emerald-900">Auto-Fetch Employee Details (Optional)</label>
                            <select
                                value={selectedEmpId}
                                onChange={(e) => handleEmployeeSelect(e.target.value)}
                                className="w-full p-2 text-xs font-bold border rounded-lg bg-white"
                            >
                                <option value="">-- Choose Employee to Auto-Fill --</option>
                                {employees.map((emp) => (
                                    <option key={emp._id} value={emp._id}>
                                        {emp.name} ({emp.employeeId}) - {emp.department}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <form onSubmit={handleSaveEntry} className="space-y-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Sr No (Column 1)</label>
                                    <input
                                        type="number"
                                        value={modalData.srNo}
                                        onChange={(e) => setModalData({ ...modalData, srNo: Number(e.target.value) })}
                                        className="w-full p-2 border rounded-lg font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Emp ID / Ticket (Column 2)</label>
                                    <input
                                        type="text"
                                        value={modalData.workerEmpId}
                                        onChange={(e) => setModalData({ ...modalData, workerEmpId: e.target.value })}
                                        className="w-full p-2 border rounded-lg font-mono font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Worker Name (Column 3)</label>
                                    <input
                                        type="text"
                                        value={modalData.workerName}
                                        onChange={(e) => setModalData({ ...modalData, workerName: e.target.value })}
                                        className="w-full p-2 border rounded-lg font-bold text-slate-900"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Sex (Column 4)</label>
                                    <select
                                        value={modalData.sex}
                                        onChange={(e) => setModalData({ ...modalData, sex: e.target.value })}
                                        className="w-full p-2 border rounded-lg font-semibold"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Age (Column 5)</label>
                                    <input
                                        type="number"
                                        value={modalData.age}
                                        onChange={(e) => setModalData({ ...modalData, age: Number(e.target.value) })}
                                        className="w-full p-2 border rounded-lg font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Present Work Date (Column 6)</label>
                                    <input
                                        type="date"
                                        value={modalData.dateOfEmploymentOnPresentWork}
                                        onChange={(e) => setModalData({ ...modalData, dateOfEmploymentOnPresentWork: e.target.value })}
                                        className="w-full p-2 border rounded-lg font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Nature of Job / Occupation (Column 9)</label>
                                    <input
                                        type="text"
                                        value={modalData.natureOfJobOrOccupation}
                                        onChange={(e) => setModalData({ ...modalData, natureOfJobOrOccupation: e.target.value })}
                                        className="w-full p-2 border rounded-lg font-semibold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Raw Material / Byproduct (Column 10)</label>
                                    <input
                                        type="text"
                                        value={modalData.rawMaterialOrByproductHandled}
                                        onChange={(e) => setModalData({ ...modalData, rawMaterialOrByproductHandled: e.target.value })}
                                        className="w-full p-2 border rounded-lg font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Medical Exam Result (Column 11)</label>
                                    <select
                                        value={modalData.resultOfMedicalExamination}
                                        onChange={(e) => setModalData({ ...modalData, resultOfMedicalExamination: e.target.value })}
                                        className="w-full p-2 border rounded-lg font-bold"
                                    >
                                        <option value="Fit">Fit</option>
                                        <option value="Unfit">Unfit</option>
                                        <option value="Suspended">Suspended</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Medical Exam Date</label>
                                    <input
                                        type="date"
                                        value={modalData.medicalExamDate}
                                        onChange={(e) => setModalData({ ...modalData, medicalExamDate: e.target.value })}
                                        className="w-full p-2 border rounded-lg font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Certifying Surgeon</label>
                                    <input
                                        type="text"
                                        value={modalData.certifyingSurgeonName}
                                        onChange={(e) => setModalData({ ...modalData, certifyingSurgeonName: e.target.value })}
                                        className="w-full p-2 border rounded-lg font-bold text-emerald-900"
                                    />
                                </div>
                            </div>

                            {modalData.resultOfMedicalExamination === 'Suspended' || modalData.resultOfMedicalExamination === 'Unfit' ? (
                                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                                    <label className="block font-bold text-rose-900 mb-1">Suspension Details / Reason (Column 12)</label>
                                    <input
                                        type="text"
                                        value={modalData.suspensionDetailsReason}
                                        onChange={(e) => setModalData({ ...modalData, suspensionDetailsReason: e.target.value })}
                                        placeholder="State cause of suspension or unfitness..."
                                        className="w-full p-2 border rounded-lg font-semibold bg-white"
                                    />
                                </div>
                            ) : null}

                            <div className="flex justify-end gap-3 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Save Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
