
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewTcRemarkPage() {
  const masterType = 'tc-remarks';

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="New TC Remark"
        description="Fill in the details to create a new TC remark."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
