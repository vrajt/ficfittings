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
import { StartMaterialForm } from '@/components/masters/start-material-form';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

export default function StartMaterialsPage() {
  const [data, setData] = React.useState<GenericMaster[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingData, setEditingData] = React.useState<GenericMaster | null>(null);

  const columns: ColumnDef<GenericMaster>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Material Name' },
    {
      accessorKey: 'isBlocked',
      header: 'Status',
      cell: ({ row }) => {
        const isBlocked = row.original.isBlocked;
        return (
          <Badge variant={isBlocked ? 'destructive' : 'default'}>
            {isBlocked ? 'Blocked' : 'Active'}
          </Badge>
        );
      },
    },
    { 
      accessorKey: 'date', 
      header: 'Created At',
      cell: ({ row }) => (row.original.date ? format(new Date(row.original.date), 'dd-MM-yyyy') : '-'),
    },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/start-materials');
      console.log('response::: ', response);
      
      const formattedData = response.data.map((item: any) => ({
        id: item.Id,
        name: item.SM_RM_Name,
        isBlocked: item.IsBlocked,
        date: item.CreatedDate,
        updatedAt: item.UpdateDate,
      }));
      
      setData(formattedData);
    } catch (error) {
      console.error("Failed to fetch start materials:", error);
      toast({
        title: "Fetch Failed",
        description: "Could not fetch start materials. Please try again.",
        variant: "destructive",
      });
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
  
  const handleDelete = async (record: GenericMaster) => {
    const id = record.id;
    try {
      await axios.delete(`/api/start-materials/${id}`);
      toast({
        title: "Record Deleted",
        description: `The record with ID ${id} has been deleted.`
      });
      fetchData();
    } catch (error) {
      console.error(`Failed to delete record ${id}:`, error);
      toast({
        title: "Deletion Failed",
        description: "Could not delete the record. Please try again.",
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Start Material Master"
        description="Manage types of starting materials."
        actionButtonText="Add New Start Material"
        onActionClick={handleAddNew}
      />
      <DataTable 
        columns={columns} 
        data={data} 
        isLoading={isLoading} 
        onRefresh={fetchData}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingData ? 'Edit Start Material' : 'Add New Start Material'}</DialogTitle>
            <DialogDescription>
              {editingData ? 'Update the details of the existing material.' : 'Fill in the details to create a new material.'}
            </DialogDescription>
          </DialogHeader>
          <StartMaterialForm initialData={editingData} onSave={handleSave} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
