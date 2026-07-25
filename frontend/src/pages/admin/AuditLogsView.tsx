import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldAlert, Search, Calendar, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function AuditLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const { token } = useAuth();

  const formatDateForInput = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await axios.get('http://localhost:5000/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const handlePreset = (preset: 'today' | '7days' | '30days') => {
    const now = new Date();
    setActivePreset(preset);
    if (preset === 'today') {
      const todayStr = formatDateForInput(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(now.getDate() - 6);
      setStartDate(formatDateForInput(past));
      setEndDate(formatDateForInput(now));
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(now.getDate() - 29);
      setStartDate(formatDateForInput(past));
      setEndDate(formatDateForInput(now));
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setActivePreset(null);
  };

  const hasActiveFilters = Boolean(startDate || endDate || searchQuery);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Audit Logs</h2>
          <p className="text-muted-foreground">Immutable trail of system activities and access records.</p>
        </div>
        <ShieldAlert className="h-8 w-8 text-primary opacity-50" />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Recent Activities</CardTitle>
              <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 font-medium rounded-full">
                {logs.length} {logs.length === 1 ? 'record' : 'records'}
              </span>
            </div>
            
            {/* Keyword Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by user, action, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 bg-white border-slate-200 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Date Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-slate-600 font-medium mr-1">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Filter by Date:</span>
              </div>
              
              {/* Start Date */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">From</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActivePreset(null);
                  }}
                  className="h-8 text-xs bg-white w-36 border-slate-200"
                />
              </div>

              {/* End Date */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">To</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActivePreset(null);
                  }}
                  className="h-8 text-xs bg-white w-36 border-slate-200"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant={activePreset === 'today' ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => handlePreset('today')}
                  className="text-xs"
                >
                  Today
                </Button>
                <Button
                  variant={activePreset === '7days' ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => handlePreset('7days')}
                  className="text-xs"
                >
                  Last 7 Days
                </Button>
                <Button
                  variant={activePreset === '30days' ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => handlePreset('30days')}
                  className="text-xs"
                >
                  Last 30 Days
                </Button>
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-slate-900 gap-1 h-8"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead className="w-24">Log ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>User / Actor</TableHead>
                <TableHead>Action Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log._id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-400 text-xs">...{log._id?.slice(-6)}</TableCell>
                    <TableCell className="text-sm">{log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell className="font-medium text-sm text-slate-700">
                      {log.userName || 'System'} <span className="text-xs text-muted-foreground ml-1">({log.userRole || 'System'})</span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <div className="font-bold text-slate-800">{log.action}</div>
                      <div className="text-xs text-slate-400 truncate max-w-sm" title={log.details}>{log.details}</div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">{log.ipAddress || '—'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    {hasActiveFilters ? 'No audit logs found matching the selected filters.' : 'No audit logs available.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
