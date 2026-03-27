
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewHeatTestPage() {
  const masterType = 'heattestmaster';

  return (
    <div className="app-page">
      <PageHeader
        title="New Heat Test"
        description="Fill in the details to create a new heat test."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
