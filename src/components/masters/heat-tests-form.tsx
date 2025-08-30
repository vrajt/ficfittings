
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { GenericMaster } from "@/lib/types";
import axios from "axios";

interface HeatTestFormProps {
  initialData?: GenericMaster | null;
  onSave?: () => void;
}

const formSchema = z.object({
  Heat_Code: z.string().min(1, "Heat Code is required"),
  Heat_Desc: z.string().optional(),
  IsBlocked: z.boolean().default(false),
});

export function HeatTestForm({ initialData, onSave }: HeatTestFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const masterType = 'heattestmaster';
  
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Heat_Code: "",
      Heat_Desc: "",
      IsBlocked: false,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        Heat_Code: initialData.code,
        Heat_Desc: initialData.name,
        IsBlocked: initialData.isBlocked,
      });
    } else {
      form.reset({
        Heat_Code: "",
        Heat_Desc: "",
        IsBlocked: false,
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const apiData = {
        Heat_Code: values.Heat_Code,
        Heat_Desc: values.Heat_Desc,
        IsBlocked: values.IsBlocked,
    };
    
    try {
      if (isEditMode) {
        await axios.put(`/api/${masterType}/${initialData?.id}`, apiData);
        toast({
          title: "Heat Test Updated",
          description: `The record has been updated successfully.`,
        });
      } else {
        await axios.post(`/api/${masterType}`, apiData);
        toast({
          title: "Heat Test Saved",
          description: `The new record has been saved successfully.`,
        });
      }
      onSave?.();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "An error occurred while saving the heat test record.",
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
        <div className="grid grid-cols-1 gap-4 p-1">
          <FormField
            control={form.control}
            name="Heat_Code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heat Code</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="Heat_Desc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heat Description</FormLabel>
                <FormControl><Textarea {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="IsBlocked"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                <div className="space-y-0.5">
                  <FormLabel>Block Heat Test</FormLabel>
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
