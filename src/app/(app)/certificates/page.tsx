
'use client';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { certificateConfig } from '@/lib/master-data-config';

export default function CertificatesPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title={certificateConfig.title}
        description={certificateConfig.description}
        actionButtonText="New Certificate"
        actionButtonLink="/certificates/new"
      />
      <DataTable columns={certificateConfig.columns} data={certificateConfig.data} />
    </div>
  );
}
