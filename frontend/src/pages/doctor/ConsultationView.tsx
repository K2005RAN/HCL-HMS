import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Printer, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function ConsultationView() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const { token } = useAuth();
  
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [vitals, setVitals] = useState({ bp: '', pulse: '', weight: '', temp: '' });
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  
  // Prescription State
  const [prescription, setPrescription] = useState<any[]>([]);
  const [medInput, setMedInput] = useState({ medicineName: '', dosage: '', duration: '' });

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/doctor/appointment/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointment(res.data);
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
      const payload = {
        vitals,
        symptoms,
        diagnosis,
        notes,
        prescription
      };
      
      await axios.post(`http://localhost:5000/api/doctor/consultation/${appointmentId}`, payload, {
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
