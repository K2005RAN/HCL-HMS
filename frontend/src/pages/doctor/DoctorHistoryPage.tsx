import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Search, 
  FileText, 
  User, 
  Calendar, 
  Pill, 
  CheckCircle, 
  Clock, 
  Filter, 
  X, 
  RefreshCw, 
  Activity, 
  Stethoscope, 
  Heart, 
  Phone, 
  Mail, 
  MapPin,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';

export default function DoctorHistoryPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'super admin';
  
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('ALL');
  const [selectedGender, setSelectedGender] = useState('ALL');
  const [selectedPharmacyStatus, setSelectedPharmacyStatus] = useState('ALL');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('ALL');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Fetch all medical records (admin/global view)
      const res = await axios.get(`${API_BASE_URL}/api/doctor/history?global=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data || []);
    } catch (err) {
      console.error("Failed to fetch patient history", err);
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

  // Comprehensive Multi-Field Filter Logic
  const filteredHistory = useMemo(() => {
    return history.filter((record: any) => {
      const patient = record.patientId || {};
      const doctor = record.doctorId || {};
      const query = searchQuery.trim().toLowerCase();

      // 1. Search Query Filter across multiple fields
      if (query) {
        const patientName = (patient.name || '').toLowerCase();
        const patientId = (patient.patientId || '').toLowerCase();
        const phone = (patient.phone || '').toLowerCase();
        const email = (patient.email || '').toLowerCase();
        const address = (patient.address || '').toLowerCase();
        const doctorName = (doctor.name || '').toLowerCase();
        const doctorSpec = (doctor.specialization || '').toLowerCase();
        const doctorDept = (doctor.department || '').toLowerCase();
        const diagnosis = (record.diagnosis || '').toLowerCase();
        const symptoms = Array.isArray(record.symptoms) ? record.symptoms.join(' ').toLowerCase() : '';
        const labRequests = Array.isArray(record.labRequests) ? record.labRequests.join(' ').toLowerCase() : '';
        const medicines = Array.isArray(record.prescription) 
          ? record.prescription.map((m: any) => `${m.medicineName || ''} ${m.dosage || ''} ${m.instructions || ''}`).join(' ').toLowerCase()
          : '';

        const matchesQuery = 
          patientName.includes(query) ||
          patientId.includes(query) ||
          phone.includes(query) ||
          email.includes(query) ||
          address.includes(query) ||
          doctorName.includes(query) ||
          doctorSpec.includes(query) ||
          doctorDept.includes(query) ||
          diagnosis.includes(query) ||
          symptoms.includes(query) ||
          labRequests.includes(query) ||
          medicines.includes(query);

        if (!matchesQuery) return false;
      }

      // 2. Blood Group Filter
      if (selectedBloodGroup !== 'ALL') {
        const bg = (patient.bloodGroup || '').toUpperCase().trim();
        if (bg !== selectedBloodGroup.toUpperCase()) return false;
      }

      // 3. Gender Filter
      if (selectedGender !== 'ALL') {
        const gender = (patient.gender || '').toLowerCase().trim();
        if (gender !== selectedGender.toLowerCase()) return false;
      }

      // 4. Pharmacy Status Filter
      if (selectedPharmacyStatus !== 'ALL') {
        const status = record.pharmacyStatus || 'Pending';
        if (selectedPharmacyStatus === 'Dispensed' && status !== 'Dispensed') return false;
        if (selectedPharmacyStatus === 'Pending' && status === 'Dispensed') return false;
      }

      // 5. Time Period Filter
      if (selectedTimePeriod !== 'ALL') {
        const recordDate = new Date(record.createdAt);
        const now = new Date();

        if (selectedTimePeriod === 'TODAY') {
          const isToday = recordDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (selectedTimePeriod === '7DAYS') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (recordDate < sevenDaysAgo) return false;
        } else if (selectedTimePeriod === '30DAYS') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (recordDate < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [history, searchQuery, selectedBloodGroup, selectedGender, selectedPharmacyStatus, selectedTimePeriod]);

  // Statistics Computations
  const stats = useMemo(() => {
    const totalRecords = history.length;
    const uniquePatientIds = new Set(history.map(r => r.patientId?._id || r.patientId?.patientId || r.patientId?.name)).size;
    const dispensedCount = history.filter(r => r.pharmacyStatus === 'Dispensed').length;
    const pendingCount = totalRecords - dispensedCount;

    return { totalRecords, uniquePatientIds, dispensedCount, pendingCount };
  }, [history]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedBloodGroup !== 'ALL') count++;
    if (selectedGender !== 'ALL') count++;
    if (selectedPharmacyStatus !== 'ALL') count++;
    if (selectedTimePeriod !== 'ALL') count++;
    return count;
  }, [searchQuery, selectedBloodGroup, selectedGender, selectedPharmacyStatus, selectedTimePeriod]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedBloodGroup('ALL');
    setSelectedGender('ALL');
    setSelectedPharmacyStatus('ALL');
    setSelectedTimePeriod('ALL');
  };

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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
              <History className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Patient History & Medical Records
              </h2>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Search and review complete patient consultation histories, diagnoses, vitals, and pharmacy dispensing records across all hospital departments.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={fetchHistory}
            disabled={loading}
            className="rounded-xl shadow-sm hover:scale-105 transition-all bg-background/50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Records
          </Button>
        </motion.div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <motion.div variants={itemVariants}>
          <Card className="glass border-border/50 hover:shadow-lg transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Consultations</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-foreground">{loading ? '...' : stats.totalRecords}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">All recorded visits</p>
              </div>
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass border-border/50 hover:shadow-lg transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unique Patients</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-foreground">{loading ? '...' : stats.uniquePatientIds}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Patients treated</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <UserCheck className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass border-border/50 hover:shadow-lg transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pharmacy Dispensed</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">{loading ? '...' : stats.dispensedCount}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Fulfilled & Billed</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass border-border/50 hover:shadow-lg transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Pharmacy</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-amber-600 dark:text-amber-400">{loading ? '...' : stats.pendingCount}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Awaiting medicine issue</p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Search & Multi-Field Filter Panel */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Primary Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by Patient Name, ID, Mobile, Email, Doctor, Diagnosis, Medicines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-10 h-12 bg-background/80 border-border/60 focus:ring-2 focus:ring-primary/40 rounded-xl text-base shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Active Filter Clear Button */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={clearAllFilters}
                  className="text-xs text-destructive hover:bg-destructive/10 rounded-xl flex items-center gap-1.5 self-end md:self-center"
                >
                  <X className="h-3.5 w-3.5" /> Clear Filters ({activeFiltersCount})
                </Button>
              )}
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {/* Blood Group Filter */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Blood Group
                </label>
                <select
                  value={selectedBloodGroup}
                  onChange={(e) => setSelectedBloodGroup(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-border/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-foreground shadow-sm"
                >
                  <option value="ALL">All Blood Groups</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              {/* Gender Filter */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Gender
                </label>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-border/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-foreground shadow-sm"
                >
                  <option value="ALL">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Pharmacy Status Filter */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Pharmacy Status
                </label>
                <select
                  value={selectedPharmacyStatus}
                  onChange={(e) => setSelectedPharmacyStatus(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-border/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-foreground shadow-sm"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Dispensed">Dispensed & Billed</option>
                  <option value="Pending">Pending Issue</option>
                </select>
              </div>

              {/* Time Period Filter */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Time Period
                </label>
                <select
                  value={selectedTimePeriod}
                  onChange={(e) => setSelectedTimePeriod(e.target.value)}
                  className="w-full h-10 px-3 bg-background border border-border/60 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-foreground shadow-sm"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="7DAYS">Past 7 Days</option>
                  <option value="30DAYS">Past 30 Days</option>
                </select>
              </div>
            </div>

            {/* Results Count Header */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 font-semibold border-t border-border/40">
              <span>
                Showing <strong className="text-foreground font-bold">{filteredHistory.length}</strong> of{' '}
                <strong className="text-foreground font-bold">{history.length}</strong> total patient records
              </span>
              {activeFiltersCount > 0 && (
                <span className="text-primary font-bold">Filtered View Active</span>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 text-center text-muted-foreground font-medium flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span>Loading consultation records...</span>
              </div>
            ) : filteredHistory.length > 0 ? (
              <div className="divide-y divide-border/50">
                {filteredHistory.map((record: any) => {
                  const patient = record.patientId || {};
                  const doctor = record.doctorId || {};
                  const isDispensed = record.pharmacyStatus === 'Dispensed';

                  return (
                    <motion.div
                      key={record._id}
                      whileHover={{ backgroundColor: 'rgba(var(--primary), 0.02)' }}
                      className="p-6 transition-colors space-y-4"
                    >
                      {/* Patient & Consultation Header */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-extrabold shadow-inner shrink-0">
                            <User className="h-7 w-7 text-primary" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-extrabold text-xl text-foreground tracking-tight">
                                {patient.name || 'Unknown Patient'}
                              </h4>
                              {patient.patientId && (
                                <Badge variant="outline" className="text-xs bg-muted font-bold">
                                  ID: {patient.patientId}
                                </Badge>
                              )}
                              {patient.bloodGroup && (
                                <Badge className="text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-extrabold">
                                  {patient.bloodGroup}
                                </Badge>
                              )}
                              {patient.gender && (
                                <Badge variant="secondary" className="text-xs capitalize font-semibold">
                                  {patient.gender}
                                </Badge>
                              )}
                            </div>

                            {/* Patient Contact Line */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1 font-medium">
                              {patient.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5 text-primary" /> {patient.phone}
                                </span>
                              )}
                              {patient.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3.5 w-3.5 text-primary" /> {patient.email}
                                </span>
                              )}
                              {patient.address && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-primary" /> {patient.address}
                                </span>
                              )}
                            </div>

                            {/* Consultation Date & Attending Doctor */}
                            <div className="text-xs text-muted-foreground mt-2 flex flex-wrap items-center gap-2 font-medium">
                              <span className="flex items-center gap-1 bg-muted/50 px-2.5 py-1 rounded-lg border">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                {new Date(record.createdAt).toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </span>

                              {doctor.name && (
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-bold border border-primary/20 flex items-center gap-1.5">
                                  <Stethoscope className="h-3.5 w-3.5" />
                                  Dr. {doctor.name} ({doctor.specialization || 'General Physician'})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Record Details CTA */}
                        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigate(`/consultation-history/${record._id}`)}
                            className="shadow-md hover:scale-105 transition-all rounded-xl font-bold gap-2"
                          >
                            <FileText className="h-4 w-4" /> View Full Record
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Vitals Summary Pill Strip */}
                      {(record.bloodPressure || record.pulse || record.temperature || record.weight || record.bmi) && (
                        <div className="flex flex-wrap gap-2 bg-muted/30 p-3 rounded-xl border border-border/40 text-xs font-semibold text-foreground">
                          {record.bloodPressure && (
                            <span className="flex items-center gap-1 bg-background px-2.5 py-1 rounded-lg border shadow-2xs">
                              <Activity className="h-3.5 w-3.5 text-rose-500" /> BP: <strong className="font-bold">{record.bloodPressure}</strong>
                            </span>
                          )}
                          {record.pulse && (
                            <span className="flex items-center gap-1 bg-background px-2.5 py-1 rounded-lg border shadow-2xs">
                              <Heart className="h-3.5 w-3.5 text-red-500" /> Pulse: <strong className="font-bold">{record.pulse} bpm</strong>
                            </span>
                          )}
                          {record.temperature && (
                            <span className="flex items-center gap-1 bg-background px-2.5 py-1 rounded-lg border shadow-2xs">
                              Temp: <strong className="font-bold">{record.temperature} °F</strong>
                            </span>
                          )}
                          {record.weight && (
                            <span className="flex items-center gap-1 bg-background px-2.5 py-1 rounded-lg border shadow-2xs">
                              Weight: <strong className="font-bold">{record.weight} kg</strong>
                            </span>
                          )}
                          {record.bmi && (
                            <span className="flex items-center gap-1 bg-background px-2.5 py-1 rounded-lg border shadow-2xs">
                              BMI: <strong className="font-bold">{record.bmi}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Diagnosis & Prescription Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-border/50 text-sm">
                        {/* Diagnosis & Symptoms */}
                        <div className="space-y-2">
                          <span className="font-bold text-foreground block text-xs uppercase tracking-wider text-muted-foreground">
                            Diagnosis & Clinical Findings
                          </span>
                          <p className="text-foreground font-semibold leading-relaxed bg-background/60 p-3 rounded-xl border border-border/40 whitespace-pre-wrap">
                            {record.diagnosis}
                          </p>

                          {Array.isArray(record.symptoms) && record.symptoms.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-xs font-bold text-muted-foreground">Symptoms:</span>
                              {record.symptoms.map((s: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-background font-medium">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Prescription & Pharmacy Billing Status */}
                        <div className="space-y-2">
                          <span className="font-bold text-foreground flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Pill className="h-4 w-4 text-primary" />
                              Prescriptions & Pharmacy Status
                            </span>
                          </span>

                          {record.prescription?.length > 0 ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1.5">
                                {record.prescription.map((m: any, idx: number) => (
                                  <span key={idx} className="bg-background px-3 py-1.5 rounded-lg border border-border/50 text-xs font-semibold shadow-2xs">
                                    {m.medicineName} ({m.dosage}) {m.instructions ? `- ${m.instructions}` : ''}
                                  </span>
                                ))}
                              </div>

                              <div className="pt-2 flex items-center justify-between">
                                <Badge variant="outline" className={
                                  isDispensed 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold px-3 py-1 rounded-lg' 
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold px-3 py-1 rounded-lg'
                                }>
                                  {isDispensed ? <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> : <Clock className="h-3.5 w-3.5 mr-1.5" />}
                                  {isDispensed 
                                    ? `Pharmacy Status: Dispensed & Billed (₹${record.pharmacyBilledAmount || 0})`
                                    : 'Pharmacy Status: Pending Dispensing'}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic bg-background/40 p-3 rounded-xl border border-dashed">
                              No medicines prescribed for this visit.
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-muted/60 flex items-center justify-center border">
                  <History className="h-8 w-8 opacity-40 text-primary" />
                </div>
                <p className="text-xl font-extrabold text-foreground">No patient records found</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {activeFiltersCount > 0
                    ? "Try adjusting your search terms or clearing active filters to see patient histories."
                    : "No consultation history has been recorded in the hospital system yet."}
                </p>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={clearAllFilters} className="rounded-xl mt-2 font-semibold">
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
