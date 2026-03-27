
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewOtherTestPage() {
  const masterType = 'other-tests';

  return (
    <div className="app-page">
      <PageHeader
        title="New Other Test"
        description="Fill in the details to create a new other test."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
