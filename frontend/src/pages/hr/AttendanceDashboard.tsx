import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, CheckCircle, XCircle, Search, Calendar, UserPlus, LogOut, UserCheck, AlertCircle, ShieldCheck, Trash2, KeyRound, CalendarRange, Percent, BarChart3, RefreshCw, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import StaffCSVImportWizard from '@/components/attendance/StaffCSVImportWizard';

export default function AttendanceDashboard() {
  const { user, token } = useAuth();
  const isAdmin = ['admin', 'super admin', 'hr'].includes((user?.role || '').toLowerCase());

  // Staff Directory & Attendance State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // History & Monthly Filter State
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalCount: 0,
    totalDbRecords: 0,
    totalStaffCount: 0,
    presentCount: 0,
    signedOffCount: 0,
    markedDaysCount: 0,
    absentCount: 0,
    daysInPeriod: 30,
    attendancePercentage: '0.0'
  });
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // e.g. '2026-07'
  const [logFilterDate, setLogFilterDate] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Add Staff Manual State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [addMode, setAddMode] = useState<'manual' | 'csv'>('manual');
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Emergency',
    shift: 'Morning',
    designation: 'Staff Nurse',
    password: ''
  });
  const [addingStaff, setAddingStaff] = useState(false);
  const [addStaffMsg, setAddStaffMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete Staff Security Modal State
  const [staffToDelete, setStaffToDelete] = useState<any | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [deletingStaff, setDeletingStaff] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch staff members (Admins get all; Doctor/Lab/Pharmacy get ONLY their own record)
  const fetchStaffMembers = async () => {
    if (!token) return;
    setSearching(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/attendance/search-staff?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Fetch staff error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Fetch logs (Admins get all/filtered; Doctor/Lab/Pharmacy get ONLY their own history)
  const fetchLogs = async () => {
    if (!token) return;
    setLogsLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/attendance/admin-logs?month=${selectedMonth}&date=${logFilterDate}&staffId=${selectedStaffId}&search=${logSearchQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLogs(res.data.records || []);
      setStats(res.data.stats || {});
    } catch (err) {
      console.error('Failed to fetch attendance logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffMembers();
  }, [token, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [token, selectedMonth, logFilterDate, selectedStaffId, logSearchQuery]);

  // Give Attendance (Clock In)
  const handleGiveAttendance = async (staffMember: any) => {
    setActionLoading(true);
    setAttendanceMsg(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/attendance/give-attendance`, {
        staffId: staffMember.staffId,
        staffName: staffMember.name,
        department: staffMember.department,
        shift: 'Morning'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceMsg({ type: 'success', text: `Attendance marked as PRESENT for ${staffMember.name} (${staffMember.staffId})` });
      fetchStaffMembers();
      fetchLogs();
    } catch (err: any) {
      console.error('Give attendance error:', err);
      setAttendanceMsg({ type: 'error', text: err.response?.data?.message || 'Failed to mark attendance.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Sign Off (Clock Out)
  const handleSignOff = async (staffMember: any) => {
    setActionLoading(true);
    setAttendanceMsg(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/attendance/sign-off`, {
        staffId: staffMember.staffId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceMsg({ type: 'success', text: `Signed off successfully for ${staffMember.name} (${staffMember.staffId})!` });
      fetchStaffMembers();
      fetchLogs();
    } catch (err: any) {
      console.error('Sign off error:', err);
      setAttendanceMsg({ type: 'error', text: err.response?.data?.message || 'Failed to sign off.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Add Manual Staff Submit
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingStaff(true);
    setAddStaffMsg(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/attendance/add-staff`, manualForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddStaffMsg({ type: 'success', text: `Staff ${manualForm.name} registered with Staff ID: ${res.data.staff?.staffId}` });
      setManualForm({
        name: '', email: '', phone: '', department: 'Emergency', shift: 'Morning', designation: 'Staff Nurse', password: ''
      });
      fetchStaffMembers();
      fetchLogs();
    } catch (err: any) {
      console.error('Add staff failed:', err);
      setAddStaffMsg({ type: 'error', text: err.response?.data?.message || 'Failed to add staff.' });
    } finally {
      setAddingStaff(false);
    }
  };

  // Delete Staff Submit (Verifies Admin Password)
  const handleDeleteStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffToDelete || !adminPassword) return;

    setDeletingStaff(true);
    setDeleteMsg(null);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/attendance/delete-staff`, {
        staffId: staffToDelete.staffId,
        adminPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDeleteMsg({ type: 'success', text: res.data.message || 'Staff member deleted successfully!' });
      setTimeout(() => {
        setStaffToDelete(null);
        setAdminPassword('');
        setDeleteMsg(null);
        fetchStaffMembers();
        fetchLogs();
      }, 1000);
    } catch (err: any) {
      console.error('Delete staff failed:', err);
      setDeleteMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete staff. Please verify your admin password.' });
    } finally {
      setDeletingStaff(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedStaffId('all');
    setSelectedMonth(new Date().toISOString().slice(0, 7));
    setLogFilterDate('');
    setLogSearchQuery('');
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const selectedStaffObj = searchResults.find(s => s.staffId === selectedStaffId);
  const mySelfStaff = searchResults[0]; // For non-admins, searchResults strictly contains only their own profile!

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {isAdmin ? 'Hospital Staff & Attendance Management' : 'My Personal Attendance & Shift Portal'}
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">
            {isAdmin 
              ? 'Give daily attendance, sign off shifts, and track detailed monthly hospital attendance reports.' 
              : `Clock in for your shift, sign off at shift completion, and review your monthly attendance record.`}
          </p>
        </motion.div>

        {isAdmin && (
          <motion.div variants={itemVariants} className="flex gap-2">
            <Button 
              onClick={() => setShowAddStaffModal(true)}
              className="shadow-lg shadow-primary/20 hover:scale-105 transition-transform bg-gradient-to-r from-primary to-indigo-600 font-bold gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Hospital Staff (Manual / CSV)
            </Button>
          </motion.div>
        )}
      </div>

      {/* Staff Attendance Portal Section */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  {isAdmin ? 'Hospital Staff Attendance Portal' : 'My Shift Clock In & Sign Off'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAdmin 
                    ? 'All registered hospital staff members are listed below. Click "Give Attendance" to clock in or "Sign Off" to complete shift.'
                    : 'Your personal attendance card. Click "Give Attendance" to clock in or "Sign Off" when your shift ends.'}
                </CardDescription>
              </div>

              {/* Search Filter Bar (Admin Only) */}
              {isAdmin && (
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter staff by ID, Name, Phone..."
                    className="pl-8 h-9 bg-background/80 border-border/60 text-xs shadow-sm"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Attendance Alert Notification */}
            {attendanceMsg && (
              <div className="p-4 border-b">
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${attendanceMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                  {attendanceMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {attendanceMsg.text}
                </div>
              </div>
            )}

            {/* Non-Admin Personal Profile Card */}
            {!isAdmin ? (
              <div className="p-6">
                {mySelfStaff ? (
                  <Card className="border-primary/30 bg-primary/5 shadow-md">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/20 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xl">
                            {mySelfStaff.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                              {mySelfStaff.name}
                              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">
                                {mySelfStaff.staffId}
                              </Badge>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {mySelfStaff.department} Department • {mySelfStaff.role} • {mySelfStaff.phone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">Today's Status:</span>
                          <Badge variant="outline" className={
                            mySelfStaff.todayStatus === 'Present' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-3 py-1 text-xs' :
                            mySelfStaff.todayStatus === 'Signed Off' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold px-3 py-1 text-xs' :
                            'bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-3 py-1 text-xs'
                          }>
                            {mySelfStaff.todayStatus === 'Present' ? `Present (${formatTime(mySelfStaff.clockIn)})` :
                             mySelfStaff.todayStatus === 'Signed Off' ? `Signed Off (${formatTime(mySelfStaff.clockOut)})` :
                             'Not Marked Yet'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                          size="lg"
                          disabled={actionLoading || mySelfStaff.todayStatus === 'Present' || mySelfStaff.todayStatus === 'Signed Off'}
                          onClick={() => handleGiveAttendance(mySelfStaff)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold gap-2 shadow-lg h-12 text-sm"
                        >
                          <CheckCircle className="w-5 h-5" />
                          {mySelfStaff.todayStatus === 'Present' ? 'Attendance Marked (Present)' : mySelfStaff.todayStatus === 'Signed Off' ? 'Shift Completed' : 'Give My Attendance (Clock In)'}
                        </Button>

                        <Button
                          size="lg"
                          variant="outline"
                          disabled={actionLoading || mySelfStaff.todayStatus !== 'Present'}
                          onClick={() => handleSignOff(mySelfStaff)}
                          className="flex-1 border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 font-extrabold gap-2 h-12 text-sm"
                        >
                          <LogOut className="w-5 h-5" />
                          Sign Off Shift (Clock Out)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Loading your attendance profile details...
                  </div>
                )}
              </div>
            ) : (
              /* Admin Full Staff Directory Table */
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-foreground font-semibold py-3 text-xs">Staff ID</TableHead>
                    <TableHead className="text-foreground font-semibold py-3 text-xs">Staff Name</TableHead>
                    <TableHead className="text-foreground font-semibold py-3 text-xs">Department & Role</TableHead>
                    <TableHead className="text-foreground font-semibold py-3 text-xs">Contact Phone</TableHead>
                    <TableHead className="text-foreground font-semibold py-3 text-xs">Today's Status</TableHead>
                    <TableHead className="text-foreground font-semibold py-3 text-xs text-right">Attendance Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searching ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                        Loading hospital staff directory...
                      </TableCell>
                    </TableRow>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((staff) => (
                      <TableRow key={staff.staffId} className="border-border/50 hover:bg-muted/40 transition-colors text-xs">
                        <TableCell className="font-mono font-bold text-primary py-3">{staff.staffId}</TableCell>
                        <TableCell className="font-bold text-foreground py-3">{staff.name}</TableCell>
                        <TableCell className="text-muted-foreground py-3">
                          <span className="font-semibold text-foreground">{staff.department}</span>
                          <span className="text-[11px] block text-muted-foreground">{staff.role}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground py-3">{staff.phone}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={
                            staff.todayStatus === 'Present' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold' :
                            staff.todayStatus === 'Signed Off' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold' :
                            'bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold'
                          }>
                            {staff.todayStatus === 'Present' ? `Present (${formatTime(staff.clockIn)})` :
                             staff.todayStatus === 'Signed Off' ? `Signed Off (${formatTime(staff.clockOut)})` :
                             'Not Marked Yet'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button
                              size="sm"
                              disabled={actionLoading || staff.todayStatus === 'Present' || staff.todayStatus === 'Signed Off'}
                              onClick={() => handleGiveAttendance(staff)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {staff.todayStatus === 'Present' ? 'Present' : staff.todayStatus === 'Signed Off' ? 'Completed' : 'Give Attendance'}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading || staff.todayStatus !== 'Present'}
                              onClick={() => handleSignOff(staff)}
                              className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold text-xs h-8 px-3 gap-1"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Sign Off
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setStaffToDelete(staff);
                                setAdminPassword('');
                                setDeleteMsg(null);
                              }}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 h-8 w-8 p-0 rounded-lg"
                              title="Delete Staff Member (Admin Only)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                        No hospital staff found matching "{searchQuery}". Click "Add Hospital Staff" to add new staff.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl transition-all border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">Days Present / Marked</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-500">{stats.markedDaysCount || 0} Days</div>
              <p className="text-[11px] text-muted-foreground mt-1">Out of {stats.daysInPeriod || 30} days in selected month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl transition-all border-rose-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-rose-600 dark:text-rose-500">Days Absent / Unmarked</CardTitle>
              <div className="p-2 rounded-xl bg-rose-500/10">
                <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-500">{stats.absentCount || 0} Days</div>
              <p className="text-[11px] text-muted-foreground mt-1">Unmarked shift days</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl transition-all border-indigo-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Monthly Attendance Rate</CardTitle>
              <div className="p-2 rounded-xl bg-indigo-500/10">
                <Percent className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.attendancePercentage || '0.0'}%</div>
              <p className="text-[11px] text-muted-foreground mt-1">Monthly percentage record</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl transition-all border-slate-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500">Total Log History</CardTitle>
              <div className="p-2 rounded-xl bg-slate-500/10">
                <BarChart3 className="h-4 w-4 text-slate-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-700 dark:text-slate-300">{stats.totalCount || 0}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Recorded shift entries</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Attendance History Table Section */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-primary" />
                  {isAdmin ? 'Staff Monthly & Daily Attendance History' : 'My Personal Attendance History Logs'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAdmin
                    ? 'Select a staff member and month to view their complete attendance breakdown and log history.'
                    : 'Select a month to view your detailed shift check-in and sign-off records.'}
                </CardDescription>
              </div>

              {/* Month Selector for All Users */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-9 w-40 text-xs bg-background/50 font-semibold"
                />
                {isAdmin && (
                  <Button size="sm" variant="outline" onClick={handleResetFilters} className="gap-1 text-xs font-bold">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Admin Extra Filter Controls */}
            {isAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/40">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-muted-foreground">Select Staff Member</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm font-semibold"
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                  >
                    <option value="all">All Hospital Staff Members</option>
                    {searchResults.map((s) => (
                      <option key={s.staffId} value={s.staffId}>
                        {s.staffId} - {s.name} ({s.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-muted-foreground">Filter by Specific Day</Label>
                  <Input
                    type="date"
                    value={logFilterDate}
                    onChange={(e) => setLogFilterDate(e.target.value)}
                    className="h-9 text-xs bg-background/50 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-muted-foreground">Search Logs</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Filter by keyword..."
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      className="pl-8 h-9 text-xs bg-background/50 font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-foreground font-semibold py-3 text-xs">Date</TableHead>
                  <TableHead className="text-foreground font-semibold py-3 text-xs">Staff ID</TableHead>
                  <TableHead className="text-foreground font-semibold py-3 text-xs">Staff Name</TableHead>
                  <TableHead className="text-foreground font-semibold py-3 text-xs">Department</TableHead>
                  <TableHead className="text-foreground font-semibold py-3 text-xs">Clock In (Time In)</TableHead>
                  <TableHead className="text-foreground font-semibold py-3 text-xs">Clock Out (Sign Off)</TableHead>
                  <TableHead className="text-foreground font-semibold py-3 text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      Loading attendance history...
                    </TableCell>
                  </TableRow>
                ) : logs.length > 0 ? (
                  logs.map((record, i) => (
                    <motion.tr 
                      key={record._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-border/50 hover:bg-muted/40 transition-colors text-xs"
                    >
                      <TableCell className="font-semibold text-foreground py-3">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-primary py-3">{record.staffId}</TableCell>
                      <TableCell className="font-bold text-foreground py-3">{record.staffName}</TableCell>
                      <TableCell className="text-muted-foreground py-3">{record.department}</TableCell>
                      <TableCell className="font-medium text-foreground py-3">
                        {formatTime(record.clockIn)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-3">
                        {formatTime(record.clockOut)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={
                          record.status === 'Present' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold' :
                          record.status === 'Signed Off' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold' :
                          'bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold'
                        }>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      No attendance history records found for the selected period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Staff Admin Password Security Confirmation Modal */}
      {staffToDelete && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setStaffToDelete(null)}>
          <div className="bg-background rounded-3xl shadow-2xl border border-rose-500/30 w-full max-w-md overflow-hidden relative p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3 text-rose-600 dark:text-rose-400">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Confirm Staff Deletion
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setStaffToDelete(null)}>✕</Button>
            </div>

            <div className="space-y-2 bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl text-xs">
              <p className="font-bold text-foreground">You are about to delete the following staff member:</p>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Staff Name:</span>
                <span className="font-bold text-foreground">{staffToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staff ID:</span>
                <span className="font-mono font-bold text-primary">{staffToDelete.staffId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Department:</span>
                <span className="font-semibold text-foreground">{staffToDelete.department}</span>
              </div>
            </div>

            {deleteMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${deleteMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
                {deleteMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {deleteMsg.text}
              </div>
            )}

            <form onSubmit={handleDeleteStaffSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  Enter Admin Password to Confirm
                </Label>
                <Input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Type your Admin Password"
                  className="h-10 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setStaffToDelete(null)}>Cancel</Button>
                <Button type="submit" disabled={deletingStaff || !adminPassword} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  {deletingStaff ? 'Verifying & Deleting...' : 'Confirm & Delete Staff'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal (Manual & CSV Import) */}
      {showAddStaffModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowAddStaffModal(false)}>
          <div className="bg-background rounded-3xl shadow-2xl border border-border w-full max-w-2xl overflow-hidden relative p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Add Hospital Staff Member
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddStaffModal(false)}>✕</Button>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-2 bg-muted p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setAddMode('manual')}
                className={`flex-1 py-2 rounded-lg transition-all ${addMode === 'manual' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'}`}
              >
                Manual Form Add
              </button>
              <button
                onClick={() => setAddMode('csv')}
                className={`flex-1 py-2 rounded-lg transition-all ${addMode === 'csv' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'}`}
              >
                Bulk CSV Import Wizard
              </button>
            </div>

            {addMode === 'manual' ? (
              <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs">
                {addStaffMsg && (
                  <div className={`p-3 rounded-xl font-semibold flex items-center gap-2 ${addStaffMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
                    {addStaffMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {addStaffMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Staff Full Name</Label>
                    <Input
                      required
                      value={manualForm.name}
                      onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                      placeholder="e.g. Sarah Jenkins"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Email Address</Label>
                    <Input
                      type="email"
                      value={manualForm.email}
                      onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                      placeholder="sarah@hospital.com"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Phone Number</Label>
                    <Input
                      type="tel"
                      value={manualForm.phone}
                      onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                      placeholder="10-digit number"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Department</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                      value={manualForm.department}
                      onChange={(e) => setManualForm({ ...manualForm, department: e.target.value })}
                    >
                      <option value="Emergency">Emergency</option>
                      <option value="OPD">OPD</option>
                      <option value="ICU">ICU</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Laboratory">Laboratory</option>
                      <option value="Administration">Administration</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Designation / Role</Label>
                    <Input
                      value={manualForm.designation}
                      onChange={(e) => setManualForm({ ...manualForm, designation: e.target.value })}
                      placeholder="e.g. Staff Nurse, Lab Technician"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Default Password</Label>
                    <Input
                      type="password"
                      value={manualForm.password}
                      onChange={(e) => setManualForm({ ...manualForm, password: e.target.value })}
                      placeholder="Leave blank for Password123!"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddStaffModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={addingStaff} size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold">
                    {addingStaff ? 'Adding Staff...' : 'Add Hospital Staff'}
                  </Button>
                </div>
              </form>
            ) : (
              <StaffCSVImportWizard onComplete={() => {
                setShowAddStaffModal(false);
                fetchStaffMembers();
                fetchLogs();
              }} />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
