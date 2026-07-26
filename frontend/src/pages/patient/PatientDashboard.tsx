import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { FileText, History, Activity, AlertCircle, Droplet, UserCircle, Printer } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [data, setData] = useState<any>({ profile: null, history: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/patient/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err: any) {
        console.error("Failed to fetch patient dashboard", err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchDashboard();
    }
  }, [token]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full pt-20 text-muted-foreground">Loading your health portal...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive flex items-center justify-center gap-2"><AlertCircle className="w-5 h-5"/> {error}</div>;
  }

  const { profile, history } = data;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-border/50 pb-6">
        <motion.div variants={itemVariants}>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">My Health Portal</h2>
          <p className="text-muted-foreground mt-2 text-lg">Secure access to your HeidelbergCement medical records.</p>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-card border border-border/50 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center shadow-inner ring-1 ring-primary/20">
             <UserCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-bold text-lg">{profile?.name || user?.name || 'Employee'}</p>
            <p className="text-sm text-muted-foreground">ID: {profile?.patientId || 'N/A'}</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="md:col-span-1 space-y-6">
          <Card className="glass border-border/50 shadow-lg">
            <CardHeader className="bg-muted/20 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" /> Medical Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-rose-500" /> Blood Group
                </span>
                <span className="font-semibold text-foreground">{profile?.bloodGroup || 'Unknown'}</span>
              </div>
              <div className="border-b border-border/50 pb-3 space-y-2">
                <span className="text-muted-foreground block text-sm">Allergies</span>
                <p className="font-medium text-sm">
                  {profile?.allergies?.length > 0 ? profile.allergies.join(', ') : 'No known allergies'}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-muted-foreground block text-sm">Chronic Conditions</span>
                <p className="font-medium text-sm">
                  {profile?.chronicDiseases?.length > 0 ? profile.chronicDiseases.join(', ') : 'None reported'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-border/50 shadow-lg bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2 text-primary">Need an appointment?</h3>
              <p className="text-sm text-muted-foreground mb-4">You can request an appointment with the Occupational Health Center by visiting the clinic during working hours.</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="glass border-border/50 shadow-xl overflow-hidden h-full">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 pt-5 px-6 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <History className="w-5 h-5 text-primary" /> Visit History
              </CardTitle>
              <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                {history.length} Visits
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto custom-scrollbar">
                {history.length > 0 ? (
                  history.map((record: any) => (
                    <motion.div key={record._id} whileHover={{ backgroundColor: 'rgba(var(--primary), 0.03)' }} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 transition-colors gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-lg">{new Date(record.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
                        </div>
                        <p className="text-emerald-600 font-semibold">{record.diagnosis}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          Dr. {record.doctorId?.name || 'Authorized Physician'} • {record.doctorId?.department || 'OHC'}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Button 
                          variant="outline"
                          onClick={() => navigate(`/consultation-history/${record._id}`)}
                          className="shadow-sm hover:scale-105 transition-transform"
                        >
                          <Printer className="mr-2 h-4 w-4" /> View Prescription
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
                    <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <History className="h-10 w-10 opacity-40 text-primary" />
                    </div>
                    <p className="text-xl font-medium mb-1">No medical history found</p>
                    <p className="text-sm">You have not had any recorded visits to the clinic yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
