
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
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { TcItem, TcMain } from '@/lib/types';
import { Combobox } from '../ui/combobox';

interface ItemFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialData: TcItem | null;
  tcMainData: TcMain | null;
  onSave: (item: TcItem) => void;
}

const formSchema = z.object({
  ProductName: z.string().min(1, 'Product name is required'),
  Specification: z.string().optional(),
  HeatNo: z.string().optional(),
  Qty1: z.preprocess((val) => Number(val), z.number().min(0)),
  Qty1Unit: z.string().optional(),
  GradeName: z.string().optional(),
  //PId: z.number().optional(),
});

export function ItemFormDialog({ isOpen, setIsOpen, initialData, tcMainData, onSave }: ItemFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uomOptions, setUomOptions] = React.useState<{ label: string; value: string }[]>([]);
  const [lotNoOptions, setLotNoOptions] = React.useState<{ label: string; value: string }[]>([]);
  const isEditModeItem = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ProductName: '',
      Specification: '',
      HeatNo: '',
      Qty1: 0,
      Qty1Unit: '',
      GradeName: '',
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
          GradeName: tcMainData?.GradeName || '',
        });
      }
    }
  }, [isOpen, initialData, form, tcMainData]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const dataToSave: TcItem = {
      ...initialData,
      ...values,
     // PId: initialData?.PId || Date.now(), // Use existing or generate temporary new one
      Id: tcMainData?.Id || 0,
      ApsFullDoc: tcMainData?.ApsFullDoc || '',
      CreatedDate: new Date().toISOString(),
      UpdateDate: new Date().toISOString(),
    };
    onSave(dataToSave);
    setIsSubmitting(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditModeItem ? 'Edit Product Item' : 'Add New Product Item'}</DialogTitle>
          <DialogDescription>
            Fill in the details for this product item.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ProductName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Specification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specification</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="GradeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                     <Combobox
                        options={lotNoOptions}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Select Heat No..."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <Combobox
                        options={uomOptions}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Select UOM..."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : isEditModeItem ? 'Update Item' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
