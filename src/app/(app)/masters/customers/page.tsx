
'use client';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import type { Customer } from '@/lib/types';
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
import { CustomerForm } from '@/components/masters/customer-form';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const masterType = 'customers';
  const [data, setData] = React.useState<Customer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'address', header: 'Address' },
    { accessorKey: 'teleOff', header: 'Office Phone' },
    { accessorKey: 'mobile', header: 'Mobile' },
    { accessorKey: 'email1', header: 'Email' },
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
        }
    },
    { 
      accessorKey: 'date', 
      header: 'Created At',
      cell: ({ row }) => row.original.date ? format(new Date(row.original.date), 'dd-MM-yyyy') : '-',
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
            name: source.CName,
            address: source.CAddress,
            teleOff: source.Tele_Off,
            mobile: source.Mobile,
            email1: source.EMail_1,
            isBlocked: source.IsBlocked,
            date: source.CreatedDate,
            updatedAt: source.UpdateDate,
            createdBy: source.CreatedBy,
            updatedBy: source.UpdatedBy,
        };
      });
      
      setData(formattedData);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleAddNew = () => {
    setEditingCustomer(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };
  
  const handleSave = () => {
    setIsDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (customer: Customer) => {
    try {
      await axios.delete(`/api/${masterType}/${customer.id}`);
      toast({
        title: "Customer Deleted",
        description: `The customer record has been deleted successfully.`,
      });
      fetchData();
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast({
        title: "Deletion Failed",
        description: "Could not delete the customer. Please try again.",
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Customer Master"
        description="Manage customer information."
        actionButtonText="Add New Customer"
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Update the details of the existing customer.' : 'Fill in the details to create a new customer.'}
            </DialogDescription>
          </DialogHeader>
          <CustomerForm initialData={editingCustomer} onSave={handleSave} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
