import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Building, CheckCircle2, ArrowLeft, LogOut, Lock, Phone, MapPin, KeyRound, Save, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

export default function ProfilePage() {
  const { user, token, logout, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'overview';

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    emergencyContact: '',
    bloodGroup: '',
    department: '',
    specialization: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Password Form State
  const [passForm, setPassForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingPass, setUpdatingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMe = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(res.data);
      setEditForm({
        name: res.data.name || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        emergencyContact: res.data.emergencyContact || '',
        bloodGroup: res.data.bloodGroup || '',
        department: res.data.department || '',
        specialization: res.data.specialization || ''
      });
    } catch (err) {
      console.error('Failed to fetch detailed profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMsg(null);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/auth/update-profile`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      if (token && res.data.user) {
        login(token, res.data.user);
      }
      fetchMe();
    } catch (err: any) {
      console.error('Profile update failed:', err);
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingPass(true);
    setPassMsg(null);

    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      setUpdatingPass(false);
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/api/auth/change-password`, {
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPassMsg({ type: 'success', text: 'Password changed successfully!' });
      setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error('Password change failed:', err);
      setPassMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password. Please verify your old password.' });
    } finally {
      setUpdatingPass(false);
    }
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

      {/* Tabs Navigation */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg text-xs sm:text-sm font-semibold">Overview</TabsTrigger>
          <TabsTrigger value="edit" className="rounded-lg text-xs sm:text-sm font-semibold">Edit Profile</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg text-xs sm:text-sm font-semibold">Change Password</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6">
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
                  <span className="text-slate-500 font-medium">Contact Phone</span>
                  <span className="font-semibold text-slate-900">{activeUser?.phone || activeUser?.emergencyContact || 'N/A'}</span>
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
                  Organization & Address Details
                </CardTitle>
                <CardDescription className="text-xs">Department assignment and registered address.</CardDescription>
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
                {activeUser?.address && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Address</span>
                    <span className="font-semibold text-slate-900">{activeUser.address}</span>
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
        </TabsContent>

        {/* Tab 2: Edit Profile */}
        <TabsContent value="edit">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Edit Profile Information
              </CardTitle>
              <CardDescription className="text-xs">Update your phone number, address, and personal details.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {profileMsg && (
                <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {profileMsg.text}
                </div>
              )}
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Full Name</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Phone Number</Label>
                    <Input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Emergency Contact</Label>
                    <Input
                      type="tel"
                      value={editForm.emergencyContact}
                      onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                      placeholder="Emergency contact number"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Blood Group</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                      value={editForm.bloodGroup}
                      onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    >
                      <option value="">Select Blood Group</option>
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

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Residential Address</Label>
                    <Input
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="City, State, Country"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={updatingProfile} className="w-full sm:w-auto gap-2">
                    <Save className="w-4 h-4" />
                    {updatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Change Password */}
        <TabsContent value="security">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Security & Change Password
              </CardTitle>
              <CardDescription className="text-xs">Type your current old password to set a new password.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {passMsg && (
                <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${passMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {passMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {passMsg.text}
                </div>
              )}
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Current (Old) Password</Label>
                  <Input
                    type="password"
                    value={passForm.oldPassword}
                    onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">New Password</Label>
                  <Input
                    type="password"
                    value={passForm.newPassword}
                    onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                    placeholder="At least 6 characters"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={passForm.confirmPassword}
                    onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={updatingPass} className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <KeyRound className="w-4 h-4" />
                    {updatingPass ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
