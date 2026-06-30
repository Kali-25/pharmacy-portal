import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, paymentMethod, discount, tax, customer } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in sale' }, { status: 400 });
    }

    if (!customer || !customer.name || !customer.mobile) {
      return NextResponse.json(
        { error: 'Patient name and mobile number are required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    let userId: string | undefined;
    if (token) {
      try {
        const payload = await verifyToken(token);
        userId = payload.userId;
      } catch {}
    }

    const count = await prisma.sale.count();
    const invoiceNumber = `INV-${1001 + count}`;

    const result = await prisma.$transaction(async (tx) => {
      // Find or create customer by mobile
      let customerId: string | undefined;
      const existingCustomer = await tx.customer.findFirst({
        where: { phone: customer.mobile },
      });

      if (existingCustomer) {
        customerId = existingCustomer.id;
        await tx.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: customer.name,
            email: customer.email || existingCustomer.email,
            age: customer.age ?? existingCustomer.age,
            gender: customer.gender || existingCustomer.gender,
          },
        });
      } else {
        const newCustomer = await tx.customer.create({
          data: {
            name: customer.name,
            phone: customer.mobile,
            email: customer.email,
            age: customer.age,
            gender: customer.gender,
          },
        });
        customerId = newCustomer.id;
      }

      let total = 0;
      const saleItems: {
        batchId: string;
        medicineId: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }[] = [];

      for (const item of items) {
        const batch = await tx.batch.findUnique({ where: { id: item.batchId } });
        if (!batch) {
          throw new Error(`Batch not found: ${item.batchId}`);
        }
        if (batch.quantityAvailable < item.quantity) {
          throw new Error(
            `Insufficient stock for batch ${batch.batchNumber}. Available: ${batch.quantityAvailable}, Requested: ${item.quantity}`
          );
        }
        const lineTotal = item.unitPrice * item.quantity;
        total += lineTotal;
        saleItems.push({
          batchId: item.batchId,
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal,
        });
      }

      const grandTotal = Math.round((total + (tax || 0) - (discount || 0)) * 100) / 100;

      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId,
          userId,
          total: grandTotal,
          discount: discount || 0,
          tax: tax || 0,
          paymentMethod: paymentMethod || 'CASH',
          status: 'COMPLETED',
          items: { create: saleItems },
        },
      });

      for (const item of items) {
        await tx.batch.update({
          where: { id: item.batchId },
          data: { quantityAvailable: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            batchId: item.batchId,
            type: 'SALE',
            quantity: -item.quantity,
            referenceId: sale.id,
          },
        });
      }

      return sale;
    });

    revalidatePath('/dashboard');
    revalidatePath('/inventory');
    revalidatePath('/expiry');
    revalidatePath('/pos');
    revalidatePath('/suppliers');

    return NextResponse.json({
      id: result.id,
      invoiceNumber: result.invoiceNumber,
      total: result.total,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create sale';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
