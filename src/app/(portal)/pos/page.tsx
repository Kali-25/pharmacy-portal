import { prisma } from '@/lib/prisma';
import { POSTerminal } from '@/components/pos/pos-terminal';
import { PageHeader } from '@/components/layout/page-header';

export const dynamic = 'force-dynamic';

export default async function POSPage() {
  const medicines = await prisma.medicine.findMany({
    include: {
      batches: {
        where: { status: 'ACTIVE' },
        orderBy: { expiryDate: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  const posMedicines = medicines.map((m) => ({
    id: m.id,
    name: m.name,
    genericName: m.genericName,
    strength: m.strength,
    form: m.form,
    prescriptionRequired: m.prescriptionRequired,
    batches: m.batches.map((b) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      quantityAvailable: b.quantityAvailable,
      sellingPrice: b.sellingPrice,
      expiryDate: b.expiryDate.toISOString(),
    })),
  }));

  return (
    <div className="p-6">
      <PageHeader
        title="Point of Sale"
        description="Search medicines, add to cart, and complete transactions"
      />
      <POSTerminal medicines={posMedicines} />
    </div>
  );
}
