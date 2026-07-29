import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  X, 
  RefreshCw, 
  Stethoscope, 
  Phone, 
  ChevronRight,
  Eye,
  TestTube
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';

export default function DoctorHistoryPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simplified Clean Search & Date Filters ONLY
  const [nameOrPhoneQuery, setNameOrPhoneQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
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

  // Clean Multi-Visit Filter Logic: Name, Mobile Number, Patient ID, and Date
  const filteredHistory = useMemo(() => {
    return history.filter((record: any) => {
      const patient = record.patientId || {};
      const query = nameOrPhoneQuery.trim().toLowerCase();

      // 1. Filter by Name, Mobile Number, or Patient ID
      if (query) {
        const patientName = (patient.name || '').toLowerCase();
        const patientId = (patient.patientId || '').toLowerCase();
        const phone = (patient.phone || '').toLowerCase();
        const email = (patient.email || '').toLowerCase();

        const matchesQuery = 
          patientName.includes(query) ||
          phone.includes(query) ||
          patientId.includes(query) ||
          email.includes(query);

        if (!matchesQuery) return false;
      }

      // 2. Filter by Visit Date
      if (filterDate) {
        const recordDateStr = new Date(record.createdAt).toISOString().split('T')[0];
        if (recordDateStr !== filterDate) return false;
      }

      return true;
    });
  }, [history, nameOrPhoneQuery, filterDate]);

  // Statistics
  const stats = useMemo(() => {
    const totalRecords = history.length;
    const uniquePatients = new Set(history.map(r => r.patientId?._id || r.patientId?.patientId || r.patientId?.name)).size;
    const filteredCount = filteredHistory.length;
    return { totalRecords, uniquePatients, filteredCount };
  }, [history, filteredHistory]);

  const clearFilters = () => {
    setNameOrPhoneQuery('');
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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
              <History className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Patient Visit History
              </h2>
              <p className="text-muted-foreground mt-0.5 text-sm sm:text-base">
                Search all past visits by patient name or mobile number, filter by date, and view full consultation reports.
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
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </motion.div>
      </div>

      {/* Simplified Filter & Search Controls */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50 shadow-lg">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Name & Mobile Number Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by Patient Name or Mobile Number..."
                  value={nameOrPhoneQuery}
                  onChange={(e) => setNameOrPhoneQuery(e.target.value)}
                  className="pl-11 pr-10 h-12 bg-background/80 border-border/60 focus:ring-2 focus:ring-primary/40 rounded-xl text-base shadow-sm"
                />
                {nameOrPhoneQuery && (
                  <button
                    onClick={() => setNameOrPhoneQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-56">
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="h-12 bg-background/80 border-border/60 focus:ring-2 focus:ring-primary/40 rounded-xl text-sm shadow-sm"
                  />
                </div>

                {(nameOrPhoneQuery || filterDate) && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="h-12 px-3 text-xs text-destructive hover:bg-destructive/10 rounded-xl shrink-0 font-bold"
                  >
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Results Count & Filter Status */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40 font-semibold">
              <span>
                Showing <strong className="text-foreground font-bold">{stats.filteredCount}</strong> visit records (Out of {stats.totalRecords} total)
              </span>
              {nameOrPhoneQuery && (
                <span className="text-primary font-bold">
                  Searching for: "{nameOrPhoneQuery}"
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Visits Results Table */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 py-4 px-6">
            <CardTitle className="text-lg font-extrabold text-foreground flex items-center justify-between">
              <span>Patient Consultation History Records</span>
              <Badge variant="outline" className="text-xs bg-background font-bold">
                {stats.filteredCount} Visits Found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 text-center text-muted-foreground font-medium flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span>Loading patient history records...</span>
              </div>
            ) : filteredHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-foreground font-bold py-4">Visit Date & Time</TableHead>
                      <TableHead className="text-foreground font-bold py-4">Patient Name & Contact</TableHead>
                      <TableHead className="text-foreground font-bold py-4">Attending Doctor</TableHead>
                      <TableHead className="text-foreground font-bold py-4">Diagnosis & Complaints</TableHead>
                      <TableHead className="text-foreground font-bold py-4">Prescription & Status</TableHead>
                      <TableHead className="text-foreground font-bold py-4">Lab Status</TableHead>
                      <TableHead className="text-right text-foreground font-bold py-4">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((record: any) => {
                      const patient = record.patientId || {};
                      const doctor = record.doctorId || {};
                      const isDispensed = record.pharmacyStatus === 'Dispensed';
                      const hasPrescription = Array.isArray(record.prescription) && record.prescription.length > 0;

                      return (
                        <TableRow
                          key={record._id}
                          className="border-border/50 hover:bg-muted/40 transition-colors"
                        >
                          {/* Visit Date & Time */}
                          <TableCell className="py-4 font-semibold text-xs whitespace-nowrap">
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

                          {/* Patient Name & Contact */}
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <div className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
                                <User className="h-4 w-4 text-primary shrink-0" />
                                {patient.name || 'Unknown Patient'}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {patient.patientId && (
                                  <Badge variant="outline" className="text-[10px] bg-muted font-bold px-1.5 py-0">
                                    ID: {patient.patientId}
                                  </Badge>
                                )}
                                {patient.phone && (
                                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-primary" /> {patient.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Attending Doctor */}
                          <TableCell className="py-4">
                            <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                              <Stethoscope className="h-4 w-4 text-primary shrink-0" />
                              Dr. {doctor.name || 'Staff Doctor'}
                            </div>
                            {doctor.specialization && (
                              <div className="text-xs text-muted-foreground pl-5.5 font-medium">
                                {doctor.specialization}
                              </div>
                            )}
                          </TableCell>

                          {/* Diagnosis & Complaints */}
                          <TableCell className="py-4 max-w-[240px]">
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
                          <TableCell className="py-4">
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
                          <TableCell className="py-4">
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

                          {/* Action Button for Full Visit Details */}
                          <TableCell className="text-right py-4">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => navigate(`/consultation-history/${record._id}`)}
                              className="shadow-sm hover:scale-105 transition-all text-xs font-bold rounded-xl gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5" /> Full Visit Details
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
                <p className="text-lg font-bold text-foreground">No patient visit records found</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {nameOrPhoneQuery || filterDate
                    ? "No records match your current search query or date filter."
                    : "No consultation history records exist in the system yet."}
                </p>
                {(nameOrPhoneQuery || filterDate) && (
                  <Button variant="outline" onClick={clearFilters} className="rounded-xl mt-2 text-xs font-semibold">
                    Clear Search Filters
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
