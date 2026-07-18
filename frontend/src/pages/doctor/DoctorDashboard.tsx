import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, Activity, ArrowRight, UserCircle, History, Printer } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [dashboardData, setDashboardData] = useState<any>({
    doctor: null,
    currentQueue: [],
    totalPatientsToday: 0,
    pendingReports: 0,
    fitnessCertsIssued: 0
  });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/doctor/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(res.data);
      } catch (err) {
        console.error("Failed to fetch doctor dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchHistory = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/doctor/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    if (token) {
      fetchDashboard();
      fetchHistory();
    }
  }, [token]);

  useEffect(() => {
    const searchGlobalHistory = async () => {
      if (searchPhone.length >= 3) {
        setHistoryLoading(true);
        try {
          // First find the patient
          const patientRes = await axios.get(`http://localhost:5000/api/appointments/meta/search-patient?query=${searchPhone}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (patientRes.data && patientRes.data._id) {
            // Then fetch global history for this patient
            const histRes = await axios.get(`http://localhost:5000/api/doctor/history?patientId=${patientRes.data._id}&global=true`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(histRes.data);
          }
        } catch (error) {
          console.error("Patient not found or error", error);
          setHistory([]);
        } finally {
          setHistoryLoading(false);
        }
      } else if (searchPhone.length === 0) {
        // Reset to doctor's own history
        setHistoryLoading(true);
        axios.get('http://localhost:5000/api/doctor/history', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => setHistory(res.data)).finally(() => setHistoryLoading(false));
      }
    };
    
    const timeoutId = setTimeout(() => {
      searchGlobalHistory();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchPhone, token]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Doctor Dashboard</h2>
          <p className="text-muted-foreground mt-1 text-lg">Welcome back, Dr. {dashboardData.doctor?.name || user?.username || 'User'}.</p>
        </motion.div>
        
        {dashboardData.doctor && (
          <motion.div variants={itemVariants} className="bg-card border border-border/50 p-4 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {dashboardData.doctor.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold">{dashboardData.doctor.specialization}</p>
              <p className="text-sm text-muted-foreground">{dashboardData.doctor.department} Department • {dashboardData.doctor.phone}</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-indigo-600 opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10 text-white">
              <CardTitle className="text-sm font-semibold">Patients Today</CardTitle>
              <div className="p-2 rounded-xl bg-white/20">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 text-white">
              <div className="text-3xl font-extrabold tracking-tight">{loading ? '...' : dashboardData.totalPatientsToday}</div>
              <p className="text-xs font-medium mt-1 text-white/80">{dashboardData.currentQueue.length} patients currently in queue</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-border/50">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-amber-600 dark:text-amber-500">Pending Reports</CardTitle>
              <div className="p-2 rounded-xl bg-amber-500/10">
                <FileText className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight">{loading ? '...' : dashboardData.pendingReports}</div>
              <p className="text-xs font-medium mt-1 text-amber-600 dark:text-amber-500">Requires review</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-border/50">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">Fitness Certs Issued</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight">{loading ? '...' : dashboardData.fitnessCertsIssued}</div>
              <p className="text-xs font-medium mt-1 text-emerald-600 dark:text-emerald-500">Today</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="glass border-border/50 shadow-xl overflow-hidden h-full">
            
            <Tabs defaultValue="queue" className="w-full">
              <CardHeader className="border-b border-border/50 bg-muted/20 pb-0 pt-4 px-6">
                <div className="flex items-center justify-between">
                  <TabsList className="bg-transparent mb-[-1px]">
                    <TabsTrigger value="queue" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none pb-3 pt-2 px-4 text-base font-semibold">
                      Current Queue
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none pb-3 pt-2 px-4 text-base font-semibold">
                      History
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                
                <TabsContent value="queue" className="m-0 border-none outline-none">
                  <div className="divide-y divide-border/50">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                        <p className="text-lg font-medium">Loading queue...</p>
                      </div>
                    ) : dashboardData.currentQueue.length > 0 ? (
                      dashboardData.currentQueue.map((appt: any, index: number) => (
                        <motion.div key={appt._id} whileHover={{ x: 4, backgroundColor: 'rgba(var(--primary), 0.03)' }} className="flex items-center justify-between p-5 transition-colors gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
                              Q{appt.queueNumber || index + 1}
                            </div>
                            <div>
                              <h4 className="font-bold">{appt.patientId?.name || 'Unknown Patient'}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{appt.reasonForVisit || appt.type}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="secondary" className="shadow-sm">{appt.appointmentTime}</Badge>
                            <Button 
                              size="sm" 
                              onClick={() => navigate(`/consultation/${appt._id}`)}
                              className="shadow-sm hover:scale-105 transition-all bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              Start Consult <ArrowRight className="ml-2 h-3 w-3" />
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <UserCircle className="h-8 w-8 opacity-40 text-primary" />
                        </div>
                        <p className="text-lg font-medium">No patients currently in queue.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="history" className="m-0 border-none outline-none">
                  <div className="p-4 border-b border-border/50 bg-muted/10">
                    <input 
                      type="text"
                      placeholder="Search any patient's global history by mobile number or ID (e.g. EMP-123)..."
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-input/60 bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
                    />
                  </div>
                  <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto">
                    {historyLoading ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                        <p className="text-lg font-medium">Loading history...</p>
                      </div>
                    ) : history.length > 0 ? (
                      history.map((record: any) => (
                        <motion.div key={record._id} whileHover={{ backgroundColor: 'rgba(var(--primary), 0.03)' }} className="flex items-center justify-between p-5 transition-colors gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 font-bold shadow-inner">
                              <History className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold">{record.patientId?.name || 'Unknown Patient'}</h4>
                              <p className="text-sm text-muted-foreground mt-1 text-emerald-600 font-medium">
                                {record.diagnosis}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                                {record.doctorId && <span className="text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">Dr. {record.doctorId.name}</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              size="sm" 
                              onClick={() => navigate(`/consultation-history/${record._id}`)}
                              className="shadow-sm hover:scale-105 transition-all"
                            >
                              <FileText className="mr-2 h-4 w-4" /> View Details
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <History className="h-8 w-8 opacity-40 text-primary" />
                        </div>
                        <p className="text-lg font-medium">No past consultations found.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
              </CardContent>
            </Tabs>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass border-border/50 shadow-xl overflow-hidden h-full">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Button variant="outline" className="w-full justify-start h-14 rounded-xl hover:scale-105 transition-all bg-background/50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950 dark:hover:border-blue-800">
                <FileText className="mr-3 h-5 w-5 text-blue-500" />
                <span className="font-semibold">Write Prescription</span>
              </Button>
              <Button variant="outline" className="w-full justify-start h-14 rounded-xl hover:scale-105 transition-all bg-background/50 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-950 dark:hover:border-emerald-800">
                <Activity className="mr-3 h-5 w-5 text-emerald-500" />
                <span className="font-semibold">Issue Fitness Certificate</span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
