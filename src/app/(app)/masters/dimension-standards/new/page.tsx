
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewDimensionStandardPage() {
  const masterType = 'dimension-standards';

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="New Dimension Standard"
        description="Fill in the details to create a new dimension standard."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
