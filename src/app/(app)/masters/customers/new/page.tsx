
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewCustomerPage() {
  const masterType = 'customers';

  return (
    <div className="app-page">
      <PageHeader
        title="New Customer"
        description="Fill in the details to create a new customer."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
