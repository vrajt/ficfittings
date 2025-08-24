
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
import type { Customer } from "@/lib/types";
import axios from "axios";

interface CustomerFormProps {
  initialData?: Customer | null;
  onSave?: () => void;
}

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    address: z.string().optional(),
    teleOff: z.string().optional(),
    mobile: z.string().optional(),
    email1: z.string().email("Invalid email address").optional().or(z.literal('')),
    isBlocked: z.boolean().default(false),
});


export function CustomerForm({ initialData, onSave }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const masterType = 'customers';
  
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
        address: "",
        teleOff: "",
        mobile: "",
        email1: "",
        isBlocked: false,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        name: "",
        address: "",
        teleOff: "",
        mobile: "",
        email1: "",
        isBlocked: false,
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const apiData = {
        CName: values.name,
        CAddress: values.address,
        Tele_Off: values.teleOff,
        Mobile: values.mobile,
        EMail_1: values.email1,
        IsBlocked: values.isBlocked,
        CId: initialData?.id ? initialData.id : `CUST-${Date.now()}`
    };
    
    try {
        if (isEditMode) {
          await axios.put(`/api/${masterType}/${initialData?.id}`, apiData);
            toast({
                title: "Customer Updated",
                description: `The customer record has been updated successfully.`,
            });
        } else {
            await axios.post(`/api/${masterType}`, apiData);
            toast({
                title: "Customer Saved",
                description: `The new customer record has been saved successfully.`,
            });
        }
        onSave?.();

    } catch (error) {
        toast({
            title: "Submission Failed",
            description: "An error occurred while saving the customer record.",
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )}/>
               <FormField control={form.control} name="email1" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl><Textarea {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="teleOff" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Office Phone</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="mobile" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Mobile No.</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )}/>
               <FormField control={form.control} name="isBlocked" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm md:col-span-2 mt-4">
                      <div className="space-y-0.5">
                          <FormLabel>Block Customer</FormLabel>
                          <FormMessage />
                      </div>
                      <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                      </FormControl>
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
