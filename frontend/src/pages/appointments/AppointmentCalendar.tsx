import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Clock, User, Plus, X, HeartPulse, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';

export default function AppointmentCalendar() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Vitals record modal state for existing appointments
  const [vitalsModalAppt, setVitalsModalAppt] = useState<any>(null);
  const [vitalsModalData, setVitalsModalData] = useState({ bp: '', pulse: '', weight: '', temp: '' });
  const [savingVitals, setSavingVitals] = useState(false);

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
    reasonForVisit: '',
    vitals: { bp: '', pulse: '', weight: '', temp: '' }
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
      if (searchPhone.length >= 3) {
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
      // Reset form
      setFormData({
        patientId: '',
        doctorId: doctors[0]?._id || '',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '10:00',
        type: 'Walk-in',
        reasonForVisit: '',
        vitals: { bp: '', pulse: '', weight: '', temp: '' }
      });
      setSearchPhone('');
      setPatientFound(null);
      fetchData(); // Refresh list
    } catch (error: any) {
      console.error("Failed to add appointment", error.response?.data || error);
      alert("Error creating appointment: " + (error.response?.data?.message || error.message));
    }
  };

  const handleOpenVitalsModal = (appt: any) => {
    setVitalsModalAppt(appt);
    setVitalsModalData({
      bp: appt.vitals?.bp || '',
      pulse: appt.vitals?.pulse || '',
      weight: appt.vitals?.weight || '',
      temp: appt.vitals?.temp || ''
    });
  };

  const handleSaveVitalsModal = async () => {
    if (!vitalsModalAppt) return;
    setSavingVitals(true);
    try {
      await axios.put(`${API_BASE_URL}/api/appointments/${vitalsModalAppt._id}/vitals`, {
        vitals: vitalsModalData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVitalsModalAppt(null);
      fetchData();
    } catch (error: any) {
      console.error("Failed to update vitals", error);
      alert("Error updating vitals: " + (error.response?.data?.message || error.message));
    } finally {
      setSavingVitals(false);
    }
  };

  const handleQuickRegister = async () => {
    setRegistering(true);
    try {
      const approxDob = new Date();
      approxDob.setFullYear(approxDob.getFullYear() - parseInt(newPatientData.age || '0'));
      
      const payload = {
        role: 'patient',
        phone: searchPhone,
        password: 'Password123!',
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
            Appointments & Nurse Triage
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">Manage daily appointments, queues, and nurse vitals check-in.</p>
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
                  appointments.map((appt, i) => {
                    const hasVitals = appt.vitals && (appt.vitals.bp || appt.vitals.pulse || appt.vitals.temp || appt.vitals.weight);
                    return (
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
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg text-foreground">{appt.patientId?.name || 'Unknown Patient'}</h4>
                              {hasVitals ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-800 text-xs flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Vitals Recorded
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300 dark:border-amber-800 text-xs flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 text-amber-600" /> Vitals Pending
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1.5 gap-2 sm:gap-4 font-medium">
                              <span className="flex items-center bg-muted px-2.5 py-1 rounded-md"><Clock className="mr-1.5 h-3.5 w-3.5" /> {appt.appointmentTime}</span>
                              <span className="flex items-center bg-muted px-2.5 py-1 rounded-md">{appt.type}</span>
                              <span className="flex items-center bg-muted px-2.5 py-1 rounded-md text-primary">Dr. {appt.doctorId?.name}</span>
                            </div>

                            {hasVitals && (
                              <div className="mt-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg flex flex-wrap gap-3 items-center border border-border/40">
                                <span><strong className="text-foreground">BP:</strong> {appt.vitals.bp || '--'}</span>
                                <span><strong className="text-foreground">Pulse:</strong> {appt.vitals.pulse ? `${appt.vitals.pulse} bpm` : '--'}</span>
                                <span><strong className="text-foreground">Weight:</strong> {appt.vitals.weight ? `${appt.vitals.weight} kg` : '--'}</span>
                                <span><strong className="text-foreground">Temp:</strong> {appt.vitals.temp ? `${appt.vitals.temp} °F` : '--'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenVitalsModal(appt)}
                            className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-300 dark:border-emerald-800 text-xs font-semibold shadow-sm transition-all"
                          >
                            <HeartPulse className="mr-1.5 h-3.5 w-3.5 text-emerald-600 hover:text-white" />
                            {hasVitals ? 'Edit Vitals' : 'Record Vitals'}
                          </Button>
                          <Badge variant="secondary" className="px-3 py-1.5 shadow-sm">
                            {appt.status}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })
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

      {/* Record Vitals Nurse Modal */}
      <AnimatePresence>
        {vitalsModalAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground w-full max-w-md rounded-2xl border border-border/50 shadow-2xl overflow-hidden relative"
            >
              <div className="p-5 border-b border-border/50 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600">
                    <HeartPulse className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Nurse Check-In: Patient Vitals</h3>
                    <p className="text-xs text-muted-foreground">Patient: {vitalsModalAppt.patientId?.name || 'Patient'}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setVitalsModalAppt(null)} className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">BP (mmHg)</Label>
                    <Input 
                      placeholder="120/80" 
                      value={vitalsModalData.bp} 
                      onChange={e => setVitalsModalData({...vitalsModalData, bp: e.target.value})} 
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Pulse (bpm)</Label>
                    <Input 
                      type="number" 
                      placeholder="72" 
                      value={vitalsModalData.pulse} 
                      onChange={e => setVitalsModalData({...vitalsModalData, pulse: e.target.value})} 
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Weight (kg)</Label>
                    <Input 
                      type="number" 
                      placeholder="70" 
                      value={vitalsModalData.weight} 
                      onChange={e => setVitalsModalData({...vitalsModalData, weight: e.target.value})} 
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Temp (°F)</Label>
                    <Input 
                      type="number" 
                      step="0.1" 
                      placeholder="98.6" 
                      value={vitalsModalData.temp} 
                      onChange={e => setVitalsModalData({...vitalsModalData, temp: e.target.value})} 
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border/50 bg-muted/20 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setVitalsModalAppt(null)}>Cancel</Button>
                <Button 
                  onClick={handleSaveVitalsModal} 
                  disabled={savingVitals}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5"
                >
                  {savingVitals ? 'Saving...' : 'Save Vitals'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Appointment Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-card text-card-foreground w-full max-w-xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-purple-600" />
              <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/10">
                <div>
                  <h3 className="font-bold text-2xl tracking-tight text-foreground">Create Appointment</h3>
                  <p className="text-sm text-muted-foreground mt-1">Schedule visit & record triage vitals.</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <form onSubmit={handleAddSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                
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
                          <Label className="text-xs text-foreground">Email Address (Optional)</Label>
                          <Input type="email" className="h-9 text-sm border-input/60" value={newPatientData.email} onChange={e => setNewPatientData({...newPatientData, email: e.target.value})} placeholder="Optional email" />
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
                          <Input type="tel" className="h-9 text-sm border-input/60" value={newPatientData.emergencyContact} onChange={e => setNewPatientData({...newPatientData, emergencyContact: e.target.value})} placeholder="10-digit number" />
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
                          <Input className="h-9 text-sm border-input/60" value={newPatientData.address} onChange={e => setNewPatientData({...newPatientData, address: e.target.value})} placeholder="City, State" />
                        </div>
                        <div className="col-span-2 mt-2">
                          <Button 
                            type="button" 
                            onClick={handleQuickRegister} 
                            disabled={registering || !newPatientData.name || !newPatientData.age}
                            className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
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

                  {/* Nurse Triage Vitals Section */}
                  <div className="col-span-2 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                      <HeartPulse className="h-4 w-4" /> Nurse Triage Vitals (Optional at Booking)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">BP (mmHg)</Label>
                        <Input 
                          placeholder="120/80" 
                          value={formData.vitals.bp} 
                          onChange={e => setFormData({...formData, vitals: {...formData.vitals, bp: e.target.value}})} 
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Pulse (bpm)</Label>
                        <Input 
                          type="number" 
                          placeholder="72" 
                          value={formData.vitals.pulse} 
                          onChange={e => setFormData({...formData, vitals: {...formData.vitals, pulse: e.target.value}})} 
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
                        <Input 
                          type="number" 
                          placeholder="70" 
                          value={formData.vitals.weight} 
                          onChange={e => setFormData({...formData, vitals: {...formData.vitals, weight: e.target.value}})} 
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Temp (°F)</Label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="98.6" 
                          value={formData.vitals.temp} 
                          onChange={e => setFormData({...formData, vitals: {...formData.vitals, temp: e.target.value}})} 
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                    </div>
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
