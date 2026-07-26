import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TestTube, FileUp, CheckCircle, Search, User, Stethoscope, Phone, X, FileCheck, FileText, Download, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';

export default function LaboratoryDashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for uploading report / findings
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [resultNotes, setResultNotes] = useState('');
  const [pdfReportUrl, setPdfReportUrl] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      alert('Please select a PDF document or image file.');
      return;
    }

    setPdfFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPdfReportUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchTests = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/lab/tests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTests(res.data);
    } catch (err) {
      console.error("Failed to fetch lab tests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTests();
    }
  }, [token]);

  const handleUpdateStatus = async (testId: string, status: string, payload: any = {}) => {
    setUpdating(true);
    try {
      await axios.put(`${API_BASE_URL}/api/lab/tests/${testId}/status`, {
        status,
        ...payload
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Status updated to ${status}!`);
      setSelectedTest(null);
      setResultNotes('');
      setPdfReportUrl('');
      fetchTests();
    } catch (err: any) {
      console.error("Failed to update test status", err);
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const pendingCount = tests.filter(t => t.status === 'Pending').length;
  const processingCount = tests.filter(t => t.status === 'Sample Collected').length;
  const completedCount = tests.filter(t => t.status === 'Completed').length;

  const filteredTests = tests.filter(t => {
    const query = searchQuery.toLowerCase();
    const patientName = t.patientId?.name?.toLowerCase() || '';
    const patientIdStr = t.patientId?.patientId?.toLowerCase() || '';
    const testName = t.testName?.toLowerCase() || '';
    const doctorName = t.doctorId?.name?.toLowerCase() || '';
    return patientName.includes(query) || patientIdStr.includes(query) || testName.includes(query) || doctorName.includes(query);
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Laboratory Dashboard
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">Manage patient test requests, sample collections, and upload clinical reports.</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button onClick={() => navigate('/attendance')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-md">
            <Activity className="w-4 h-4" /> Mark Attendance / Sign Off
          </Button>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-amber-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-amber-600 dark:text-amber-500">Pending Collections</CardTitle>
              <div className="p-2 rounded-xl bg-amber-500/20">
                <TestTube className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-500">{pendingCount}</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-blue-600 dark:text-blue-500">Processing / Sample Collected</CardTitle>
              <div className="p-2 rounded-xl bg-blue-500/20">
                <TestTube className="h-4 w-4 text-blue-600 dark:text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-500">{processingCount}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">Completed Reports</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/20">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-500">{completedCount}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-xl">Lab Test Requests</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search patient, ID or test..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50 border-border/50 focus:ring-primary/50 transition-all rounded-xl" 
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground font-medium">Loading lab test requests...</div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-foreground font-semibold py-4">Patient Details</TableHead>
                    <TableHead className="text-foreground font-semibold py-4">Test Requested</TableHead>
                    <TableHead className="text-foreground font-semibold py-4">Prescribed By</TableHead>
                    <TableHead className="text-foreground font-semibold py-4">Doctor Remarks</TableHead>
                    <TableHead className="text-foreground font-semibold py-4">Status</TableHead>
                    <TableHead className="text-right text-foreground font-semibold py-4">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.length > 0 ? (
                    filteredTests.map((test, i) => {
                      const p = test.patientId;
                      const d = test.doctorId;
                      const age = p?.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : null;

                      return (
                        <motion.tr 
                          key={test._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <div className="font-bold text-foreground flex items-center gap-1.5">
                                <User className="h-4 w-4 text-primary shrink-0" />
                                {p?.name || 'Unknown Patient'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {p?.patientId && <span className="font-semibold text-foreground/80 mr-2">ID: {p.patientId}</span>}
                                {age && <span>{age} yrs | </span>}
                                {p?.gender && <span>{p.gender}</span>}
                              </div>
                              {p?.phone && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {p.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="py-4">
                            <div>
                              <div className="font-bold text-foreground">{test.testName}</div>
                              <div className="text-xs text-muted-foreground">{test.category}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {new Date(test.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-4">
                            <div className="text-sm font-semibold text-foreground flex items-center gap-1">
                              <Stethoscope className="h-3.5 w-3.5 text-primary" />
                              {d?.name || 'Authorized Doctor'}
                            </div>
                            {d?.specialization && (
                              <div className="text-xs text-muted-foreground">{d.specialization}</div>
                            )}
                          </TableCell>

                          <TableCell className="py-4 max-w-[200px]">
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {test.remarks || 'No special instructions'}
                            </div>
                          </TableCell>

                          <TableCell className="py-4">
                            <Badge variant="outline" className={
                              test.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                              test.status === 'Sample Collected' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                              'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            }>
                              {test.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right py-4">
                            <div className="flex justify-end gap-2">
                              {test.status === 'Pending' && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleUpdateStatus(test._id, 'Sample Collected')}
                                  className="shadow-sm hover:scale-105 transition-transform"
                                >
                                  Collect Sample
                                </Button>
                              )}
                              {(test.status === 'Sample Collected' || test.status === 'Pending') && (
                                <Button 
                                  size="sm" 
                                  className="bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:scale-105 transition-transform text-white"
                                  onClick={() => {
                                    setSelectedTest(test);
                                    setResultNotes(test.resultNotes || '');
                                    setPdfReportUrl(test.pdfReportUrl || '');
                                  }}
                                >
                                  <FileUp className="h-4 w-4 mr-1.5" /> Complete Report
                                </Button>
                              )}
                              {test.status === 'Completed' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-xs font-medium text-emerald-600"
                                  onClick={() => {
                                    setSelectedTest(test);
                                    setResultNotes(test.resultNotes || '');
                                    setPdfReportUrl(test.pdfReportUrl || '');
                                  }}
                                >
                                  View / Edit Report
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <TestTube className="h-8 w-8 opacity-40 text-primary" />
                          </div>
                          <p className="text-lg font-medium">No lab test requests found.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* REPORT ENTRY / UPLOAD MODAL */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl p-6 space-y-6 relative text-card-foreground"
          >
            <button 
              onClick={() => setSelectedTest(null)} 
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <TestTube className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Complete Lab Report</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Patient: <span className="font-semibold text-foreground">{selectedTest.patientId?.name}</span> | 
                Test: <span className="font-semibold text-foreground">{selectedTest.testName}</span>
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <Label htmlFor="resultNotes">Test Findings & Results Notes</Label>
                <Textarea 
                  id="resultNotes" 
                  rows={4}
                  placeholder="Enter detailed laboratory findings (e.g. Hemoglobin: 13.8 g/dL, Total Leukocyte Count: 6800 /cu mm - All parameters normal)"
                  value={resultNotes}
                  onChange={e => setResultNotes(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdfFile">Upload Report PDF Document</Label>
                <Input 
                  id="pdfFile" 
                  type="file" 
                  accept="application/pdf,image/*" 
                  onChange={handleFileUpload} 
                  className="bg-background/50 cursor-pointer text-xs"
                />
                {pdfFileName && (
                  <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center gap-1.5 font-medium">
                      <FileCheck className="h-4 w-4 shrink-0" />
                      <span>Uploaded: <strong>{pdfFileName}</strong></span>
                    </div>
                    {pdfReportUrl && (
                      <a 
                        href={pdfReportUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="underline text-xs font-semibold hover:text-emerald-700"
                      >
                        Preview PDF
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setSelectedTest(null)}>Cancel</Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={updating || !resultNotes.trim()}
                onClick={() => handleUpdateStatus(selectedTest._id, 'Completed', { resultNotes, pdfReportUrl })}
              >
                {updating ? 'Saving...' : 'Submit & Mark Completed'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
