
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewGenericMasterPage() {
  const masterType = 'generic';

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="New Generic Item"
        description="Fill in the details to create a new generic item."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
