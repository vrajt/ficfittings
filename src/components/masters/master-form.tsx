
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
import { masterDataConfig } from "@/lib/master-data-config";
import { Loader2 } from "lucide-react";
import { useTabs } from "../tabs/tab-provider";

interface MasterFormProps {
    masterType: string;
}

const createFormSchema = (masterType: string) => {
    const config = masterDataConfig[masterType as keyof typeof masterDataConfig];
    let schema = z.object({
        name: z.string().min(1, "Name is required"),
        status: z.enum(["Active", "Inactive"]),
    });

    if (config.columns.some(c => c.accessorKey === 'code')) {
        schema = schema.extend({ code: z.string().min(1, "Code is required") });
    }
    if (config.columns.some(c => c.accessorKey === 'description')) {
        schema = schema.extend({ description: z.string().optional() });
    }
    if (config.columns.some(c => c.accessorKey === 'address')) {
        schema = schema.extend({ address: z.string().min(1, "Address is required") });
    }
    if (config.columns.some(c => c.accessorKey === 'contactPerson')) {
        schema = schema.extend({ contactPerson: z.string().min(1, "Contact person is required") });
    }

    return schema;
}


export function MasterForm({ masterType }: MasterFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { removeTab } = useTabs();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const config = masterDataConfig[masterType as keyof typeof masterDataConfig];
  
  const formSchema = createFormSchema(masterType);

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
            description: `The new ${config.title.replace(' Master', '').toLowerCase()} has been saved successfully.`,
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
            <CardContent className="grid md:grid-cols-2 gap-6">
                 {config.columns.map(col => {
                    const key = col.accessorKey as string;
                    if (key === 'id' || key === 'status') return null;

                    if (key === 'description' || key === 'address') {
                        return (
                             <FormField key={key} control={form.control} name={key} render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>{col.header}</FormLabel>
                                    <FormControl><Textarea {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        )
                    }

                    return (
                        <FormField key={key} control={form.control} name={key} render={({ field }) => (
                            <FormItem>
                                <FormLabel>{col.header}</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
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
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
