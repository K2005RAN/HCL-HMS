import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, UserPlus, ShieldAlert, Trash2, KeyRound, RefreshCw, Stethoscope, Pill, TestTube, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

export default function UserManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset Database State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    role: 'doctor',
    name: '',
    email: '',
    password: '',
    phone: '',
    department: 'OPD',
    designation: 'Nurse',
    specialization: 'General Physician',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleVal = e.target.value;
    let defaultDept = 'OPD';
    let defaultDesig = 'Nurse';

    if (roleVal === 'staff') defaultDept = 'Emergency';
    if (roleVal === 'lab') defaultDept = 'Laboratory';
    if (roleVal === 'pharmacy') defaultDept = 'Pharmacy';

    setFormData({
      ...formData,
      role: roleVal,
      department: defaultDept,
      designation: defaultDesig
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone
      };

      if (formData.role === 'staff') {
        payload.department = formData.department;
        payload.designation = formData.designation;
      } else if (formData.role === 'doctor') {
        payload.specialization = formData.specialization;
        payload.department = formData.department || 'OPD';
      } else if (formData.role === 'lab') {
        payload.department = 'Laboratory';
        payload.designation = 'Lab Incharge';
      } else if (formData.role === 'pharmacy') {
        payload.department = 'Pharmacy';
        payload.designation = 'Pharmacy Incharge';
      }

      await axios.post(`${API_BASE_URL}/api/auth/admin-create-user`, payload);
      
      setSuccess(`Account for ${formData.name} (${formData.role.toUpperCase()}) created successfully!`);
      setFormData({
        role: formData.role,
        name: '',
        email: '',
        password: '',
        phone: '',
        department: formData.department,
        designation: 'Nurse',
        specialization: 'General Physician',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // Execute Database Reset
  const handleResetDatabase = async () => {
    setResetting(true);
    setResetMsg(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/reset-database`);
      setResetMsg({ type: 'success', text: res.data.message || 'Database reset complete! Kept Admin accounts; wiped non-admin users & attendance logs.' });
      setTimeout(() => {
        setShowResetModal(false);
        setResetMsg(null);
      }, 2000);
    } catch (err: any) {
      console.error('Reset database failed:', err);
      setResetMsg({ type: 'error', text: err.response?.data?.message || 'Failed to reset database.' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">User Management</h2>
          <p className="text-muted-foreground">Provision accounts for Doctors, Lab Incharges, Pharmacy Staff, and Hospital Staff.</p>
        </div>
        
        <Button
          onClick={() => setShowResetModal(true)}
          variant="destructive"
          className="shadow-lg shadow-destructive/20 font-bold gap-2 text-xs"
        >
          <RefreshCw className="h-4 w-4" /> Reset Database (Wipe Non-Admin Accounts)
        </Button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="glass border-border/50 shadow-lg">
          <CardHeader className="bg-muted/20 border-b border-border/40 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Register New Account</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Select the account role below to provision a new user account with dedicated permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center text-sm font-medium border border-destructive/20">
                  <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center text-sm font-medium border border-emerald-500/20">
                  <CheckCircle className="h-5 w-5 mr-2 shrink-0" />
                  {success}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6 text-xs">
                {/* Account Role Dropdown */}
                <div className="space-y-1.5 col-span-full md:col-span-1">
                  <Label htmlFor="role" className="font-bold text-foreground">Select Account Role</Label>
                  <select 
                    id="role" 
                    value={formData.role} 
                    onChange={handleRoleChange} 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="doctor">🩺 Doctor (OPD / Specialist)</option>
                    <option value="staff">🏥 Hospital Staff (Nurse, Compounder, Receptionist)</option>
                    <option value="lab">🔬 Laboratory Incharge / Technician</option>
                    <option value="pharmacy">💊 Pharmacy Incharge / Pharmacist</option>
                    <option value="patient">👤 Patient</option>
                    <option value="admin">🛡️ Administrator</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name" className="font-bold">Full Name</Label>
                  <Input id="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Dr. Rahul Sharma, Nurse Anjali" className="bg-background/50 h-10 text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="font-bold">Email Address</Label>
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} required placeholder="user@hospital.com" className="bg-background/50 h-10 text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="font-bold">Temporary Password</Label>
                  <Input id="password" type="password" value={formData.password} onChange={handleChange} required placeholder="Type password" className="bg-background/50 h-10 text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="font-bold">Phone Number</Label>
                  <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="10-digit mobile number" className="bg-background/50 h-10 text-xs" />
                </div>

                {/* Role Specific Dynamic Fields */}
                {formData.role === 'staff' && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="designation" className="font-bold">Staff Designation (Role Type)</Label>
                      <select 
                        id="designation" 
                        value={formData.designation} 
                        onChange={handleChange} 
                        required
                        className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-foreground text-xs font-semibold"
                      >
                        <option value="Nurse">Nurse (Staff Nurse / ICU Nurse)</option>
                        <option value="Compounder">Compounder</option>
                        <option value="Receptionist">Receptionist / Front Desk</option>
                        <option value="Ward Attendant">Ward Boy / Attendant</option>
                        <option value="Other Hospital Staff">Other Hospital Staff</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="department" className="font-bold">Department</Label>
                      <select 
                        id="department" 
                        value={formData.department} 
                        onChange={handleChange} 
                        required
                        className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-foreground text-xs font-semibold"
                      >
                        <option value="Emergency">Emergency</option>
                        <option value="OPD">OPD</option>
                        <option value="ICU">ICU</option>
                        <option value="General Ward">General Ward</option>
                        <option value="Administration">Administration</option>
                      </select>
                    </div>
                  </>
                )}

                {formData.role === 'doctor' && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="specialization" className="font-bold">Specialization</Label>
                      <Input id="specialization" placeholder="e.g. Cardiology, Orthopedics, General Physician" value={formData.specialization} onChange={handleChange} required className="bg-background/50 h-10 text-xs" />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="department" className="font-bold">Department</Label>
                      <Input id="department" placeholder="e.g. OPD, Cardiology (Default: OPD)" value={formData.department} onChange={handleChange} className="bg-background/50 h-10 text-xs" />
                    </div>
                  </>
                )}

                {formData.role === 'lab' && (
                  <div className="space-y-1.5 col-span-full md:col-span-1 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <TestTube className="w-4 h-4" /> Laboratory Account Details
                    </p>
                    <p className="text-[11px] text-muted-foreground">Will be provisioned as <strong>Lab Incharge</strong> under dedicated <strong>LabUser</strong> database collection with ID: <code>LAB-xxxx</code>.</p>
                  </div>
                )}

                {formData.role === 'pharmacy' && (
                  <div className="space-y-1.5 col-span-full md:col-span-1 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                    <p className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                      <Pill className="w-4 h-4" /> Pharmacy Account Details
                    </p>
                    <p className="text-[11px] text-muted-foreground">Will be provisioned as <strong>Pharmacy Incharge</strong> under dedicated <strong>PharmacyUser</strong> database collection with ID: <code>PHM-xxxx</code>.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button type="submit" disabled={loading} className="px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform font-bold text-xs">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Database Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowResetModal(false)}>
          <div className="bg-background rounded-3xl shadow-2xl border border-destructive/30 w-full max-w-md overflow-hidden relative p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3 text-destructive">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Reset Database Clean Slate
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowResetModal(false)}>✕</Button>
            </div>

            <div className="space-y-2 bg-destructive/10 border border-destructive/20 p-4 rounded-2xl text-xs">
              <p className="font-bold text-foreground">Warning: This operation will permanently wipe:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground pt-1">
                <li>All Doctors & Specialists</li>
                <li>All Hospital Staff (Nurses, Compounders)</li>
                <li>All Lab Incharges & Technicians</li>
                <li>All Pharmacy Incharges & Pharmacists</li>
                <li>All Attendance & Shift Log records</li>
                <li>All Patients & Appointments</li>
              </ul>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 pt-2">✓ Admin user accounts will remain intact so you can log in and register fresh users.</p>
            </div>

            {resetMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${resetMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                {resetMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {resetMsg.text}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowResetModal(false)}>Cancel</Button>
              <Button onClick={handleResetDatabase} disabled={resetting} size="sm" variant="destructive" className="font-bold gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                {resetting ? 'Resetting Database...' : 'Confirm Reset Database'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
