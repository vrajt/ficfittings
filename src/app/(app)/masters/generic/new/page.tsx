
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewGenericMasterPage() {
  const masterType = 'generic';

  return (
    <div className="app-page">
      <PageHeader
        title="New Generic Item"
        description="Fill in the details to create a new generic item."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
