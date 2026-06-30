import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { medicine, batch } = body;

    if (!medicine.name || !medicine.genericName || !medicine.strength) {
      return NextResponse.json(
        { error: 'Name, generic name, and strength are required' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const newMedicine = await tx.medicine.create({
        data: {
          name: medicine.name,
          genericName: medicine.genericName,
          brand: medicine.brand || null,
          categoryId: medicine.categoryId,
          manufacturer: medicine.manufacturer || null,
          form: medicine.form || 'tablet',
          strength: medicine.strength,
          unit: medicine.unit || 'strip',
          barcode: medicine.barcode || null,
          prescriptionRequired: medicine.prescriptionRequired || false,
          reorderLevel: medicine.reorderLevel || 10,
          reorderQuantity: medicine.reorderQuantity || 50,
          storageConditions: medicine.storageConditions || null,
        },
      });

      if (batch && batch.batchNumber && batch.quantityReceived > 0) {
        const newBatch = await tx.batch.create({
          data: {
            medicineId: newMedicine.id,
            batchNumber: batch.batchNumber,
            supplierId: batch.supplierId || null,
            quantityReceived: batch.quantityReceived,
            quantityAvailable: batch.quantityReceived,
            unitCost: batch.unitCost || 0,
            sellingPrice: batch.sellingPrice || 0,
            mrp: batch.mrp || batch.sellingPrice || 0,
            manufactureDate: batch.manufactureDate
              ? new Date(batch.manufactureDate)
              : new Date(),
            expiryDate: batch.expiryDate ? new Date(batch.expiryDate) : new Date(),
            status: 'ACTIVE',
          },
        });

        await tx.stockMovement.create({
          data: {
            batchId: newBatch.id,
            type: 'PURCHASE',
            quantity: batch.quantityReceived,
            reason: 'Initial stock receipt',
          },
        });
      }

      return newMedicine;
    });

    revalidatePath('/dashboard');
    revalidatePath('/inventory');
    revalidatePath('/expiry');
    revalidatePath('/suppliers');

    return NextResponse.json({ id: result.id, name: result.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create medicine';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
