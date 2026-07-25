import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { openPdfReport } from '@/lib/utils';

export default function ConsultationHistoryView() {
  const navigate = useNavigate();
  const { recordId } = useParams();
  const { token, user } = useAuth();
  
  const [record, setRecord] = useState<any>(null);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const endpoint = user?.role === 'patient' 
          ? `http://localhost:5000/api/patient/history/${recordId}`
          : `http://localhost:5000/api/doctor/history/${recordId}`;
          
        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecord(res.data);

        const patientIdVal = res.data?.patientId?._id || res.data?.patientId;
        if (patientIdVal) {
          try {
            const labRes = await axios.get(`http://localhost:5000/api/lab/patient/${patientIdVal}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setLabTests(labRes.data);
          } catch (e) {
            console.error("Failed to fetch patient lab tests", e);
          }
        }
      } catch (err) {
        console.error("Failed to fetch record", err);
      } finally {
        setLoading(false);
      }
    };
    if (token && recordId) {
      fetchRecord();
    }
  }, [token, recordId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading medical record...</div>;
  }

  if (!record) {
    return <div className="p-8 text-center text-red-500">Medical record not found.</div>;
  }

  const patient = record.patientId;
  const doctor = record.doctorId;

  return (
    <>
    <div className="space-y-6 max-w-6xl mx-auto print:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(user?.role === 'patient' ? '/patient-dashboard' : '/doctor-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Past Consultation Record</h2>
            <p className="text-muted-foreground">
              Patient: <span className="font-semibold text-foreground">{patient?.name || 'Unknown'}</span> | 
              Date: {new Date(record.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Print Prescription</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vitals & Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                <div>
                  <span className="text-muted-foreground block">Blood Pressure</span>
                  <span className="font-semibold">{record.bloodPressure || '--'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Pulse</span>
                  <span className="font-semibold">{record.pulse ? `${record.pulse} bpm` : '--'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Weight</span>
                  <span className="font-semibold">{record.weight ? `${record.weight} kg` : '--'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Temperature</span>
                  <span className="font-semibold">{record.temperature ? `${record.temperature} °F` : '--'}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border/50 space-y-3 text-sm">
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
            <CardHeader>
              <CardTitle>Clinical Notes & Prescription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Presenting Symptoms</h4>
                <p className="bg-muted/50 p-3 rounded-lg border border-border/50">
                  {record.symptoms?.length > 0 ? record.symptoms.join(', ') : 'None reported'}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Diagnosis & Notes</h4>
                <div className="bg-muted/50 p-3 rounded-lg border border-border/50 whitespace-pre-wrap">
                  {record.diagnosis}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Prescription</h4>
                  {record.prescription?.length > 0 && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      record.pharmacyStatus === 'Dispensed' 
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    }`}>
                      {record.pharmacyStatus === 'Dispensed' 
                        ? `Pharmacy: Dispensed & Billed (₹${record.pharmacyBilledAmount || 0})`
                        : 'Pharmacy: Pending Dispensing'}
                    </span>
                  )}
                </div>
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  {record.prescription?.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-muted-foreground border-b border-border/50">
                        <tr>
                          <th className="px-4 py-3 font-medium">Medicine</th>
                          <th className="px-4 py-3 font-medium">Dosage</th>
                          <th className="px-4 py-3 font-medium">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {record.prescription.map((med: any, idx: number) => (
                          <tr key={idx} className="bg-card">
                            <td className="px-4 py-3 font-medium">{med.medicineName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{med.dosage}</td>
                            <td className="px-4 py-3 text-muted-foreground">{med.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground bg-slate-50/50">
                      No medicines were prescribed.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Lab Test Reports & Findings</h4>
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  {labTests.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-muted-foreground border-b border-border/50">
                        <tr>
                          <th className="px-4 py-3 font-medium">Test Name</th>
                          <th className="px-4 py-3 font-medium">Category</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Findings / Report Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {labTests.map((t: any) => (
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
                              <div>{t.resultNotes || (t.status === 'Completed' ? 'Report ready' : 'Awaiting results from laboratory')}</div>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground bg-slate-50/50">
                      No lab test records for this patient.
                    </div>
                  )}
                </div>
              </div>
              
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* PRINT LAYOUT (Identical to ConsultationView) */}
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
            <p className="text-gray-600 mt-1 text-sm font-medium">Date: {new Date(record.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Doctor & Patient Info */}
        <div className="grid grid-cols-2 gap-8 mb-8 border-b pb-6">
          <div>
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-2 text-green-700">Doctor Details</h3>
            <p className="font-bold text-lg">{doctor?.name || 'Authorized Physician'}</p>
            {doctor?.specialization && <p className="text-gray-600">{doctor.specialization}</p>}
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
          <div className="flex gap-8 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div><span className="font-semibold">BP:</span> {record.bloodPressure || '--'}</div>
            <div><span className="font-semibold">Pulse:</span> {record.pulse || '--'}</div>
            <div><span className="font-semibold">Weight:</span> {record.weight ? `${record.weight} kg` : '--'}</div>
            <div><span className="font-semibold">Temp:</span> {record.temperature ? `${record.temperature} °F` : '--'}</div>
          </div>
        </div>

        {/* Clinical Notes */}
        <div className="mb-8 space-y-4">
          <div>
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-1 text-green-700">Presenting Symptoms</h3>
            <p className="text-gray-700 text-sm">{record.symptoms?.length > 0 ? record.symptoms.join(', ') : 'None reported.'}</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-1 text-green-700">Diagnosis & Notes</h3>
            <p className="text-gray-800 font-semibold whitespace-pre-wrap">{record.diagnosis || 'Pending'}</p>
          </div>
        </div>

        {/* Prescription Table */}
        <div className="mb-16">
          <h3 className="font-bold text-gray-800 uppercase text-xs tracking-wider mb-3 text-green-700">Rx - Medicines Prescribed</h3>
          {record.prescription?.length > 0 ? (
            <table className="w-full text-sm text-left border-collapse border border-gray-300">
              <thead>
                <tr className="bg-green-50 border-b border-gray-300">
                  <th className="py-2 px-3 font-semibold text-green-800 border-r border-gray-300">Medicine Name</th>
                  <th className="py-2 px-3 font-semibold text-green-800 border-r border-gray-300">Dosage</th>
                  <th className="py-2 px-3 font-semibold text-green-800">Duration</th>
                </tr>
              </thead>
              <tbody>
                {record.prescription.map((med: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-2 px-3 font-medium text-gray-800 border-r border-gray-200">{med.medicineName}</td>
                    <td className="py-2 px-3 text-gray-600 border-r border-gray-200">{med.dosage}</td>
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
        <div className="flex justify-between items-end mt-24 pt-8 border-t border-gray-300">
          <div className="text-xs text-gray-500">
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
