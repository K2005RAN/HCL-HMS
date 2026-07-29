import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Printer, Trash2, FileText, HeartPulse, Activity, Stethoscope, AlertCircle, CheckCircle2, Sparkles, Thermometer, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { openPdfReport } from '@/lib/utils';
import { API_BASE_URL } from '@/config/api';

export default function ConsultationView() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const { token } = useAuth();
  
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Vitals state stored from nurse check-in
  const [vitals, setVitals] = useState({ bp: '', pulse: '', weight: '', temp: '' });
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  
  // Prescription State
  const [prescription, setPrescription] = useState<any[]>([]);
  const [medInput, setMedInput] = useState({ medicineName: '', dosage: '', duration: '' });

  // Lab Test State
  const [patientLabTests, setPatientLabTests] = useState<any[]>([]);
  const [selectedPresetTest, setSelectedPresetTest] = useState('');
  const [labTestInput, setLabTestInput] = useState({ testName: '', category: 'Hematology', remarks: '' });
  const [orderingLab, setOrderingLab] = useState(false);

  const fetchPatientLabTests = async (patientIdStr: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/lab/patient/${patientIdStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatientLabTests(res.data);
    } catch (err) {
      console.error("Failed to fetch lab tests for patient", err);
    }
  };

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/doctor/appointment/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const apptData = res.data;
        setAppointment(apptData);
        
        if (apptData?.vitals) {
          setVitals({
            bp: apptData.vitals.bp || '',
            pulse: apptData.vitals.pulse || '',
            weight: apptData.vitals.weight || '',
            temp: apptData.vitals.temp || ''
          });
        }

        if (apptData?.reasonForVisit && !symptoms) {
          setSymptoms(apptData.reasonForVisit);
        }

        if (apptData?.patientId?._id) {
          fetchPatientLabTests(apptData.patientId._id);
        }
      } catch (err) {
        console.error("Failed to fetch appointment", err);
      } finally {
        setLoading(false);
      }
    };
    if (token && appointmentId) {
      fetchAppointment();
    }
  }, [token, appointmentId]);

  const handleApplyPreset = (presetType: string) => {
    switch (presetType) {
      case 'fever':
        setSymptoms('Fever, Cold, Cough, Body ache, Mild headache');
        setDiagnosis('Acute Upper Respiratory Tract Infection (URTI)');
        break;
      case 'hypertension':
        setSymptoms('Routine Blood Pressure checkup, Mild dizziness');
        setDiagnosis('Essential Hypertension (Routine Monitoring)');
        break;
      case 'gastritis':
        setSymptoms('Epigastric pain, Heartburn, Nausea, Acidity');
        setDiagnosis('Acute Gastritis / Dyspepsia');
        break;
      case 'fitness':
        setSymptoms('Annual occupational health screening / Periodic physical test');
        setDiagnosis('Fit for Duty - Occupational Health Clearance');
        break;
      case 'sprain':
        setSymptoms('Localized joint/muscle pain, Mild swelling after physical activity');
        setDiagnosis('Acute Musculoskeletal Strain');
        break;
    }
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPresetTest(val);
    if (val && val !== 'custom') {
      let category = 'General';
      if (val.includes('CBC') || val.includes('Blood')) category = 'Hematology';
      else if (val.includes('Lipid') || val.includes('Sugar') || val.includes('LFT') || val.includes('KFT') || val.includes('Thyroid')) category = 'Biochemistry';
      else if (val.includes('Urine')) category = 'Pathology';
      else if (val.includes('X-Ray') || val.includes('ECG')) category = 'Radiology';
      setLabTestInput({ ...labTestInput, testName: val, category });
    } else if (val === 'custom') {
      setLabTestInput({ ...labTestInput, testName: '', category: 'General' });
    }
  };

  const handleOrderLabTest = async () => {
    if (!labTestInput.testName.trim()) {
      alert("Please select or enter a lab test name.");
      return;
    }
    const patientIdVal = appointment?.patientId?._id || appointment?.patientId;
    if (!patientIdVal) {
      alert("Patient details not found.");
      return;
    }
    setOrderingLab(true);
    try {
      await axios.post(`${API_BASE_URL}/api/lab/order`, {
        patientId: patientIdVal,
        testName: labTestInput.testName,
        category: labTestInput.category,
        remarks: labTestInput.remarks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Lab test "${labTestInput.testName}" ordered successfully!`);
      setLabTestInput({ testName: '', category: 'Hematology', remarks: '' });
      setSelectedPresetTest('');
      fetchPatientLabTests(patientIdVal);
    } catch (err: any) {
      console.error("Failed to order lab test", err);
      alert("Failed to order lab test: " + (err.response?.data?.message || err.message));
    } finally {
      setOrderingLab(false);
    }
  };

  const handleAddMedicine = () => {
    if (medInput.medicineName && medInput.dosage && medInput.duration) {
      setPrescription([...prescription, medInput]);
      setMedInput({ medicineName: '', dosage: '', duration: '' }); // reset
    }
  };

  const handleRemoveMedicine = (index: number) => {
    const newList = [...prescription];
    newList.splice(index, 1);
    setPrescription(newList);
  };

  const handleCompleteConsultation = async () => {
    if (!diagnosis.trim()) {
      alert("Please enter a diagnosis before completing the consultation.");
      return;
    }

    try {
      const finalPrescription = [...prescription];
      if (medInput.medicineName.trim()) {
        finalPrescription.push({
          medicineName: medInput.medicineName.trim(),
          dosage: medInput.dosage.trim() || '1-0-1',
          duration: medInput.duration.trim() || '5 Days'
        });
      }

      const payload = {
        vitals: appointment?.vitals || vitals,
        symptoms,
        diagnosis,
        notes,
        prescription: finalPrescription
      };
      
      await axios.post(`${API_BASE_URL}/api/doctor/consultation/${appointmentId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert("Consultation completed successfully!");
      navigate('/doctor-dashboard');
    } catch (err: any) {
      console.error("Failed to complete consultation", err);
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading consultation details...</div>;
  }

  const patient = appointment?.patientId;
  const doctor = appointment?.doctorId;
  const apptVitals = appointment?.vitals || vitals;
  const hasNurseVitals = apptVitals && (apptVitals.bp || apptVitals.pulse || apptVitals.weight || apptVitals.temp);

  // Vitals Status Helper
  const getTempStatus = (tempStr: string) => {
    const t = parseFloat(tempStr);
    if (isNaN(t)) return null;
    if (t >= 100.4) return { label: 'Fever', color: 'bg-rose-500/10 text-rose-700 border-rose-300' };
    if (t >= 99.1) return { label: 'Low Fever', color: 'bg-amber-500/10 text-amber-700 border-amber-300' };
    return { label: 'Normal', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-300' };
  };

  const getBpStatus = (bpStr: string) => {
    if (!bpStr) return null;
    const parts = bpStr.split('/');
    if (parts.length === 2) {
      const sys = parseInt(parts[0]);
      if (!isNaN(sys)) {
        if (sys >= 140) return { label: 'High BP', color: 'bg-rose-500/10 text-rose-700 border-rose-300' };
        if (sys >= 125) return { label: 'Elevated', color: 'bg-amber-500/10 text-amber-700 border-amber-300' };
        return { label: 'Normal', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-300' };
      }
    }
    return null;
  };

  const bpStat = getBpStatus(apptVitals.bp);
  const tempStat = getTempStatus(apptVitals.temp);

  return (
    <>
    <div className="space-y-6 max-w-6xl mx-auto print:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/doctor-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Doctor Consultation</h2>
            <p className="text-muted-foreground">
              Patient: <span className="font-semibold text-foreground">{patient?.name || 'Unknown'}</span> | 
              Age: {patient?.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : '--'} | 
              Gender: {patient?.gender || '--'} | 
              Queue: #{appointment?.queueNumber || '--'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Print</Button>
          <Button onClick={handleCompleteConsultation} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="mr-2 h-4 w-4"/> Complete Consult
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          
          {/* Read-Only Nurse Vitals Card */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent py-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <HeartPulse className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Nurse Triage Vitals
                </CardTitle>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 text-[10px]">
                  Captured at Check-In
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {hasNurseVitals ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">BP (mmHg)</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-foreground">{apptVitals.bp || '--'}</span>
                      {bpStat && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${bpStat.color}`}>{bpStat.label}</span>}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Pulse (bpm)</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-foreground">{apptVitals.pulse || '--'}</span>
                      <span className="text-[10px] text-muted-foreground">bpm</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Weight (kg)</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-foreground">{apptVitals.weight || '--'}</span>
                      <span className="text-[10px] text-muted-foreground">kg</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Temp (°F)</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-foreground">{apptVitals.temp || '--'}</span>
                      {tempStat && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tempStat.color}`}>{tempStat.label}</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-400 space-y-1">
                  <AlertCircle className="h-5 w-5 mx-auto opacity-70" />
                  <p className="text-xs font-semibold">Vitals Pending Nurse Check-in</p>
                  <p className="text-[11px] opacity-80">Nursing staff did not enter vitals at appointment booking.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visit Reason / Chief Complaint Card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="py-3 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Reason for Visit / Chief Complaint
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm font-medium text-foreground">
                "{appointment?.reasonForVisit || 'General Health Checkup / Consultation'}"
              </div>
            </CardContent>
          </Card>

          {/* Quick Clinical Presets Widget */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="py-3 border-b border-border/40 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Quick Diagnostic Presets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground mb-2">Click to auto-fill diagnosis & presenting symptoms:</p>
              <div className="flex flex-col gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleApplyPreset('fever')}
                  className="justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  🌡️ Viral Fever & Upper Respiratory
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleApplyPreset('hypertension')}
                  className="justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  🩺 Hypertension Routine Review
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleApplyPreset('gastritis')}
                  className="justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  💊 Acute Gastritis / Acidity
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleApplyPreset('fitness')}
                  className="justify-start text-xs h-8 hover:bg-emerald-500/10 hover:text-emerald-700 transition-colors"
                >
                  🛡️ Occupational Fitness Clearance
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleApplyPreset('sprain')}
                  className="justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  🩹 Musculoskeletal Strain / Injury
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Patient Background Card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="py-3 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" /> Patient Background
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-sm space-y-3">
                <div>
                  <span className="font-semibold text-foreground">Blood Group:</span> {patient?.bloodGroup || 'Unknown'}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Allergies:</span>
                  <p className="text-muted-foreground">{patient?.allergies?.length > 0 ? patient.allergies.join(', ') : 'None reported'}</p>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Chronic Issues:</span>
                  <p className="text-muted-foreground">{patient?.chronicDiseases?.length > 0 ? patient.chronicDiseases.join(', ') : 'None reported'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="lg:col-span-2">
          <Card className="h-full border-border/60 shadow-sm">
            <CardContent className="p-0">
              <Tabs defaultValue="diagnosis" className="w-full h-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                  <TabsTrigger value="diagnosis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-6 font-semibold">Diagnosis</TabsTrigger>
                  <TabsTrigger value="prescription" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-6 font-semibold">Prescription</TabsTrigger>
                  <TabsTrigger value="lab" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-6 font-semibold">Lab Test Orders</TabsTrigger>
                </TabsList>
                
                <TabsContent value="diagnosis" className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Presenting Symptoms</Label>
                    <Textarea 
                      placeholder="e.g. Fever, Cough, Headache..." 
                      className="h-20" 
                      value={symptoms} 
                      onChange={e => setSymptoms(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Primary Diagnosis *</Label>
                    <Input 
                      placeholder="Enter primary clinical diagnosis..." 
                      value={diagnosis} 
                      onChange={e => setDiagnosis(e.target.value)} 
                      className="h-11 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Doctor's Notes & Advice</Label>
                    <Textarea 
                      placeholder="Additional clinical notes, dietary advice, follow-up recommendations..." 
                      className="h-32" 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="prescription" className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5 space-y-2">
                        <Label className="font-semibold text-xs text-foreground">Medicine Name</Label>
                        <Input placeholder="e.g. Paracetamol 500mg" value={medInput.medicineName} onChange={e => setMedInput({...medInput, medicineName: e.target.value})} />
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label className="font-semibold text-xs text-foreground">Dosage</Label>
                        <Input placeholder="e.g. 1-0-1" value={medInput.dosage} onChange={e => setMedInput({...medInput, dosage: e.target.value})} />
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label className="font-semibold text-xs text-foreground">Duration</Label>
                        <Input placeholder="e.g. 5 Days" value={medInput.duration} onChange={e => setMedInput({...medInput, duration: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <Button type="button" onClick={handleAddMedicine} className="w-full bg-primary hover:bg-primary/90">
                          Add
                        </Button>
                      </div>
                    </div>

                    {prescription.length > 0 ? (
                      <div className="border rounded-xl overflow-hidden mt-4">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase">
                            <tr>
                              <th className="py-2.5 px-4 font-semibold">Medicine</th>
                              <th className="py-2.5 px-4 font-semibold">Dosage</th>
                              <th className="py-2.5 px-4 font-semibold">Duration</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {prescription.map((med, idx) => (
                              <tr key={idx}>
                                <td className="py-2.5 px-4 font-medium text-foreground">{med.medicineName}</td>
                                <td className="py-2.5 px-4 text-muted-foreground">{med.dosage}</td>
                                <td className="py-2.5 px-4 text-muted-foreground">{med.duration}</td>
                                <td className="py-2.5 px-4 text-right">
                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveMedicine(idx)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-xl">
                        No prescription items added yet. Fill in medicine details above and click Add.
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="lab" className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-semibold text-xs text-foreground">Select Common Test Preset</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedPresetTest}
                        onChange={handlePresetChange}
                      >
                        <option value="">-- Choose Preset Lab Test --</option>
                        <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                        <option value="Lipid Profile">Lipid Profile</option>
                        <option value="Fasting Blood Sugar (FBS)">Fasting Blood Sugar (FBS)</option>
                        <option value="Post Prandial Blood Sugar (PPBS)">Post Prandial Blood Sugar (PPBS)</option>
                        <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
                        <option value="Kidney Function Test (KFT)">Kidney Function Test (KFT)</option>
                        <option value="Thyroid Profile (T3, T4, TSH)">Thyroid Profile (T3, T4, TSH)</option>
                        <option value="Urine Routine Analysis">Urine Routine Analysis</option>
                        <option value="Chest X-Ray PA View">Chest X-Ray PA View</option>
                        <option value="ECG (12 Lead)">ECG (12 Lead)</option>
                        <option value="custom">-- Custom Test --</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-semibold text-xs text-foreground">Test Name</Label>
                        <Input 
                          placeholder="e.g. CBC or Lipid Profile" 
                          value={labTestInput.testName} 
                          onChange={e => setLabTestInput({ ...labTestInput, testName: e.target.value })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-semibold text-xs text-foreground">Category</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={labTestInput.category}
                          onChange={e => setLabTestInput({ ...labTestInput, category: e.target.value })}
                        >
                          <option value="Hematology">Hematology</option>
                          <option value="Biochemistry">Biochemistry</option>
                          <option value="Pathology">Pathology</option>
                          <option value="Radiology">Radiology</option>
                          <option value="General">General</option>
                        </select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="font-semibold text-xs text-foreground">Clinical Remarks / Instructions</Label>
                        <Input 
                          placeholder="e.g. Fasting required, urgent result..." 
                          value={labTestInput.remarks} 
                          onChange={e => setLabTestInput({ ...labTestInput, remarks: e.target.value })} 
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleOrderLabTest} 
                      disabled={orderingLab || !labTestInput.testName}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                      {orderingLab ? 'Ordering...' : 'Order Lab Test'}
                    </Button>

                    {/* Patient's Lab Test History */}
                    <div className="mt-6 pt-4 border-t border-border">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Ordered Lab Tests for Patient</h4>
                      {patientLabTests.length > 0 ? (
                        <div className="space-y-2">
                          {patientLabTests.map(t => (
                            <div key={t._id} className="p-3 rounded-lg bg-muted/30 border border-border flex justify-between items-center text-sm">
                              <div>
                                <span className="font-bold text-foreground">{t.testName}</span>
                                <span className="text-xs text-muted-foreground ml-2">({t.category})</span>
                              </div>
                              <Badge variant={t.status === 'Completed' ? 'default' : 'secondary'}>
                                {t.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No lab tests ordered for this patient yet.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* Printable Medical Prescription Sheet */}
    <div className="hidden print:block p-8 bg-white text-black font-sans leading-relaxed">
      <div className="border-b-2 border-gray-800 pb-6 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">HEIDELBERGCEMENT INDIA</h1>
          <h2 className="text-lg font-semibold text-gray-700">Occupational Health Center</h2>
          <p className="text-gray-500 text-xs mt-1">Medical Examination & Prescription Sheet</p>
        </div>
        <div className="text-right text-xs text-gray-600">
          <p className="font-bold text-sm text-gray-800">Date: {new Date().toLocaleDateString()}</p>
          <p>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p>Ref #: {appointmentId?.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg text-sm">
        <div>
          <p><span className="font-bold text-gray-700">Patient Name:</span> {patient?.name || 'Unknown'}</p>
          <p><span className="font-bold text-gray-700">Employee / Patient ID:</span> {patient?.patientId || '--'}</p>
        </div>
        <div>
          <p>
            <span className="font-bold text-gray-700">Age / Gender / Blood Group:</span>{' '}
            {patient?.age || (patient?.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : '--')} Years | {patient?.gender || '--'} | {patient?.bloodGroup || '--'}
          </p>
          {patient?.phone && <p className="text-gray-500 text-sm mt-1">Ph: {patient.phone}</p>}
        </div>
      </div>

      {/* Read-Only Nurse Captured Vitals in Print */}
      <div className="mb-8">
        <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-3 text-green-700">Vitals & Assessment (Captured by Nurse)</h3>
        <div className="flex gap-8 text-sm bg-gray-50 p-4 rounded-lg">
          <div><span className="font-semibold">BP:</span> {apptVitals.bp || '--'}</div>
          <div><span className="font-semibold">Pulse:</span> {apptVitals.pulse ? `${apptVitals.pulse} bpm` : '--'}</div>
          <div><span className="font-semibold">Weight:</span> {apptVitals.weight ? `${apptVitals.weight} kg` : '--'}</div>
          <div><span className="font-semibold">Temp:</span> {apptVitals.temp ? `${apptVitals.temp} °F` : '--'}</div>
        </div>
      </div>

      {/* Clinical Notes */}
      <div className="mb-8 space-y-4">
        <div>
          <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-1 text-green-700">Presenting Symptoms</h3>
          <p className="text-gray-700 text-sm">{symptoms || 'None reported.'}</p>
        </div>
        <div>
          <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-1 text-green-700">Diagnosis</h3>
          <p className="text-gray-800 font-semibold">{diagnosis || 'Pending'}</p>
        </div>
        {notes && (
          <div>
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-1 text-green-700">Clinical Notes</h3>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{notes}</p>
          </div>
        )}
      </div>

      {/* Prescription Table */}
      <div className="mb-16">
        <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-3 text-green-700">Rx - Medicines Prescribed</h3>
        {prescription.length > 0 ? (
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-green-50 border-y border-green-200">
                <th className="py-2 px-3 font-semibold text-green-800">Medicine Name</th>
                <th className="py-2 px-3 font-semibold text-green-800">Dosage</th>
                <th className="py-2 px-3 font-semibold text-green-800">Duration</th>
              </tr>
            </thead>
            <tbody>
              {prescription.map((med, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 px-3 font-medium text-gray-800">{med.medicineName}</td>
                  <td className="py-2 px-3 text-gray-600">{med.dosage}</td>
                  <td className="py-2 px-3 text-gray-600">{med.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 italic text-sm">No medicines prescribed.</p>
        )}
      </div>

      {/* Footer / Signature */}
      <div className="flex justify-between items-end mt-24 pt-8 border-t border-gray-200">
        <div className="text-xs text-gray-400">
          <p>Generated by HCI-HMS</p>
          <p>HeidelbergCement India Occupational Health Center</p>
        </div>
        <div className="text-center w-48 border-t-2 border-gray-800 pt-2">
          <p className="font-bold text-sm text-gray-800">{doctor?.name ? `Dr. ${doctor.name}` : "Doctor's Signature"}</p>
        </div>
      </div>

    </div>
    </>
  );
}
