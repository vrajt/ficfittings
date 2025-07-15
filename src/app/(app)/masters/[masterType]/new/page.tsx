import { MasterForm } from '@/components/masters/master-form';
import { PageHeader } from '@/components/page-header';
import { masterDataConfig } from '@/lib/master-data-config';
import { notFound } from 'next/navigation';

export default function NewMasterPage({ params }: { params: { masterType: string } }) {
  const { masterType } = params;
  const config = masterDataConfig[masterType as keyof typeof masterDataConfig];

  if (!config) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`New ${config.title.replace(' Master', '')}`}
        description={`Fill in the details to create a new ${config.title.toLowerCase()}.`}
      />
      <MasterForm masterType={masterType} />
    </div>
  );
}
