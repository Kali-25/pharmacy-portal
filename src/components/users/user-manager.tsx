'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Mail, Shield } from 'lucide-react';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function UserManager({ users: initialUsers }: { users: UserRow[] }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'PHARMACIST',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create user');
      }

      const newUser = await res.json();
      setUsers([newUser, ...users]);
      setForm({ name: '', email: '', password: '', role: 'PHARMACIST' });
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const roleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="danger">Admin</Badge>;
      case 'PHARMACIST':
        return <Badge variant="info">Pharmacist</Badge>;
      case 'TECHNICIAN':
        return <Badge variant="warning">Technician</Badge>;
      case 'CASHIER':
        return <Badge variant="neutral">Cashier</Badge>;
      default:
        return <Badge variant="neutral">{role}</Badge>;
    }
  };

  const roleOptions = ['ADMIN', 'PHARMACIST', 'TECHNICIAN', 'CASHIER'];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {users.length} users - manage who can access the portal
        </p>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'primary'}>
          <UserPlus className="mr-2 h-4 w-4" />
          {showForm ? 'Cancel' : 'Add User'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-red-50 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardHeader title="Create New User" subtitle="Provide details for the new team member" />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., John Smith"
              />
              <Input
                label="Email"
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g., john@pharmacy.com"
              />
              <Input
                label="Password"
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Set a temporary password"
                minLength={6}
              />
              <div className="w-full">
                <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-foreground">
                  Role <span className="text-destructive">*</span>
                </label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving || !form.name || !form.email || !form.password}>
                {saving ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Email</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {users.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                      {u.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="font-medium text-foreground">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {u.email}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">{roleBadge(u.role)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
