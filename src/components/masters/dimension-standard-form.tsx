
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { GenericMaster } from "@/lib/types";
import axios from "axios";

interface DimensionStandardFormProps {
  initialData?: GenericMaster | null;
  onSave?: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Standard Type is required"),
  isBlocked: z.boolean().default(false),
});

export function DimensionStandardForm({ initialData, onSave }: DimensionStandardFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      isBlocked: false,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        isBlocked: initialData.isBlocked,
      });
    } else {
      form.reset({
        name: "",
        isBlocked: false,
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const apiData = {
      DStd_Type: values.name,
      IsBlocked: values.isBlocked,
      // DStd_Id is not in the form, you might need to generate it
      // on the backend or pass it if necessary.
    //  DStd_Id: initialData?.id ? `DSTD-${initialData.id}` : `DSTD-${Date.now()}`
    };
    
    try {
      if (isEditMode) {
        await axios.put(`/api/dimension-standards/${initialData?.id}`, apiData);
        toast({
          title: "Dimension Standard Updated",
          description: `The record has been updated successfully.`,
        });
      } else {
        await axios.post(`/api/dimension-standards`, apiData);
        toast({
          title: "Dimension Standard Saved",
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
                <FormLabel>Standard Type</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isBlocked"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Block Standard</FormLabel>
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
