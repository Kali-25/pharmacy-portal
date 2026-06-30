'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface MedicineData {
  id: string;
  name: string;
  genericName: string;
  brand: string | null;
  categoryId: string;
  manufacturer: string | null;
  form: string;
  strength: string;
  unit: string;
  barcode: string | null;
  prescriptionRequired: boolean;
  reorderLevel: number;
  reorderQuantity: number;
  storageConditions: string | null;
  description: string | null;
}

interface Category {
  id: string;
  name: string;
}

export function MedicineEditForm({
  medicine,
  categories,
}: {
  medicine: MedicineData;
  categories: Category[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: medicine.name,
    genericName: medicine.genericName,
    brand: medicine.brand || '',
    categoryId: medicine.categoryId,
    manufacturer: medicine.manufacturer || '',
    form: medicine.form,
    strength: medicine.strength,
    unit: medicine.unit,
    barcode: medicine.barcode || '',
    prescriptionRequired: medicine.prescriptionRequired,
    reorderLevel: medicine.reorderLevel,
    reorderQuantity: medicine.reorderQuantity,
    storageConditions: medicine.storageConditions || '',
    description: medicine.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/medicines/${medicine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update medicine');
      }

      router.push('/inventory');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update medicine');
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
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Inventory
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-red-50 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader title="Edit Medicine" subtitle="Update medicine information" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Medicine Name"
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Generic Name"
            id="genericName"
            required
            value={form.genericName}
            onChange={(e) => setForm({ ...form, genericName: e.target.value })}
          />
          <Input
            label="Brand"
            id="brand"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
          />
          <div className="w-full">
            <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-foreground">
              Category <span className="text-destructive">*</span>
            </label>
            <select
              id="category"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
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
            value={form.manufacturer}
            onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
          />
          <div className="w-full">
            <label htmlFor="form" className="mb-1.5 block text-sm font-medium text-foreground">
              Form <span className="text-destructive">*</span>
            </label>
            <select
              id="form"
              value={form.form}
              onChange={(e) => setForm({ ...form, form: e.target.value })}
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
            value={form.strength}
            onChange={(e) => setForm({ ...form, strength: e.target.value })}
          />
          <div className="w-full">
            <label htmlFor="unit" className="mb-1.5 block text-sm font-medium text-foreground">
              Unit <span className="text-destructive">*</span>
            </label>
            <select
              id="unit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
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
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
          />
          <Input
            label="Reorder Level"
            id="reorderLevel"
            type="number"
            min="0"
            value={form.reorderLevel}
            onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Reorder Quantity"
            id="reorderQuantity"
            type="number"
            min="0"
            value={form.reorderQuantity}
            onChange={(e) => setForm({ ...form, reorderQuantity: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Storage Conditions"
            id="storageConditions"
            value={form.storageConditions}
            onChange={(e) => setForm({ ...form, storageConditions: e.target.value })}
          />
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="prescriptionRequired"
              checked={form.prescriptionRequired}
              onChange={(e) => setForm({ ...form, prescriptionRequired: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <label htmlFor="prescriptionRequired" className="text-sm text-foreground">
              Prescription Required
            </label>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/inventory">
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={saving || !form.name || !form.genericName || !form.strength}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
