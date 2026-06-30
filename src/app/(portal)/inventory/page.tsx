import { prisma } from '@/lib/prisma';
import { MedicineTable } from '@/components/inventory/medicine-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ImportButton } from '@/components/inventory/import-button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const medicines = await prisma.medicine.findMany({
    include: {
      category: true,
      batches: { where: { status: 'ACTIVE' } },
    },
    orderBy: { name: 'asc' },
  });

  const medicinesWithStock = medicines.map((m) => {
    const totalStock = m.batches.reduce((sum, b) => sum + b.quantityAvailable, 0);
    const status: 'in_stock' | 'low_stock' | 'out_of_stock' =
      totalStock === 0 ? 'out_of_stock' : totalStock <= m.reorderLevel ? 'low_stock' : 'in_stock';
    return {
      id: m.id,
      name: m.name,
      genericName: m.genericName,
      brand: m.brand,
      category: m.category.name,
      form: m.form,
      strength: m.strength,
      unit: m.unit,
      totalStock,
      reorderLevel: m.reorderLevel,
      prescriptionRequired: m.prescriptionRequired,
      batchCount: m.batches.length,
      status,
    };
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Inventory Management"
        description={`${medicines.length} medicines in catalog`}
        action={
          <div className="flex gap-2">
            <ImportButton />
            <Link href="/inventory/add">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Medicine
              </Button>
            </Link>
          </div>
        }
      />
      <MedicineTable medicines={medicinesWithStock} />
    </div>
  );
}
