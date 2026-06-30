export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysUntil(date: Date | string): number {
  const target = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'notify' | 'safe';

export interface ExpiryInfo {
  status: ExpiryStatus;
  daysLeft: number;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export function getExpiryStatus(expiryDate: Date | string): ExpiryInfo {
  const days = daysUntil(expiryDate);
  if (days < 0)
    return {
      status: 'expired',
      daysLeft: days,
      label: 'Expired',
      color: '#7F1D1D',
      bgClass: 'bg-red-900',
      textClass: 'text-red-700',
      borderClass: 'border-red-300',
    };
  if (days <= 30)
    return {
      status: 'critical',
      daysLeft: days,
      label: `Critical (${days}d)`,
      color: '#DC2626',
      bgClass: 'bg-red-500',
      textClass: 'text-red-600',
      borderClass: 'border-red-200',
    };
  if (days <= 60)
    return {
      status: 'warning',
      daysLeft: days,
      label: `Warning (${days}d)`,
      color: '#F59E0B',
      bgClass: 'bg-amber-500',
      textClass: 'text-amber-600',
      borderClass: 'border-amber-200',
    };
  if (days <= 90)
    return {
      status: 'notify',
      daysLeft: days,
      label: `Notify (${days}d)`,
      color: '#EAB308',
      bgClass: 'bg-yellow-500',
      textClass: 'text-yellow-600',
      borderClass: 'border-yellow-200',
    };
  return {
    status: 'safe',
    daysLeft: days,
    label: 'Safe',
    color: '#15803D',
    bgClass: 'bg-green-600',
    textClass: 'text-green-700',
    borderClass: 'border-green-200',
  };
}
