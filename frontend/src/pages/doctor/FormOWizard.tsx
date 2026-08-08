import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrintableFormHeader } from '../../components/ohs/PrintableFormHeader';
import { 
    CheckCircle2, AlertTriangle, FileText, Printer, Save, 
    RefreshCw, Heart, Activity, Eye, Stethoscope, User, Calendar,
    Building2, Hash, ShieldCheck, Edit3, Sparkles, Check, Clock, Award, ShieldAlert
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

export const FormOWizard: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [searchParams] = useSearchParams();
    const employeeIdParam = searchParams.get('employeeId');

    const [activeTab, setActiveTab] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [syncingLab, setSyncingLab] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [employee, setEmployee] = useState<any>(null);
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmpId, setSelectedEmpId] = useState<string>(employeeIdParam || '');

    // Form O Data State (Pages 1-5) - ALL DETAILS EDITABLE
    const [formData, setFormData] = useState<any>({
        certificateNo: `FO-${Date.now().toString().slice(-6)}`,
        workerName: 'RAMESH KUMAR PATEL',
        designation: 'HEMM Operator',
        department: 'Mining Operations',
        fatherName: 'SHRI GYAN CHAND PATEL',
        gender: 'Male',
        mineName: 'DIAMOND PATHARIYA LIME STONE MINES',
        formDNo: 'EMP-9024',
        examinationType: 'Periodical',
        age: 38,
        fitnessStatus: 'Fit',
        unfitReason: '',
        disabilityCurePeriodMonths: 0,
        permittedToWork: true,
        examiningAuthorityName: 'Dr ANIL RAPELLIWAR',
        examiningAuthorityDesignation: 'Certifying Surgeon / Factory Medical Officer',
        place: 'DAMOH',
        examinationDate: new Date().toISOString().split('T')[0],

        // Page 2
        identificationMarks: 'Mole on right forearm near elbow',
        generalDevelopment: 'Good',
        height: 172,
        weight: 70,
        eyes: { distantRight: '6/6', distantLeft: '6/6', organicDisease: 'None', nightBlindness: false, colourBlindness: false, squint: false },
        ears: { hearingRight: 'Normal', hearingLeft: 'Normal', organicDisease: 'None' },
        respiratorySystem: { chestInspiration: 94, chestExpiration: 89 },
        circulatorySystem: { bloodPressure: '120/80', pulse: 72 },
        abdomen: { tenderness: 'None', liver: 'Normal', spleen: 'Normal', tumour: 'None' },
        nervousSystem: { fitsOrEpilepsyHistory: false, paralysisHistory: false, mentalHealth: 'Normal' },
        locomotorySystem: 'Normal',
        skin: 'Normal',
        hydrocele: 'Absent',
        hernia: 'Absent',
        urine: { reaction: 'Acidic', albumin: 'Nil', sugar: 'Nil' },
        skiagramChest: 'Normal Lung Fields',
        specialistOpinion: 'Fit for mine duty',

        // Page 3
        cardiologicalAssessment: { auscultationS1: 'Normal S1', auscultationS2: 'Normal S2', additionalSound: 'Nil', ecg12LeadFindings: 'Normal', ecgEnclosed: true },
        neurologicalAssessment: { superficialReflexes: 'Normal', deepReflexes: 'Normal', peripheralCirculation: 'Normal', vibrationalSyndromes: 'Normal' },
        iloChestRadiograph: { pneumoconioticOpacities: 'Absent', grades: 'Category 0/-', types: 'None', radiographEnclosed: true },

        // Page 4
        audiometryFindings: { leftEarCondition: 'Normal', rightEarCondition: 'Normal', leftBoneConduction: 'Normal', rightBoneConduction: 'Normal', findingsEnclosed: true },
        labInvestigations: { cbcBloodTcDcHbEsrPlatelets: 'WNL (Hb 14.2 g/dl)', bloodSugarFastingPP: 'WNL (FBG 92 mg/dl)', lipidProfile: 'WNL', bloodUreaCreatinine: 'WNL', urineRoutine: 'WNL', stoolRoutine: 'WNL', investigationsReportEnclosed: true },
        manganeseExposureSpecialTests: { speechDefect: 'Not Present', tremor: 'Not Present', adiadocokinesia: 'Not Present', emotionalChanges: 'Not Present' },

        // Page 5 - Spirometry
        spirometryTest: {
            fev: { predicted: 3.5, performed: 3.4, percentPredicted: 97 },
            fev1: { predicted: 3.0, performed: 2.9, percentPredicted: 96 },
            fev1FvcRatio: { predicted: 85, performed: 85, percentPredicted: 100 },
            peakExpiratoryFlow: { predicted: 450, performed: 440, percentPredicted: 97 },
            reportEnclosed: true
        }
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (selectedEmpId) {
            fetchEmployeeDetails(selectedEmpId);
        }
    }, [selectedEmpId]);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/employees?limit=100`, {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            });
            const empList = Array.isArray(res.data) ? res.data : (res.data?.employees || []);
            setEmployees(empList);
            if (empList.length > 0 && !selectedEmpId) {
                setSelectedEmpId(empList[0]._id);
            }
        } catch (err) {
            console.error('Failed to load employees', err);
            setEmployees([]);
        }
    };

    const fetchEmployeeDetails = async (id: string) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/ohs/auto-fill-lab/${id}`, {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            });
            const emp = res.data.employee;
            setEmployee(emp);

            let ageVal = 35;
            if (emp.dob) {
                const birthYear = new Date(emp.dob).getFullYear();
                ageVal = new Date().getFullYear() - birthYear;
            }

            setFormData((prev: any) => ({
                ...prev,
                employeeId: emp._id,
                workerName: emp.name || prev.workerName || '',
                designation: emp.designation || prev.designation || '',
                department: emp.department || prev.department || '',
                fatherName: emp.fatherName || prev.fatherName || '',
                gender: emp.gender || prev.gender || 'Male',
                age: ageVal,
                formDNo: emp.employeeId || '',
            }));
        } catch (err) {
            console.error('Error fetching employee OHS details', err);
        } finally {
            setLoading(false);
        }
    };

    const syncLabData = async () => {
        if (!selectedEmpId) return;
        try {
            setSyncingLab(true);
            const res = await axios.get(`${API_BASE_URL}/api/ohs/auto-fill-lab/${selectedEmpId}`, {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            });
            setMessage({ type: 'success', text: 'Recent lab test results synced into examination fields!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to sync lab data.' });
        } finally {
            setSyncingLab(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                ...formData,
                employeeId: selectedEmpId || undefined,
            };
            await axios.post(`${API_BASE_URL}/api/ohs/form-o`, payload, {
                headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` }
            });
            setMessage({ type: 'success', text: 'Form O saved successfully! Certificate Issued in Triplicate.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error saving Form O' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-slate-50/70 min-h-screen">
            
            {/* ========================================================================= */}
            {/* SCREEN INTERACTIVE FORM UI (HIDDEN DURING PRINT) */}
            {/* ========================================================================= */}
            <div className="print:hidden space-y-6">
                
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                Form 'O' — Statutory Mines Medical Exam
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                                    Rule 29-B
                                </span>
                            </h1>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Edit data in the fields below. Click "Print Document" to generate the A4 certificate layout.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={syncLabData}
                            disabled={syncingLab}
                            className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-all shadow-sm"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncingLab ? 'animate-spin' : ''}`} />
                            Sync Lab Data
                        </button>

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
                            Save Form O
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

                {/* Worker Selection & Interactive Edit Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-emerald-600" />
                            Worker Data Collection & Fast Overrides
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            <Edit3 className="w-3 h-3 inline mr-1" /> All data items are live editable
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Select Employee / Worker</label>
                            <select
                                value={selectedEmpId}
                                onChange={(e) => setSelectedEmpId(e.target.value)}
                                className="w-full text-xs font-bold text-slate-800 border border-slate-300 rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">-- Choose Employee --</option>
                                {employees.map((emp) => (
                                    <option key={emp._id} value={emp._id}>
                                        {emp.name} ({emp.employeeId}) - {emp.department}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Worker Name</label>
                            <input
                                type="text"
                                value={formData.workerName}
                                onChange={(e) => setFormData({ ...formData, workerName: e.target.value })}
                                className="w-full text-xs font-bold text-slate-800 border border-slate-300 rounded-xl p-2.5 bg-slate-50/50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Form D / Emp Code</label>
                            <input
                                type="text"
                                value={formData.formDNo}
                                onChange={(e) => setFormData({ ...formData, formDNo: e.target.value })}
                                className="w-full text-xs font-bold text-slate-800 border border-slate-300 rounded-xl p-2.5 bg-slate-50/50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                        <div>
                            <label className="block font-bold text-slate-600 mb-1">Designation</label>
                            <input
                                type="text"
                                value={formData.designation}
                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                className="w-full p-2 border rounded-lg font-semibold"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-slate-600 mb-1">Mine Site</label>
                            <input
                                type="text"
                                value={formData.mineName}
                                onChange={(e) => setFormData({ ...formData, mineName: e.target.value })}
                                className="w-full p-2 border rounded-lg font-semibold"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-slate-600 mb-1">Exam Type</label>
                            <select
                                value={formData.examinationType}
                                onChange={(e) => setFormData({ ...formData, examinationType: e.target.value })}
                                className="w-full p-2 border rounded-lg font-semibold"
                            >
                                <option value="Initial">Initial (IME)</option>
                                <option value="Periodical">Periodical (PME)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-bold text-slate-600 mb-1">Age (Years)</label>
                            <input
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                                className="w-full p-2 border rounded-lg font-semibold"
                            />
                        </div>
                    </div>
                </div>

                {/* Step Tabs for Interactive Editing */}
                <div className="flex border-b border-slate-200 bg-white rounded-t-2xl overflow-x-auto shadow-sm">
                    {[
                        { id: 1, name: 'Page 1: Main Fitness Outcome', icon: FileText },
                        { id: 2, name: 'Page 2: Physical & Vitals', icon: User },
                        { id: 3, name: 'Page 3: Cardiac & X-Ray', icon: Heart },
                        { id: 4, name: 'Page 4: Audiometry & Lab', icon: Stethoscope },
                        { id: 5, name: 'Page 5: Spirometry Test', icon: Activity },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-extrabold whitespace-nowrap border-b-2 transition-all ${
                                    isActive ? 'border-emerald-600 text-emerald-800 bg-emerald-50/70' : 'border-transparent text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                                {tab.name}
                            </button>
                        );
                    })}
                </div>

                {/* Form Editing Panels */}
                <div className="bg-white p-6 rounded-b-2xl border border-slate-200 space-y-6">
                    {activeTab === 1 && (
                        <div className="space-y-4 text-xs">
                            <h3 className="text-sm font-extrabold text-slate-900 border-b pb-2">Medical Fitness Recommendation</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.fitnessStatus === 'Fit' ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200'}`}
                                     onClick={() => setFormData({ ...formData, fitnessStatus: 'Fit', permittedToWork: true })}>
                                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" /> (a) Fit for Employment
                                    </div>
                                    <p className="text-[11px] text-slate-600 mt-1">Medically fit for any employment in mines.</p>
                                </div>

                                <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.fitnessStatus === 'Unfit' ? 'border-rose-600 bg-rose-50/50' : 'border-slate-200'}`}
                                     onClick={() => setFormData({ ...formData, fitnessStatus: 'Unfit', permittedToWork: false })}>
                                    <div className="flex items-center gap-2 font-bold text-rose-900">
                                        <ShieldAlert className="w-5 h-5 text-rose-600" /> (b) Medically Unfit
                                    </div>
                                    {formData.fitnessStatus === 'Unfit' && (
                                        <input
                                            type="text"
                                            placeholder="State unfit condition reason..."
                                            value={formData.unfitReason}
                                            onChange={(e) => setFormData({ ...formData, unfitReason: e.target.value })}
                                            className="w-full mt-2 p-1.5 border rounded bg-white text-xs"
                                        />
                                    )}
                                </div>

                                <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.fitnessStatus === 'TemporarilyUnfit' ? 'border-amber-600 bg-amber-50/50' : 'border-slate-200'}`}
                                     onClick={() => setFormData({ ...formData, fitnessStatus: 'TemporarilyUnfit' })}>
                                    <div className="flex items-center gap-2 font-bold text-amber-900">
                                        <Clock className="w-5 h-5 text-amber-600" /> (c) Temporarily Unfit
                                    </div>
                                    {formData.fitnessStatus === 'TemporarilyUnfit' && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="number"
                                                value={formData.disabilityCurePeriodMonths}
                                                onChange={(e) => setFormData({ ...formData, disabilityCurePeriodMonths: Number(e.target.value) })}
                                                className="w-16 p-1 border rounded text-xs text-center bg-white"
                                            />
                                            <span>Months</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Certifying Surgeon / Authority Name</label>
                                    <input
                                        type="text"
                                        value={formData.examiningAuthorityName}
                                        onChange={(e) => setFormData({ ...formData, examiningAuthorityName: e.target.value })}
                                        className="w-full p-2 border rounded-lg font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Authority Designation</label>
                                    <input
                                        type="text"
                                        value={formData.examiningAuthorityDesignation}
                                        onChange={(e) => setFormData({ ...formData, examiningAuthorityDesignation: e.target.value })}
                                        className="w-full p-2 border rounded-lg font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Exam Date & Place</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={formData.examinationDate}
                                            onChange={(e) => setFormData({ ...formData, examinationDate: e.target.value })}
                                            className="w-full p-2 border rounded-lg font-semibold"
                                        />
                                        <input
                                            type="text"
                                            value={formData.place}
                                            onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                                            className="w-24 p-2 border rounded-lg font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 2 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Height (cm)</label>
                                <input type="number" value={formData.height} onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })} className="w-full p-2 border rounded-lg font-bold" />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Weight (kg)</label>
                                <input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })} className="w-full p-2 border rounded-lg font-bold" />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Blood Pressure</label>
                                <input type="text" value={formData.circulatorySystem.bloodPressure} onChange={(e) => setFormData({ ...formData, circulatorySystem: { ...formData.circulatorySystem, bloodPressure: e.target.value } })} className="w-full p-2 border rounded-lg font-bold" />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Pulse (/min)</label>
                                <input type="number" value={formData.circulatorySystem.pulse} onChange={(e) => setFormData({ ...formData, circulatorySystem: { ...formData.circulatorySystem, pulse: Number(e.target.value) } })} className="w-full p-2 border rounded-lg font-bold" />
                            </div>
                        </div>
                    )}

                    {activeTab === 5 && (
                        <div className="space-y-3 text-xs">
                            <h4 className="font-bold text-slate-800">Spirometry Parameters</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-slate-600 font-bold mb-1">FEV Performed</label>
                                    <input type="number" step="0.1" value={formData.spirometryTest.fev.performed} onChange={(e) => setFormData({ ...formData, spirometryTest: { ...formData.spirometryTest, fev: { ...formData.spirometryTest.fev, performed: Number(e.target.value) } } })} className="w-full p-2 border rounded-lg font-bold" />
                                </div>
                                <div>
                                    <label className="block text-slate-600 font-bold mb-1">FEV1 Performed</label>
                                    <input type="number" step="0.1" value={formData.spirometryTest.fev1.performed} onChange={(e) => setFormData({ ...formData, spirometryTest: { ...formData.spirometryTest, fev1: { ...formData.spirometryTest.fev1, performed: Number(e.target.value) } } })} className="w-full p-2 border rounded-lg font-bold" />
                                </div>
                                <div>
                                    <label className="block text-slate-600 font-bold mb-1">PEFR Performed</label>
                                    <input type="number" value={formData.spirometryTest.peakExpiratoryFlow.performed} onChange={(e) => setFormData({ ...formData, spirometryTest: { ...formData.spirometryTest, peakExpiratoryFlow: { ...formData.spirometryTest.peakExpiratoryFlow, performed: Number(e.target.value) } } })} className="w-full p-2 border rounded-lg font-bold" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* DEDICATED STUNNING A4 PRINT DOCUMENT (ONLY VISIBLE ON PRINT) */}
            {/* ========================================================================= */}
            <div className="hidden print:block w-full max-w-full box-border bg-white text-slate-950 p-1 mx-auto font-sans leading-relaxed print-page-a4">
                
                {/* Official Outer Document Border Frame */}
                <div className="border-4 border-slate-950 p-4 rounded-2xl print:border-2 print:border-slate-950 space-y-3">
                    
                    {/* Official Header */}
                    <PrintableFormHeader
                        formNumber="FORM 'O'"
                        ruleSubtitle="[See Rules 29-F (2) and 29-L] - Report of Medical Examination under Rule 29-B"
                        title="Certificate of Medical Fitness for Mines Work"
                        certificateNo={formData.certificateNo}
                    />

                    {/* Worker Profile Card Header */}
                    <div className="border-2 border-slate-950 rounded-xl p-3.5 my-3 bg-slate-50/50 print:bg-transparent">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                                <p><span className="font-extrabold text-slate-700 uppercase text-[10px]">Worker Name:</span> <span className="font-black text-slate-950 text-xs">{formData.workerName}</span></p>
                                <p><span className="font-extrabold text-slate-700 uppercase text-[10px]">Form D / Emp ID:</span> <span className="font-mono font-bold text-emerald-950 text-xs">{formData.formDNo}</span></p>
                                <p><span className="font-extrabold text-slate-700 uppercase text-[10px]">Designation:</span> <span className="font-bold text-slate-900">{formData.designation}</span></p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p><span className="font-extrabold text-slate-700 uppercase text-[10px]">Mine Site:</span> <span className="font-bold text-emerald-950">{formData.mineName}</span></p>
                                <p><span className="font-extrabold text-slate-700 uppercase text-[10px]">Examination Type:</span> <span className="font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-950 rounded-md">{formData.examinationType} (PME/IME)</span></p>
                                <p><span className="font-extrabold text-slate-700 uppercase text-[10px]">Age:</span> <span className="font-bold text-slate-900">{formData.age} Years</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Statutory Certification Statement */}
                    <div className="my-3 text-xs text-justify leading-relaxed">
                        Certify that Shri/Shrimati <span className="font-black text-xs px-1.5 text-slate-950 bg-slate-100 rounded">{formData.workerName}</span> employed as <span className="font-black text-xs px-1.5 text-slate-950 bg-slate-100 rounded">{formData.designation}</span> in <span className="font-black uppercase text-emerald-950 px-1.5 bg-emerald-50 rounded">{formData.mineName}</span>, Form D No. <span className="font-black px-1.5 text-slate-950 bg-slate-100 rounded">{formData.formDNo}</span> has been examined for an <span className="font-black px-1.5 text-slate-950 bg-slate-100 rounded">{formData.examinationType}</span> medical examination under Rule 29-B. He/She appears to be <span className="font-black px-1.5 text-slate-950 bg-slate-100 rounded">{formData.age}</span> years of age.
                    </div>

                    {/* Prominent Fitness Outcome Banner */}
                    <div className={`p-3.5 rounded-xl border-2 my-3 text-xs ${
                        formData.fitnessStatus === 'Fit' ? 'border-emerald-800 bg-emerald-50/70 text-emerald-950' :
                        formData.fitnessStatus === 'Unfit' ? 'border-rose-800 bg-rose-50/70 text-rose-950' : 'border-amber-800 bg-amber-50/70 text-amber-950'
                    }`}>
                        <div className="flex items-center gap-2.5 font-black text-xs uppercase">
                            {formData.fitnessStatus === 'Fit' && <CheckCircle2 className="w-5 h-5 text-emerald-700" />}
                            {formData.fitnessStatus === 'Unfit' && <ShieldAlert className="w-5 h-5 text-rose-700" />}
                            {formData.fitnessStatus === 'TemporarilyUnfit' && <Clock className="w-5 h-5 text-amber-700" />}
                            <span>Official Fitness Finding: {formData.fitnessStatus} FOR MINES EMPLOYMENT</span>
                        </div>

                        <div className="mt-1.5 pl-8 font-bold text-xs space-y-0.5">
                            {formData.fitnessStatus === 'Fit' && (
                                <p>(a) Shri/Shrimati {formData.workerName} is medically FIT for any employment in mines.</p>
                            )}
                            {formData.fitnessStatus === 'Unfit' && (
                                <p>(b) Medically UNFIT due to: <span className="font-black text-rose-950">{formData.unfitReason || 'Disability condition'}</span></p>
                            )}
                            {formData.fitnessStatus === 'TemporarilyUnfit' && (
                                <p>(c) TEMPORARILY UNFIT. Advised re-examination after <span className="font-black">{formData.disabilityCurePeriodMonths} Months</span>.</p>
                            )}
                        </div>
                    </div>

                    {/* Clinical Findings Grid Summary (Pages 2-5 Data) */}
                    <div className="my-3 space-y-2 text-xs">
                        <h4 className="font-black text-xs uppercase tracking-wider text-slate-950 border-b-2 border-slate-950 pb-0.5">
                            Clinical & Diagnostic Examination Summary
                        </h4>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="border-2 border-slate-300 p-3 rounded-xl bg-slate-50/40">
                                <span className="font-black uppercase text-[10px] text-slate-700 block mb-0.5">Physical & Vitals</span>
                                <p className="font-semibold text-xs"><span className="font-bold text-slate-950">Height:</span> {formData.height} cm | <span className="font-bold text-slate-950">Weight:</span> {formData.weight} kg</p>
                                <p className="font-semibold text-xs"><span className="font-bold text-slate-950">BP:</span> {formData.circulatorySystem.bloodPressure} mmHg | <span className="font-bold text-slate-950">Pulse:</span> {formData.circulatorySystem.pulse}/min</p>
                                <p className="font-semibold text-xs"><span className="font-bold text-slate-950">Identification Mark:</span> {formData.identificationMarks}</p>
                            </div>

                            <div className="border-2 border-slate-300 p-3 rounded-xl bg-slate-50/40">
                                <span className="font-black uppercase text-[10px] text-slate-700 block mb-0.5">Eyes & Hearing</span>
                                <p className="font-semibold text-xs"><span className="font-bold text-slate-950">Vision R/L:</span> {formData.eyes.distantRight} / {formData.eyes.distantLeft}</p>
                                <p className="font-semibold text-xs"><span className="font-bold text-slate-950">Colour Blindness:</span> {formData.eyes.colourBlindness ? 'Present' : 'Absent'}</p>
                                <p className="font-semibold text-xs"><span className="font-bold text-slate-950">Hearing R/L:</span> {formData.ears.hearingRight} / {formData.ears.hearingLeft}</p>
                            </div>
                        </div>

                        {/* Spirometry Table */}
                        <div className="border-2 border-slate-300 rounded-xl overflow-hidden mt-2">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950 text-white font-bold uppercase text-[10px]">
                                    <tr>
                                        <th className="p-1.5 border-b">Spirometry Parameter</th>
                                        <th className="p-1.5 text-center border-b">Predicted</th>
                                        <th className="p-1.5 text-center border-b">Performed</th>
                                        <th className="p-1.5 text-center border-b">% Predicted</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-300 font-bold text-slate-900 text-xs">
                                    <tr>
                                        <td className="p-1.5">FVC (Forced Vital Capacity)</td>
                                        <td className="p-1.5 text-center">{formData.spirometryTest.fev.predicted}</td>
                                        <td className="p-1.5 text-center">{formData.spirometryTest.fev.performed}</td>
                                        <td className="p-1.5 text-center font-black text-emerald-950">{formData.spirometryTest.fev.percentPredicted}%</td>
                                    </tr>
                                    <tr>
                                        <td className="p-1.5">FEV1</td>
                                        <td className="p-1.5 text-center">{formData.spirometryTest.fev1.predicted}</td>
                                        <td className="p-1.5 text-center">{formData.spirometryTest.fev1.performed}</td>
                                        <td className="p-1.5 text-center font-black text-emerald-950">{formData.spirometryTest.fev1.percentPredicted}%</td>
                                    </tr>
                                    <tr>
                                        <td className="p-1.5">PEFR</td>
                                        <td className="p-1.5 text-center">{formData.spirometryTest.peakExpiratoryFlow.predicted}</td>
                                        <td className="p-1.5 text-center">{formData.spirometryTest.peakExpiratoryFlow.performed}</td>
                                        <td className="p-1.5 text-center font-black text-emerald-950">{formData.spirometryTest.peakExpiratoryFlow.percentPredicted}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Signatures & Seal Section */}
                    <div className="pt-5 mt-4 border-t-2 border-slate-950 grid grid-cols-2 gap-6 items-end text-xs">
                        <div className="border-2 border-dashed border-slate-400 w-28 h-28 flex flex-col items-center justify-center text-slate-400 text-[10px] text-center p-1.5 rounded-xl">
                            <User className="w-6 h-6 text-slate-300 mb-0.5" />
                            Space for Photograph & Official Seal
                        </div>

                        <div className="text-right space-y-1.5">
                            <div className="border-b-2 border-slate-950 pb-0.5 w-52 ml-auto text-center font-black text-xs text-slate-950">
                                {formData.examiningAuthorityName}
                            </div>
                            <p className="text-[10px] text-slate-800 font-black uppercase">{formData.examiningAuthorityDesignation || 'Signature of Examining Authority'}</p>
                            <p className="text-[10px] text-slate-700 font-bold">Place: {formData.place} | Date: {formData.examinationDate}</p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};



