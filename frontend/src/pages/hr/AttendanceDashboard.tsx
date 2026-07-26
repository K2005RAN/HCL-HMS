import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, Search, Calendar, UserPlus, Upload, LogOut, UserCheck, AlertCircle, Building, Phone, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import StaffCSVImportWizard from '@/components/attendance/StaffCSVImportWizard';

export default function AttendanceDashboard() {
  const { user, token } = useAuth();
  const isAdmin = ['admin', 'super admin', 'hr'].includes((user?.role || '').toLowerCase());

  // Staff Search & Attendance State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [attendanceMsg, setAttendanceMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Admin Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCount: 0, totalDbRecords: 0, totalStaffCount: 0, presentCount: 0, signedOffCount: 0 });
  const [logsLoading, setLogsLoading] = useState(false);
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

  // Fetch admin logs
  const fetchAdminLogs = async () => {
    if (!token) return;
    setLogsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/attendance/admin-logs?date=${logFilterDate}&search=${logSearchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data.records || []);
      setStats(res.data.stats || { totalCount: 0, totalDbRecords: 0, totalStaffCount: 0, presentCount: 0, signedOffCount: 0 });
    } catch (err) {
      console.error('Failed to fetch admin logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminLogs();
  }, [token, logFilterDate, logSearchQuery]);

  // Live Staff Search Effect
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length >= 2) {
        setSearching(true);
        try {
          const res = await axios.get(`${API_BASE_URL}/api/attendance/search-staff?query=${searchQuery}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSearchResults(res.data);
        } catch (err) {
          console.error('Search staff error:', err);
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, token]);

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
      fetchAdminLogs();
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
      fetchAdminLogs();
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
      fetchAdminLogs();
    } catch (err: any) {
      console.error('Add staff failed:', err);
      setAddStaffMsg({ type: 'error', text: err.response?.data?.message || 'Failed to add staff.' });
    } finally {
      setAddingStaff(false);
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
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
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Hospital Staff & Attendance
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">Give daily attendance, sign off shifts, and manage hospital staff records.</p>
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

      {/* Staff Attendance Marking Section */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Staff Self Attendance Portal
            </CardTitle>
            <CardDescription className="text-xs">
              Search by Staff ID (e.g. STF-0001, EMP-0001) or Name to Give Attendance or Sign Off your shift.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Find Staff by Staff ID, Name, or Phone</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type Staff ID (e.g. STF-0001, EMP-0001), Doctor ID, or Name..."
                  className="pl-9 h-11 bg-background/80 border-border/60 rounded-xl text-sm shadow-sm"
                />
              </div>
            </div>

            {/* Attendance Status Alert Message */}
            {attendanceMsg && (
              <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${attendanceMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                {attendanceMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {attendanceMsg.text}
              </div>
            )}

            {/* Search Results List */}
            {searching ? (
              <div className="text-xs text-muted-foreground text-center py-4">Searching staff directory...</div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((staff) => (
                  <Card key={staff.staffId} className="border-border/60 bg-card hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {staff.staffId}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {staff.department}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-foreground">{staff.name}</h4>
                        <p className="text-xs text-muted-foreground">{staff.role} • {staff.phone}</p>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-border/40">
                        <Button
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleGiveAttendance(staff)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Give Attendance
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading}
                          onClick={() => handleSignOff(staff)}
                          className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold text-xs h-9 gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Off
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                No staff found matching "{searchQuery}". Make sure the Staff ID or Name is entered correctly.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      {/* Admin Summary Stats */}
      {isAdmin && (
        <div className="grid gap-6 md:grid-cols-4">
          <motion.div variants={itemVariants}>
            <Card className="glass relative overflow-hidden group hover:shadow-2xl transition-all border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">Total DB Attendance Logs</CardTitle>
                <div className="p-2 rounded-xl bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">{stats.totalDbRecords || logs.length}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass relative overflow-hidden group hover:shadow-2xl transition-all border-emerald-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">Present (Active Shift)</CardTitle>
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-500">{stats.presentCount || 0}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass relative overflow-hidden group hover:shadow-2xl transition-all border-indigo-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Signed Off Today</CardTitle>
                <div className="p-2 rounded-xl bg-indigo-500/10">
                  <LogOut className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.signedOffCount || 0}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass relative overflow-hidden group hover:shadow-2xl transition-all border-slate-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-slate-500">Registered Staff in DB</CardTitle>
                <div className="p-2 rounded-xl bg-slate-500/10">
                  <ShieldCheck className="h-4 w-4 text-slate-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-slate-700 dark:text-slate-300">{stats.totalStaffCount || 0}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Admin Attendance Database Records Table */}
      {isAdmin && (
        <motion.div variants={itemVariants}>
          <Card className="glass border-border/50 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Database Attendance Log History</CardTitle>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={logFilterDate}
                      onChange={(e) => setLogFilterDate(e.target.value)}
                      className="h-9 w-36 text-xs bg-background/50"
                    />
                    {logFilterDate && (
                      <Button size="sm" variant="ghost" onClick={() => setLogFilterDate('')} className="h-9 text-xs px-2 text-primary font-bold">
                        All Dates
                      </Button>
                    )}
                  </div>

                  <div className="relative flex-1 sm:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Filter by Staff ID, Name..."
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      className="pl-8 h-9 text-xs bg-background/50"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-foreground font-semibold py-3 text-xs">Staff ID</TableHead>
                    <TableHead className="text-foreground font-semibold py-3 text-xs">Staff Name</TableHead>
                    <TableHead className="text-foreground font-semibold py-3 text-xs">Department</TableHead>
                    <TableHead className="text-foreground font-semibold py-3 text-xs">Date</TableHead>
                    <TableHead className="text-foreground font-semibold py-3 text-xs">Clock In (Time In)</TableHead>
                    <TableHead className="text-foreground font-semibold py-3 text-xs">Clock Out (Sign Off)</TableHead>
                    <TableHead className="text-foreground font-semibold py-3 text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                        Loading database attendance records...
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
                        <TableCell className="font-mono font-bold text-primary py-3">{record.staffId}</TableCell>
                        <TableCell className="font-bold text-foreground py-3">{record.staffName}</TableCell>
                        <TableCell className="text-muted-foreground py-3">{record.department}</TableCell>
                        <TableCell className="text-muted-foreground py-3">
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
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
                        No attendance logs found in database for the selected criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Add Staff Modal (Manual & CSV Import) */}
      {showAddStaffModal && (
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
                fetchAdminLogs();
              }} />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
