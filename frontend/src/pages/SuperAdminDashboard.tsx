import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Stethoscope, Bed, Activity, Pencil, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';

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

  const { token, user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'super admin';

  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeDoctors: 0,
    appointmentsToday: 0,
    availableBeds: 0
  });
  const [loading, setLoading] = useState(true);

  // Edit Beds Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bedInput, setBedInput] = useState<number | string>(0);
  const [updatingBeds, setUpdatingBeds] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
        setBedInput(res.data.availableBeds);
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

  const handleUpdateBeds = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingBeds(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/dashboard/beds`, {
        availableBeds: Number(bedInput)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(prev => ({ ...prev, availableBeds: res.data.availableBeds }));
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update available beds count');
    } finally {
      setUpdatingBeds(false);
    }
  };

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
          { title: 'Total Employees', value: loading ? '...' : stats.totalEmployees.toString(), icon: Users, desc: 'Active staff members', color: 'from-blue-500/10 to-indigo-500/10 text-indigo-500', isBeds: false },
          { title: 'Active Doctors', value: loading ? '...' : stats.activeDoctors.toString(), icon: Stethoscope, desc: 'Registered specialists', color: 'from-emerald-500/10 to-teal-500/10 text-teal-500', isBeds: false },
          { title: 'Appointments Today', value: loading ? '...' : stats.appointmentsToday.toString(), icon: Activity, desc: 'Scheduled today', color: 'from-amber-500/10 to-orange-500/10 text-orange-500', isBeds: false },
          { title: 'Available Beds', value: loading ? '...' : stats.availableBeds.toString(), icon: Bed, desc: 'Current capacity', color: 'from-rose-500/10 to-pink-500/10 text-pink-500', isBeds: true }
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="glass relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-border/50">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold">{stat.title}</CardTitle>
                  {stat.isBeds && isAdmin && (
                    <button
                      onClick={() => {
                        setBedInput(stats.availableBeds);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1 rounded-lg hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 transition-colors"
                      title="Edit Available Beds (Admin Only)"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-extrabold tracking-tight flex items-center justify-between">
                  <span>{stat.value}</span>
                  {stat.isBeds && isAdmin && (
                    <button
                      onClick={() => {
                        setBedInput(stats.availableBeds);
                        setIsEditModalOpen(true);
                      }}
                      className="text-xs font-semibold text-pink-500 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  )}
                </div>
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

      {/* Edit Available Beds Modal (Admin Only) */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/80 rounded-2xl p-6 shadow-2xl w-full max-w-md space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500">
                    <Bed className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Update Available Beds</h3>
                    <p className="text-xs text-muted-foreground">Admin Only Management</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateBeds} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">
                    Available Bed Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={bedInput}
                    onChange={(e) => setBedInput(e.target.value)}
                    placeholder="Enter available beds count..."
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-foreground font-semibold text-lg"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingBeds}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {updatingBeds ? 'Updating...' : (
                      <>
                        <Check className="h-4 w-4" /> Save Beds Count
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
