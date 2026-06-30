import { prisma } from '@/lib/prisma';
import { getExpiryStatus, formatCurrency, formatDate, daysUntil } from '@/lib/format';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle,
  Package,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ExpiryPage() {
  const batches = await prisma.batch.findMany({
    where: { status: { in: ['ACTIVE', 'EXPIRED'] } },
    include: { medicine: { include: { category: true } }, supplier: true },
    orderBy: { expiryDate: 'asc' },
  });

  const batchesWithStatus = batches.map((b) => ({
    id: b.id,
    batchNumber: b.batchNumber,
    medicineName: `${b.medicine.name} ${b.medicine.strength}`,
    genericName: b.medicine.genericName,
    category: b.medicine.category.name,
    form: b.medicine.form,
    quantityAvailable: b.quantityAvailable,
    sellingPrice: b.sellingPrice,
    unitCost: b.unitCost,
    expiryDate: b.expiryDate,
    manufactureDate: b.manufactureDate,
    supplier: b.supplier?.name ?? 'Unknown',
    batchStatus: b.status,
    expiryInfo: getExpiryStatus(b.expiryDate),
    lossValue: b.quantityAvailable * b.sellingPrice,
  }));

  const expired = batchesWithStatus.filter((b) => b.expiryInfo.status === 'expired');
  const critical = batchesWithStatus.filter((b) => b.expiryInfo.status === 'critical');
  const warning = batchesWithStatus.filter((b) => b.expiryInfo.status === 'warning');
  const notify = batchesWithStatus.filter((b) => b.expiryInfo.status === 'notify');
  const safe = batchesWithStatus.filter((b) => b.expiryInfo.status === 'safe');

  const totalLossValue = expired.reduce((sum, b) => sum + b.lossValue, 0);
  const atRiskValue = [...critical, ...warning].reduce((sum, b) => sum + b.lossValue, 0);

  const summaryCards = [
    {
      label: 'Expired',
      count: expired.length,
      value: totalLossValue,
      icon: XCircle,
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    {
      label: 'Critical (<30d)',
      count: critical.length,
      value: critical.reduce((s, b) => s + b.lossValue, 0),
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    {
      label: 'Warning (30-60d)',
      count: warning.length,
      value: warning.reduce((s, b) => s + b.lossValue, 0),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      label: 'Notify (60-90d)',
      count: notify.length,
      value: notify.reduce((s, b) => s + b.lossValue, 0),
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
    },
    {
      label: 'Safe (>90d)',
      count: safe.length,
      value: safe.reduce((s, b) => s + b.lossValue, 0),
      icon: CheckCircle,
      color: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Expiry Tracking"
        description="Monitor batch expirations and prevent medication waste"
      />

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-lg border ${card.border} ${card.bg} p-4`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${card.color}`} />
                <span className="text-sm font-medium text-foreground">{card.label}</span>
              </div>
              <p className={`mt-2 font-mono text-2xl font-bold ${card.color}`}>{card.count}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatCurrency(card.value)} at risk
              </p>
            </div>
          );
        })}
      </div>

      {/* Financial Impact Banner */}
      {(totalLossValue > 0 || atRiskValue > 0) && (
        <Card className="mb-6 border-destructive/30 bg-red-50">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Expired Loss</p>
              <p className="font-mono text-xl font-bold text-destructive">
                {formatCurrency(totalLossValue)}
              </p>
            </div>
            <div className="h-10 w-px bg-destructive/20" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">At-Risk Value (next 60d)</p>
              <p className="font-mono text-xl font-bold text-amber-600">
                {formatCurrency(atRiskValue)}
              </p>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">
              FIFO strategy recommended: sell earliest valid batches first
            </div>
          </div>
        </Card>
      )}

      {/* Batch Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Medicine</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Batch No.</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Supplier</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Qty Avail.</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Expiry Date</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Days Left</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Loss Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {batchesWithStatus.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  No batches found
                </td>
              </tr>
            ) : (
              batchesWithStatus.map((b) => (
                <tr
                  key={b.id}
                  className={`transition-colors hover:bg-muted/20 ${
                    b.expiryInfo.status === 'expired'
                      ? 'bg-red-50/50'
                      : b.expiryInfo.status === 'critical'
                        ? 'bg-red-50/30'
                        : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{b.medicineName}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.genericName} - {b.category}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {b.batchNumber}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{b.supplier}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-foreground">
                    {b.quantityAvailable}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(b.expiryDate)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-mono font-semibold ${b.expiryInfo.textClass}`}
                    >
                      {b.expiryInfo.daysLeft < 0
                        ? `${Math.abs(b.expiryInfo.daysLeft)}d ago`
                        : `${b.expiryInfo.daysLeft}d`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${b.expiryInfo.bgClass} text-white`}
                    >
                      {b.expiryInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {b.quantityAvailable > 0 ? formatCurrency(b.lossValue) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {batchesWithStatus.length} batches tracked - sorted by expiry date (earliest first)
      </p>
    </div>
  );
}
