
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
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import type { GenericMaster } from "@/lib/types";
import axios from "axios";
import { Combobox } from "../ui/combobox";

interface MasterFormProps {
  masterType: string;
  initialData?: GenericMaster | null;
  onSave?: () => void;
}

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    uDecimal: z.preprocess((val) => Number(val), z.number().min(0, "Must be a positive number")),
    gstUom: z.string().min(1, "GST UOM is required"),
    uomType: z.string().min(1, "UOM Type is required"),
});


export function MasterForm({ masterType, initialData, onSave }: MasterFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uomOptions, setUomOptions] = React.useState<{ label: string; value: string }[]>([]);
  
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
        description: "",
        uDecimal: 0,
        gstUom: "",
        uomType: "",
        ...initialData,
    },
  });

  React.useEffect(() => {
    async function fetchUoms() {
      try {
        const response = await axios.get('/api/uom/getAllGsstUom');
        const data = response.data.map((item: { UOM: string }) => ({
          label: item.UOM,
          value: item.UOM,
        }));
        setUomOptions(data);
      } catch (error) {
        console.error("Failed to fetch UOMs:", error);
        toast({
          title: "Error",
          description: "Could not load UOM list.",
          variant: "destructive",
        });
      }
    }
    fetchUoms();
  }, []);

  React.useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        name: "",
        description: "",
        uDecimal: 0,
        gstUom: "",
        uomType: ""
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const apiData = {
        UnitName: values.name,
        UDecimal: values.uDecimal,
        GSTUOM: values.gstUom,
        UOM_Type: values.uomType,
        Description: values.description,
    };
    
    try {
        if (isEditMode) {
          await axios.put(`/api/unitmaster/${initialData?.id}`, apiData);
            toast({
                title: "Master Updated",
                description: `The record has been updated successfully.`,
            });
        } else {
            await axios.post(`/api/unitmaster`, apiData);
            toast({
                title: "Master Saved",
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Unit Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="uDecimal" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Decimal Places</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )}/>
               <FormField
                control={form.control}
                name="gstUom"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>GST UOM</FormLabel>
                     <Combobox
                      options={uomOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select or type a UOM..."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="uomType" render={({ field }) => (
                  <FormItem>
                      <FormLabel>UOM Type</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea {...field} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )}/>
          </div>
          <div className="flex justify-end pt-4">
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                              <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                              </>
                          ) : (
                              "Save"
                          )}
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Save this master record.</p>
                  </TooltipContent>
              </Tooltip>
          </div>
      </form>
    </Form>
  );
}
