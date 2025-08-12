
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewLaboratoryPage() {
  const masterType = 'laboratories';

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="New Laboratory"
        description="Fill in the details to create a new laboratory."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
