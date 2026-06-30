import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { MedicineEditForm } from '@/components/inventory/medicine-edit-form';
import { AuditHistory } from '@/components/inventory/audit-history';
import { PageHeader } from '@/components/layout/page-header';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditMedicinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const [medicine, categories, auditLogs] = await Promise.all([
    prisma.medicine.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.auditLog.findMany({
      where: { entityType: 'MEDICINE', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  if (!medicine) notFound();

  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    categoryMap[c.id] = c.name;
  }

  const serializedLogs = auditLogs.map((log) => ({
    id: log.id,
    fieldName: log.fieldName,
    oldValue: log.oldValue,
    newValue: log.newValue,
    userName: log.userName,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <div className="p-6">
      <PageHeader
        title="Edit Medicine"
        description={`${medicine.name} ${medicine.strength} - ${medicine.genericName}`}
      />
      <div className="max-w-4xl space-y-6">
        <MedicineEditForm medicine={medicine} categories={categories} />
        {currentUser?.role === 'ADMIN' && (
          <AuditHistory logs={serializedLogs} categoryMap={categoryMap} />
        )}
      </div>
    </div>
  );
}
