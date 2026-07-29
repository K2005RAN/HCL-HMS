import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Activity, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('doctor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const cleanEmail = email.trim();
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email: cleanEmail, password, role });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950">
      {/* Left side: Premium Branding with Image */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-950 text-white p-12 relative overflow-hidden">
        {/* Image Background */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/bg-login.png')" }}
        />
        {/* Overlays for readability and premium feel */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 z-0 bg-indigo-950/30 mix-blend-multiply" />
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20 shadow-xl">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            HCL-HMS
          </span>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 max-w-xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold mb-6 backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            System Online & Secure
          </div>
          <h1 className="text-5xl font-extrabold mb-6 leading-[1.15] tracking-tight text-white drop-shadow-xl">
            HeidelbergCement India
          </h1>
          <p className="text-lg text-slate-200 leading-relaxed font-medium max-w-md drop-shadow-md">
            Manage employee wellness and clinic operations efficiently.
          </p>
        </motion.div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-slate-300 font-semibold drop-shadow-md">
          <span>&copy; {new Date().getFullYear()} HeidelbergCement India</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Internal Use Only</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>
            Developed By: <a href="https://www.linkedin.com/in/karan-rai-a961aa292" target="_blank" rel="noreferrer" className="hover:text-white underline">Karan Rai</a>
          </span>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Subtle background glow for right side */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-primary/5 blur-[150px] -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          <Card className="glass border-border/50 shadow-2xl shadow-primary/5 p-2 sm:p-4 bg-card text-card-foreground">
            <CardHeader className="space-y-3 pb-6">
              <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mb-2 mx-auto ring-1 ring-primary/20 shadow-inner">
                <Activity className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-3xl font-extrabold text-center text-slate-900 dark:text-white tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription className="text-center text-slate-500 dark:text-slate-400 text-base">
                Enter your credentials to access the portal
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
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
                <div className="space-y-2.5">
                  <Label htmlFor="role" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Account Type</Label>
                  <select 
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-12 px-3 bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-slate-900 dark:text-white rounded-xl shadow-sm appearance-none"
                  >
                    <option value="admin">Administrator</option>
                    <option value="doctor">Doctor</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="lab">Lab Incharge</option>
                    <option value="patient">Patient / Employee</option>
                    <option value="staff">Hospital Staff</option>
                  </select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Email / Mobile / Patient ID</Label>
                  <Input 
                    id="email" 
                    type="text" 
                    placeholder="e.g. email, phone, or PAT-0002" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-white/80 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/40 transition-all text-slate-900 dark:text-white rounded-xl shadow-sm"
                  />
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Password</Label>
                    <a href="#" className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors">
                      Forgot password?
                    </a>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-white/80 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/40 transition-all text-slate-900 dark:text-white rounded-xl shadow-sm"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-6 pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all rounded-xl group" 
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto leading-relaxed font-medium">
                  By continuing, you agree to HeidelbergCement India's <br />
                  <a href="#" className="underline hover:text-primary transition-colors">Security Policy</a> & <a href="#" className="underline hover:text-primary transition-colors">Terms of Service</a>.
                </p>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
