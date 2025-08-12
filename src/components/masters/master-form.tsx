
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTabs } from "../tabs/tab-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { masterDataConfig } from "@/lib/master-data-config";


interface MasterFormProps {
    masterType: string;
}

const createFormSchema = (formFields: {key: string, type: string}[]) => {
    let schema = z.object({
        name: z.string().min(1, "Name is required"),
        status: z.enum(["Active", "Inactive"]),
    });

    const fieldToSchema = {
      code: z.string().min(1, "Code is required"),
      description: z.string().optional(),
      address: z.string().min(1, "Address is required"),
      contactPerson: z.string().min(1, "Contact person is required"),
    }

    formFields.forEach(field => {
        if (field.key === 'name' || field.key === 'status') return;

        if (fieldToSchema.hasOwnProperty(field.key)) {
            schema = schema.extend({ [field.key]: fieldToSchema[field.key as keyof typeof fieldToSchema] });
        }
    });

    return schema;
}

const getFormFields = (masterType: string) => {
    if (masterDataConfig[masterType as keyof typeof masterDataConfig]) {
      return masterDataConfig[masterType as keyof typeof masterDataConfig].columns.map(c => ({ key: c.accessorKey, header: c.header }) as {key: string, header: string});
    }
    // A fallback for the refactored pages that might still use the component
     switch (masterType) {
        case 'customers':
            return [
                { key: 'name', header: 'Name' },
                { key: 'address', header: 'Address' },
                { key: 'contactPerson', header: 'Contact Person' },
            ];
        case 'units':
        case 'grades':
        case 'product-grades':
        case 'dimension-standards':
        case 'start-materials':
        case 'laboratories':
        case 'heat-tests':
        case 'other-tests':
        case 'generic':
             return [
                { key: 'code', header: 'Code' },
                { key: 'name', header: 'Name' },
                { key: 'description', header: 'Description' },
            ];
        case 'tc-remarks':
             return [
                { key: 'name', header: 'Remark' },
                { key: 'description', header: 'Details' },
            ];
        default:
            return [{key: 'name', header: 'Name'}];
    }
}


export function MasterForm({ masterType }: MasterFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { removeTab } = useTabs();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const formFields = getFormFields(masterType);
  const formSchema = createFormSchema(formFields.map(f => ({key: f.key, type: 'string'})));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
        status: "Active",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    console.log(values);

    // Simulate API call
    setTimeout(() => {
        toast({
            title: "Master Saved",
            description: `The new record has been saved successfully.`,
        });
        setIsSubmitting(false);
        removeTab(pathname);
        router.push(`/masters/${masterType}`);
    }, 1500); // 1.5 second delay
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
            <CardHeader>
                <CardTitle>Master Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {formFields.map(field => {
                    const key = field.key;
                    if (key === 'id' || key === 'status' || key === 'date' || key.toLowerCase().includes('at') || key.toLowerCase().includes('by')) return null;

                    if (key === 'description' || key === 'address') {
                        return (
                             <FormField key={key} control={form.control} name={key} render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>{field.header}</FormLabel>
                                    <FormControl><Textarea {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        )
                    }

                    return (
                        <FormField key={key} control={form.control} name={key} render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>{field.header}</FormLabel>
                                <FormControl><Input {...formField} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    )
                 })}
                 <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>
            </CardContent>
            <CardFooter className="justify-end">
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
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
