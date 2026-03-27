
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewGradePage() {
  const masterType = 'grades';

  return (
    <div className="app-page">
      <PageHeader
        title="New Grade"
        description="Fill in the details to create a new grade."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
