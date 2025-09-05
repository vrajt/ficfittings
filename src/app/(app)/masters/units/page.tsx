
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
} from "@/components/ui/dialog";
import { MasterForm } from '@/components/masters/master-form';
import { toast } from '@/hooks/use-toast';


export default function UnitsPage() {
  const masterType = 'units';
  const [data, setData] = React.useState<GenericMaster[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingUnit, setEditingUnit] = React.useState<GenericMaster | null>(null);

  const columns: ColumnDef<GenericMaster>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Unit Name' },
    { accessorKey: 'description', header: 'Description' },
    { 
      accessorKey: 'date', 
      header: 'Created At',
      cell: ({ row }) => format(new Date(row.original.date), 'dd-MM-yyyy'),
    },
    { accessorKey: 'createdBy', header: 'Created By' },
    { accessorKey: 'updatedBy', header: 'Updated By' },
    { 
      accessorKey: 'updatedAt', 
      header: 'Updated At',
      cell: ({ row }) => row.original.updatedAt ? format(new Date(row.original.updatedAt), 'dd-MM-yyyy') : '-',
    },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/unitmaster');
      
      const formattedData = response.data.map((item: any) => {
        // Handle both nested dataValues and flat structures
        const source = item.dataValues || item;

        if (!source.Id) {
            console.error("Skipping an item with missing Id:", item);
            return null;
        }
        
        return {
            id: source.Id,
            name: source.UnitName,
            description: source.Description,
            uDecimal: source.UDecimal,
            gstUom: source.GSTUOM,
            uomType: source.UOM_Type,
            status: 'Active',
            createdBy: source.CreatedBy,
            date: source.CreatedDate,
            updatedBy: source.UpdatedBy,
            updatedAt: source.UpdateDate,
        };
      }).filter(Boolean); // Filter out any null items
      
      setData(formattedData);
    } catch (error) {
      console.error("Failed to fetch units:", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleAddNew = () => {
    setEditingUnit(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (unit: GenericMaster) => {
    setEditingUnit(unit);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    fetchData();
    setIsDialogOpen(false);
  };

  const handleDelete = async (record: GenericMaster) => {
    const id = record.id;
    try {
      await axios.delete(`/api/unitmaster/${id}`);
      toast({
        title: "Record Deleted",
        description: `The unit with ID ${id} has been deleted.`,
      });
      fetchData();
    } catch (error) {
      console.error(`Failed to delete unit ${id}:`, error);
      toast({
        title: "Deletion Failed",
        description: "Could not delete the unit. Please try again.",
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Unit Master"
        description="Manage measurement units used in certificates."
        actionButtonText="Add New Unit"
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
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Edit Unit' : 'Create Unit'}</DialogTitle>
            <DialogDescription>
              {editingUnit ? 'Update the details of the existing unit.' : 'Fill in the details to create a new unit.'}
            </DialogDescription>
          </DialogHeader>
          <MasterForm 
            masterType="units"
            initialData={editingUnit}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
