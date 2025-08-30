
'use client';

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { GenericMaster } from "@/lib/types";
import axios from "axios";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";

interface TcRemarkFormProps {
  initialData?: GenericMaster | null;
  onSave?: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Remark text is required"),
  tcChoice: z.boolean().default(false),
});

export function TcRemarkForm({ initialData, onSave }: TcRemarkFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      tcChoice: false,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        tcChoice: !!initialData.tcChoice,
      });
    } else {
      form.reset({
        name: "",
        tcChoice: false,
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const apiData = {
      TcTerms: values.name,
      TcChoice: values.tcChoice,
    };
    
    try {
      if (isEditMode) {
        await axios.put(`/api/tcremarksfix/${initialData?.id}`, apiData);
        toast({
          title: "Remark Updated",
          description: `The record has been updated successfully.`,
        });
      } else {
        await axios.post(`/api/tcremarksfix`, apiData);
        toast({
          title: "Remark Saved",
          description: `The new record has been saved successfully.`,
        });
      }
      onSave?.();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "An error occurred while saving the record.",
        variant: 'destructive',
      });
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4 p-1">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remark Text</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={5} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tcChoice"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Enable TC Choice</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
