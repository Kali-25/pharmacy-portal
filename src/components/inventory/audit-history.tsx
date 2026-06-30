import { formatDateTime } from '@/lib/format';
import { Card, CardHeader } from '@/components/ui/card';
import { History, User, ArrowRight } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  userName: string | null;
  createdAt: string;
}

const fieldLabels: Record<string, string> = {
  name: 'Name',
  genericName: 'Generic Name',
  brand: 'Brand',
  categoryId: 'Category',
  manufacturer: 'Manufacturer',
  form: 'Form',
  strength: 'Strength',
  unit: 'Unit',
  barcode: 'Barcode',
  prescriptionRequired: 'Prescription Required',
  reorderLevel: 'Reorder Level',
  reorderQuantity: 'Reorder Quantity',
  storageConditions: 'Storage Conditions',
  description: 'Description',
};

export function AuditHistory({
  logs,
  categoryMap,
}: {
  logs: AuditLogEntry[];
  categoryMap: Record<string, string>;
}) {
  function resolveValue(value: string | null): string {
    if (!value) return 'empty';
    if (value === 'true') return 'Yes';
    if (value === 'false') return 'No';
    if (categoryMap[value]) return categoryMap[value];
    return value;
  }

  return (
    <Card>
      <CardHeader
        title="Edit History"
        subtitle="Audit trail of all changes made to this medicine"
        action={
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <History className="h-3.5 w-3.5" /> {logs.length} changes
          </span>
        }
      />
      {logs.length === 0 ? (
        <div className="py-8 text-center">
          <History className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No edits have been made yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 rounded-md border border-border bg-muted/20 p-3"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10">
                <ArrowRight className="h-3.5 w-3.5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Changed{' '}
                  <span className="font-semibold text-accent">
                    {fieldLabels[log.fieldName] || log.fieldName}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  from <span className="font-mono">{resolveValue(log.oldValue)}</span> to{' '}
                  <span className="font-mono">{resolveValue(log.newValue)}</span>
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {log.userName || 'Unknown user'} - {formatDateTime(log.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
