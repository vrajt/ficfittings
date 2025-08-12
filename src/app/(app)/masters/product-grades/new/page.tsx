
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewProductGradePage() {
  const masterType = 'product-grades';

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="New Product Grade"
        description="Fill in the details to create a new product grade."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
