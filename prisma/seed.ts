import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const daysFromNow = (days: number) => new Date(Date.now() + days * 86400000);
const daysAgo = (days: number) => new Date(Date.now() - days * 86400000);

async function main() {
  console.log('Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const pharmaPassword = await bcrypt.hash('pharma123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'srikanth',
      email: 'admin@pharmacy.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.create({
    data: {
      name: 'James Wilson',
      email: 'pharmacist@pharmacy.com',
      password: pharmaPassword,
      role: 'PHARMACIST',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Lisa Anderson',
      email: 'cashier@pharmacy.com',
      password: cashierPassword,
      role: 'CASHIER',
    },
  });

  console.log('  Created: admin@pharmacy.com / admin123 (ADMIN)');
  console.log('  Created: pharmacist@pharmacy.com / pharma123 (PHARMACIST)');
  console.log('  Created: cashier@pharmacy.com / cashier123 (CASHIER)');

  console.log('Creating categories...');
  const catNames = [
    ['Analgesics', 'Pain relief and anti-inflammatory medications'],
    ['Antibiotics', 'Bacterial infection treatments'],
    ['Cardiovascular', 'Heart and blood pressure medications'],
    ['Vitamins & Supplements', 'Nutritional supplements and vitamins'],
    ['Gastrointestinal', 'Digestive system medications'],
    ['Respiratory', 'Respiratory and allergy medications'],
    ['Antidiabetic', 'Diabetes management medications'],
  ];
  const categories: Record<string, { id: string }> = {};
  for (const [name, desc] of catNames) {
    const cat = await prisma.category.create({ data: { name, description: desc } });
    categories[name] = cat;
  }

  console.log('Creating suppliers...');
  const supplierData = [
    { name: 'MedSupply Co', contact: 'John Smith', email: 'orders@medsupply.com', phone: '+1-555-0101', leadTimeDays: 5 },
    { name: 'PharmaDist Ltd', contact: 'Sarah Lee', email: 'sales@pharmadist.com', phone: '+1-555-0102', leadTimeDays: 7 },
    { name: 'HealthCare Distributors', contact: 'Mike Brown', email: 'info@hcd.com', phone: '+1-555-0103', leadTimeDays: 10 },
  ];
  const suppliers: { id: string }[] = [];
  for (const s of supplierData) {
    suppliers.push(await prisma.supplier.create({ data: s }));
  }

  console.log('Creating customers...');
  const customerData = [
    { name: 'James Wilson', phone: '+1-555-0201', allergies: 'Penicillin' },
    { name: 'Maria Garcia', phone: '+1-555-0202' },
    { name: 'Robert Taylor', phone: '+1-555-0203', allergies: 'Aspirin, Sulfa' },
    { name: 'Jennifer Adams', phone: '+1-555-0204' },
    { name: 'David Brown', phone: '+1-555-0205' },
  ];
  const customers: { id: string }[] = [];
  for (const c of customerData) {
    customers.push(await prisma.customer.create({ data: c }));
  }

  console.log('Creating medicines and batches...');

  interface BatchData {
    bn: string;
    si: number;
    qr: number;
    qa: number;
    uc: number;
    sp: number;
    mrp: number;
    md: Date;
    ed: Date;
    st: string;
  }
  interface MedData {
    name: string;
    gn: string;
    brand: string;
    cat: string;
    mfr: string;
    form: string;
    str: string;
    unit: string;
    rx: boolean;
    rl: number;
    rq: number;
    batches: BatchData[];
  }

  const meds: MedData[] = [
    {
      name: 'Paracetamol', gn: 'Acetaminophen', brand: 'Tylenol', cat: 'Analgesics', mfr: 'Johnson & Johnson',
      form: 'tablet', str: '500mg', unit: 'strip', rx: false, rl: 20, rq: 100,
      batches: [
        { bn: 'PCM2401A', si: 0, qr: 200, qa: 180, uc: 0.05, sp: 0.15, mrp: 0.20, md: daysAgo(320), ed: daysFromNow(45), st: 'ACTIVE' },
        { bn: 'PCM2402B', si: 0, qr: 100, qa: 40, uc: 0.05, sp: 0.15, mrp: 0.20, md: daysAgo(350), ed: daysFromNow(15), st: 'ACTIVE' },
      ],
    },
    {
      name: 'Ibuprofen', gn: 'Ibuprofen', brand: 'Advil', cat: 'Analgesics', mfr: 'Pfizer',
      form: 'tablet', str: '400mg', unit: 'strip', rx: false, rl: 15, rq: 80,
      batches: [
        { bn: 'IBU2401A', si: 1, qr: 80, qa: 5, uc: 0.08, sp: 0.20, mrp: 0.25, md: daysAgo(180), ed: daysFromNow(120), st: 'ACTIVE' },
      ],
    },
    {
      name: 'Amoxicillin', gn: 'Amoxicillin', brand: 'Amoxil', cat: 'Antibiotics', mfr: 'GSK',
      form: 'capsule', str: '500mg', unit: 'strip', rx: true, rl: 15, rq: 60,
      batches: [
        { bn: 'AMX2401A', si: 0, qr: 150, qa: 120, uc: 0.15, sp: 0.35, mrp: 0.45, md: daysAgo(165), ed: daysFromNow(200), st: 'ACTIVE' },
        { bn: 'AMX2309B', si: 1, qr: 100, qa: 30, uc: 0.15, sp: 0.35, mrp: 0.45, md: daysAgo(375), ed: daysAgo(10), st: 'EXPIRED' },
      ],
    },
    {
      name: 'Azithromycin', gn: 'Azithromycin', brand: 'Zithromax', cat: 'Antibiotics', mfr: 'Pfizer',
      form: 'tablet', str: '500mg', unit: 'strip', rx: true, rl: 10, rq: 40,
      batches: [
        { bn: 'AZI2401A', si: 0, qr: 80, qa: 65, uc: 0.30, sp: 0.60, mrp: 0.75, md: daysAgo(340), ed: daysFromNow(25), st: 'ACTIVE' },
      ],
    },
    {
      name: 'Metformin', gn: 'Metformin HCl', brand: 'Glucophage', cat: 'Antidiabetic', mfr: 'Merck',
      form: 'tablet', str: '500mg', unit: 'strip', rx: true, rl: 20, rq: 100,
      batches: [
        { bn: 'MET2401A', si: 2, qr: 200, qa: 110, uc: 0.04, sp: 0.12, mrp: 0.15, md: daysAgo(65), ed: daysFromNow(300), st: 'ACTIVE' },
      ],
    },
    {
      name: 'Atorvastatin', gn: 'Atorvastatin', brand: 'Lipitor', cat: 'Cardiovascular', mfr: 'Pfizer',
      form: 'tablet', str: '10mg', unit: 'strip', rx: true, rl: 12, rq: 50,
      batches: [
        { bn: 'ATV2401A', si: 0, qr: 60, qa: 8, uc: 0.10, sp: 0.25, mrp: 0.30, md: daysAgo(185), ed: daysFromNow(180), st: 'ACTIVE' },
      ],
    },
    {
      name: 'Amlodipine', gn: 'Amlodipine Besylate', brand: 'Norvasc', cat: 'Cardiovascular', mfr: 'Pfizer',
      form: 'tablet', str: '5mg', unit: 'strip', rx: true, rl: 15, rq: 60,
      batches: [
        { bn: 'AML2401A', si: 0, qr: 100, qa: 90, uc: 0.06, sp: 0.18, mrp: 0.22, md: daysAgo(310), ed: daysFromNow(55), st: 'ACTIVE' },
        { bn: 'AML2402B', si: 1, qr: 80, qa: 55, uc: 0.06, sp: 0.18, mrp: 0.22, md: daysAgo(115), ed: daysFromNow(250), st: 'ACTIVE' },
      ],
    },
    {
      name: 'Omeprazole', gn: 'Omeprazole', brand: 'Prilosec', cat: 'Gastrointestinal', mfr: 'AstraZeneca',
      form: 'capsule', str: '20mg', unit: 'strip', rx: false, rl: 15, rq: 60,
      batches: [
        { bn: 'OME2401A', si: 2, qr: 70, qa: 42, uc: 0.12, sp: 0.30, mrp: 0.38, md: daysAgo(290), ed: daysFromNow(75), st: 'ACTIVE' },
      ],
    },
    {
      name: 'Cetirizine', gn: 'Cetirizine HCl', brand: 'Zyrtec', cat: 'Respiratory', mfr: 'Johnson & Johnson',
      form: 'tablet', str: '10mg', unit: 'strip', rx: false, rl: 20, rq: 80,
      batches: [
        { bn: 'CET2401A', si: 0, qr: 120, qa: 85, uc: 0.05, sp: 0.14, mrp: 0.18, md: daysAgo(280), ed: daysFromNow(85), st: 'ACTIVE' },
        { bn: 'CET2312B', si: 1, qr: 60, qa: 18, uc: 0.05, sp: 0.14, mrp: 0.18, md: daysAgo(370), ed: daysAgo(5), st: 'EXPIRED' },
      ],
    },
    {
      name: 'Vitamin C', gn: 'Ascorbic Acid', brand: 'Nature Made', cat: 'Vitamins & Supplements', mfr: 'Nature Made',
      form: 'tablet', str: '500mg', unit: 'bottle', rx: false, rl: 10, rq: 50,
      batches: [
        { bn: 'VTC2401A', si: 2, qr: 300, qa: 280, uc: 0.03, sp: 0.08, mrp: 0.10, md: daysAgo(30), ed: daysFromNow(400), st: 'ACTIVE' },
      ],
    },
    {
      name: 'Vitamin D3', gn: 'Cholecalciferol', brand: 'Nature Made', cat: 'Vitamins & Supplements', mfr: 'Nature Made',
      form: 'capsule', str: '60000 IU', unit: 'strip', rx: false, rl: 10, rq: 40,
      batches: [
        { bn: 'VTD2401A', si: 0, qr: 150, qa: 140, uc: 0.07, sp: 0.16, mrp: 0.20, md: daysAgo(15), ed: daysFromNow(350), st: 'ACTIVE' },
      ],
    },
    {
      name: 'Aspirin', gn: 'Acetylsalicylic Acid', brand: 'Bayer', cat: 'Cardiovascular', mfr: 'Bayer',
      form: 'tablet', str: '75mg', unit: 'strip', rx: false, rl: 15, rq: 60,
      batches: [
        { bn: 'ASP2401A', si: 0, qr: 100, qa: 0, uc: 0.03, sp: 0.08, mrp: 0.10, md: daysAgo(275), ed: daysFromNow(90), st: 'ACTIVE' },
      ],
    },
    {
      name: 'Cough Syrup', gn: 'Dextromethorphan', brand: 'Robitussin', cat: 'Respiratory', mfr: 'Haleon',
      form: 'syrup', str: '100ml', unit: 'bottle', rx: false, rl: 8, rq: 30,
      batches: [
        { bn: 'CSY2401A', si: 1, qr: 40, qa: 22, uc: 1.50, sp: 3.50, mrp: 4.20, md: daysAgo(305), ed: daysFromNow(60), st: 'ACTIVE' },
      ],
    },
    {
      name: 'Ranitidine', gn: 'Ranitidine HCl', brand: 'Zantac', cat: 'Gastrointestinal', mfr: 'GSK',
      form: 'tablet', str: '150mg', unit: 'strip', rx: false, rl: 10, rq: 40,
      batches: [
        { bn: 'RAN2401A', si: 0, qr: 50, qa: 3, uc: 0.06, sp: 0.15, mrp: 0.18, md: daysAgo(345), ed: daysFromNow(20), st: 'ACTIVE' },
      ],
    },
    {
      name: 'Metronidazole', gn: 'Metronidazole', brand: 'Flagyl', cat: 'Antibiotics', mfr: 'Pfizer',
      form: 'tablet', str: '400mg', unit: 'strip', rx: true, rl: 10, rq: 40,
      batches: [
        { bn: 'MTN2401A', si: 2, qr: 80, qa: 65, uc: 0.08, sp: 0.20, mrp: 0.25, md: daysAgo(215), ed: daysFromNow(150), st: 'ACTIVE' },
      ],
    },
  ];

  let invoiceCounter = 1001;

  for (const m of meds) {
    const med = await prisma.medicine.create({
      data: {
        name: m.name,
        genericName: m.gn,
        brand: m.brand,
        categoryId: categories[m.cat].id,
        manufacturer: m.mfr,
        form: m.form,
        strength: m.str,
        unit: m.unit,
        barcode: `BAR${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        prescriptionRequired: m.rx,
        reorderLevel: m.rl,
        reorderQuantity: m.rq,
        storageConditions: m.form === 'syrup' ? 'Store below 25C' : 'Store at room temperature',
      },
    });

    for (const b of m.batches) {
      const batch = await prisma.batch.create({
        data: {
          medicineId: med.id,
          batchNumber: b.bn,
          supplierId: suppliers[b.si].id,
          quantityReceived: b.qr,
          quantityAvailable: b.qa,
          unitCost: b.uc,
          sellingPrice: b.sp,
          mrp: b.mrp,
          manufactureDate: b.md,
          expiryDate: b.ed,
          status: b.st,
        },
      });

      await prisma.stockMovement.create({
        data: {
          batchId: batch.id,
          type: 'PURCHASE',
          quantity: b.qr,
          userId: admin.id,
          reason: 'Initial stock receipt',
        },
      });

      if (b.qr - b.qa > 0) {
        await prisma.stockMovement.create({
          data: {
            batchId: batch.id,
            type: 'SALE',
            quantity: -(b.qr - b.qa),
            reason: 'Sales over time',
          },
        });
      }
    }

    console.log(`  Created: ${m.name} (${m.batches.length} batches)`);
  }

  console.log('Creating sales transactions...');
  const allBatches = await prisma.batch.findMany({
    where: { status: 'ACTIVE', quantityAvailable: { gt: 0 } },
    include: { medicine: true },
  });

  for (let i = 0; i < 12; i++) {
    const daysOffset = i < 7 ? -(6 - i) : -Math.floor(Math.random() * 7) - 7;
    const saleDate = daysAgo(-daysOffset);
    saleDate.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));

    const itemCount = 1 + Math.floor(Math.random() * 3);
    const selectedBatches: typeof allBatches = [];
    const usedBatchIds = new Set<string>();

    for (let j = 0; j < itemCount; j++) {
      let attempt = 0;
      while (attempt < 10) {
        const randomBatch = allBatches[Math.floor(Math.random() * allBatches.length)];
        if (!usedBatchIds.has(randomBatch.id) && randomBatch.quantityAvailable > 2) {
          selectedBatches.push(randomBatch);
          usedBatchIds.add(randomBatch.id);
          break;
        }
        attempt++;
      }
    }

    if (selectedBatches.length === 0) continue;

    let total = 0;
    const items: { batchId: string; medicineId: string; quantity: number; unitPrice: number; lineTotal: number }[] = [];
    for (const batch of selectedBatches) {
      const qty = Math.min(1 + Math.floor(Math.random() * 5), Math.floor(batch.quantityAvailable / 2));
      if (qty <= 0) continue;
      const lineTotal = batch.sellingPrice * qty;
      total += lineTotal;
      items.push({
        batchId: batch.id,
        medicineId: batch.medicineId,
        quantity: qty,
        unitPrice: batch.sellingPrice,
        lineTotal,
      });
    }

    if (items.length === 0) continue;

    const tax = total * 0.08;
    const discount = Math.random() > 0.7 ? total * 0.05 : 0;
    const grandTotal = total + tax - discount;
    const custIdx = i % customers.length;
    const paymentMethods = ['CASH', 'CARD', 'UPI', 'CASH', 'CASH'];
    const payMethod = paymentMethods[i % paymentMethods.length];

    const sale = await prisma.sale.create({
      data: {
        invoiceNumber: `INV-${invoiceCounter++}`,
        customerId: customers[custIdx].id,
        userId: admin.id,
        total: grandTotal,
        discount,
        tax,
        paymentMethod: payMethod,
        status: 'COMPLETED',
        createdAt: saleDate,
        items: { create: items },
      },
    });

    for (const item of items) {
      await prisma.batch.update({
        where: { id: item.batchId },
        data: { quantityAvailable: { decrement: item.quantity } },
      });
      await prisma.stockMovement.create({
        data: {
          batchId: item.batchId,
          type: 'SALE',
          quantity: -item.quantity,
          referenceId: sale.id,
          userId: admin.id,
        },
      });
    }
  }

  console.log(`Created ${invoiceCounter - 1001} sales transactions`);
  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
