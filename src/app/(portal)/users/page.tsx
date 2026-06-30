import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { UserManager } from '@/components/users/user-manager';
import { PageHeader } from '@/components/layout/page-header';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="p-6">
      <PageHeader
        title="User Management"
        description="Create and manage user accounts and access roles"
      />
      <UserManager users={serializedUsers} />
    </div>
  );
}
