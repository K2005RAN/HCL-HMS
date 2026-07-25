import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Building, Award, CheckCircle2, ArrowLeft, LogOut } from 'lucide-react';
import axios from 'axios';

export default function ProfilePage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfileData(res.data);
      } catch (err) {
        console.error('Failed to fetch detailed profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const activeUser = profileData || user;

  const displayName = activeUser?.name || activeUser?.username || 'User';
  const displayEmail = activeUser?.email || 'N/A';
  const displayRole = (activeUser?.role || 'User').toUpperCase();
  const customId = activeUser?.doctorId || activeUser?.patientId || activeUser?.staffId || activeUser?.employeeId || activeUser?.adminId || activeUser?._id || activeUser?.id || 'N/A';

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-rose-500/10 text-rose-600 border-rose-200';
      case 'doctor': return 'bg-indigo-500/10 text-indigo-600 border-indigo-200';
      case 'patient': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'staff': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'pharmacy': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'lab': return 'bg-cyan-500/10 text-cyan-600 border-cyan-200';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 text-slate-600 hover:text-slate-900 border-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 px-3 py-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Account Active
        </Badge>
      </div>

      {/* Main Profile Header Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/80 via-primary to-accent" />
        <CardContent className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 sm:-mt-14 mb-4">
            <Avatar className="h-28 w-28 ring-4 ring-white shadow-lg bg-white">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-3xl">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{displayName}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeVariant(displayRole)} w-fit mx-auto sm:mx-0`}>
                  {displayRole}
                </span>
              </div>
              <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {displayEmail}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Personal Profile Details
            </CardTitle>
            <CardDescription className="text-xs">Your registered account credentials and information.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Full Name</span>
              <span className="font-semibold text-slate-900">{displayName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Email Address</span>
              <span className="font-semibold text-slate-900">{displayEmail}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">User Identifier ID</span>
              <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-semibold">{customId}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 font-medium">System Role</span>
              <span className="font-semibold text-slate-900">{displayRole}</span>
            </div>
          </CardContent>
        </Card>

        {/* Additional Organizational Details */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              Organization & Role Details
            </CardTitle>
            <CardDescription className="text-xs">Department assignment and system privileges.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-semibold text-slate-900">{activeUser?.department || 'General Healthcare'}</span>
            </div>
            {activeUser?.specialization && (
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Specialization</span>
                <span className="font-semibold text-slate-900">{activeUser.specialization}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Access Status</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                Active & Verified
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 font-medium">Security Token</span>
              <span className="text-xs text-slate-400 font-mono">JWT Session Authenticated</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
