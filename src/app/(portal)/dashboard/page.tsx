import { prisma } from '@/lib/prisma';
import { formatCurrency, formatNumber, daysUntil } from '@/lib/format';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { InventoryHealthRing } from '@/components/dashboard/inventory-health-ring';
import { StockChart } from '@/components/dashboard/stock-chart';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { ExpiryTimeline } from '@/components/dashboard/expiry-timeline';
import {
  Package,
  AlertTriangle,
  DollarSign,
  Boxes,
  XCircle,
  TrendingDown,
  Activity,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [medicines, batches, sales] = await Promise.all([
    prisma.medicine.findMany({ include: { category: true } }),
    prisma.batch.findMany({ where: { status: 'ACTIVE' }, include: { medicine: true } }),
    prisma.sale.findMany({
      include: { items: { include: { medicine: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  const totalMedicines = medicines.length;
  const totalStock = batches.reduce((sum, b) => sum + b.quantityAvailable, 0);

  const medicineStock = new Map<string, number>();
  for (const b of batches) {
    medicineStock.set(b.medicineId, (medicineStock.get(b.medicineId) || 0) + b.quantityAvailable);
  }

  const lowStockMedicines = medicines.filter((m) => {
    const stock = medicineStock.get(m.id) || 0;
    return stock > 0 && stock <= m.reorderLevel;
  });

  const outOfStockMedicines = medicines.filter((m) => {
    return (medicineStock.get(m.id) || 0) === 0;
  });

  const now = new Date();
  const expiredBatches = batches.filter((b) => b.expiryDate < now);
  const criticalBatches = batches.filter((b) => {
    const d = daysUntil(b.expiryDate);
    return d >= 0 && d <= 30;
  });
  const warningBatches = batches.filter((b) => {
    const d = daysUntil(b.expiryDate);
    return d > 30 && d <= 60;
  });
  const notifyBatches = batches.filter((b) => {
    const d = daysUntil(b.expiryDate);
    return d > 60 && d <= 90;
  });
  const safeBatches = batches.filter((b) => {
    const d = daysUntil(b.expiryDate);
    return d > 90;
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const salesToday = sales.filter((s) => s.createdAt >= todayStart);
  const salesTodayTotal = salesToday.reduce((sum, s) => sum + s.total, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const salesByDay: { date: string; total: number; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(sevenDaysAgo);
    day.setDate(day.getDate() + i);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const daySales = sales.filter((s) => s.createdAt >= day && s.createdAt < nextDay);
    salesByDay.push({
      date: day.toLocaleDateString('en-US', { weekday: 'short' }),
      total: Math.round(daySales.reduce((sum, s) => sum + s.total, 0) * 100) / 100,
      count: daySales.length,
    });
  }

  const stockStatusData = [
    { name: 'Safe (>90d)', value: safeBatches.length, color: '#15803D' },
    { name: 'Notify (90d)', value: notifyBatches.length, color: '#EAB308' },
    { name: 'Warning (60d)', value: warningBatches.length, color: '#F59E0B' },
    { name: 'Critical (30d)', value: criticalBatches.length, color: '#DC2626' },
    { name: 'Expired', value: expiredBatches.length, color: '#7F1D1D' },
  ];

  const expiryTimelineData = [
    { label: 'Expired', count: expiredBatches.length, color: '#7F1D1D' },
    { label: '<30 days', count: criticalBatches.length, color: '#DC2626' },
    { label: '30-60 days', count: warningBatches.length, color: '#F59E0B' },
    { label: '60-90 days', count: notifyBatches.length, color: '#EAB308' },
    { label: '90+ days', count: safeBatches.length, color: '#15803D' },
  ];

  const inventoryValue = batches.reduce((sum, b) => sum + b.quantityAvailable * b.unitCost, 0);

  const inStockRatio =
    totalMedicines > 0
      ? (totalMedicines - lowStockMedicines.length - outOfStockMedicines.length) / totalMedicines
      : 0;
  const safeExpiryRatio =
    batches.length > 0 ? (safeBatches.length + notifyBatches.length) / batches.length : 0;
  const healthScore = Math.round((inStockRatio * 0.5 + safeExpiryRatio * 0.5) * 100);

  const medicineSales = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const existing = medicineSales.get(item.medicineId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.lineTotal;
      } else {
        medicineSales.set(item.medicineId, {
          name: item.medicine.name,
          quantity: item.quantity,
          revenue: item.lineTotal,
        });
      }
    }
  }
  const topSelling = Array.from(medicineSales.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const recentSales = sales.slice(0, 5);

  const kpis = [
    {
      label: 'Total Medicines',
      value: formatNumber(totalMedicines),
      sub: `${formatNumber(totalStock)} units in stock`,
      icon: Package,
      iconBg: 'bg-primary',
      iconColor: 'text-primary-foreground',
    },
    {
      label: 'Low Stock Alerts',
      value: formatNumber(lowStockMedicines.length + outOfStockMedicines.length),
      sub: `${outOfStockMedicines.length} out of stock`,
      icon: TrendingDown,
      iconBg: 'bg-amber-500',
      iconColor: 'text-white',
      alert: true,
    },
    {
      label: 'Expiring Soon (<30d)',
      value: formatNumber(criticalBatches.length + expiredBatches.length),
      sub: `${expiredBatches.length} already expired`,
      icon: AlertTriangle,
      iconBg: 'bg-destructive',
      iconColor: 'text-destructive-foreground',
      alert: true,
    },
    {
      label: 'Sales Today',
      value: formatCurrency(salesTodayTotal),
      sub: `${salesToday.length} transactions`,
      icon: DollarSign,
      iconBg: 'bg-accent',
      iconColor: 'text-accent-foreground',
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        description="Real-time overview of inventory, expiry tracking, and sales performance"
      />

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-lg ${kpi.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Inventory Health Ring */}
        <Card>
          <CardHeader title="Inventory Health" subtitle="Overall stock & expiry score" />
          <InventoryHealthRing score={healthScore} />
          <div className="mt-3 space-y-1.5 border-t border-border pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Inventory Value</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(inventoryValue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active Batches</span>
              <span className="font-mono font-semibold text-foreground">{batches.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Out of Stock</span>
              <span className="font-mono font-semibold text-destructive">
                {outOfStockMedicines.length}
              </span>
            </div>
          </div>
        </Card>

        {/* Sales Trend */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Sales Trend"
            subtitle="Revenue over the last 7 days"
            action={
              <Badge variant="info">
                {salesByDay.reduce((s, d) => s + d.count, 0)} orders
              </Badge>
            }
          />
          <SalesChart data={salesByDay} />
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Stock Status by Expiry */}
        <Card>
          <CardHeader title="Batch Status" subtitle="Active batches by expiry window" />
          <StockChart data={stockStatusData} />
        </Card>

        {/* Expiry Timeline */}
        <Card>
          <CardHeader
            title="Expiry Timeline"
            subtitle="Batches approaching expiration"
            action={
              <Link
                href="/expiry"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <ExpiryTimeline data={expiryTimelineData} />
        </Card>
      </div>

      {/* Bottom Row: Top Selling + Recent Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Selling Medicines */}
        <Card>
          <CardHeader title="Top Selling Medicines" subtitle="By quantity sold" />
          {topSelling.length > 0 ? (
            <div className="space-y-3">
              {topSelling.map((med, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold ${
                      idx === 0
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.quantity} units sold</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {formatCurrency(med.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No sales data yet</p>
          )}
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader
            title="Recent Transactions"
            subtitle="Latest sales activity"
            action={
              <Link
                href="/pos"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                New sale <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          {recentSales.length > 0 ? (
            <div className="space-y-2">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium text-foreground">
                        {sale.invoiceNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sale.items.length} items -{' '}
                        {new Date(sale.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {formatCurrency(sale.total)}
                    </p>
                    <Badge variant="neutral" className="mt-0.5">
                      {sale.paymentMethod}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No recent transactions</p>
          )}
        </Card>
      </div>

      {/* Low Stock Alert Section */}
      {lowStockMedicines.length > 0 && (
        <Card className="mt-6 border-amber-300 bg-amber-50">
          <CardHeader
            title="Low Stock Alerts"
            subtitle="Medicines at or below reorder level - action required"
            action={
              <Link
                href="/inventory"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                Manage inventory <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStockMedicines.map((med) => {
              const stock = medicineStock.get(med.id) || 0;
              return (
                <div
                  key={med.id}
                  className="flex items-center justify-between rounded-md border border-amber-200 bg-card px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{med.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {med.strength} - {med.category.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-amber-600">{stock}</p>
                    <p className="text-xs text-muted-foreground">min: {med.reorderLevel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
