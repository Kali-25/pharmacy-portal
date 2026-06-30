'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}
interface Supplier {
  id: string;
  name: string;
}

export function MedicineForm({ categories, suppliers }: { categories: Category[]; suppliers: Supplier[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [med, setMed] = useState({
    name: '',
    genericName: '',
    brand: '',
    categoryId: categories[0]?.id || '',
    manufacturer: '',
    form: 'tablet',
    strength: '',
    unit: 'strip',
    barcode: '',
    prescriptionRequired: false,
    reorderLevel: 10,
    reorderQuantity: 50,
    storageConditions: '',
  });

  const [batch, setBatch] = useState({
    batchNumber: '',
    supplierId: suppliers[0]?.id || '',
    quantityReceived: 0,
    unitCost: 0,
    sellingPrice: 0,
    mrp: 0,
    manufactureDate: '',
    expiryDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicine: med, batch }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add medicine');
      }

      router.push('/inventory');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add medicine');
    } finally {
      setSaving(false);
    }
  };

  const formOptions = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler'];
  const unitOptions = ['strip', 'bottle', 'box', 'tube', 'vial', 'pack', 'piece'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/inventory">
          <Button variant="outline" size="sm" type="button">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-red-50 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Medicine Details */}
      <Card>
        <CardHeader title="Medicine Details" subtitle="Basic information about the medicine" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Medicine Name"
            id="name"
            required
            value={med.name}
            onChange={(e) => setMed({ ...med, name: e.target.value })}
            placeholder="e.g., Paracetamol"
          />
          <Input
            label="Generic Name"
            id="genericName"
            required
            value={med.genericName}
            onChange={(e) => setMed({ ...med, genericName: e.target.value })}
            placeholder="e.g., Acetaminophen"
          />
          <Input
            label="Brand"
            id="brand"
            value={med.brand}
            onChange={(e) => setMed({ ...med, brand: e.target.value })}
            placeholder="e.g., Tylenol"
          />
          <div className="w-full">
            <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-foreground">
              Category <span className="text-destructive">*</span>
            </label>
            <select
              id="category"
              value={med.categoryId}
              onChange={(e) => setMed({ ...med, categoryId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Manufacturer"
            id="manufacturer"
            value={med.manufacturer}
            onChange={(e) => setMed({ ...med, manufacturer: e.target.value })}
            placeholder="e.g., Johnson & Johnson"
          />
          <div className="w-full">
            <label htmlFor="form" className="mb-1.5 block text-sm font-medium text-foreground">
              Form <span className="text-destructive">*</span>
            </label>
            <select
              id="form"
              value={med.form}
              onChange={(e) => setMed({ ...med, form: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              {formOptions.map((f) => (
                <option key={f} value={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Strength"
            id="strength"
            required
            value={med.strength}
            onChange={(e) => setMed({ ...med, strength: e.target.value })}
            placeholder="e.g., 500mg"
          />
          <div className="w-full">
            <label htmlFor="unit" className="mb-1.5 block text-sm font-medium text-foreground">
              Unit <span className="text-destructive">*</span>
            </label>
            <select
              id="unit"
              value={med.unit}
              onChange={(e) => setMed({ ...med, unit: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              {unitOptions.map((u) => (
                <option key={u} value={u}>
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Barcode"
            id="barcode"
            value={med.barcode}
            onChange={(e) => setMed({ ...med, barcode: e.target.value })}
            placeholder="Optional"
          />
          <Input
            label="Reorder Level"
            id="reorderLevel"
            type="number"
            min="0"
            value={med.reorderLevel}
            onChange={(e) => setMed({ ...med, reorderLevel: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Reorder Quantity"
            id="reorderQuantity"
            type="number"
            min="0"
            value={med.reorderQuantity}
            onChange={(e) => setMed({ ...med, reorderQuantity: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Storage Conditions"
            id="storageConditions"
            value={med.storageConditions}
            onChange={(e) => setMed({ ...med, storageConditions: e.target.value })}
            placeholder="e.g., Store at room temperature"
          />
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="prescriptionRequired"
              checked={med.prescriptionRequired}
              onChange={(e) => setMed({ ...med, prescriptionRequired: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <label htmlFor="prescriptionRequired" className="text-sm text-foreground">
              Prescription Required
            </label>
          </div>
        </div>
      </Card>

      {/* Initial Batch */}
      <Card>
        <CardHeader
          title="Initial Batch"
          subtitle="Add the first stock batch for this medicine (optional)"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Batch Number"
            id="batchNumber"
            value={batch.batchNumber}
            onChange={(e) => setBatch({ ...batch, batchNumber: e.target.value })}
            placeholder="e.g., MED2401A"
          />
          <div className="w-full">
            <label htmlFor="supplierId" className="mb-1.5 block text-sm font-medium text-foreground">
              Supplier
            </label>
            <select
              id="supplierId"
              value={batch.supplierId}
              onChange={(e) => setBatch({ ...batch, supplierId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Quantity Received"
            id="quantityReceived"
            type="number"
            min="0"
            value={batch.quantityReceived || ''}
            onChange={(e) =>
              setBatch({ ...batch, quantityReceived: parseInt(e.target.value) || 0 })
            }
            placeholder="0"
          />
          <Input
            label="Unit Cost ($)"
            id="unitCost"
            type="number"
            min="0"
            step="0.01"
            value={batch.unitCost || ''}
            onChange={(e) => setBatch({ ...batch, unitCost: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
          />
          <Input
            label="Selling Price ($)"
            id="sellingPrice"
            type="number"
            min="0"
            step="0.01"
            value={batch.sellingPrice || ''}
            onChange={(e) =>
              setBatch({ ...batch, sellingPrice: parseFloat(e.target.value) || 0 })
            }
            placeholder="0.00"
          />
          <Input
            label="MRP ($)"
            id="mrp"
            type="number"
            min="0"
            step="0.01"
            value={batch.mrp || ''}
            onChange={(e) => setBatch({ ...batch, mrp: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
          />
          <Input
            label="Manufacture Date"
            id="manufactureDate"
            type="date"
            value={batch.manufactureDate}
            onChange={(e) => setBatch({ ...batch, manufactureDate: e.target.value })}
          />
          <Input
            label="Expiry Date"
            id="expiryDate"
            type="date"
            value={batch.expiryDate}
            onChange={(e) => setBatch({ ...batch, expiryDate: e.target.value })}
          />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/inventory">
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={saving || !med.name || !med.genericName || !med.strength}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Medicine'}
        </Button>
      </div>
    </form>
  );
}
