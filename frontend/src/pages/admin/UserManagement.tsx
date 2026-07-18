import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, UserPlus, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function UserManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    role: 'doctor',
    name: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    specialization: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
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
      }
      if (formData.role === 'doctor') {
        payload.specialization = formData.specialization;
      }

      // We use the new admin-specific endpoint to handle custom ID generation
      await axios.post('http://localhost:5000/api/auth/admin-create-user', payload, {
        headers: {
          // If you have token verification for this endpoint, add it here.
          // 'Authorization': `Bearer ${token}` 
        }
      });
      
      setSuccess(`Account for ${formData.name} (${formData.role}) created successfully!`);
      setFormData({
        role: 'doctor',
        name: '',
        email: '',
        password: '',
        phone: '',
        department: '',
        specialization: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">User Management</h2>
          <p className="text-muted-foreground">Create and manage accounts for doctors, patients, and staff.</p>
        </div>
        <ShieldAlert className="h-8 w-8 text-primary opacity-50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="glass border-border/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Create New User</CardTitle>
            </div>
            <CardDescription>Fill in the details below to provision a new account in the system.</CardDescription>
          </CardHeader>
          <CardContent>
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

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-full md:col-span-1">
                  <Label htmlFor="role">Account Role</Label>
                  <select 
                    id="role" 
                    value={formData.role} 
                    onChange={handleChange} 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="patient">Patient</option>
                    <option value="staff">Staff (Pharmacy, Lab, HR)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={formData.name} onChange={handleChange} required className="bg-background/50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} required className="bg-background/50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input id="password" type="password" value={formData.password} onChange={handleChange} required className="bg-background/50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} required className="bg-background/50" />
                </div>

                {formData.role === 'staff' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 col-span-full md:col-span-1">
                    <Label htmlFor="department">Department</Label>
                    <select 
                      id="department" 
                      value={formData.department} 
                      onChange={handleChange} 
                      required
                      className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select Department...</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Laboratory">Laboratory</option>
                      <option value="HR">HR & Admin</option>
                      <option value="Nursing">Nursing</option>
                    </select>
                  </motion.div>
                )}

                {formData.role === 'doctor' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 col-span-full md:col-span-1">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input id="specialization" placeholder="e.g. Cardiology, General Physician" value={formData.specialization} onChange={handleChange} required className="bg-background/50" />
                  </motion.div>
                )}
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button type="submit" disabled={loading} className="px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40">
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
