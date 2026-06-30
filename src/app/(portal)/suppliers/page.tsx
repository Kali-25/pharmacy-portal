import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Truck, Mail, Phone, Clock, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      batches: { where: { status: 'ACTIVE' } },
    },
    orderBy: { name: 'asc' },
  });

  const suppliersWithStats = suppliers.map((s) => {
    const batchCount = s.batches.length;
    const stockUnits = s.batches.reduce((sum, b) => sum + b.quantityAvailable, 0);
    const stockValue = s.batches.reduce((sum, b) => sum + b.quantityAvailable * b.unitCost, 0);
    return {
      id: s.id,
      name: s.name,
      contact: s.contact,
      email: s.email,
      phone: s.phone,
      leadTimeDays: s.leadTimeDays,
      batchCount,
      stockUnits,
      stockValue,
    };
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Suppliers"
        description={`${suppliers.length} suppliers - manage procurement and supplier relationships`}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliersWithStats.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Truck className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{s.name}</h3>
                <p className="text-sm text-muted-foreground">{s.contact}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-3">
              {s.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" /> {s.email}
                </div>
              )}
              {s.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" /> {s.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" /> {s.leadTimeDays} day lead time
              </div>
            </div>
            <div className="mt-4 flex gap-3 border-t border-border pt-3">
              <div className="flex-1">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Package className="h-3 w-3" /> Active Batches
                </p>
                <p className="font-mono text-lg font-bold text-foreground">{s.batchCount}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Stock Value</p>
                <p className="font-mono text-lg font-bold text-foreground">
                  {formatCurrency(s.stockValue)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
