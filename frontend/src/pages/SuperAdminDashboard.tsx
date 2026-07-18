import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Stethoscope, Bed, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function SuperAdminDashboard() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeDoctors: 0,
    appointmentsToday: 0,
    availableBeds: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchStats();
    }
  }, [token]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      <div className="flex items-center justify-between">
        <motion.div variants={itemVariants}>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Super Admin Dashboard
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">
            Overview of hospital activities and management.
          </p>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Employees', value: loading ? '...' : stats.totalEmployees.toString(), icon: Users, desc: 'Active staff members', color: 'from-blue-500/10 to-indigo-500/10 text-indigo-500' },
          { title: 'Active Doctors', value: loading ? '...' : stats.activeDoctors.toString(), icon: Stethoscope, desc: 'Registered specialists', color: 'from-emerald-500/10 to-teal-500/10 text-teal-500' },
          { title: 'Appointments Today', value: loading ? '...' : stats.appointmentsToday.toString(), icon: Activity, desc: 'Scheduled today', color: 'from-amber-500/10 to-orange-500/10 text-orange-500' },
          { title: 'Available Beds', value: loading ? '...' : stats.availableBeds.toString(), icon: Bed, desc: 'Current capacity', color: 'from-rose-500/10 to-pink-500/10 text-pink-500' }
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-border/50">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold">{stat.title}</CardTitle>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-extrabold tracking-tight">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={itemVariants} className="col-span-4">
          <Card className="glass h-full border-border/50 hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Patient Visits Over Time</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50 mx-4">
                No visit data available to display.
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants} className="col-span-3">
          <Card className="glass h-full border-border/50 hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50 mx-2">
                <p>No recent activities.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
