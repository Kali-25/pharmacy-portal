'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImportModal } from '@/components/inventory/import-modal';
import { Upload } from 'lucide-react';

export function ImportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" /> Import CSV/Excel
      </Button>
      {open && <ImportModal onClose={() => setOpen(false)} />}
    </>
  );
}
