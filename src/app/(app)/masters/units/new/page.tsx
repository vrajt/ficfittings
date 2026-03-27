
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewUnitPage() {
  const masterType = 'units';

  return (
    <div className="app-page">
      <PageHeader
        title="New Unit"
        description="Fill in the details to create a new unit."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
