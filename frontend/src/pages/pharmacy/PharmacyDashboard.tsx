import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pill, AlertTriangle, Clock, Search, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function PharmacyDashboard() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { token } = useAuth();
  
  // Form state
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

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/pharmacy/medicines', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      fetchMedicines(); // Refresh the list
      // Reset form
      setFormData({
        name: '', genericName: '', category: 'Tablet', manufacturer: '', stockQuantity: 100, unitPrice: 10, expiryDate: ''
      });
    } catch (error) {
      console.error("Failed to add medicine", error);
      alert("Error adding medicine");
    }
  };

  // Compute metrics
  const totalMedicines = inventory.length;
  const lowStock = inventory.filter(m => m.stockQuantity < 50).length;
  
  // Calculate expiring soon (within 3 months)
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
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Pharmacy</h2>
          <p className="text-muted-foreground mt-1 text-lg">Manage medicine inventory and dispensing.</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex gap-3">
          <Button variant="outline" onClick={() => setShowAddModal(true)} className="hover:scale-105 transition-transform bg-background/50 backdrop-blur-sm">
            <Plus className="mr-2 h-4 w-4" /> Add Medicine
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
            Issue Medicine
          </Button>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
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
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-xl">Inventory Status</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search medicine..." className="pl-9 bg-background/50 border-border/50 focus:ring-primary/50 transition-all rounded-xl" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">Loading inventory...</TableCell>
                </TableRow>
              ) : inventory.length > 0 ? (
                inventory.map((med) => {
                  const isLow = med.stockQuantity < 50;
                  const isExpiring = new Date(med.expiryDate) < threeMonthsFromNow;
                  let status = 'Healthy';
                  if (isExpiring) status = 'Expiring Soon';
                  else if (isLow) status = 'Low Stock';

                  return (
                    <TableRow key={med._id}>
                      <TableCell className="font-semibold">{med.name} <div className="text-xs font-normal text-muted-foreground">{med.genericName}</div></TableCell>
                      <TableCell>{med.category}</TableCell>
                      <TableCell>{med.manufacturer}</TableCell>
                      <TableCell>{new Date(med.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right font-medium">{med.stockQuantity}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          status === 'Healthy' ? 'bg-green-50 text-green-700 border-green-200' :
                          status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No medicines in inventory.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        </Card>
      </motion.div>

      {/* Add Medicine Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card text-card-foreground w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <h3 className="font-semibold text-lg">Add New Medicine</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleAddSubmit} className="p-4 space-y-4">
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
                    <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
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
