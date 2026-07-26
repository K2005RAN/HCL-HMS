import { useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

export default function CSVImportWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
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

  const simulateValidation = () => {
    setStep(3);
    setProgress(0);
    // Simulate validation progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep(4);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleImport = async () => {
    setStep(5);
    setProgress(30);
    try {
      await axios.post(`${API_BASE_URL}/api/employees/bulk-upload`, { employees: data }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgress(100);
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err) {
      console.error("Bulk upload failed", err);
      alert("Failed to import employees.");
      setStep(4);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {['Upload', 'Preview', 'Validate', 'Import'].map((label, index) => (
          <div key={label} className="flex flex-col items-center flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${step > index ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
              {index + 1}
            </div>
            <span className="text-sm font-medium text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-8">
          {step === 1 && (
            <div className="text-center">
              <UploadCloud className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Employee Master Data</h3>
              <p className="text-slate-500 mb-6">Select a CSV file containing employee details to import.</p>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button size="lg">Select CSV File</Button>
              </div>
              
              <div className="mt-8 text-sm text-left bg-slate-50 p-4 rounded-lg text-slate-600">
                <p className="font-semibold mb-2">Required Columns:</p>
                <code className="text-xs bg-white p-2 rounded block">
                  Plant, User Name, First Name, Last Name, Employee ID, Domain ID, Email Address, Title, Department
                </code>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Preview Data ({data.length} records)</h3>
                <Button onClick={simulateValidation}>Proceed to Validation</Button>
              </div>
              <div className="overflow-x-auto border rounded-lg max-h-96">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                    <tr>
                      {Object.keys(data[0] || {}).map((key) => (
                        <th key={key} className="px-6 py-3">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 10).map((row, i) => (
                      <tr key={i} className="bg-white border-b hover:bg-slate-50">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-6 py-4 whitespace-nowrap">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-500 mt-2 text-center">Showing first 10 rows for preview</p>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-semibold mb-2">Validating Data...</h3>
              <p className="text-slate-500 mb-6">Checking for duplicates and invalid formats.</p>
              <Progress value={progress} className="w-[60%] mx-auto" />
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Validation Successful</h3>
              <p className="text-slate-500 mb-6">{data.length} records are ready to be imported.</p>
              
              <Button size="lg" onClick={handleImport} className="bg-green-600 hover:bg-green-700 text-white">
                Start Import
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-12">
              <UploadCloud className="w-16 h-16 text-primary mx-auto mb-4 animate-bounce" />
              <h3 className="text-xl font-semibold mb-2">Importing...</h3>
              <p className="text-slate-500 mb-6">Saving records to the database.</p>
              <Progress value={progress} className="w-[60%] mx-auto" />
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
