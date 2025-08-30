
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
import { HeatTestForm } from '@/components/masters/heat-tests-form';
import { Badge } from '@/components/ui/badge';

export default function HeatTestsPage() {
  const masterType = 'heattestmaster';
  const [data, setData] = React.useState<GenericMaster[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingData, setEditingData] = React.useState<GenericMaster | null>(null);

  const columns: ColumnDef<GenericMaster>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'code', header: 'Heat Code' },
    { accessorKey: 'name', header: 'Heat Description' },
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
    { 
      accessorKey: 'updatedAt', 
      header: 'Updated At',
      cell: ({ row }) => (row.original.updatedAt ? format(new Date(row.original.updatedAt), 'dd-MM-yyyy') : '-'),
    },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/${masterType}`);
      
      const formattedData = response.data.map((item: any) => {
        const source = item.dataValues || item;
        return {
          id: source.Id,
          code: source.Heat_Code,
          name: source.Heat_Desc,
          isBlocked: source.IsBlocked,
          date: source.CreatedDate,
          updatedAt: source.UpdateDate,
          createdBy: source.CreatedBy,
          updatedBy: source.UpdatedBy,
        };
      });
      
      setData(formattedData);
    } catch (error) {
      console.error("Failed to fetch heat tests:", error);
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
        title="Heat Test Master"
        description="Manage types of heat tests performed."
        actionButtonText="Add New Heat Test"
        onActionClick={handleAddNew}
      />
      <DataTable 
        columns={columns} 
        data={data} 
        isLoading={isLoading} 
        masterType={masterType}
        onRefresh={fetchData}
        onEdit={handleEdit}
      />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingData ? 'Edit Heat Test' : 'Add New Heat Test'}</DialogTitle>
            <DialogDescription>
              {editingData ? 'Update the details of the existing heat test.' : 'Fill in the details to create a new heat test.'}
            </DialogDescription>
          </DialogHeader>
          <HeatTestForm initialData={editingData} onSave={handleSave} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
