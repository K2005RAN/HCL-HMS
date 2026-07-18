import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Upload, Plus, Search } from 'lucide-react';
import CSVImportWizard from '@/components/employees/CSVImportWizard';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function EmployeeList() {
  const [showImport, setShowImport] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/employees', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployees(res.data);
      } catch (error) {
        console.error('Failed to fetch employees', error);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchEmployees();
    }
  }, [token]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (showImport) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Bulk Import Employees</h2>
          <Button variant="outline" onClick={() => setShowImport(false)} className="hover:bg-destructive hover:text-destructive-foreground transition-colors">Cancel</Button>
        </motion.div>
        <motion.div variants={itemVariants}>
          <CSVImportWizard onComplete={() => setShowImport(false)} />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Employees</h2>
          <p className="text-muted-foreground mt-1 text-lg">Manage company employees and their profiles.</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="hover:scale-105 transition-transform bg-background/50 backdrop-blur-sm">
            <Download className="mr-2 h-4 w-4 text-primary" /> Export
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)} className="hover:scale-105 transition-transform bg-background/50 backdrop-blur-sm">
            <Upload className="mr-2 h-4 w-4 text-primary" /> Import CSV
          </Button>
          <Button className="shadow-lg shadow-primary/20 hover:scale-105 transition-transform bg-gradient-to-r from-primary to-indigo-600">
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="flex items-center px-4 py-3 glass rounded-xl border border-border/50 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all duration-300">
        <Search className="h-5 w-5 text-muted-foreground mr-3" />
        <Input 
          placeholder="Search by ID, Name or Department..." 
          className="border-0 focus-visible:ring-0 px-0 shadow-none bg-transparent text-base"
        />
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-xl glass border border-border/50 shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-foreground font-semibold py-4">Emp ID</TableHead>
              <TableHead className="text-foreground font-semibold py-4">Name</TableHead>
              <TableHead className="text-foreground font-semibold py-4">Department</TableHead>
              <TableHead className="text-foreground font-semibold py-4">Plant</TableHead>
              <TableHead className="text-foreground font-semibold py-4">Designation</TableHead>
              <TableHead className="text-foreground font-semibold py-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground animate-pulse font-medium">
                  Loading employees...
                </TableCell>
              </TableRow>
            ) : employees.length > 0 ? (
              employees.map((emp, i) => (
                <motion.tr 
                  key={emp._id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-border/50 hover:bg-muted/50 transition-colors group"
                >
                  <TableCell className="font-bold text-foreground py-4">{emp.employeeId}</TableCell>
                  <TableCell className="text-foreground font-medium py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {emp.name.substring(0,2).toUpperCase()}
                      </div>
                      {emp.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground py-4">{emp.department}</TableCell>
                  <TableCell className="text-muted-foreground py-4">{emp.plant}</TableCell>
                  <TableCell className="text-muted-foreground py-4">{emp.designation}</TableCell>
                  <TableCell className="py-4">
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                      {emp.status}
                    </span>
                  </TableCell>
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Search className="h-8 w-8 opacity-40 text-primary" />
                    </div>
                    <p className="text-lg font-medium">No employees found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </motion.div>
  );
}
