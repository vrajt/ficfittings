
'use client';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import type { GenericMaster } from '@/lib/types';
import type { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TcRemarkForm } from '@/components/masters/tc-remark-form';

export default function TcRemarksPage() {
  const [data, setData] = React.useState<GenericMaster[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingData, setEditingData] = React.useState<GenericMaster | null>(null);

  const columns: ColumnDef<GenericMaster>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Remark', cell: ({ row }) => <div className="w-96 whitespace-normal">{row.original.name}</div> },
    { accessorKey: 'tcChoice', header: 'TC Choice' },
    { 
      accessorKey: 'date', 
      header: 'Created At',
      cell: ({ row }) => row.original.date ? format(new Date(row.original.date), 'dd-MM-yyyy') : '-',
    },
    { 
      accessorKey: 'updatedAt', 
      header: 'Updated At',
      cell: ({ row }) => row.original.updatedAt ? format(new Date(row.original.updatedAt), 'dd-MM-yyyy') : '-',
    },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/tcremarksfix');
      
      const formattedData = response.data.map((item: any) => ({
          id: item.Id,
          name: item.TcTerms,
          tcChoice: item.TcChoice,
          date: item.CreatedDate,
          updatedAt: item.UpdateDate,
          isBlocked: item.IsBlocked,
      }));
      
      setData(formattedData);
    } catch (error) {
      console.error("Failed to fetch TC remarks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleAddNew = () => {
    setEditingData(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (record: GenericMaster) => {
    setEditingData(record);
    setIsDialogOpen(true);
  };
  
  const handleSave = () => {
    setIsDialogOpen(false);
    fetchData();
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="TC Remark Master"
        description="Manage standard remarks for test certificates."
        actionButtonText="Add New TC Remark"
        onActionClick={handleAddNew}
      />
      <DataTable 
        columns={columns} 
        data={data} 
        isLoading={isLoading} 
        masterType="tcremarksfix"
        onRefresh={fetchData}
        onEdit={handleEdit}
      />
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingData ? 'Edit TC Remark' : 'Add New TC Remark'}</DialogTitle>
            <DialogDescription>
              {editingData ? 'Update the details of the existing remark.' : 'Fill in the details to create a new remark.'}
            </DialogDescription>
          </DialogHeader>
          <TcRemarkForm initialData={editingData} onSave={handleSave} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
