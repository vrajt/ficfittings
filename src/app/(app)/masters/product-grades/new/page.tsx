
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewProductGradePage() {
  const masterType = 'product-grades';

  return (
    <div className="app-page">
      <PageHeader
        title="New Product Grade"
        description="Fill in the details to create a new product grade."
      />
    </div>
  );
}
