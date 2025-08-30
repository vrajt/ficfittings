
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
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { GenericMaster } from "@/lib/types";
import axios from "axios";

interface ProductGradeFormProps {
  initialData?: GenericMaster | null;
  onSave?: () => void;
}

const formSchema = z.object({
    name: z.string().min(1, "Grade Name is required"),
});

export function ProductGradeForm({ initialData, onSave }: ProductGradeFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: initialData?.name || "",
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({ name: initialData.name });
    } else {
      form.reset({ name: "" });
    }
  }, [initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const apiData = {
        GradeName: values.name,
    };
    
    try {
        if (isEditMode) {
          await axios.put(`/api/product-grades/${initialData?.id}`, apiData);
            toast({
                title: "Product Grade Updated",
                description: `The record has been updated successfully.`,
            });
        } else {
            await axios.post(`/api/product-grades`, apiData);
            toast({
                title: "Product Grade Saved",
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-1">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Grade Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )}/>
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
