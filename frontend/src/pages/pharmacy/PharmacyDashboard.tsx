import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill, AlertTriangle, Clock, Search, Plus, X, CheckCircle, FileText, IndianRupee, User, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function PharmacyDashboard() {
  const { token } = useAuth();
  
  // Data state
  const [inventory, setInventory] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [billingAmount, setBillingAmount] = useState<number>(250);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [dispensing, setDispensing] = useState(false);

  // Form state for new medicine
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: 'Tablet',
    manufacturer: '',
    stockQuantity: 100,
    unitPrice: 10,
    expiryDate: ''
  });

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/pharmacy/medicines', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(res.data);
    } catch (error) {
      console.error("Failed to fetch medicines", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      setPrescriptionsLoading(true);
      const res = await axios.get('http://localhost:5000/api/pharmacy/prescriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescriptions(res.data);
    } catch (error) {
      console.error("Failed to fetch prescriptions", error);
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMedicines();
      fetchPrescriptions();
    }
  }, [token]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/pharmacy/medicines', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      fetchMedicines();
      setFormData({
        name: '', genericName: '', category: 'Tablet', manufacturer: '', stockQuantity: 100, unitPrice: 10, expiryDate: ''
      });
    } catch (error) {
      console.error("Failed to add medicine", error);
      alert("Error adding medicine");
    }
  };

  const handleDispenseAndBill = async () => {
    if (!selectedRecord) return;
    setDispensing(true);
    try {
      await axios.post('http://localhost:5000/api/pharmacy/dispense-and-bill', {
        recordId: selectedRecord._id,
        billedAmount: billingAmount,
        paymentMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Prescription for ${selectedRecord.patientId?.name || 'patient'} dispensed & billed successfully! Invoice generated.`);
      setSelectedRecord(null);
      fetchPrescriptions();
    } catch (error: any) {
      console.error("Failed to dispense prescription", error);
      alert("Error dispensing: " + (error.response?.data?.message || error.message));
    } finally {
      setDispensing(false);
    }
  };

  // Metrics
  const totalMedicines = inventory.length;
  const lowStock = inventory.filter(m => m.stockQuantity < 50).length;
  const pendingPrescriptionsCount = prescriptions.filter(p => p.pharmacyStatus !== 'Dispensed').length;

  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  const expiringSoon = inventory.filter(m => new Date(m.expiryDate) < threeMonthsFromNow).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Pharmacy Dashboard</h2>
          <p className="text-muted-foreground mt-1 text-lg">Manage prescribed medicines, dispensing queue, and inventory.</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex gap-3">
          <Button onClick={() => setShowAddModal(true)} className="bg-primary shadow-md hover:scale-105 transition-transform">
            <Plus className="mr-2 h-4 w-4" /> Add Medicine
          </Button>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-primary">Pending Prescriptions</CardTitle>
              <div className="p-2 rounded-xl bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight text-primary">{prescriptionsLoading ? '...' : pendingPrescriptionsCount}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Awaiting pharmacy dispensing</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-border/50">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold">Total Medicines</CardTitle>
              <div className="p-2 rounded-xl bg-primary/10">
                <Pill className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight">{totalMedicines}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Active inventory items</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-amber-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-amber-600 dark:text-amber-500">Low Stock Alerts</CardTitle>
              <div className="p-2 rounded-xl bg-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-500">{lowStock}</div>
              <p className="text-xs text-amber-600/80 mt-1 font-medium">&lt; 50 units remaining</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-red-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-red-600 dark:text-red-500">Expiring Soon</CardTitle>
              <div className="p-2 rounded-xl bg-red-500/20">
                <Clock className="h-4 w-4 text-red-600 dark:text-red-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight text-red-600 dark:text-red-500">{expiringSoon}</div>
              <p className="text-xs text-red-600/80 mt-1 font-medium">Within next 3 months</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* TABS FOR PRESCRIPTION QUEUE AND INVENTORY */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50 shadow-xl overflow-hidden">
          <Tabs defaultValue="prescriptions" className="w-full">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-0 pt-4 px-6">
              <TabsList className="bg-transparent mb-[-1px]">
                <TabsTrigger value="prescriptions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none pb-3 pt-2 px-4 text-base font-semibold">
                  Prescription Requests Queue ({pendingPrescriptionsCount})
                </TabsTrigger>
                <TabsTrigger value="inventory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none pb-3 pt-2 px-4 text-base font-semibold">
                  Inventory Management ({totalMedicines})
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-0">
              {/* TAB 1: PRESCRIPTIONS QUEUE */}
              <TabsContent value="prescriptions" className="m-0 border-none outline-none">
                {prescriptionsLoading ? (
                  <div className="p-16 text-center text-muted-foreground font-medium">Loading prescription queue...</div>
                ) : prescriptions.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {prescriptions.map((record: any) => {
                      const patient = record.patientId;
                      const doctor = record.doctorId;
                      const isDispensed = record.pharmacyStatus === 'Dispensed';

                      return (
                        <div key={record._id} className="p-6 transition-colors space-y-4 hover:bg-muted/10">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner shrink-0 mt-1">
                                <User className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-lg text-foreground">{patient?.name || 'Unknown Patient'}</h4>
                                  {patient?.patientId && (
                                    <Badge variant="outline" className="text-xs bg-muted">
                                      ID: {patient.patientId}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className={
                                    isDispensed 
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  }>
                                    {isDispensed ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                    {isDispensed ? `Dispensed & Billed (₹${record.pharmacyBilledAmount || 0})` : 'Pending Dispensing'}
                                  </Badge>
                                </div>

                                <p className="text-sm text-muted-foreground mt-0.5">
                                  Phone: {patient?.phone || '--'} | Blood Group: {patient?.bloodGroup || '--'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                  <Stethoscope className="h-3.5 w-3.5 text-primary" />
                                  <span>Prescribed by: <strong>Dr. {doctor?.name || 'Doctor'}</strong> ({doctor?.specialization || 'Physician'})</span>
                                  <span>•</span>
                                  <span>{new Date(record.createdAt).toLocaleString()}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isDispensed ? (
                                <Button 
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    // calculate default billing amount based on medicine count
                                    const total = (record.prescription?.length || 1) * 120;
                                    setBillingAmount(total);
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:scale-105 transition-all font-semibold"
                                >
                                  <IndianRupee className="mr-1.5 h-4 w-4" /> Dispense & Generate Bill
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs text-emerald-600 border-emerald-500/30 bg-emerald-500/10 cursor-default"
                                >
                                  <CheckCircle className="mr-1.5 h-4 w-4" /> Billing Completed
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Prescribed medicines list */}
                          <div className="bg-card border border-border/60 p-4 rounded-xl space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <Pill className="h-3.5 w-3.5 text-primary" /> Prescribed Medicine List
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                              {record.prescription?.map((med: any, idx: number) => (
                                <div key={idx} className="bg-background/80 p-3 rounded-lg border border-border/40 text-xs space-y-1">
                                  <div className="font-bold text-foreground text-sm">{med.medicineName}</div>
                                  <div className="text-muted-foreground">Dosage: <span className="font-medium text-foreground">{med.dosage}</span></div>
                                  <div className="text-muted-foreground">Duration: <span className="font-medium text-foreground">{med.duration}</span></div>
                                  {med.instructions && <div className="text-xs text-primary/80 italic">{med.instructions}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Pill className="h-8 w-8 opacity-40 text-primary" />
                    </div>
                    <p className="text-lg font-medium">No pending prescription requests found.</p>
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: INVENTORY MANAGEMENT */}
              <TabsContent value="inventory" className="m-0 border-none outline-none">
                <div className="p-4 border-b border-border/50 bg-muted/10 flex justify-between items-center">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search medicine inventory..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background/50 border-border/50 focus:ring-primary/50 transition-all rounded-xl" 
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">Loading inventory...</TableCell>
                      </TableRow>
                    ) : inventory.length > 0 ? (
                      inventory
                        .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.genericName?.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((med) => {
                          const isLow = med.stockQuantity < 50;
                          const isExpiring = new Date(med.expiryDate) < threeMonthsFromNow;
                          let status = 'Healthy';
                          if (isExpiring) status = 'Expiring Soon';
                          else if (isLow) status = 'Low Stock';

                          return (
                            <TableRow key={med._id}>
                              <TableCell className="font-semibold">
                                {med.name} 
                                <div className="text-xs font-normal text-muted-foreground">{med.genericName}</div>
                              </TableCell>
                              <TableCell>{med.category}</TableCell>
                              <TableCell>{med.manufacturer}</TableCell>
                              <TableCell>{new Date(med.expiryDate).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right font-medium">{med.stockQuantity}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                  status === 'Low Stock' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                  'bg-red-500/10 text-red-600 border-red-500/20'
                                }>
                                  {status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No medicines found in inventory.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </motion.div>

      {/* DISPENSE & BILLING MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl p-6 space-y-6 relative text-card-foreground"
          >
            <button 
              onClick={() => setSelectedRecord(null)} 
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Pill className="h-5 w-5 text-emerald-600" />
                <h3 className="text-xl font-bold text-foreground">Dispense Medicines & Generate Bill</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Patient: <span className="font-semibold text-foreground">{selectedRecord.patientId?.name}</span> | 
                Doctor: <span className="font-semibold text-foreground">Dr. {selectedRecord.doctorId?.name}</span>
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-muted/20 p-3.5 rounded-xl border space-y-2">
                <span className="font-semibold text-xs text-muted-foreground uppercase">Prescribed Medicines summary</span>
                <ul className="divide-y divide-border/40 text-xs">
                  {selectedRecord.prescription?.map((m: any, idx: number) => (
                    <li key={idx} className="py-1.5 flex justify-between">
                      <span className="font-bold">{m.medicineName} ({m.dosage})</span>
                      <span className="text-muted-foreground">{m.duration}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingAmount">Total Billing Amount (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                  <Input 
                    id="billingAmount" 
                    type="number"
                    value={billingAmount}
                    onChange={e => setBillingAmount(parseFloat(e.target.value) || 0)}
                    className="pl-8 bg-background/50 font-bold text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <select 
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / Digital Transfer</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Insurance">Corporate / Insurance Waived</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setSelectedRecord(null)}>Cancel</Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-semibold"
                disabled={dispensing || billingAmount <= 0}
                onClick={handleDispenseAndBill}
              >
                {dispensing ? 'Processing...' : 'Confirm Dispensing & Create Invoice'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Medicine Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b bg-muted/30">
                <h3 className="font-semibold text-lg">Add New Medicine to Inventory</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Medicine Name</Label>
                    <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Generic Name</Label>
                    <Input required value={formData.genericName} onChange={(e) => setFormData({...formData, genericName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option>Tablet</option>
                      <option>Syrup</option>
                      <option>Injection</option>
                      <option>Capsule</option>
                      <option>Ointment</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Manufacturer</Label>
                    <Input required value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Quantity</Label>
                    <Input type="number" required value={formData.stockQuantity} onChange={(e) => setFormData({...formData, stockQuantity: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price (₹)</Label>
                    <Input type="number" step="0.01" required value={formData.unitPrice} onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Expiry Date</Label>
                    <Input type="date" required value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit">Save Medicine</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
