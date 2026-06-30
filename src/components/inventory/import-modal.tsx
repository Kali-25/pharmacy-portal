'use client';

import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Download } from 'lucide-react';

interface ParsedRow {
  [key: string]: string;
}

const REQUIRED_FIELDS = ['name', 'genericName', 'strength'];
const ALL_FIELDS = [
  'name', 'genericName', 'brand', 'category', 'manufacturer',
  'form', 'strength', 'unit', 'barcode', 'prescriptionRequired',
  'reorderLevel', 'reorderQuantity', 'storageConditions', 'description',
  'batchNumber', 'quantityReceived', 'unitCost', 'sellingPrice', 'mrp',
  'manufactureDate', 'expiryDate', 'supplierName',
];

const TEMPLATE_HEADERS = ALL_FIELDS.join(',');

export function ImportModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: { row: number; name: string; error: string }[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState('');

  const handleFile = useCallback((file: File) => {
    setParseError('');
    setResult(null);
    setFileName(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse<ParsedRow>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            setParseError(`CSV parse error: ${results.errors[0].message}`);
            return;
          }
          validateAndSetRows(results.data as ParsedRow[]);
        },
        error: (err) => setParseError(`Failed to parse CSV: ${err.message}`),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: '' });
          validateAndSetRows(json);
        } catch {
          setParseError('Failed to parse Excel file. Make sure it is a valid .xlsx or .xls file.');
        }
      };
      reader.onerror = () => setParseError('Failed to read file.');
      reader.readAsArrayBuffer(file);
    } else {
      setParseError('Unsupported file format. Please upload a .csv or .xlsx file.');
    }
  }, []);

  const validateAndSetRows = (data: ParsedRow[]) => {
    if (data.length === 0) {
      setParseError('File is empty or has no data rows.');
      return;
    }

    const headers = Object.keys(data[0]).map((h) => h.trim());
    const missing = REQUIRED_FIELDS.filter((f) => !headers.some((h) => h.toLowerCase() === f.toLowerCase()));

    if (missing.length > 0) {
      setParseError(`Missing required columns: ${missing.join(', ')}. Please download the template for the correct format.`);
      return;
    }

    const normalized = data.map((row) => {
      const obj: ParsedRow = {};
      for (const [key, val] of Object.entries(row)) {
        const lowerKey = key.toLowerCase().trim();
        obj[lowerKey] = String(val || '').trim();
      }
      return obj;
    });

    setRows(normalized);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      const res = await fetch('/api/medicines/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      const data = await res.json();

      if (!res.ok) {
        setParseError(data.error || 'Import failed');
      } else {
        setResult(data);
        if (data.success > 0) {
          router.refresh();
        }
      }
    } catch {
      setParseError('Network error. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const sample = `name,genericName,brand,category,manufacturer,form,strength,unit,barcode,prescriptionRequired,reorderLevel,reorderQuantity,storageConditions,description,batchNumber,quantityReceived,unitCost,sellingPrice,mrp,manufactureDate,expiryDate,supplierName
Paracetamol,Acetaminophen,Tylenol,Analgesics,Johnson & Johnson,tablet,500mg,strip,,false,10,50,Store at room temperature,,BAT001,100,0.15,0.20,0.25,2025-01-15,2027-01-15,Cipla
Amoxicillin,Amoxicillin,Amoxil,Antibiotics,GSK,capsule,250mg,strip,,true,5,20,Store in cool place,,BAT002,50,0.50,0.65,0.75,2025-03-01,2027-03-01,Cipla
Cetirizine,Cetirizine,Zyrtec,Antihistamines,Dr Reddys,tablet,10mg,strip,,false,8,40,,,BAT003,80,0.10,0.15,0.18,2025-06-01,2027-06-01,Sun Pharma`;

    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medicine-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setRows([]);
    setFileName('');
    setResult(null);
    setParseError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Import Medicines</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {result ? (
            /* Results view */
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-lg font-semibold text-foreground">Import Complete</p>
                  <p className="text-sm text-muted-foreground">
                    {result.success} succeeded, {result.failed} failed
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" /> Errors ({result.errors.length})
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((err, i) => (
                      <div key={i} className="text-xs text-red-600 dark:text-red-400">
                        Row {err.row} ({err.name}): {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={reset} variant="secondary">
                Import Another File
              </Button>
            </div>
          ) : rows.length === 0 ? (
            /* Upload view */
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 transition-colors ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Drop your file here or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Supports .csv and .xlsx files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>

              {parseError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {parseError}
                </div>
              )}

              {/* Template download */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Need a template?</p>
                    <p className="text-xs text-muted-foreground">Download the CSV template with sample data</p>
                  </div>
                  <Button onClick={downloadTemplate} variant="secondary">
                    <Download className="mr-2 h-4 w-4" /> Template
                  </Button>
                </div>
                <div className="mt-3 border-t border-border pt-3">
                  <p className="mb-1 text-xs font-medium text-foreground">Required columns:</p>
                  <p className="text-xs text-muted-foreground">name, genericName, strength</p>
                  <p className="mt-2 mb-1 text-xs font-medium text-foreground">Optional columns:</p>
                  <p className="text-xs text-muted-foreground">
                    brand, category, manufacturer, form, unit, barcode, prescriptionRequired,
                    reorderLevel, reorderQuantity, storageConditions, description, batchNumber,
                    quantityReceived, unitCost, sellingPrice, mrp, manufactureDate, expiryDate, supplierName
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Preview view */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-foreground">{fileName}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {rows.length} rows
                  </span>
                </div>
                <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground">
                  Choose different file
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Generic</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Category</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Strength</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Batch</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="bg-card">
                        <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-foreground">{row.name || '-'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.genericname || row.genericName || '-'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.category || '-'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.strength || '-'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.batchnumber || row.batchNumber || '-'}</td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">{row.quantityreceived || row.quantityReceived || '-'}</td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">{row.sellingprice || row.sellingPrice || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length > 50 && (
                <p className="text-center text-xs text-muted-foreground">
                  Showing first 50 of {rows.length} rows
                </p>
              )}

              {parseError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {parseError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {rows.length > 0 && !result && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {rows.length} medicine{rows.length !== 1 ? 's' : ''} ready to import
            </p>
            <div className="flex gap-2">
              <Button onClick={reset} variant="secondary">Cancel</Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Import {rows.length} medicines
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
