import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Clock, User, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';

export default function AppointmentCalendar() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [patientFound, setPatientFound] = useState<any>(null);
  
  const [registering, setRegistering] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    email: '',
    gender: 'Male',
    age: '',
    bloodGroup: '',
    chronicDiseases: '',
    allergies: '',
    address: '',
    emergencyContact: ''
  });
  
  const { token } = useAuth();
  
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:00',
    type: 'Walk-in',
    reasonForVisit: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [apptsRes, docsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/appointments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/appointments/meta/doctors`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAppointments(apptsRes.data);
      setDoctors(docsRes.data);
      
      // Auto-select first item if available to prevent empty form submisison
      if (docsRes.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          doctorId: docsRes.data[0]._id
        }));
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const searchPatient = async () => {
      if (searchPhone.length >= 3) { // Reduced to 3 to allow searching by ID like EMP-123
        try {
          const res = await axios.get(`${API_BASE_URL}/api/appointments/meta/search-patient?query=${searchPhone}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPatientFound(res.data);
          setFormData(prev => ({...prev, patientId: res.data._id}));
        } catch (error) {
          setPatientFound(null);
          setFormData(prev => ({...prev, patientId: ''}));
        }
      } else {
        setPatientFound(null);
        setFormData(prev => ({...prev, patientId: ''}));
      }
    };
    
    const timeoutId = setTimeout(() => {
      searchPatient();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchPhone, token]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/appointments`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      fetchData(); // Refresh the list
    } catch (error: any) {
      console.error("Failed to add appointment", error.response?.data || error);
      alert("Error creating appointment: " + (error.response?.data?.message || error.message));
    }
  };

  const handleQuickRegister = async () => {
    setRegistering(true);
    try {
      // Calculate an approximate DOB from the provided age
      const approxDob = new Date();
      approxDob.setFullYear(approxDob.getFullYear() - parseInt(newPatientData.age || '0'));
      
      const payload = {
        role: 'patient',
        phone: searchPhone,
        password: 'Password123!', // default temp password
        ...newPatientData,
        dob: approxDob.toISOString().split('T')[0],
        chronicDiseases: newPatientData.chronicDiseases ? newPatientData.chronicDiseases.split(',').map(s => s.trim()).filter(Boolean) : [],
        allergies: newPatientData.allergies ? newPatientData.allergies.split(',').map(s => s.trim()).filter(Boolean) : []
      };
      const res = await axios.post(`${API_BASE_URL}/api/auth/admin-create-user`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newPatient = res.data.user;
      setPatientFound(newPatient);
      setFormData(prev => ({...prev, patientId: newPatient._id}));
      
    } catch (error: any) {
      console.error("Failed to register patient", error);
      alert(error.response?.data?.message || error.message || "Error registering patient.");
    } finally {
      setRegistering(false);
    }
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
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      <div className="flex items-center justify-between">
        <motion.div variants={itemVariants}>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Appointments
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">Manage daily appointments and queues.</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button onClick={() => setShowAddModal(true)} className="shadow-lg shadow-primary/20 hover:scale-105 transition-transform bg-gradient-to-r from-primary to-indigo-600">
            <Plus className="mr-2 h-4 w-4" /> New Appointment
          </Button>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-4">
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <Card className="glass h-full border-border/50 shadow-lg">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-primary" /> Calendar</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="p-6 border border-dashed rounded-xl text-center text-slate-500 bg-muted/10 flex flex-col items-center justify-center">
                <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-30 text-primary" />
                <p className="font-medium">Calendar Component</p>
                <p className="text-sm mt-2 text-primary bg-primary/10 px-3 py-1 rounded-full font-bold">Today: {new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="mt-8 space-y-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Available Doctors
                </h4>
                <div className="space-y-3">
                  {doctors.slice(0, 5).map(doc => (
                     <div key={doc._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30">
                       <span className="flex items-center text-sm font-semibold">{doc.name}</span>
                       <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">Available</Badge>
                     </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-6 lg:col-span-3">
          <Card className="glass h-full border-border/50 shadow-lg">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Today's Queue</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {loading ? (
                  <div className="text-center py-16 text-muted-foreground animate-pulse font-medium">Loading appointments...</div>
                ) : appointments.length > 0 ? (
                  appointments.map((appt, i) => (
                    <motion.div 
                      key={appt._id} 
                      whileHover={{ x: 4, backgroundColor: 'rgba(var(--primary), 0.03)' }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-5">
                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 flex items-center justify-center font-extrabold text-xl text-primary shadow-inner">
                          {appt.queueNumber || i + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-foreground">{appt.patientId?.name || 'Unknown Patient'}</h4>
                          <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1.5 gap-2 sm:gap-4 font-medium">
                            <span className="flex items-center bg-muted px-2.5 py-1 rounded-md"><Clock className="mr-1.5 h-3.5 w-3.5" /> {appt.appointmentTime}</span>
                            <span className="flex items-center bg-muted px-2.5 py-1 rounded-md">{appt.type}</span>
                            <span className="flex items-center bg-muted px-2.5 py-1 rounded-md text-primary">Dr. {appt.doctorId?.name}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="px-3 py-1 shadow-sm">
                          {appt.status}
                        </Badge>
                        <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground shadow-sm transition-all">Details</Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                    <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <CalendarIcon className="h-10 w-10 opacity-30" />
                    </div>
                    <p className="text-lg font-medium">No appointments found.</p>
                    <p className="text-sm opacity-70 mt-1">The queue is currently empty.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add Appointment Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-card text-card-foreground w-full max-w-xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-purple-600" />
              <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/10">
                <div>
                  <h3 className="font-bold text-2xl tracking-tight text-foreground">Create Appointment</h3>
                  <p className="text-sm text-muted-foreground mt-1">Schedule a new visit for a patient.</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <form onSubmit={handleAddSubmit} className="flex flex-col max-h-[75vh]">
                <div className="p-6 space-y-6 overflow-y-auto">
                
                {/* Patient Search Section */}
                <div className="bg-muted/20 p-4 rounded-xl border border-border/50">
                  <div className="space-y-2 mb-4">
                    <Label className="text-sm font-semibold text-foreground">Mobile Number or Employee ID</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="text" 
                        placeholder="Search by 10-digit mobile or ID (e.g. EMP-123)"
                        value={searchPhone} 
                        onChange={(e) => {
                          setSearchPhone(e.target.value);
                        }} 
                        className="h-11 rounded-xl border-input/60 bg-background/50 shadow-sm focus-visible:ring-primary/40 focus-visible:border-primary transition-all flex-1" 
                      />
                    </div>
                  </div>

                  {/* Auto-filled details */}
                  {patientFound ? (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{patientFound.name} ({patientFound.gender})</span>
                        <span className="text-xs font-semibold px-2 py-1 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full">
                          Age: {patientFound.dob ? Math.floor((new Date().getTime() - new Date(patientFound.dob).getTime()) / 31557600000) : 'N/A'}
                        </span>
                      </div>
                      {(patientFound.chronicDiseases?.length > 0 || patientFound.allergies?.length > 0) ? (
                         <div className="text-xs text-muted-foreground mt-2 grid grid-cols-2 gap-2">
                           {patientFound.chronicDiseases?.length > 0 && <div><strong className="text-foreground">Issues:</strong> {patientFound.chronicDiseases.join(', ')}</div>}
                           {patientFound.allergies?.length > 0 && <div><strong className="text-foreground">Allergies:</strong> {patientFound.allergies.join(', ')}</div>}
                         </div>
                      ) : (
                         <div className="text-xs text-muted-foreground mt-1">No known chronic issues or allergies.</div>
                      )}
                    </div>
                  ) : searchPhone.length >= 3 ? (
                    <div className="mt-4 p-4 rounded-xl bg-background border border-border shadow-sm">
                      <div className="flex items-center gap-2 mb-3 text-destructive">
                        <span className="font-bold">Patient Not Found</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10">Quick Register</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <Label className="text-xs">Full Name</Label>
                          <Input className="h-9 text-sm" value={newPatientData.name} onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} placeholder="e.g. John Doe" />
                        </div>
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <Label className="text-xs text-foreground">Email</Label>
                          <Input type="email" className="h-9 text-sm border-input/60" value={newPatientData.email} onChange={e => setNewPatientData({...newPatientData, email: e.target.value})} placeholder="Required for portal access" required />
                        </div>
                        <div className="space-y-1 col-span-1">
                          <Label className="text-xs text-foreground">Gender</Label>
                          <select className="flex h-9 w-full rounded-md border border-input/60 bg-background px-3 py-1 text-sm shadow-sm" value={newPatientData.gender} onChange={e => setNewPatientData({...newPatientData, gender: e.target.value})}>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className="space-y-1 col-span-1">
                          <Label className="text-xs text-foreground">Age</Label>
                          <Input type="number" required min="0" max="150" className="h-9 text-sm border-input/60" value={newPatientData.age} onChange={e => setNewPatientData({...newPatientData, age: e.target.value})} placeholder="Years" />
                        </div>
                        <div className="space-y-1 col-span-1">
                          <Label className="text-xs text-foreground">Blood Group</Label>
                          <select className="flex h-9 w-full rounded-md border border-input/60 bg-background px-3 py-1 text-sm shadow-sm" value={newPatientData.bloodGroup} onChange={e => setNewPatientData({...newPatientData, bloodGroup: e.target.value})}>
                            <option value="">Unknown</option>
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
                        <div className="space-y-1 col-span-1">
                          <Label className="text-xs text-foreground">Emergency Contact</Label>
                          <Input type="tel" required className="h-9 text-sm border-input/60" value={newPatientData.emergencyContact} onChange={e => setNewPatientData({...newPatientData, emergencyContact: e.target.value})} placeholder="10-digit number" />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label className="text-xs text-foreground">Past Issues / Chronic Diseases</Label>
                          <Input className="h-9 text-sm border-input/60" value={newPatientData.chronicDiseases} onChange={e => setNewPatientData({...newPatientData, chronicDiseases: e.target.value})} placeholder="e.g. Asthma, Diabetes (comma separated)" />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label className="text-xs text-foreground">Allergies</Label>
                          <Input className="h-9 text-sm border-input/60" value={newPatientData.allergies} onChange={e => setNewPatientData({...newPatientData, allergies: e.target.value})} placeholder="e.g. Penicillin, Peanuts (comma separated)" />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label className="text-xs text-foreground">Address</Label>
                          <Input required className="h-9 text-sm border-input/60" value={newPatientData.address} onChange={e => setNewPatientData({...newPatientData, address: e.target.value})} placeholder="City, State" />
                        </div>
                        <div className="col-span-2 mt-2">
                          <Button 
                            type="button" 
                            onClick={handleQuickRegister} 
                            disabled={registering || !newPatientData.name || !newPatientData.email || !newPatientData.age}
                            className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {registering ? 'Registering...' : 'Register & Select Patient'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2 col-span-2 md:col-span-2">
                    <Label className="text-sm font-semibold text-foreground">Doctor</Label>
                    <select required className="flex h-11 w-full rounded-xl border border-input/60 bg-background/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all appearance-none" value={formData.doctorId} onChange={(e) => setFormData({...formData, doctorId: e.target.value})}>
                      {doctors.map(d => (
                        <option key={d._id} value={d._id}>Dr. {d.name} ({d.specialization})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2 col-span-1">
                    <Label className="text-sm font-semibold text-foreground">Date</Label>
                    <Input type="date" required value={formData.appointmentDate} onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})} className="h-11 rounded-xl border-input/60 bg-background/50 shadow-sm focus-visible:ring-primary/40 focus-visible:border-primary transition-all" />
                  </div>
                  <div className="space-y-2 col-span-1">
                    <Label className="text-sm font-semibold text-foreground">Time</Label>
                    <Input type="time" required value={formData.appointmentTime} onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})} className="h-11 rounded-xl border-input/60 bg-background/50 shadow-sm focus-visible:ring-primary/40 focus-visible:border-primary transition-all" />
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm font-semibold text-foreground">Visit Type</Label>
                    <select required className="flex h-11 w-full rounded-xl border border-input/60 bg-background/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all appearance-none" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option>Walk-in</option>
                      <option>Scheduled</option>
                      <option>Follow-up</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-sm font-semibold text-foreground">Reason For Visit / Current Issue</Label>
                    <Input required placeholder="Briefly describe the current issue..." value={formData.reasonForVisit} onChange={(e) => setFormData({...formData, reasonForVisit: e.target.value})} className="h-11 rounded-xl border-input/60 bg-background/50 shadow-sm focus-visible:ring-primary/40 focus-visible:border-primary transition-all" />
                  </div>
                </div>
                </div>
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border/50 bg-card z-10">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl px-5 hover:bg-muted transition-colors">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!patientFound} className="rounded-xl px-6 bg-gradient-to-r from-primary to-indigo-600 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                    Schedule Appointment
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
