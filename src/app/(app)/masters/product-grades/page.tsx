
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
import { ProductGradeForm } from '@/components/masters/product-grade-form';
import { Badge } from '@/components/ui/badge';

export default function ProductGradesPage() {
  const [data, setData] = React.useState<GenericMaster[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingData, setEditingData] = React.useState<GenericMaster | null>(null);

  const columns: ColumnDef<GenericMaster>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Grade Name' },
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
      const response = await axios.get('/api/product-grades');
      
      const formattedData = response.data.map((item: any) => {
        const source = item.dataValues || item;
        return {
            id: source.Id,
            name: source.GradeName,
            isBlocked: source.IsBlocked,
            date: source.CreatedDate,
            updatedAt: source.UpdateDate,
            createdBy: source.CreatedBy,
            updatedBy: source.UpdatedBy,
        };
      });
      
      setData(formattedData);
    } catch (error) {
      console.error("Failed to fetch product grades:", error);
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
        title="Product Grade Master"
        description="Manage specific grades associated with products."
        actionButtonText="Add New Product Grade"
        onActionClick={handleAddNew}
      />
      <DataTable 
        columns={columns} 
        data={data} 
        isLoading={isLoading} 
        masterType="product-grades"
        onRefresh={fetchData}
        onEdit={handleEdit}
      />
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingData ? 'Edit Product Grade' : 'Add New Product Grade'}</DialogTitle>
            <DialogDescription>
              {editingData ? 'Update the details of the existing product grade.' : 'Fill in the details to create a new product grade.'}
            </DialogDescription>
          </DialogHeader>
          <ProductGradeForm initialData={editingData} onSave={handleSave} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
