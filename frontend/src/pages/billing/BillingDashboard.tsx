import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee, FileText, Plus, Search, Receipt, CheckCircle, Clock, Building2, UserCheck, ShieldCheck, Printer, FlaskConical, Pill, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

export default function BillingDashboard() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  // Generate Invoice State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [patientQuery, setPatientQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected Invoice Modal State for Preview / Printing
  const [selectedInvoiceView, setSelectedInvoiceView] = useState<any | null>(null);

  // Editable bill line items in modal
  const [customConsultationFee, setCustomConsultationFee] = useState(500);
  const [paymentMethodChoice, setPaymentMethodChoice] = useState<'Salary Deduction' | 'Cash' | 'UPI' | 'Card'>('Salary Deduction');

  const fetchInvoices = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/billing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(res.data || []);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [token]);

  // Search Patient Billable Records
  const handleSearchPatient = async (query: string) => {
    setPatientQuery(query);
    setSearchLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/billing/patient-records?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Failed to search patient records for billing:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectRecord = (rec: any) => {
    setSelectedRecord(rec);
    setCustomConsultationFee(rec.consultationCharges || 500);
    setPaymentMethodChoice(rec.suggestedPaymentMethod || (rec.patientType === 'Employee' ? 'Salary Deduction' : 'Cash'));
  };

  const handleCreateInvoiceSubmit = async () => {
    if (!selectedRecord) return;
    setSubmitting(true);
    setGenerateMsg(null);

    const labChg = selectedRecord.labCharges || 0;
    const medChg = selectedRecord.medicineCharges || 0;
    const consChg = Number(customConsultationFee) || 0;
    const subT = labChg + medChg + consChg;
    const gstT = Math.round(subT * 0.05);
    const totT = subT + gstT;

    const payload = {
      patientId: selectedRecord.patient._id,
      appointmentId: selectedRecord.appointmentId,
      patientType: selectedRecord.patientType,
      items: [
        ...(selectedRecord.allItems.filter((i: any) => i.type !== 'Consultation')),
        {
          description: `Doctor Consultation Fee (${selectedRecord.doctorName})`,
          amount: consChg,
          type: 'Consultation'
        }
      ],
      labCharges: labChg,
      medicineCharges: medChg,
      consultationCharges: consChg,
      subTotal: subT,
      gstAmount: gstT,
      totalAmount: totT,
      paymentMethod: paymentMethodChoice
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/api/billing`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGenerateMsg({
        type: 'success',
        text: res.data.message || 'Invoice generated successfully!'
      });

      setTimeout(() => {
        setShowGenerateModal(false);
        setSelectedRecord(null);
        setPatientQuery('');
        setSearchResults([]);
        setGenerateMsg(null);
        fetchInvoices();
      }, 1500);
    } catch (err: any) {
      console.error('Invoice creation error:', err);
      setGenerateMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to generate invoice.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Stats Calculations
  const revenueToday = invoices
    .filter(i => i.status === 'Paid')
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const salaryDeductionsTotal = invoices
    .filter(i => i.status === 'Salary Deduction')
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const pendingPaymentsTotal = invoices
    .filter(i => i.status === 'Pending')
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const filteredInvoices = invoices.filter(inv => {
    const pName = inv.patientId?.name || '';
    const pId = inv.patientId?.patientId || '';
    const invNo = inv.invoiceNumber || '';
    const q = searchFilter.toLowerCase();
    return pName.toLowerCase().includes(q) || pId.toLowerCase().includes(q) || invNo.toLowerCase().includes(q);
  });

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Hospital Billing & Invoices
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Consolidated billing, fixed-rate lab reports (₹300), medicine charges, and corporate employee salary deduction management.
          </p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button 
            onClick={() => { setShowGenerateModal(true); setGenerateMsg(null); handleSearchPatient(''); }}
            className="bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 shadow-lg shadow-emerald-600/20 text-white font-bold rounded-xl px-5"
          >
            <Plus className="mr-2 h-4 w-4" /> Generate Consolidated Invoice
          </Button>
        </motion.div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-xl transition-all border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Cash / Online Revenue</CardTitle>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                <IndianRupee className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                ₹ {revenueToday.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Paid directly by General Patients</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-xl transition-all border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Employee Salary Deductions</CardTitle>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
                <Building2 className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400">
                ₹ {salaryDeductionsTotal.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Routed to corporate employee accounts</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-xl transition-all border-amber-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending Invoices</CardTitle>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                <FileText className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                ₹ {pendingPaymentsTotal.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting settlement at billing desk</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Invoices Table */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border/60 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold">All Billing Records & Invoices</CardTitle>
                <CardDescription>Comprehensive list of generated invoices with breakdown</CardDescription>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by invoice no, patient name or ID..." 
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 bg-background/60 border-border/60 focus:ring-primary/40 rounded-xl text-sm" 
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50">
                  <TableHead className="font-bold py-4">Invoice No.</TableHead>
                  <TableHead className="font-bold py-4">Patient Name & ID</TableHead>
                  <TableHead className="font-bold py-4">Patient Type</TableHead>
                  <TableHead className="font-bold py-4">Date</TableHead>
                  <TableHead className="font-bold py-4">Payment Method</TableHead>
                  <TableHead className="text-right font-bold py-4">Total Amount</TableHead>
                  <TableHead className="font-bold py-4">Status</TableHead>
                  <TableHead className="text-right py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv, i) => {
                    const isEmp = inv.patientType === 'Employee' || inv.status === 'Salary Deduction';

                    return (
                      <TableRow key={inv._id} className="border-border/50 hover:bg-muted/40 transition-colors">
                        <TableCell className="font-extrabold text-foreground py-4">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="font-bold text-foreground">{inv.patientId?.name || 'Patient'}</div>
                          <div className="text-xs text-muted-foreground">{inv.patientId?.patientId || inv.patientId?.phone}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className={isEmp ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 font-bold'}>
                            {isEmp ? '🏢 Employee' : '👤 General'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground py-4 text-xs">
                          {new Date(inv.date || inv.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-semibold py-4 text-xs">
                          {inv.paymentMethod}
                        </TableCell>
                        <TableCell className="text-right font-black text-foreground py-4 text-base">
                          ₹ {inv.totalAmount?.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className={
                            inv.status === 'Salary Deduction' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-extrabold px-2.5 py-0.5' :
                            inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-extrabold px-2.5 py-0.5' :
                            'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-extrabold px-2.5 py-0.5'
                          }>
                            {inv.status === 'Salary Deduction' ? 'Deducted from Salary' : inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          {inv.isPendingVisit ? (
                            <Button 
                              size="sm" 
                              onClick={() => { 
                                setShowGenerateModal(true); 
                                setGenerateMsg(null); 
                                handleSearchPatient(inv.patientId?.name || inv.patientId?.patientId || ''); 
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 rounded-lg shadow-sm"
                            >
                              <Plus className="h-3.5 w-3.5" /> Settle / Bill
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedInvoiceView(inv)}
                              className="text-xs font-semibold rounded-lg gap-1 border-primary/30 hover:bg-primary/10"
                            >
                              <FileText className="h-3.5 w-3.5" /> View Breakdown
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <Receipt className="h-10 w-10 opacity-30 text-primary mb-2" />
                        <p className="text-base font-medium">No billing records found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border border-border/80 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">Generate Consolidated Patient Bill</h3>
                <p className="text-xs text-muted-foreground">Auto-fetches completed consultation, prescription, and fixed-rate lab report charges (₹300/report).</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowGenerateModal(false)} className="rounded-full">✕</Button>
            </div>

            {/* Step 1: Patient Search */}
            {!selectedRecord ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold text-sm text-foreground">Search Patient for Billing</Label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Type patient name, phone, or Employee ID (e.g. EMP-1001)..."
                      value={patientQuery}
                      onChange={e => handleSearchPatient(e.target.value)}
                      className="pl-10 h-11 text-sm bg-background border-primary/40 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {searchLoading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Searching patient records...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((rec: any) => (
                      <div 
                        key={rec.patient._id} 
                        onClick={() => handleSelectRecord(rec)}
                        className="p-4 rounded-xl border border-border/60 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-foreground">{rec.patient.name}</span>
                            <Badge variant="outline" className={rec.patientType === 'Employee' ? 'bg-purple-500/10 text-purple-600 font-bold text-xs' : 'bg-slate-500/10 text-slate-600 font-bold text-xs'}>
                              {rec.patientType === 'Employee' ? '🏢 Employee' : '👤 General'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3">
                            <span>ID: <strong className="text-foreground">{rec.patient.patientId}</strong></span>
                            <span>Phone: <strong className="text-foreground">{rec.patient.phone}</strong></span>
                            <span>Visit Date: {new Date(rec.latestVisitDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-emerald-600">₹ {rec.totalAmount}</div>
                          <span className="text-xs font-semibold text-muted-foreground">{rec.labCount} Lab Reports (₹300 ea)</span>
                        </div>
                      </div>
                    ))
                  ) : patientQuery.trim() ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">No matching patient record found.</div>
                  ) : (
                    <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                      Type patient name or ID above to calculate billable services.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Step 2: Bill Summary & Breakdown */
              <div className="space-y-6">
                {/* Patient Header Card */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-lg text-foreground">{selectedRecord.patient.name}</h4>
                      <Badge variant="outline" className={selectedRecord.patientType === 'Employee' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold' : 'bg-slate-500/10 text-slate-600 border-slate-500/20 font-bold'}>
                        {selectedRecord.patientType === 'Employee' ? '🏢 Corporate Employee' : '👤 General Patient'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: <strong>{selectedRecord.patient.patientId}</strong> | Doctor: <strong>{selectedRecord.doctorName}</strong> | Diagnosis: {selectedRecord.diagnosis}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(null)} className="text-xs text-muted-foreground">
                    Change Patient
                  </Button>
                </div>

                {/* Line Items Breakdown Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Consolidated Service Charges</h4>
                  <div className="border border-border/60 rounded-xl overflow-hidden text-sm">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Service / Item Description</th>
                          <th className="py-2.5 px-4 text-center">Category</th>
                          <th className="py-2.5 px-4 text-right">Charge</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {/* 1. Lab Test Reports */}
                        <tr>
                          <td className="py-3 px-4">
                            <div className="font-bold text-foreground flex items-center gap-2">
                              <FlaskConical className="h-4 w-4 text-amber-500" /> Lab Test Reports
                            </div>
                            <div className="text-xs text-muted-foreground">{selectedRecord.labCount} test(s) ordered @ fixed ₹300 per report type</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 font-bold">Lab Fee</Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-foreground">
                            ₹ {selectedRecord.labCharges}
                          </td>
                        </tr>

                        {/* 2. Prescribed Medicines */}
                        <tr>
                          <td className="py-3 px-4">
                            <div className="font-bold text-foreground flex items-center gap-2">
                              <Pill className="h-4 w-4 text-emerald-500" /> Prescribed Medicines
                            </div>
                            <div className="text-xs text-muted-foreground">Pharmacy medication & supply charges</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 font-bold">Pharmacy</Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-foreground">
                            ₹ {selectedRecord.medicineCharges}
                          </td>
                        </tr>

                        {/* 3. Doctor Consultation Fee */}
                        <tr>
                          <td className="py-3 px-4">
                            <div className="font-bold text-foreground flex items-center gap-2">
                              <Stethoscope className="h-4 w-4 text-primary" /> Doctor OPD Consultation Fee
                            </div>
                            <div className="text-xs text-muted-foreground">Clinical examination & consultation</div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary font-bold">Consultation</Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-foreground">
                            ₹ {customConsultationFee}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Editable Consultation & Payment Mode Switcher */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/20 border border-border/60">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs text-foreground">Doctor Consultation Fee (₹)</Label>
                    <Input 
                      type="number" 
                      value={customConsultationFee}
                      onChange={e => setCustomConsultationFee(Number(e.target.value))}
                      className="h-10 text-sm bg-background border-border/80"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-xs text-foreground">Payment Settlement Mode</Label>
                    {selectedRecord.patientType === 'Employee' ? (
                      <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-extrabold text-xs flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Salary Deduction (Employee Account)
                      </div>
                    ) : (
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold"
                        value={paymentMethodChoice}
                        onChange={(e: any) => setPaymentMethodChoice(e.target.value)}
                      >
                        <option value="Cash">Cash Payment (Pay Now)</option>
                        <option value="UPI">UPI / QR Payment (Pay Now)</option>
                        <option value="Card">Credit / Debit Card (Pay Now)</option>
                        <option value="Salary Deduction">Salary Deduction (Corporate)</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Total & Tax Summary */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Final Bill Total</span>
                    <div className="text-xs text-muted-foreground">Includes Subtotal + 5% GST tax</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      ₹ {(selectedRecord.labCharges + selectedRecord.medicineCharges + Number(customConsultationFee) + Math.round((selectedRecord.labCharges + selectedRecord.medicineCharges + Number(customConsultationFee)) * 0.05)).toLocaleString()}
                    </div>
                    {selectedRecord.patientType === 'Employee' && (
                      <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        Details will be logged in Employee Account (Salary Deduction)
                      </div>
                    )}
                  </div>
                </div>

                {generateMsg && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${generateMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : 'bg-destructive/10 text-destructive border border-destructive/30'}`}>
                    {generateMsg.text}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setSelectedRecord(null)}>Back</Button>
                  <Button 
                    onClick={handleCreateInvoiceSubmit}
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md"
                  >
                    {submitting ? 'Generating Invoice...' : selectedRecord.patientType === 'Employee' ? 'Confirm & Route to Salary Deduction' : 'Generate & Pay Now'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Breakdown Modal */}
      {selectedInvoiceView && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <span className="font-black text-lg text-foreground">{selectedInvoiceView.invoiceNumber}</span>
                <p className="text-xs text-muted-foreground">{new Date(selectedInvoiceView.date || selectedInvoiceView.createdAt).toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedInvoiceView(null)}>✕</Button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">{selectedInvoiceView.patientId?.name || 'Patient'}</div>
                  <div className="text-xs text-muted-foreground">ID: {selectedInvoiceView.patientId?.patientId || selectedInvoiceView.patientId?.phone}</div>
                </div>
                <Badge variant="outline" className={selectedInvoiceView.status === 'Salary Deduction' ? 'bg-purple-500/10 text-purple-600 font-bold' : 'bg-emerald-500/10 text-emerald-600 font-bold'}>
                  {selectedInvoiceView.status === 'Salary Deduction' ? 'Salary Deduction' : selectedInvoiceView.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Itemized Line Charges</h4>
                <div className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/40 text-xs">
                  {selectedInvoiceView.items?.map((it: any, idx: number) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <span className="font-medium text-foreground">{it.description}</span>
                      <span className="font-bold text-foreground">₹ {it.amount}</span>
                    </div>
                  ))}
                  {selectedInvoiceView.labCharges > 0 && !selectedInvoiceView.items?.some((i: any) => i.type === 'Lab') && (
                    <div className="p-3 flex items-center justify-between">
                      <span className="font-medium text-foreground">Lab Test Reports (Fixed ₹300 per report)</span>
                      <span className="font-bold text-foreground">₹ {selectedInvoiceView.labCharges}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹ {selectedInvoiceView.subTotal}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST Tax (5%)</span>
                  <span>₹ {selectedInvoiceView.gstAmount}</span>
                </div>
                <div className="flex justify-between font-black text-base text-foreground pt-1 border-t border-border/40">
                  <span>Total Amount</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹ {selectedInvoiceView.totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedInvoiceView(null)}>Close</Button>
              <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5">
                <Printer className="h-4 w-4" /> Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
