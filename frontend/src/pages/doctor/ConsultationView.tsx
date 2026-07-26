import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Printer, Trash2, FileText } from 'lucide-react';
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
  
  // Form State
  const [vitals, setVitals] = useState({ bp: '120/80', pulse: '72', weight: '70', temp: '98.6' });
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
        setAppointment(res.data);
        if (res.data?.patientId?._id) {
          fetchPatientLabTests(res.data.patientId._id);
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
        vitals,
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
  const doctor = appointment?.doctorId; // We might need to fetch this or rely on auth user if not populated, but auth user works.

  return (
    <>
    <div className="space-y-6 max-w-6xl mx-auto print:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/doctor-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Consultation</h2>
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
          <Card>
            <CardHeader>
              <CardTitle>Vitals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>BP (mmHg)</Label>
                  <Input placeholder="120/80" value={vitals.bp} onChange={e => setVitals({...vitals, bp: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Pulse (bpm)</Label>
                  <Input placeholder="72" value={vitals.pulse} onChange={e => setVitals({...vitals, pulse: e.target.value})} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input placeholder="70" value={vitals.weight} onChange={e => setVitals({...vitals, weight: e.target.value})} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Temp (°F)</Label>
                  <Input placeholder="98.6" value={vitals.temp} onChange={e => setVitals({...vitals, temp: e.target.value})} type="number" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Patient Background</CardTitle>
            </CardHeader>
            <CardContent>
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
          <Card className="h-full">
            <CardContent className="p-0">
              <Tabs defaultValue="diagnosis" className="w-full h-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                  <TabsTrigger value="diagnosis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-6">Diagnosis</TabsTrigger>
                  <TabsTrigger value="prescription" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-6">Prescription</TabsTrigger>
                  <TabsTrigger value="lab" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-6">Lab Test Orders</TabsTrigger>
                </TabsList>
                
                <TabsContent value="diagnosis" className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Presenting Symptoms</Label>
                    <Textarea 
                      placeholder="e.g. Fever, Cough (comma separated)" 
                      className="h-16" 
                      value={symptoms} 
                      onChange={e => setSymptoms(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Diagnosis</Label>
                    <Input 
                      placeholder="Primary diagnosis" 
                      value={diagnosis} 
                      onChange={e => setDiagnosis(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Doctor's Notes</Label>
                    <Textarea 
                      placeholder="Additional clinical notes..." 
                      className="h-32" 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="prescription" className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-5 space-y-2">
                        <Label>Medicine</Label>
                        <Input placeholder="e.g. Paracetamol 500mg" value={medInput.medicineName} onChange={e => setMedInput({...medInput, medicineName: e.target.value})} />
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label>Dosage</Label>
                        <Input placeholder="e.g. 1-0-1" value={medInput.dosage} onChange={e => setMedInput({...medInput, dosage: e.target.value})} />
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label>Duration</Label>
                        <Input placeholder="e.g. 5 Days" value={medInput.duration} onChange={e => setMedInput({...medInput, duration: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <Button variant="outline" size="icon" onClick={handleAddMedicine} disabled={!medInput.medicineName}>+</Button>
                      </div>
                    </div>
                    
                    <div className="mt-8 border rounded-lg overflow-hidden">
                      {prescription.length > 0 ? (
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted text-muted-foreground border-b border-border/50">
                            <tr>
                              <th className="px-4 py-3 font-medium">Medicine</th>
                              <th className="px-4 py-3 font-medium">Dosage</th>
                              <th className="px-4 py-3 font-medium">Duration</th>
                              <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {prescription.map((med, idx) => (
                              <tr key={idx} className="bg-card">
                                <td className="px-4 py-3 font-medium">{med.medicineName}</td>
                                <td className="px-4 py-3 text-muted-foreground">{med.dosage}</td>
                                <td className="px-4 py-3 text-muted-foreground">{med.duration}</td>
                                <td className="px-4 py-3 text-right">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleRemoveMedicine(idx)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-8 text-center text-sm text-muted-foreground bg-slate-50/50">
                          No medicines added to prescription yet.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="lab" className="p-6 space-y-6">
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-4">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      Order New Lab Test
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Select Preset Test or Custom</Label>
                        <select 
                          value={selectedPresetTest}
                          onChange={handlePresetChange}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">Select Lab Test...</option>
                          <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                          <option value="Lipid Profile">Lipid Profile</option>
                          <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
                          <option value="Kidney Function Test (KFT)">Kidney Function Test (KFT)</option>
                          <option value="Fasting Blood Sugar (FBS)">Fasting Blood Sugar (FBS)</option>
                          <option value="Postprandial Blood Sugar (PPBS)">Postprandial Blood Sugar (PPBS)</option>
                          <option value="HbA1c">HbA1c</option>
                          <option value="Urine Routine & Microscopy">Urine Routine & Microscopy</option>
                          <option value="Chest X-Ray">Chest X-Ray</option>
                          <option value="ECG 12 Lead">ECG 12 Lead</option>
                          <option value="Thyroid Profile (T3, T4, TSH)">Thyroid Profile (T3, T4, TSH)</option>
                          <option value="custom">-- Type Custom Test Name --</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Test Name</Label>
                        <Input 
                          placeholder="e.g. Vitamin D3 level" 
                          value={labTestInput.testName} 
                          onChange={e => setLabTestInput({ ...labTestInput, testName: e.target.value })} 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Category</Label>
                        <select 
                          value={labTestInput.category}
                          onChange={e => setLabTestInput({ ...labTestInput, category: e.target.value })}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="Hematology">Hematology</option>
                          <option value="Biochemistry">Biochemistry</option>
                          <option value="Pathology">Pathology</option>
                          <option value="Radiology">Radiology</option>
                          <option value="Microbiology">Microbiology</option>
                          <option value="General">General</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Clinical Instructions / Remarks</Label>
                        <Input 
                          placeholder="e.g. Fasting sample required" 
                          value={labTestInput.remarks} 
                          onChange={e => setLabTestInput({ ...labTestInput, remarks: e.target.value })} 
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button onClick={handleOrderLabTest} disabled={orderingLab || !labTestInput.testName.trim()}>
                        {orderingLab ? 'Ordering...' : 'Order Lab Test'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-foreground">Lab Test Orders & Reports History</h4>
                    {patientLabTests.length > 0 ? (
                      <div className="border border-border/50 rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted text-muted-foreground border-b border-border/50">
                            <tr>
                              <th className="px-4 py-3 font-medium">Test Name</th>
                              <th className="px-4 py-3 font-medium">Category</th>
                              <th className="px-4 py-3 font-medium">Status</th>
                              <th className="px-4 py-3 font-medium">Result Notes / Findings</th>
                              <th className="px-4 py-3 font-medium">Date Requested</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {patientLabTests.map((t: any) => (
                              <tr key={t._id} className="bg-card">
                                <td className="px-4 py-3 font-semibold">{t.testName}</td>
                                <td className="px-4 py-3 text-muted-foreground">{t.category}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                    t.status === 'Sample Collected' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                                    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {t.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  <div>{t.resultNotes || (t.status === 'Completed' ? 'Report ready' : 'Awaiting results from lab')}</div>
                                  {t.pdfReportUrl && (
                                    <div className="mt-1.5">
                                      <button 
                                        type="button"
                                        onClick={() => openPdfReport(t.pdfReportUrl)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-semibold border border-primary/20 transition-all shadow-sm cursor-pointer"
                                      >
                                        <FileText className="h-3.5 w-3.5" /> View Uploaded PDF Report
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {new Date(t.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-sm text-muted-foreground bg-slate-50/50 rounded-xl border border-dashed">
                        No lab test orders recorded for this patient.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* PRINT LAYOUT */}
    <div className="hidden print:block w-[210mm] min-h-[297mm] bg-white text-black p-10 border-2 border-black mx-auto shadow-none print:shadow-none print:border-0 print:m-0 print:p-0">
      <div className="border border-black p-6 rounded-sm min-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-green-700 pb-6 mb-6">
        <div>
          <img src="/logo.svg" alt="HeidelbergCement Logo" className="h-16 mb-2" />
          <p className="text-sm text-gray-500 font-medium tracking-wide">OCCUPATIONAL HEALTH CENTER</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-800">Prescription</h2>
          <p className="text-gray-600 mt-1 text-sm font-medium">Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Doctor & Patient Info */}
      <div className="grid grid-cols-2 gap-8 mb-8 border-b pb-6">
        <div>
          <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-2 text-green-700">Doctor Details</h3>
          <p className="font-bold text-lg">{appointment?.doctorId?.name || 'Authorized Physician'}</p>
          {appointment?.doctorId?.specialization && <p className="text-gray-600">{appointment.doctorId.specialization}</p>}
        </div>
        <div>
          <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-2 text-green-700">Patient Details</h3>
          <p className="font-bold text-lg">{patient?.name || 'Unknown Patient'}</p>
          <p className="text-gray-600">
            {patient?.age || (patient?.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : '--')} Years | {patient?.gender || '--'} | {patient?.bloodGroup || '--'}
          </p>
          {patient?.phone && <p className="text-gray-500 text-sm mt-1">Ph: {patient.phone}</p>}
        </div>
      </div>

      {/* Vitals */}
      <div className="mb-8">
        <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-3 text-green-700">Vitals & Assessment</h3>
        <div className="flex gap-8 text-sm bg-gray-50 p-4 rounded-lg">
          <div><span className="font-semibold">BP:</span> {vitals.bp || '--'}</div>
          <div><span className="font-semibold">Pulse:</span> {vitals.pulse || '--'}</div>
          <div><span className="font-semibold">Weight:</span> {vitals.weight ? `${vitals.weight} kg` : '--'}</div>
          <div><span className="font-semibold">Temp:</span> {vitals.temp ? `${vitals.temp} °F` : '--'}</div>
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
          <p className="font-bold text-sm text-gray-800">Doctor's Signature</p>
        </div>
      </div>
      
      </div>
    </div>
    </>
  );
}
