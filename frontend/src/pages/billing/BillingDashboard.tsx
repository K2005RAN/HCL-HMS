import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IndianRupee, FileText, Plus, Search, Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export default function BillingDashboard() {
  const invoices: any[] = [];

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
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Billing & Invoices</h2>
          <p className="text-muted-foreground mt-1 text-lg">Manage hospital billing, payments, and financial records.</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all text-white">
            <Plus className="mr-2 h-4 w-4" /> Generate Invoice
          </Button>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-500">Revenue Today</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <IndianRupee className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-500">₹ 0</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-amber-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-500">Pending Payments</CardTitle>
              <div className="p-2 rounded-xl bg-amber-500/10">
                <FileText className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-500">₹ 0</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-xl">Recent Invoices</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search invoice or patient..." className="pl-9 bg-background/50 border-border/50 focus:ring-primary/50 transition-all rounded-xl" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-foreground font-semibold py-4">Invoice No.</TableHead>
                  <TableHead className="text-foreground font-semibold py-4">Patient</TableHead>
                  <TableHead className="text-foreground font-semibold py-4">Date</TableHead>
                  <TableHead className="text-right text-foreground font-semibold py-4">Amount</TableHead>
                  <TableHead className="text-foreground font-semibold py-4">Status</TableHead>
                  <TableHead className="text-right py-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length > 0 ? (
                  invoices.map((inv, i) => (
                    <motion.tr 
                      key={inv.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-bold text-muted-foreground py-4">{inv.id}</TableCell>
                      <TableCell className="font-bold text-foreground py-4">{inv.patient}</TableCell>
                      <TableCell className="text-muted-foreground py-4">{inv.date}</TableCell>
                      <TableCell className="text-right font-bold text-foreground py-4">{inv.amount}</TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className={
                          inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary transition-colors">View PDF</Button>
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <Receipt className="h-8 w-8 opacity-40 text-primary" />
                        </div>
                        <p className="text-lg font-medium">No recent invoices.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
