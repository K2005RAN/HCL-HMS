import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { 
  FileText, 
  History, 
  Activity, 
  AlertCircle, 
  Droplet, 
  UserCircle, 
  Calendar,
  Search,
  X,
  Stethoscope,
  CheckCircle,
  Clock,
  Eye,
  ChevronRight,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [data, setData] = useState<any>({ profile: null, history: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Date Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Change Password State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('HCIL2026');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg(null);

    try {
      await axios.put(
        `${API_BASE_URL}/api/auth/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordMsg({ type: 'success', text: 'Password updated successfully! Next time log in with your new password.' });
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
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

  useEffect(() => {
    if (token) {
      fetchDashboard();
    }
  }, [token]);

  const { profile, history = [] } = data;

  // Filtered History Records
  const filteredHistory = useMemo(() => {
    return history.filter((record: any) => {
      const query = searchQuery.trim().toLowerCase();
      const doctor = record.doctorId || {};

      // 1. Search Query Filter (Doctor Name, Diagnosis, Prescription, Symptoms)
      if (query) {
        const doctorName = (doctor.name || '').toLowerCase();
        const diagnosis = (record.diagnosis || '').toLowerCase();
        const symptoms = Array.isArray(record.symptoms) ? record.symptoms.join(' ').toLowerCase() : '';
        const medicines = Array.isArray(record.prescription)
          ? record.prescription.map((m: any) => m.medicineName || '').join(' ').toLowerCase()
          : '';

        const matches = 
          doctorName.includes(query) ||
          diagnosis.includes(query) ||
          symptoms.includes(query) ||
          medicines.includes(query);

        if (!matches) return false;
      }

      // 2. Date Filter
      if (filterDate) {
        const recDate = new Date(record.createdAt).toISOString().split('T')[0];
        if (recDate !== filterDate) return false;
      }

      return true;
    });
  }, [history, searchQuery, filterDate]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterDate('');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-muted-foreground gap-3 font-medium">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span>Loading your health portal & visit history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive flex items-center justify-center gap-2">
        <AlertCircle className="w-5 h-5" /> {error}
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-border/50 pb-6">
        <motion.div variants={itemVariants}>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            My Health Portal
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">
            Secure access to your HeidelbergCement medical visit records, prescriptions, and lab reports.
          </p>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-card border border-border/50 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center shadow-inner ring-1 ring-primary/20">
            <UserCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-bold text-lg">{profile?.name || user?.name || 'Employee'}</p>
            <p className="text-sm text-muted-foreground">ID: {profile?.patientId || 'PAT-0001'}</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Medical Profile Summary */}
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
                <span className="font-semibold text-foreground">{profile?.bloodGroup || 'AB+'}</span>
              </div>
              <div className="border-b border-border/50 pb-3 space-y-2">
                <span className="text-muted-foreground block text-sm font-semibold">Allergies</span>
                <p className="font-medium text-sm">
                  {profile?.allergies?.length > 0 ? profile.allergies.join(', ') : 'No known allergies'}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-muted-foreground block text-sm font-semibold">Chronic Conditions</span>
                <p className="font-medium text-sm">
                  {profile?.chronicDiseases?.length > 0 ? profile.chronicDiseases.join(', ') : 'None reported'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Account Security & Default Password Card */}
          <Card className="glass border-border/50 shadow-lg">
            <CardHeader className="bg-muted/20 border-b border-border/50 py-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" /> Account Security & Password
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Default password for first-time login is <strong className="text-foreground font-bold">HCIL2026</strong>. You can update your password below.
              </p>
              
              <form onSubmit={handlePasswordChange} className="space-y-3 pt-1">
                {passwordMsg && (
                  <div className={`p-2.5 rounded-lg text-xs font-semibold ${
                    passwordMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
                  }`}>
                    {passwordMsg.text}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground">Current / Default Password</label>
                  <Input
                    type="password"
                    placeholder="HCIL2026"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="h-9 text-xs bg-background/80"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground">New Custom Password</label>
                  <Input
                    type="password"
                    placeholder="Enter new custom password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-9 text-xs bg-background/80"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={passwordLoading || !newPassword}
                  size="sm"
                  className="w-full text-xs font-bold h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card className="glass border-border/50 shadow-lg bg-primary/5 border-primary/20">
            <CardContent className="p-6 space-y-2">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <Stethoscope className="h-5 w-5" /> Heidelberg OHC Center
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For routine checkups or emergency consultations, visit the Occupational Health Center or contact clinic staff.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Side: Consultation Visit Records Table */}
        <motion.div variants={itemVariants} className="md:col-span-2 space-y-4">
          {/* Search & Date Filter Bar */}
          <Card className="glass border-border/50 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search diagnosis, doctor name, or medicines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 h-10 text-xs bg-background/80 border-border/60 rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="h-10 text-xs bg-background/80 border-border/60 rounded-xl w-full sm:w-44"
                  />
                  {(searchQuery || filterDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-10 text-xs text-destructive hover:bg-destructive/10 rounded-xl font-bold"
                    >
                      <X className="h-4 w-4 mr-1" /> Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visits Table */}
          <Card className="glass border-border/50 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-extrabold text-foreground">
                <History className="w-5 h-5 text-primary" /> My Consultation History Records
              </CardTitle>
              <Badge variant="outline" className="bg-background text-xs font-bold">
                {filteredHistory.length} Visits Listed
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {filteredHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-foreground font-bold py-3.5 text-xs">Visit Date & Time</TableHead>
                        <TableHead className="text-foreground font-bold py-3.5 text-xs">Attending Doctor</TableHead>
                        <TableHead className="text-foreground font-bold py-3.5 text-xs">Diagnosis & Symptoms</TableHead>
                        <TableHead className="text-foreground font-bold py-3.5 text-xs">Prescription Status</TableHead>
                        <TableHead className="text-foreground font-bold py-3.5 text-xs">Lab Status</TableHead>
                        <TableHead className="text-right text-foreground font-bold py-3.5 text-xs">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((record: any) => {
                        const doctor = record.doctorId || {};
                        const isDispensed = record.pharmacyStatus === 'Dispensed';
                        const hasPrescription = Array.isArray(record.prescription) && record.prescription.length > 0;

                        return (
                          <TableRow key={record._id} className="border-border/50 hover:bg-muted/40 transition-colors">
                            {/* Visit Date */}
                            <TableCell className="py-3.5 font-semibold text-xs whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-foreground font-bold">
                                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                {new Date(record.createdAt).toLocaleDateString(undefined, {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-muted-foreground text-[11px] mt-0.5 pl-5">
                                {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </TableCell>

                            {/* Attending Doctor */}
                            <TableCell className="py-3.5">
                              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Stethoscope className="h-3.5 w-3.5 text-primary shrink-0" />
                                Dr. {doctor.name || 'OHC Medical Staff'}
                              </div>
                              {doctor.department && (
                                <div className="text-[11px] text-muted-foreground pl-5 font-medium">
                                  {doctor.department}
                                </div>
                              )}
                            </TableCell>

                            {/* Diagnosis & Symptoms */}
                            <TableCell className="py-3.5 max-w-[200px]">
                              <div className="font-semibold text-foreground text-xs line-clamp-2">
                                {record.diagnosis || 'General Consultation'}
                              </div>
                              {Array.isArray(record.symptoms) && record.symptoms.length > 0 && (
                                <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                  Symptoms: {record.symptoms.join(', ')}
                                </div>
                              )}
                            </TableCell>

                            {/* Prescription & Pharmacy Status */}
                            <TableCell className="py-3.5">
                              <div className="space-y-1">
                                {hasPrescription ? (
                                  <div className="text-xs font-semibold text-foreground line-clamp-1">
                                    {record.prescription.map((m: any) => m.medicineName).join(', ')}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">No Rx</span>
                                )}
                                <div>
                                  <Badge variant="outline" className={
                                    isDispensed
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0'
                                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold px-2 py-0'
                                  }>
                                    {isDispensed ? 'Pharmacy: Dispensed' : 'Pharmacy: Pending'}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>

                            {/* Lab Status */}
                            <TableCell className="py-3.5">
                              {record.labStatus === 'Completed' ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5">
                                  <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" /> Completed
                                </Badge>
                              ) : record.labStatus === 'Pending' ? (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold px-2.5 py-0.5">
                                  <Clock className="h-3 w-3 mr-1 text-amber-500" /> Pending
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground font-medium pl-1">No Record</span>
                              )}
                            </TableCell>

                            {/* Action Button */}
                            <TableCell className="text-right py-3.5">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => navigate(`/consultation-history/${record._id}`)}
                                className="shadow-sm hover:scale-105 transition-all text-xs font-bold rounded-xl gap-1.5"
                              >
                                <Eye className="h-3.5 w-3.5" /> View Details
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center border">
                    <History className="h-8 w-8 opacity-40 text-primary" />
                  </div>
                  <p className="text-lg font-bold text-foreground">No visit records found</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    {searchQuery || filterDate
                      ? "No records match your search query or date filter."
                      : "You do not have any recorded medical visits in the system yet."}
                  </p>
                  {(searchQuery || filterDate) && (
                    <Button variant="outline" onClick={clearFilters} className="rounded-xl mt-2 text-xs font-semibold">
                      Clear Search Filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
