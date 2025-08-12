
'use client';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { masterDataConfig } from '@/lib/master-data-config';
import * as React from 'react';

export default function OtherTestsPage() {
  const masterType = 'other-tests';
  const config = masterDataConfig[masterType];
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simulate network delay
    return () => clearTimeout(timer);
  }, []);

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
