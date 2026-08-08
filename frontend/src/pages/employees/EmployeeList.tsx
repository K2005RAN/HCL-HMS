import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, Plus, Search, X, Users, CheckCircle, RefreshCw, Eye, Building2, Phone, Mail, MapPin } from 'lucide-react';
import CSVImportWizard from '@/components/employees/CSVImportWizard';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '@/config/api';

export default function EmployeeList() {
  const [showImport, setShowImport] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const { token } = useAuth();

  // New Employee Form State
  const [newEmp, setNewEmp] = useState({
    employeeId: '',
    name: '',
    department: 'Mines Site Ops',
    plant: 'Damoh Plant',
    designation: 'Heavy Equipment Operator',
    phone: '',
    email: '',
    gender: 'Male',
    bloodGroup: 'B+',
    dob: '1990-01-01',
    address: 'Damoh Plant Colony',
    emergencyContact: '',
    shift: 'General Shift'
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = Array.isArray(res.data) ? res.data : (res.data.employees || []);
      setEmployees(list);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEmployees();
    }
  }, [token]);

  // Filtered employees by search query
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(emp =>
      (emp.name || '').toLowerCase().includes(q) ||
      (emp.employeeId || '').toLowerCase().includes(q) ||
      (emp.department || '').toLowerCase().includes(q) ||
      (emp.designation || '').toLowerCase().includes(q) ||
      (emp.plant || '').toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q) ||
      (emp.phone || '').toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.employeeId || !newEmp.name || !newEmp.email) {
      setCreateError('Employee ID, Full Name, and Email are required.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      await axios.post(`${API_BASE_URL}/api/employees`, newEmp, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      setNewEmp({
        employeeId: '',
        name: '',
        department: 'Mines Site Ops',
        plant: 'Damoh Plant',
        designation: 'Heavy Equipment Operator',
        phone: '',
        email: '',
        gender: 'Male',
        bloodGroup: 'B+',
        dob: '1990-01-01',
        address: 'Damoh Plant Colony',
        emergencyContact: '',
        shift: 'General Shift'
      });
      await fetchEmployees();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setCreating(false);
    }
  };

  const handleExportCSV = () => {
    if (!employees || employees.length === 0) return;

    const headers = ['Employee ID', 'Name', 'Department', 'Plant', 'Designation', 'Email', 'Phone', 'Gender', 'Blood Group', 'Shift', 'Status'];
    const rows = employees.map(e => [
      `"${e.employeeId || ''}"`,
      `"${e.name || ''}"`,
      `"${e.department || ''}"`,
      `"${e.plant || ''}"`,
      `"${e.designation || ''}"`,
      `"${e.email || ''}"`,
      `"${e.phone || ''}"`,
      `"${e.gender || ''}"`,
      `"${e.bloodGroup || ''}"`,
      `"${e.shift || ''}"`,
      `"${e.status || 'Active'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Heidelberg_Employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (showImport) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Bulk Import Employees</h2>
            <p className="text-sm text-muted-foreground mt-1">Upload CSV roster to sync employee records with OHC health and safety systems.</p>
          </div>
          <Button variant="outline" onClick={() => { setShowImport(false); fetchEmployees(); }} className="hover:bg-destructive hover:text-destructive-foreground transition-colors">
            Cancel & Return
          </Button>
        </motion.div>
        <motion.div variants={itemVariants}>
          <CSVImportWizard onComplete={() => { setShowImport(false); fetchEmployees(); }} />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <motion.div variants={itemVariants}>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Employees
          </h2>
          <p className="text-muted-foreground mt-1 text-base">
            Manage company workforce, job roles, plant departments, and medical profile links.
          </p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchEmployees}
            className="hover:scale-105 transition-transform bg-background/50 backdrop-blur-sm shadow-sm gap-2"
          >
            <RefreshCw className={`h-4 w-4 text-primary ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="hover:scale-105 transition-transform bg-background/50 backdrop-blur-sm shadow-sm gap-2"
          >
            <Download className="h-4 w-4 text-primary" /> Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImport(true)}
            className="hover:scale-105 transition-transform bg-background/50 backdrop-blur-sm shadow-sm gap-2"
          >
            <Upload className="h-4 w-4 text-primary" /> Import CSV
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="shadow-lg shadow-primary/20 hover:scale-105 transition-transform bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground font-bold gap-2"
          >
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        </motion.div>
      </div>

      {/* Live Search & Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-3 flex items-center px-4 py-2.5 glass rounded-xl border border-border/50 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
          <Search className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
          <Input
            placeholder="Search by ID, Name (e.g. Lekhraj, Ramji), Department, or Plant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 px-0 shadow-none bg-transparent text-sm h-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="glass rounded-xl border border-border/50 px-4 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Users className="h-4 w-4 text-primary" /> Total Workforce
          </div>
          <span className="text-xl font-black text-foreground">{employees.length}</span>
        </div>
      </motion.div>

      {/* Employees Table Card */}
      <motion.div variants={itemVariants} className="rounded-2xl glass border border-border/50 shadow-xl overflow-hidden">
        {/* Search status header */}
        <div className="bg-muted/20 border-b border-border/50 px-6 py-3.5 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">
            {searchQuery.trim() ? (
              <>Search Results for <strong className="text-primary underline font-extrabold">"{searchQuery}"</strong></>
            ) : (
              <>Employee Directory</>
            )}
          </span>
          {searchQuery.trim() && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-extrabold">
              {filteredEmployees.length} Match{filteredEmployees.length === 1 ? '' : 'es'} Found
            </Badge>
          )}
        </div>

        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-foreground font-extrabold py-4 text-xs">Emp ID</TableHead>
              <TableHead className="text-foreground font-extrabold py-4 text-xs">Name & Contact</TableHead>
              <TableHead className="text-foreground font-extrabold py-4 text-xs">Department</TableHead>
              <TableHead className="text-foreground font-extrabold py-4 text-xs">Plant / Location</TableHead>
              <TableHead className="text-foreground font-extrabold py-4 text-xs">Designation / Role</TableHead>
              <TableHead className="text-foreground font-extrabold py-4 text-xs">Status</TableHead>
              <TableHead className="text-right text-foreground font-extrabold py-4 text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    <span>Loading workforce records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !searchQuery.trim() ? (
              /* When no search query is typed, require specific search */
              <TableRow>
                <TableCell colSpan={7} className="h-56 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                      <Search className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-base font-bold text-foreground">Search Employee Record</p>
                    <p className="text-xs text-muted-foreground">
                      Enter an employee name, ID, or department in the search bar above to view their details.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length > 0 ? (
              /* When searched, only show matching specific employee(s) */
              filteredEmployees.map((emp, i) => (
                <motion.tr
                  key={emp._id || emp.employeeId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  className="border-border/50 hover:bg-muted/40 transition-colors group cursor-pointer"
                  onClick={() => setSelectedEmp(emp)}
                >
                  <TableCell className="font-extrabold text-foreground py-4 text-xs">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-extrabold text-xs">
                      {emp.employeeId}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground font-medium py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center text-primary font-black text-xs ring-1 ring-primary/20 shadow-sm group-hover:scale-105 transition-transform">
                        {(emp.name || 'EM').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground font-semibold text-xs py-4">
                    {emp.department || 'Operations'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs py-4">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      {emp.plant || 'Damoh Plant'}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs py-4 font-medium">
                    {emp.designation || 'Staff'}
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                      <CheckCircle className="h-3 w-3 mr-1" /> {emp.status || 'Active'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); setSelectedEmp(emp); }}
                      className="text-xs font-bold text-primary hover:bg-primary/10 rounded-lg gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Details
                    </Button>
                  </TableCell>
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3 border border-border/50">
                      <Search className="h-7 w-7 opacity-40 text-primary" />
                    </div>
                    <p className="text-lg font-bold text-foreground">No specific employee found.</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      No employee record matched "{searchQuery}". Try checking the spelling or searching by ID (e.g. EMP-1001).
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="mt-3 text-xs font-bold rounded-xl">
                      Clear Search Filter
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Modal: Add New Employee */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border/80 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-foreground">Add New Employee</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Register a workforce member and link their medical portal profile.</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Employee ID *</label>
                  <Input
                    placeholder="e.g. EMP-1005"
                    value={newEmp.employeeId}
                    onChange={(e) => setNewEmp({ ...newEmp, employeeId: e.target.value })}
                    required
                    className="h-10 text-xs bg-background rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Full Name *</label>
                  <Input
                    placeholder="e.g. Lekhraj Patel"
                    value={newEmp.name}
                    onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                    required
                    className="h-10 text-xs bg-background rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Corporate Email *</label>
                  <Input
                    type="email"
                    placeholder="e.g. lekhraj.patel@heidelberg.in"
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    required
                    className="h-10 text-xs bg-background rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Phone Number</label>
                  <Input
                    placeholder="e.g. 9826123456"
                    value={newEmp.phone}
                    onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                    className="h-10 text-xs bg-background rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Department</label>
                  <Input
                    placeholder="e.g. Mines Site Ops"
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="h-10 text-xs bg-background rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Plant / Site</label>
                  <Input
                    placeholder="e.g. Damoh Plant"
                    value={newEmp.plant}
                    onChange={(e) => setNewEmp({ ...newEmp, plant: e.target.value })}
                    className="h-10 text-xs bg-background rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Designation</label>
                  <Input
                    placeholder="e.g. Heavy Equipment Operator"
                    value={newEmp.designation}
                    onChange={(e) => setNewEmp({ ...newEmp, designation: e.target.value })}
                    className="h-10 text-xs bg-background rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Gender</label>
                  <select
                    value={newEmp.gender}
                    onChange={(e) => setNewEmp({ ...newEmp, gender: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-background border border-border/60 rounded-xl"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Blood Group</label>
                  <select
                    value={newEmp.bloodGroup}
                    onChange={(e) => setNewEmp({ ...newEmp, bloodGroup: e.target.value })}
                    className="w-full h-10 px-3 text-xs bg-background border border-border/60 rounded-xl"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Shift</label>
                  <Input
                    placeholder="e.g. Shift A (Mines)"
                    value={newEmp.shift}
                    onChange={(e) => setNewEmp({ ...newEmp, shift: e.target.value })}
                    className="h-10 text-xs bg-background rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Residential Address</label>
                <Input
                  placeholder="e.g. Mines Colony Qtr 14, Damoh"
                  value={newEmp.address}
                  onChange={(e) => setNewEmp({ ...newEmp, address: e.target.value })}
                  className="h-10 text-xs bg-background rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="bg-primary text-primary-foreground font-bold rounded-xl">
                  {creating ? 'Saving Employee...' : 'Register Employee'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Employee Details */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border/80 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center text-primary font-black text-base ring-1 ring-primary/20">
                  {(selectedEmp.name || 'EM').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-foreground">{selectedEmp.name}</h3>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-bold mt-0.5">
                    {selectedEmp.employeeId}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedEmp(null)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Department</span>
                  <strong className="text-foreground text-sm">{selectedEmp.department || 'Operations'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Plant Site</span>
                  <strong className="text-foreground text-sm">{selectedEmp.plant || 'Damoh Plant'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Designation</span>
                  <strong className="text-foreground">{selectedEmp.designation || 'Staff'}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Shift</span>
                  <strong className="text-foreground">{selectedEmp.shift || 'General'}</strong>
                </div>
              </div>

              <div className="space-y-2 p-3 rounded-xl bg-muted/20 border border-border/40">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-semibold">{selectedEmp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-semibold">{selectedEmp.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground font-semibold">{selectedEmp.address || 'Plant Colony'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <span className="text-[11px] text-muted-foreground">Default Portal Password: <strong className="text-foreground">HCIL2026</strong></span>
              <Button onClick={() => setSelectedEmp(null)} className="text-xs font-bold rounded-xl">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
