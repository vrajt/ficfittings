
'use client';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { customerData } from '@/lib/placeholder-data';
import type { Customer } from '@/lib/types';
import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';

const columns: ColumnDef<Customer>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'address', header: 'Address' },
  { accessorKey: 'contactPerson', header: 'Contact Person' },
  { accessorKey: 'date', header: 'Created At' },
  { accessorKey: 'createdBy', header: 'Created By' },
  { accessorKey: 'updatedBy', header: 'Updated By' },
  { accessorKey: 'updatedAt', header: 'Updated At' },
];

export default function CustomersPage() {
  const masterType = 'customers';
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
        title="Customer Master"
        description="Manage customer information."
        actionButtonText="Add New Customer"
        actionButtonLink={`/masters/${masterType}/new`}
      />
      <DataTable columns={columns} data={customerData} isLoading={isLoading} />
    </div>
  );
}
