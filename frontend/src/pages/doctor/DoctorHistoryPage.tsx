import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { History, Search, FileText, User, Calendar, Pill, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';

export default function DoctorHistoryPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async (query = '') => {
    setLoading(true);
    try {
      if (query.length >= 3) {
        let records: any[] = [];
        try {
          const patientRes = await axios.get(`${API_BASE_URL}/api/appointments/meta/search-patient?query=${query}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (patientRes.data?._id) {
            const res = await axios.get(`${API_BASE_URL}/api/doctor/history?patientId=${patientRes.data._id}&global=true`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            records = res.data;
          }
        } catch (e) {
          console.log("Patient meta search fallback...");
        }

        if (!records || records.length === 0) {
          const allRes = await axios.get(`${API_BASE_URL}/api/doctor/history?global=true`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const q = query.toLowerCase();
          records = (allRes.data || []).filter((r: any) => 
            r.patientId?.name?.toLowerCase().includes(q) ||
            r.patientId?.phone?.includes(q) ||
            r.patientId?.patientId?.toLowerCase().includes(q) ||
            r.diagnosis?.toLowerCase().includes(q)
          );
        }
        setHistory(records);
      } else {
        const res = await axios.get(`${API_BASE_URL}/api/doctor/history?global=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch doctor history", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) {
        fetchHistory(searchQuery);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Patient Consultation History
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">Search and review all medical records, diagnoses, prescriptions, and pharmacy status.</p>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-xl">Past Medical Records</CardTitle>
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search patient by mobile number, ID or name..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50 focus:ring-primary/50 transition-all rounded-xl" 
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 text-center text-muted-foreground font-medium">Loading consultation records...</div>
            ) : history.length > 0 ? (
              <div className="divide-y divide-border/50">
                {history.map((record: any) => {
                  const patient = record.patientId;
                  const doctor = record.doctorId;
                  const isDispensed = record.pharmacyStatus === 'Dispensed';

                  return (
                    <motion.div 
                      key={record._id} 
                      whileHover={{ backgroundColor: 'rgba(var(--primary), 0.02)' }}
                      className="p-6 transition-colors space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner shrink-0 mt-1">
                            <User className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-lg text-foreground">{patient?.name || 'Unknown Patient'}</h4>
                              {patient?.patientId && (
                                <Badge variant="outline" className="text-xs bg-muted">
                                  ID: {patient.patientId}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              Phone: {patient?.phone || '--'} | Blood Group: {patient?.bloodGroup || '--'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              <span>{new Date(record.createdAt).toLocaleString()}</span>
                              {doctor?.name && (
                                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                                  Dr. {doctor.name} ({doctor.specialization || 'Physician'})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/consultation-history/${record._id}`)}
                            className="shadow-sm hover:scale-105 transition-all bg-background/50"
                          >
                            <FileText className="mr-2 h-4 w-4 text-primary" /> View Details
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/40 text-sm">
                        <div>
                          <span className="font-semibold text-foreground block mb-1">Diagnosis</span>
                          <p className="text-muted-foreground whitespace-pre-wrap">{record.diagnosis}</p>
                        </div>

                        <div>
                          <span className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                            <Pill className="h-4 w-4 text-primary" />
                            Prescription & Pharmacy Status
                          </span>
                          {record.prescription?.length > 0 ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1.5">
                                {record.prescription.map((m: any, idx: number) => (
                                  <span key={idx} className="bg-background px-2.5 py-1 rounded-md border text-xs font-medium">
                                    {m.medicineName} ({m.dosage})
                                  </span>
                                ))}
                              </div>
                              <div className="pt-1 flex items-center gap-2">
                                <Badge variant="outline" className={
                                  isDispensed 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                }>
                                  {isDispensed ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                  {isDispensed 
                                    ? `Pharmacy Status: Dispensed & Billed (₹${record.pharmacyBilledAmount || 0})`
                                    : 'Pharmacy Status: Pending Dispensing'}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No medicines prescribed.</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <History className="h-8 w-8 opacity-40 text-primary" />
                </div>
                <p className="text-lg font-medium">No past consultation records found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
