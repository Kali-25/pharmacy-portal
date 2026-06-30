'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Pencil } from 'lucide-react';

interface MedicineRow {
  id: string;
  name: string;
  genericName: string;
  brand: string | null;
  category: string;
  form: string;
  strength: string;
  unit: string;
  totalStock: number;
  reorderLevel: number;
  prescriptionRequired: boolean;
  batchCount: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export function MedicineTable({ medicines }: { medicines: MedicineRow[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        (m.brand?.toLowerCase().includes(q) ?? false);
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [medicines, search, statusFilter]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="success">In Stock</Badge>;
      case 'low_stock':
        return <Badge variant="warning">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="danger">Out of Stock</Badge>;
      default:
        return <Badge variant="neutral">Unknown</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, generic name, or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search medicines"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Medicine</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Form</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Stock</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Reorder At</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Batches</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  No medicines found
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {m.name} {m.strength}
                        </p>
                        <p className="text-xs text-muted-foreground">{m.genericName}</p>
                      </div>
                      {m.prescriptionRequired && (
                        <Badge variant="info" className="ml-1">
                          Rx
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.category}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{m.form}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-foreground">
                    {m.totalStock}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {m.reorderLevel}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{m.batchCount}</td>
                  <td className="px-4 py-3 text-center">{statusBadge(m.status)}</td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/inventory/${m.id}/edit`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary cursor-pointer"
                      aria-label={`Edit ${m.name}`}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Showing {filtered.length} of {medicines.length} medicines
      </p>
    </div>
  );
}
