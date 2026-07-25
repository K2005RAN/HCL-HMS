import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, AlertCircle, ArrowRight, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: 'Male',
    dob: '',
    address: '',
    emergencyContact: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, { 
        ...formData, 
        role: 'patient' 
      });
      navigate('/login', { state: { message: 'Registration successful. Please log in.' } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950">
      {/* Left side: Premium Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[40%] bg-slate-950 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/30 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[100px]" />
          <div className="absolute top-[40%] left-[20%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px]" />
        </div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20 shadow-xl">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            HCI-HMS
          </span>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10"
        >
          <h1 className="text-5xl font-extrabold mb-6 leading-[1.15] tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50">
            Join the <br /> Health Network
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed font-light max-w-md">
            Register to access your medical records, book appointments, and manage your health seamlessly.
          </p>
        </motion.div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-slate-400 font-medium">
          <span>&copy; {new Date().getFullYear()} HeidelbergCement India</span>
        </div>
      </div>

      {/* Right side: Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative overflow-hidden overflow-y-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-primary/5 blur-[150px] -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl my-8"
        >
          <Card className="glass border-border/50 shadow-2xl shadow-primary/5 p-2 sm:p-6 bg-card text-card-foreground">
            <CardHeader className="space-y-3 pb-6">
              <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mb-2 mx-auto ring-1 ring-primary/20 shadow-inner">
                <UserPlus className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-3xl font-extrabold text-center text-slate-900 dark:text-white tracking-tight">
                Create an Account
              </CardTitle>
              <CardDescription className="text-center text-slate-500 dark:text-slate-400 text-base">
                Enter your details to register as a patient or employee
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-5">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center text-sm font-semibold shadow-sm"
                  >
                    <AlertCircle className="w-5 h-5 mr-2.5 shrink-0" />
                    {error}
                  </motion.div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Full Name</Label>
                    <Input id="name" value={formData.name} onChange={handleChange} required className="h-11 bg-white/80 dark:bg-slate-950/80 border-slate-200 rounded-xl" />
                  </div>
                  
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Email Address</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleChange} required className="h-11 bg-white/80 dark:bg-slate-950/80 border-slate-200 rounded-xl" />
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Password</Label>
                    <Input id="password" type="password" value={formData.password} onChange={handleChange} required className="h-11 bg-white/80 dark:bg-slate-950/80 border-slate-200 rounded-xl" />
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Phone Number</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} required className="h-11 bg-white/80 dark:bg-slate-950/80 border-slate-200 rounded-xl" />
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="gender" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Gender</Label>
                    <select id="gender" value={formData.gender} onChange={handleChange} className="w-full h-11 px-3 bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-xl shadow-sm appearance-none">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="dob" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Date of Birth</Label>
                    <Input id="dob" type="date" value={formData.dob} onChange={handleChange} required className="h-11 bg-white/80 dark:bg-slate-950/80 border-slate-200 rounded-xl" />
                  </div>

                  <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="address" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Address</Label>
                    <Input id="address" value={formData.address} onChange={handleChange} required className="h-11 bg-white/80 dark:bg-slate-950/80 border-slate-200 rounded-xl" />
                  </div>

                  <div className="space-y-2.5 md:col-span-2">
                    <Label htmlFor="emergencyContact" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Emergency Contact Phone</Label>
                    <Input id="emergencyContact" type="tel" value={formData.emergencyContact} onChange={handleChange} required className="h-11 bg-white/80 dark:bg-slate-950/80 border-slate-200 rounded-xl" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-6 pt-4">
                <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 rounded-xl group">
                  {loading ? 'Registering...' : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                <p className="text-sm text-center text-slate-500 font-medium">
                  Already have an account? <Link to="/login" className="text-primary hover:underline font-bold">Sign In</Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
