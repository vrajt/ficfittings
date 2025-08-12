
'use client';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { genericMasterData } from '@/lib/placeholder-data';
import type { GenericMaster } from '@/lib/types';
import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';

const columns: ColumnDef<GenericMaster>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'date', header: 'Created At' },
  { accessorKey: 'createdBy', header: 'Created By' },
  { accessorKey: 'updatedBy', header: 'Updated By' },
  { accessorKey: 'updatedAt', header: 'Updated At' },
];

export default function GenericMasterPage() {
  const masterType = 'generic';
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simulate network delay
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Generic Master"
        description="Manage generic master data."
        actionButtonText="Add New Generic Item"
        actionButtonLink={`/masters/${masterType}/new`}
      />
      <DataTable columns={columns} data={genericMasterData.generic} isLoading={isLoading} />
    </div>
  );
}
