
'use client';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { certificateConfig } from '@/lib/master-data-config';
import * as React from 'react';

export default function CertificatesPage() {
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
        title={certificateConfig.title}
        description={certificateConfig.description}
        actionButtonText="New Certificate"
        actionButtonLink="/certificates/new"
      />
      <DataTable columns={certificateConfig.columns} data={certificateConfig.data} isLoading={isLoading}/>
    </div>
  );
}
