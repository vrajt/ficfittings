import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { masterDataConfig } from '@/lib/master-data-config';
import { notFound } from 'next/navigation';

export default function MasterTypePage({ params }: { params: { masterType: string } }) {
  const { masterType } = params;
  const config = masterDataConfig[masterType as keyof typeof masterDataConfig];

  if (!config) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
        actionButtonText={`New ${config.title.replace(' Master', '')}`}
        actionButtonLink={`/masters/${masterType}/new`}
      />
      <DataTable columns={config.columns} data={config.data} />
    </div>
  );
}
