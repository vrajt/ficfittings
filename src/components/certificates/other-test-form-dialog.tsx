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
import type { TcOtherTest } from '@/lib/types';
import { Combobox } from '../ui/combobox';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';

interface OtherTestFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialData: TcOtherTest | null;
  onSave: (item: Omit<TcOtherTest, 'ApsFullDoc' | 'Id'>) => void;
}

const formSchema = z.object({
  Test_Code: z.string().min(1, 'Test code is required'),
  Test_Desc: z.string().min(1, 'Test description is required'),
  Test_Result: z.string().min(1, 'Test result is required'),
  PId: z.number().optional(),
  Id: z.number().optional(),
});

type OtherTestMasterRecord = {
    Id: number;
    Test_Code: string;
    Test_Desc: string;
};

export function OtherTestFormDialog({ isOpen, setIsOpen, initialData, onSave }: OtherTestFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [otherTestMasterData, setOtherTestMasterData] = React.useState<OtherTestMasterRecord[]>([]);
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { Test_Code: '', Test_Desc: '', Test_Result: 'Done Found Satisfactory' },
  });

  const otherTestOptions = otherTestMasterData.map(item => ({ label: item.Test_Code, value: item.Test_Code }));
  const selectedTestCode = form.watch("Test_Code");
  
  React.useEffect(() => {
    async function fetchOtherTests() {
      try {
        const response = await axios.get('/api/othertests');
        const formattedData = response.data.map((item: any) => ({
            Id: item.Id,
            Test_Code: item.Test_Code,
            Test_Desc: item.Test_Desc
        }));
        setOtherTestMasterData(formattedData);
      } catch (error) {
        toast({ title: "Error", description: "Could not load other tests master data.", variant: "destructive" });
      }
    }
    fetchOtherTests();
  }, []);
  
  React.useEffect(() => {
      if(selectedTestCode) {
          const selectedTest = otherTestMasterData.find(test => test.Test_Code === selectedTestCode);
          if(selectedTest) {
              form.setValue("Test_Desc", selectedTest.Test_Desc);
          }
      }
  }, [selectedTestCode, otherTestMasterData, form]);

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset(initialData);
      } else {
        form.reset({ Test_Code: '', Test_Desc: '', Test_Result: 'Done Found Satisfactory' });
      }
    }
  }, [isOpen, initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const dataToSave: Partial<TcOtherTest> = { ...values };

    if (isEditMode && initialData) {
        // Keep the PId for updates
        dataToSave.PId = initialData.PId;
    } else {
        // This is a new record. The backend expects NO PId.
        // A temporary PId will be assigned in the parent component for the key.
        delete dataToSave.PId;
        delete (dataToSave as any).Id;
    }
    
    onSave(dataToSave as TcOtherTest);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Other Test' : 'Add Other Test'}</DialogTitle>
          <DialogDescription>Select a test and enter the result.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="Test_Code"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Test Code</FormLabel>
                  <Combobox
                    options={otherTestOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select a test code..."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="Test_Desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Description</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="Test_Result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Result</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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