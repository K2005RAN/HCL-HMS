import { useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

export default function StaffCSVImportWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const { token } = useAuth();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
          setStep(2);
        },
      });
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,staffId,name,email,phone,department,designation,shift\nSTF-0010,Robert Smith,robert@hospital.com,9876543210,Emergency,Nurse,Morning\nSTF-0011,Emily Davis,emily@hospital.com,9876543211,Pharmacy,Pharmacist,Evening";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_staff_import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    setUploading(true);
    setMsg(null);
    setProgress(30);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/attendance/bulk-staff`, { staffList: data }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgress(100);
      setMsg(res.data.message || 'Staff members imported successfully!');
      setTimeout(() => {
        onComplete();
      }, 1200);
    } catch (err: any) {
      console.error("Bulk staff upload failed", err);
      setMsg(err.response?.data?.message || "Failed to import staff members.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold">Import Hospital Staff via CSV</h3>
            <p className="text-xs text-muted-foreground">Upload a CSV file containing staff members to register them in bulk.</p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadSampleCSV} className="gap-2 text-xs">
            <Download className="w-3.5 h-3.5" />
            Sample CSV Template
          </Button>
        </div>

        {step === 1 && (
          <div className="border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors rounded-2xl p-8 text-center bg-muted/20">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-primary opacity-80" />
            <p className="text-sm font-semibold mb-1">Click to select or drag & drop CSV file</p>
            <p className="text-xs text-muted-foreground mb-4">Required columns: name, department, phone, email, designation</p>
            <label className="inline-flex">
              <span className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-md transition-all">
                Select CSV File
              </span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs font-semibold">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Parsed {data.length} staff records from CSV.
              </span>
              <Button size="sm" variant="ghost" onClick={() => setStep(1)} className="h-7 text-xs">
                Choose Different File
              </Button>
            </div>

            <div className="max-h-48 overflow-y-auto border rounded-xl text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/50 font-bold border-b sticky top-0">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Department</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="border-b border-border/40 hover:bg-muted/30">
                      <td className="p-2 font-medium">{row.name || 'N/A'}</td>
                      <td className="p-2">{row.department || 'General'}</td>
                      <td className="p-2">{row.phone || 'N/A'}</td>
                      <td className="p-2">{row.email || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 10 && (
                <div className="p-2 text-center text-muted-foreground text-xs bg-muted/20">
                  ...and {data.length - 10} more staff members.
                </div>
              )}
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground font-medium">Uploading & registering staff members...</p>
              </div>
            )}

            {msg && (
              <div className="p-3 bg-muted rounded-xl text-xs font-semibold text-center">
                {msg}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>Cancel</Button>
              <Button size="sm" disabled={uploading} onClick={handleImport} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                <UploadCloud className="w-4 h-4" />
                Confirm & Import {data.length} Staff Members
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
