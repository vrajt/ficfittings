
'use client';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { masterDataConfig } from '@/lib/master-data-config';
import { notFound, useParams } from 'next/navigation';

export default function MasterTypePage() {
  const params = useParams();
  const masterType = params.masterType as string;
  const config = masterDataConfig[masterType as keyof typeof masterDataConfig];

  if (!config) {
    notFound();
  }

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title={config.title}
        description={config.description}
        actionButtonText={`Add New ${config.title.replace(' Master', '')}`}
        actionButtonLink={`/masters/${masterType}/new`}
      />
       <div className="flex-1 flex flex-col overflow-hidden">
        <DataTable columns={config.columns} data={config.data} />
      </div>
    </div>
  );
}
