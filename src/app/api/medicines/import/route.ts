import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface ImportRow {
  name: string;
  genericName: string;
  brand?: string;
  category: string;
  manufacturer?: string;
  form: string;
  strength: string;
  unit: string;
  barcode?: string;
  prescriptionRequired?: string | boolean;
  reorderLevel?: string | number;
  reorderQuantity?: string | number;
  storageConditions?: string;
  description?: string;
  batchNumber?: string;
  quantityReceived?: string | number;
  unitCost?: string | number;
  sellingPrice?: string | number;
  mrp?: string | number;
  manufactureDate?: string;
  expiryDate?: string;
  supplierName?: string;
}

function parseBool(val: string | boolean | undefined): boolean {
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  return val.toString().toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'yes';
}

function parseNum(val: string | number | undefined, fallback = 0): number {
  if (typeof val === 'number') return val;
  if (!val || val === '') return fallback;
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const rows: ImportRow[] = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; name: string; error: string }[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        if (!row.name || !row.genericName || !row.strength) {
          throw new Error('Missing required fields: name, genericName, strength');
        }

        await prisma.$transaction(async (tx) => {
          let category = await tx.category.findFirst({
            where: { name: { equals: row.category, mode: 'insensitive' } },
          });

          if (!category) {
            category = await tx.category.create({
              data: { name: row.category },
            });
          }

          let supplierId: string | null = null;
          if (row.supplierName) {
            let supplier = await tx.supplier.findFirst({
              where: { name: { equals: row.supplierName, mode: 'insensitive' } },
            });
            if (!supplier) {
              supplier = await tx.supplier.create({
                data: { name: row.supplierName },
              });
            }
            supplierId = supplier.id;
          }

          const medicine = await tx.medicine.create({
            data: {
              name: row.name,
              genericName: row.genericName,
              brand: row.brand || null,
              categoryId: category.id,
              manufacturer: row.manufacturer || null,
              form: row.form || 'tablet',
              strength: row.strength,
              unit: row.unit || 'strip',
              barcode: row.barcode || null,
              prescriptionRequired: parseBool(row.prescriptionRequired),
              reorderLevel: parseNum(row.reorderLevel, 10),
              reorderQuantity: parseNum(row.reorderQuantity, 50),
              storageConditions: row.storageConditions || null,
              description: row.description || null,
            },
          });

          if (row.batchNumber && parseNum(row.quantityReceived) > 0) {
            const batch = await tx.batch.create({
              data: {
                medicineId: medicine.id,
                batchNumber: row.batchNumber,
                supplierId,
                quantityReceived: parseNum(row.quantityReceived),
                quantityAvailable: parseNum(row.quantityReceived),
                unitCost: parseNum(row.unitCost),
                sellingPrice: parseNum(row.sellingPrice),
                mrp: parseNum(row.mrp, parseNum(row.sellingPrice)),
                manufactureDate: row.manufactureDate ? new Date(row.manufactureDate) : new Date(),
                expiryDate: row.expiryDate ? new Date(row.expiryDate) : new Date(),
                status: 'ACTIVE',
              },
            });

            await tx.stockMovement.create({
              data: {
                batchId: batch.id,
                type: 'PURCHASE',
                quantity: parseNum(row.quantityReceived),
                reason: 'Bulk import',
              },
            });
          }

          await tx.auditLog.create({
            data: {
              entityType: 'Medicine',
              entityId: medicine.id,
              action: 'CREATE',
              fieldName: 'bulk_import',
              newValue: `Imported via CSV/Excel by ${user.name}`,
              userId: user.userId,
              userName: user.name,
            },
          });
        });

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          name: row.name || '(empty)',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/inventory');
    revalidatePath('/expiry');
    revalidatePath('/suppliers');

    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
