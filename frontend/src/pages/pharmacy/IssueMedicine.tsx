import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus, CheckCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function IssueMedicine() {
  const [patientId, setPatientId] = useState('');
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Issue Medicine</h2>
          <p className="text-muted-foreground">Scan barcode or search to issue prescribed medicines.</p>
        </div>
        <Button variant="outline">Scan Barcode</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Employee/Patient ID</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="E1003" 
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                  />
                  <Button variant="secondary" size="icon"><Search className="h-4 w-4" /></Button>
                </div>
              </div>
              
              {/* Empty Patient Card */}
              <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Search for a patient to view details</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Prescription & Issue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1">
                  <Label className="sr-only">Search Medicine</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search medicine by name or code..." className="pl-9" disabled />
                  </div>
                </div>
                <Button disabled><Plus className="mr-2 h-4 w-4" /> Add to List</Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Prescribed</TableHead>
                      <TableHead>In Stock</TableHead>
                      <TableHead className="w-24">Issue Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No active prescription loaded.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex justify-end">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="mr-2 h-5 w-5" /> Confirm Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
