
'use client';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import type { Certificate, TcMain } from '@/lib/types';
import axios from 'axios';
import * as React from 'react';
import { format } from 'date-fns';
import { useTabs } from '@/components/tabs/tab-provider';
import { toast } from '@/hooks/use-toast';
import { generateCertificatePDF } from '@/lib/pdf-generator';
import type { ColumnDef } from '@tanstack/react-table';

export default function CertificatesPage() {
  const [data, setData] = React.useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { addTab } = useTabs();

  const columns: ColumnDef<Certificate>[] = [
      { accessorKey: 'certificateNumber', header: 'Certificate No.' },
      { accessorKey: 'customerName', header: 'Customer' },
      { 
        accessorKey: 'date', 
        header: 'Date',
        cell: ({ row }: any) => row.original.date ? format(new Date(row.original.date), 'dd-MM-yyyy') : '-',
      },
      { accessorKey: 'createdBy', header: 'Created By' },
      { 
        accessorKey: 'updatedAt', 
        header: 'Updated At',
        cell: ({ row }: any) => row.original.updatedAt ? format(new Date(row.original.updatedAt), 'dd-MM-yyyy') : '-',
      },
    ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/tcmain');
      const formattedData = response.data.map((item: any) => ({
        id: item.Id.toString(),
        certificateNumber: item.ApsFullDoc,
        customerName: item.AccName,
        date: item.DocDate,
        createdBy: item.CreatedBy,
        updatedAt: item.UpdateDate,
      }));
      setData(formattedData.reverse());
    } catch(error) {
      console.error("Failed to fetch certificates", error);
      toast({
        title: "Fetch Failed",
        description: "Could not fetch certificates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (record: Certificate) => {
    const path = `/certificates/${record.id}`;
    addTab({ id: path, title: `Edit: ${record.certificateNumber}`, path });
  };

  const handleAddNew = () => {
    const path = `/certificates/new`;
    addTab({ id: path, title: 'New Certificate', path });
  }

  const handleDelete = async (record: Certificate) => {
    try {
      await axios.delete(`/api/tcmain/${record.id}`);
      toast({
        title: "Certificate Deleted",
        description: `The certificate with ID ${record.id} has been deleted.`
      });
      fetchData(); // Refresh data after delete
    } catch (error) {
      console.error(`Failed to delete certificate ${record.id}:`, error);
      toast({
        title: "Deletion Failed",
        description: "Could not delete the certificate. Please try again.",
        variant: 'destructive'
      });
    }
  };

  const handleDownload = async (certificate: Certificate) => {
    try {
        toast({ title: 'Generating PDF...', description: 'Please wait while we prepare your document.' });
        const response = await axios.get<TcMain>(`/api/tcmain/${certificate.id}`);
        const fullCertificateData = response.data;
        await generateCertificatePDF(fullCertificateData);
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        toast({
            title: "PDF Generation Failed",
            description: "Could not generate the PDF. Please try again.",
            variant: "destructive"
        });
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Test Certificates"
        description="Manage and generate test certificates."
        actionButtonText="New Certificate"
        onActionClick={handleAddNew}
      />
      <DataTable 
        columns={columns} 
        data={data} 
        isLoading={isLoading} 
        onEdit={handleEdit}
        onRefresh={fetchData}
        onDelete={handleDelete}
        onDownload={handleDownload}
        />
    </div>
  );
}
