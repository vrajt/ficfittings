
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';

export default function NewTcRemarkPage() {
  const masterType = 'tc-remarks';

  return (
    <div className="app-page">
      <PageHeader
        title="New TC Remark"
        description="Fill in the details to create a new TC remark."
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
