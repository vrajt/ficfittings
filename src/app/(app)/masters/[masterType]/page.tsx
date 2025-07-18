
'use client';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { masterDataConfig } from '@/lib/master-data-config';
import { notFound, useParams } from 'next/navigation';
import * as React from 'react';

export default function MasterTypePage() {
  const params = useParams();
  const masterType = params.masterType as string;
  const config = masterDataConfig[masterType as keyof typeof masterDataConfig];
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simulate network delay
    return () => clearTimeout(timer);
  }, [masterType]);

  if (!config) {
    notFound();
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title={config.title}
        description={config.description}
        actionButtonText={`Add New ${config.title.replace(' Master', '')}`}
        actionButtonLink={`/masters/${masterType}/new`}
      />
      <DataTable columns={config.columns} data={config.data} isLoading={isLoading} />
    </div>
  );
}
