import { prisma } from '@/lib/prisma';
import { MedicineForm } from '@/components/inventory/medicine-form';
import { PageHeader } from '@/components/layout/page-header';

export const dynamic = 'force-dynamic';

export default async function AddMedicinePage() {
  const [categories, suppliers] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="p-6">
      <PageHeader
        title="Add Medicine"
        description="Create a new medicine entry with an optional initial batch"
      />
      <div className="max-w-4xl">
        <MedicineForm categories={categories} suppliers={suppliers} />
      </div>
    </div>
  );
}
