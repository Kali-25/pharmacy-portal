import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    let userId: string | undefined;
    let userName: string | undefined;
    if (token) {
      try {
        const payload = await verifyToken(token);
        userId = payload.userId;
        userName = payload.name;
      } catch {}
    }

    const existing = await prisma.medicine.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
    }

    const fields = [
      'name', 'genericName', 'brand', 'categoryId', 'manufacturer',
      'form', 'strength', 'unit', 'barcode', 'prescriptionRequired',
      'reorderLevel', 'reorderQuantity', 'storageConditions', 'description',
    ] as const;

    const auditEntries: {
      entityType: string;
      entityId: string;
      action: string;
      fieldName: string;
      oldValue: string | null;
      newValue: string | null;
      userId: string | null;
      userName: string | null;
    }[] = [];

    for (const field of fields) {
      if (body[field] !== undefined) {
        const oldVal = String(existing[field] ?? '');
        const newVal = String(body[field] ?? '');
        if (oldVal !== newVal) {
          auditEntries.push({
            entityType: 'MEDICINE',
            entityId: id,
            action: 'UPDATE',
            fieldName: field,
            oldValue: oldVal || null,
            newValue: newVal || null,
            userId: userId || null,
            userName: userName || null,
          });
        }
      }
    }

    const updated = await prisma.medicine.update({
      where: { id },
      data: {
        name: body.name,
        genericName: body.genericName,
        brand: body.brand || null,
        categoryId: body.categoryId,
        manufacturer: body.manufacturer || null,
        form: body.form,
        strength: body.strength,
        unit: body.unit,
        barcode: body.barcode || null,
        prescriptionRequired: body.prescriptionRequired,
        reorderLevel: body.reorderLevel,
        reorderQuantity: body.reorderQuantity,
        storageConditions: body.storageConditions || null,
        description: body.description || null,
      },
    });

    if (auditEntries.length > 0) {
      await prisma.auditLog.createMany({ data: auditEntries });
    }

    revalidatePath('/dashboard');
    revalidatePath('/inventory');
    revalidatePath('/expiry');

    return NextResponse.json({ id: updated.id, name: updated.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update medicine';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
