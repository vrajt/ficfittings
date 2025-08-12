
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewHeatTestPage() {
  const masterType = 'heat-tests';

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="New Heat Test"
        description="Fill in the details to create a new heat test."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
