import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export default function AttendanceDashboard() {
  const attendance: any[] = [];

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
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">HR & Attendance</h2>
          <p className="text-muted-foreground mt-1 text-lg">Monitor daily employee attendance and leave requests.</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button className="shadow-lg shadow-primary/20 hover:scale-105 transition-transform bg-gradient-to-r from-primary to-indigo-600">Mark Manual Attendance</Button>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-border/50">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold">Total Staff</CardTitle>
              <div className="p-2 rounded-xl bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight">0</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">Present Today</CardTitle>
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-500">0</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-red-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold text-red-600 dark:text-red-500">Absent</CardTitle>
              <div className="p-2 rounded-xl bg-red-500/10">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold tracking-tight text-red-600 dark:text-red-500">0</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-xl">Today's Log ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search employee..." className="pl-9 bg-background/50 border-border/50 focus:ring-primary/50 transition-all rounded-xl" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-foreground font-semibold py-4">Emp ID</TableHead>
                  <TableHead className="text-foreground font-semibold py-4">Name</TableHead>
                  <TableHead className="text-foreground font-semibold py-4">Department</TableHead>
                  <TableHead className="text-foreground font-semibold py-4">Shift</TableHead>
                  <TableHead className="text-foreground font-semibold py-4">Status</TableHead>
                  <TableHead className="text-foreground font-semibold py-4">Time In</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.length > 0 ? (
                  attendance.map((record, i) => (
                    <motion.tr 
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-bold text-muted-foreground py-4">{record.id}</TableCell>
                      <TableCell className="font-bold text-foreground py-4">{record.name}</TableCell>
                      <TableCell className="text-muted-foreground py-4">{record.dept}</TableCell>
                      <TableCell className="text-muted-foreground py-4">{record.shift}</TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className={
                          record.status === 'Present' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                          record.status === 'On Leave' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                          'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                        }>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-4">{record.timeIn}</TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <Calendar className="h-8 w-8 opacity-40 text-primary" />
                        </div>
                        <p className="text-lg font-medium">No attendance records for today.</p>
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
