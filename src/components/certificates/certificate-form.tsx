
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";
import { customerData } from "@/lib/placeholder-data";
import { FileDown, Loader2, PlusCircle } from "lucide-react";
import { useTabs } from "../tabs/tab-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const formSchema = z.object({
  docNo: z.string().min(1, "Document number is required"),
  docDate: z.string().min(1, "Date is required"),
  customerId: z.string().min(1, "Customer is required"),
  product: z.string().min(1, "Product is required"),
  grade: z.string().min(1, "Grade is required"),
  dimensions: z.string().min(1, "Dimensions are required"),
  remarks: z.string().optional(),
});

export function CertificateForm() {
  const router = useRouter();
  const pathname = usePathname();
  const { removeTab } = useTabs();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      docNo: "",
      docDate: "",
      customerId: "",
      product: "",
      grade: "",
      dimensions: "",
      remarks: "",
    },
  });

  React.useEffect(() => {
    form.reset({
      docNo: `TC-${new Date().getFullYear()}-`,
      docDate: new Date().toISOString().split("T")[0],
      customerId: "",
      product: "",
      grade: "",
      dimensions: "",
      remarks: "",
    });
  }, [form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    console.log(values);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Certificate Saved",
        description: "The test certificate has been saved successfully.",
      });
      setIsSubmitting(false);
      removeTab(pathname);
      router.push("/certificates");
    }, 1500);
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="document" className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto w-full sm:w-auto">
              <TabsTrigger value="document">Document</TabsTrigger>
              <TabsTrigger value="product">Product</TabsTrigger>
              <TabsTrigger value="heat-test">Heat Test</TabsTrigger>
              <TabsTrigger value="other-test">Other Test</TabsTrigger>
              <TabsTrigger value="remarks">Remarks</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button type="submit" variant="default" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? (
                            <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                            </>
                        ) : (
                            "Save Certificate"
                        )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Save the current certificate details.</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button type="button" variant="outline" className="w-full sm:w-auto">
                            <FileDown className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Export the certificate as a PDF document.</p>
                    </TooltipContent>
                </Tooltip>
            </div>
          </div>
          <div className="mt-6">
            <TabsContent value="document">
                <Card>
                    <CardHeader><CardTitle>Document Details</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="docNo" render={({ field }) => (
                            <FormItem><FormLabel>Certificate No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="docDate" render={({ field }) => (
                            <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="customerId" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Customer</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {customerData.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="product">
                 <Card>
                    <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="product" render={({ field }) => (
                            <FormItem><FormLabel>Product</FormLabel><FormControl><Input {...field} placeholder="e.g., Steel Plate"/></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="grade" render={({ field }) => (
                            <FormItem><FormLabel>Grade</FormLabel><FormControl><Input {...field} placeholder="e.g., SS304"/></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="dimensions" render={({ field }) => (
                            <FormItem className="md:col-span-2"><FormLabel>Dimensions</FormLabel><FormControl><Input {...field} placeholder="e.g., 10mm x 1200mm x 2400mm"/></FormControl><FormMessage /></FormItem>
                        )}/>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="heat-test">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Heat Test Details</CardTitle>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="button" size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Add Test</Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Add a new heat test result.</p>
                            </TooltipContent>
                        </Tooltip>
                    </CardHeader>
                    <CardContent>
                        {/* A simple placeholder table can be used here. For real app, this should be dynamic */}
                        <p className="text-muted-foreground text-sm">Heat test results will be managed and displayed here.</p>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="other-test">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Other Test Details</CardTitle>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="button" size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Add Test</Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Add a new result for other tests.</p>
                            </TooltipContent>
                        </Tooltip>
                    </CardHeader>
                    <CardContent>
                         <p className="text-muted-foreground text-sm">Other test results will be managed and displayed here.</p>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="remarks">
                <Card>
                    <CardHeader><CardTitle>Remarks</CardTitle></CardHeader>
                    <CardContent>
                         <FormField control={form.control} name="remarks" render={({ field }) => (
                            <FormItem><FormLabel>Enter any remarks</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </CardContent>
                </Card>
            </TabsContent>
          </div>
        </Tabs>
      </form>
    </Form>
  );
}
