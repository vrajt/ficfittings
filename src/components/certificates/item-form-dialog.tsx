
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { TcItem } from '@/lib/types';
import { Combobox } from '../ui/combobox';
import { Input } from '../ui/input';

interface ItemFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialData: TcItem | null;
  onSave: (item: TcItem) => void;
}

const formSchema = z.object({
  ProductName: z.string().min(1, 'Product name is required'),
  Specification: z.string().optional(),
  HeatNo: z.string().optional(),
  Qty1: z.preprocess((val) => Number(val), z.number().min(0)),
  Qty1Unit: z.string().optional(),
  Po_Inv_PId: z.preprocess((val) => val ? Number(val) : 0, z.number().optional()),
  Id: z.number().optional(),
  PId: z.number().optional(),
  _tempId: z.number().optional(),
});


export function ItemFormDialog({ isOpen, setIsOpen, initialData, onSave }: ItemFormDialogProps) {
  const [uomOptions, setUomOptions] = React.useState<{ label: string; value: string }[]>([]);
  const [lotNoOptions, setLotNoOptions] = React.useState<{ label: string; value: string }[]>([]);
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        ProductName: '',
        Specification: '',
        HeatNo: '',
        Qty1: 0,
        Qty1Unit: '',
        Po_Inv_PId: 0,
    },
  });

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [uomRes, lotRes] = await Promise.all([
          axios.get('/api/unitmaster'),
          axios.get('/api/lot-test-values')
        ]);

        const uomData = uomRes.data.map((item: { UnitName: string }) => ({
          label: item.UnitName,
          value: item.UnitName,
        }));
        setUomOptions(uomData);

        const uniqueLots = [...new Set(lotRes.data.map((item: any) => item.HeatNo))].filter(Boolean);
        const lotData = uniqueLots.map((lot: any) => ({
          label: lot,
          value: lot,
        }));
        setLotNoOptions(lotData);

      } catch (error) {
        toast({ title: "Error", description: "Could not load master data for the form.", variant: "destructive" });
      }
    }
    fetchData();
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset(initialData);
      } else {
        form.reset({
            ProductName: '',
            Specification: '',
            HeatNo: '',
            Qty1: 0,
            Qty1Unit: '',
            Po_Inv_PId: 0,
        });
      }
    }
  }, [isOpen, initialData, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    
    let dataToSave: TcItem;

    if (isEditMode && initialData) {
        dataToSave = {
            ...initialData,
            ...values,
            _tempId: initialData._tempId, // Ensure _tempId is preserved
        };
    } else {
         dataToSave = values as TcItem;
    }

    onSave(dataToSave);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Product Item' : 'Add Product Item'}</DialogTitle>
          <DialogDescription>Fill in the details for the product item.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="ProductName"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                        <FormLabel>Product Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="Size"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Size</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="Po_Inv_PId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>PO Number</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="HeatNo"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Heat No.</FormLabel>
                            <Combobox options={lotNoOptions} value={field.value || ''} onChange={field.onChange} placeholder="Select Heat No..." />
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-2">
                    <FormField
                        control={form.control}
                        name="Qty1"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="Qty1Unit"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>UOM</FormLabel>
                                <Combobox options={uomOptions} value={field.value || ''} onChange={field.onChange} placeholder="Select UOM..." />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit">
                {isEditMode ? 'Update Item' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
