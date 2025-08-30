
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
import { Textarea } from "../ui/textarea";

interface OtherTestFormProps {
  initialData?: GenericMaster | null;
  onSave?: () => void;
}

const formSchema = z.object({
  Test_Code: z.string().min(1, "Test Code is required"),
  Test_Desc: z.string().optional(),
  IsBlocked: z.boolean().default(false),
});

export function OtherTestForm({ initialData, onSave }: OtherTestFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      Test_Code: "",
      Test_Desc: "",
      IsBlocked: false,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        Test_Code: initialData.code,
        Test_Desc: initialData.name,
        IsBlocked: initialData.isBlocked,
      });
    } else {
      form.reset({
        Test_Code: "",
        Test_Desc: "",
        IsBlocked: false,
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const apiData = {
        Test_Code: values.Test_Code,
        Test_Desc: values.Test_Desc,
        IsBlocked: values.IsBlocked,
    };
    
    try {
      if (isEditMode) {
        await axios.put(`/api/othertests/${initialData?.id}`, apiData);
        toast({
          title: "Other Test Updated",
          description: `The record has been updated successfully.`,
        });
      } else {
        await axios.post(`/api/othertests`, apiData);
        toast({
          title: "Other Test Saved",
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
            name="Test_Code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Test Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="IsBlocked"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Block Test</FormLabel>
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
