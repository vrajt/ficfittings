
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewStartMaterialPage() {
  const masterType = 'start-materials';

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="New Start Material"
        description="Fill in the details to create a new start material."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
