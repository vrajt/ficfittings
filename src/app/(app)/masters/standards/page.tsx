
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
import { StandardForm } from '@/components/masters/standard-form';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

export default function StandardsPage() {
  const [data, setData] = React.useState<GenericMaster[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingData, setEditingData] = React.useState<GenericMaster | null>(null);

  const columns: ColumnDef<GenericMaster>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Standard Type' },
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
      const response = await axios.get('/api/mtcstandards');
      
      const formattedData = response.data.map((item: any) => ({
        id: item.Std_Id,
        name: item.Std_Type,
        isBlocked: item.IsBlocked,
        date: item.CreatedDate,
        updatedAt: item.UpdateDate,
      }));
      
      setData(formattedData);
    } catch (error) {
      console.error("Failed to fetch standards:", error);
      toast({
        title: "Fetch Failed",
        description: "Could not fetch standards. Please try again.",
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
  
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/mtcstandards/${id}`);
      toast({
        title: "Record Deleted",
        description: `The record with ID ${id} has been deleted.`
      });
      fetchData(); // Refresh data after delete
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
        title="Standard Master"
        description="Manage TC Standard Types."
        actionButtonText="Add New Standard"
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
            <DialogTitle>{editingData ? 'Edit Standard' : 'Add New Standard'}</DialogTitle>
            <DialogDescription>
              {editingData ? 'Update the details of the existing standard.' : 'Fill in the details to create a new standard.'}
            </DialogDescription>
          </DialogHeader>
          <StandardForm initialData={editingData} onSave={handleSave} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
