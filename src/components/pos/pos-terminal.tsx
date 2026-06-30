'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle,
  X,
  Package,
} from 'lucide-react';
import { formatCurrency, getExpiryStatus } from '@/lib/format';

interface POSBatch {
  id: string;
  batchNumber: string;
  quantityAvailable: number;
  sellingPrice: number;
  expiryDate: string;
}

interface POSMedicine {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  form: string;
  prescriptionRequired: boolean;
  batches: POSBatch[];
}

interface CartItem {
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export function POSTerminal({ medicines }: { medicines: POSMedicine[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState({ name: '', mobile: '', age: '', gender: '', email: '' });

  const availableMedicines = useMemo(
    () => medicines.filter((m) => m.batches.some((b) => b.quantityAvailable > 0)),
    [medicines]
  );

  const searchResults = useMemo(() => {
    if (!search) return availableMedicines.slice(0, 8);
    const q = search.toLowerCase();
    return availableMedicines
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [search, availableMedicines]);

  const getFifoBatch = (medicine: POSMedicine): POSBatch | null => {
    const valid = medicine.batches
      .filter((b) => b.quantityAvailable > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    return valid[0] || null;
  };

  const addToCart = (medicine: POSMedicine) => {
    const batch = getFifoBatch(medicine);
    if (!batch) return;

    const existing = cart.find((item) => item.batchId === batch.id);
    if (existing) {
      if (existing.quantity >= batch.quantityAvailable) {
        setError(`Only ${batch.quantityAvailable} units available in batch ${batch.batchNumber}`);
        return;
      }
      updateQuantity(existing.batchId, existing.quantity + 1);
      return;
    }

    setCart([
      ...cart,
      {
        medicineId: medicine.id,
        medicineName: `${medicine.name} ${medicine.strength}`,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        unitPrice: batch.sellingPrice,
        quantity: 1,
        lineTotal: batch.sellingPrice,
      },
    ]);
    setError(null);
  };

  const updateQuantity = (batchId: string, qty: number) => {
    if (qty < 1) {
      removeFromCart(batchId);
      return;
    }
    const item = cart.find((i) => i.batchId === batchId);
    if (item) {
      const medicine = medicines.find((m) => m.id === item.medicineId);
      const batch = medicine?.batches.find((b) => b.id === batchId);
      if (batch && qty > batch.quantityAvailable) {
        setError(`Only ${batch.quantityAvailable} units available`);
        return;
      }
    }
    setCart(
      cart.map((item) =>
        item.batchId === batchId
          ? { ...item, quantity: qty, lineTotal: item.unitPrice * qty }
          : item
      )
    );
    setError(null);
  };

  const removeFromCart = (batchId: string) => {
    setCart(cart.filter((item) => item.batchId !== batchId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + tax - discount) * 100) / 100;

  const checkout = async () => {
    if (cart.length === 0) return;
    if (!customer.name.trim() || !customer.mobile.trim()) {
      setError('Patient name and mobile number are required');
      return;
    }
    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            medicineId: item.medicineId,
            batchId: item.batchId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          paymentMethod,
          discount,
          tax,
          customer: {
            name: customer.name.trim(),
            mobile: customer.mobile.trim(),
            age: customer.age ? parseInt(customer.age) : null,
            gender: customer.gender || null,
            email: customer.email.trim() || null,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Checkout failed');
      }

      const data = await res.json();
      setSuccess(data.invoiceNumber);
      setCart([]);
      setDiscount(0);
      setCustomer({ name: '', mobile: '', age: '', gender: '', email: '' });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Medicine Search & Selection */}
      <div className="lg:col-span-3">
        <Card>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search medicine by name or generic name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11"
                aria-label="Search medicines"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {searchResults.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                No medicines found
              </p>
            ) : (
              searchResults.map((med) => {
                const fifoBatch = getFifoBatch(med);
                if (!fifoBatch) return null;
                const expiry = getExpiryStatus(fifoBatch.expiryDate);
                const totalAvail = med.batches.reduce(
                  (s, b) => s + b.quantityAvailable,
                  0
                );
                return (
                  <button
                    key={med.id}
                    onClick={() => addToCart(med)}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {med.name} {med.strength}
                        </p>
                        {med.prescriptionRequired && (
                          <Badge variant="info">Rx</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {totalAvail} units - {formatCurrency(fifoBatch.sellingPrice)}/unit
                      </p>
                      <p className={`text-xs ${expiry.textClass}`}>
                        FIFO batch: {fifoBatch.batchNumber} ({expiry.label})
                      </p>
                    </div>
                    <Plus className="h-5 w-5 text-primary" />
                  </button>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Cart & Checkout */}
      <div className="lg:col-span-2">
        <Card className="sticky top-6">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Cart</h3>
            {cart.length > 0 && (
              <Badge variant="default">{cart.length} items</Badge>
            )}
          </div>

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 p-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Sale completed: {success}
                </p>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-600 hover:text-green-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-red-50 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Cart is empty</p>
              <p className="text-xs text-muted-foreground">Search and add medicines to begin</p>
            </div>
          ) : (
            <>
              <div className="mb-4 max-h-64 space-y-2 overflow-y-auto scrollbar-thin">
                {cart.map((item) => (
                  <div
                    key={item.batchId}
                    className="rounded-md border border-border bg-muted/30 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {item.medicineName}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {item.batchNumber} - {formatCurrency(item.unitPrice)}/unit
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.batchId)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.batchId, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card hover:bg-muted"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-mono text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.batchId, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card hover:bg-muted"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {formatCurrency(item.lineTotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer / Patient Details */}
              <div className="mb-3 border-t border-border pt-3">
                <p className="mb-2 text-xs font-semibold text-foreground">Patient Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Name *"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="h-8 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile *"
                    value={customer.mobile}
                    onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
                    className="h-8 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={customer.age}
                    onChange={(e) => setCustomer({ ...customer, age: e.target.value })}
                    className="h-8 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <select
                    value={customer.gender}
                    onChange={(e) => setCustomer({ ...customer, gender: e.target.value })}
                    className="h-8 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  >
                    <option value="">Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    className="col-span-2 h-8 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span className="font-mono text-foreground">{formatCurrency(tax)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    step="0.01"
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="h-7 w-24 rounded-md border border-input bg-card px-2 text-right font-mono text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-mono text-lg font-bold text-primary">
                    {formatCurrency(total)}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  {['CASH', 'CARD', 'UPI'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        paymentMethod === method
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={checkout}
                  disabled={processing || cart.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {processing ? 'Processing...' : `Complete Sale - ${formatCurrency(total)}`}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
