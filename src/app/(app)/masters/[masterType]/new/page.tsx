
'use client';
import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';
import { masterDataConfig } from '@/lib/master-data-config';
import { notFound, useParams } from 'next/navigation';

export default function NewMasterPage() {
  const params = useParams();
  const masterType = params.masterType as string;
  const config = masterDataConfig[masterType as keyof typeof masterDataConfig];

  if (!config) {
    notFound();
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title={`New ${config.title.replace(' Master', '')}`}
        description={`Fill in the details to create a new ${config.title.toLowerCase()}.`}
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
