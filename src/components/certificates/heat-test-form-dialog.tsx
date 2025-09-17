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
import type { TcHeatTest } from '@/lib/types';
import { Combobox } from '../ui/combobox';
import { Input } from '../ui/input';

interface HeatTestFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialData: TcHeatTest | null;
  onSave: (item: Omit<TcHeatTest, 'ApsFullDoc' | 'Id'>) => void;
}

const formSchema = z.object({
  Heat_Code: z.string().min(1, 'Heat Code is required'),
  Heat_Desc: z.string().min(1, 'Heat Test description is required'),
  PId: z.number().optional(),
  Id: z.number().optional(),
  _tempId: z.number().optional(),
});

type HeatTestMasterRecord = {
  Id: number;
  Heat_Code: string;
  Heat_Desc: string;
}

export function HeatTestFormDialog({ isOpen, setIsOpen, initialData, onSave }: HeatTestFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [heatTestMasterData, setHeatTestMasterData] = React.useState<HeatTestMasterRecord[]>([]);
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { Heat_Code: '', Heat_Desc: '' },
  });

  const heatTestOptions = heatTestMasterData.map(item => ({ label: item.Heat_Code, value: item.Heat_Code }));
  
  const selectedHeatCode = form.watch("Heat_Code");

  React.useEffect(() => {
    async function fetchHeatTests() {
      try {
        const response = await axios.get('/api/heattestmaster');
        const formattedData = response.data.map((item: any) => ({
            Id: item.Id,
            Heat_Code: item.Heat_Code,
            Heat_Desc: item.Heat_Desc
        }));
        setHeatTestMasterData(formattedData);
      } catch (error) {
        toast({ title: "Error", description: "Could not load heat tests master data.", variant: "destructive" });
      }
    }
    fetchHeatTests();
  }, []);
  
  React.useEffect(() => {
      if(selectedHeatCode) {
          const selectedTest = heatTestMasterData.find(test => test.Heat_Code === selectedHeatCode);
          if(selectedTest) {
              form.setValue("Heat_Desc", selectedTest.Heat_Desc);
          }
      }
  }, [selectedHeatCode, heatTestMasterData, form]);

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset(initialData);
      } else {
        form.reset({ Heat_Code: '', Heat_Desc: '' });
      }
    }
  }, [isOpen, initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const dataToSave: Partial<TcHeatTest> & { _tempId?: number } = { ...values };

    if (isEditMode && initialData) {
      dataToSave._tempId = (initialData as any)._tempId;
      dataToSave.PId = initialData.PId;
    } else {
      delete dataToSave.PId;
      delete (dataToSave as any).Id;
    }
    
    onSave(dataToSave as TcHeatTest);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Heat Test' : 'Add Heat Test'}</DialogTitle>
          <DialogDescription>Select a heat test to add to the certificate.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="Heat_Code"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Heat Test Code</FormLabel>
                  <Combobox
                    options={heatTestOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select Heat Code..."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="Heat_Desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heat Test Description</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
