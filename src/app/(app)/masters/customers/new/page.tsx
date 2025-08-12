
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewCustomerPage() {
  const masterType = 'customers';

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="New Customer"
        description="Fill in the details to create a new customer."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
