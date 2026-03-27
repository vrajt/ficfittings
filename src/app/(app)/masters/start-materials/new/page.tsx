
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewStartMaterialPage() {
  const masterType = 'start-materials';

  return (
    <div className="app-page">
      <PageHeader
        title="New Start Material"
        description="Fill in the details to create a new start material."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
