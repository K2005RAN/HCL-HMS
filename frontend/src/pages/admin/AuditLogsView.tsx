import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldAlert, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function AuditLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/audit-logs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(res.data);
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      }
    };
    if (token) fetchLogs();
  }, [token]);

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
        <CardHeader className="bg-slate-50/50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Activities</CardTitle>
            <div className="flex items-center w-72">
              <Search className="h-4 w-4 mr-2 text-slate-500" />
              <Input placeholder="Search by user or action..." className="h-8 bg-white" />
            </div>
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
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log._id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-slate-400 text-xs">...{log._id.slice(-6)}</TableCell>
                    <TableCell className="text-sm">{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="font-medium text-sm text-slate-700">
                      {log.userName || 'System'} <span className="text-xs text-muted-foreground ml-1">({log.userRole || 'System'})</span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <div className="font-bold text-slate-800">{log.action}</div>
                      <div className="text-xs text-slate-400 truncate max-w-sm" title={log.details}>{log.details}</div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">{log.ipAddress}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No audit logs available.
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
