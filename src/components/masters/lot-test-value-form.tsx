
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Save, Trash2 } from 'lucide-react';
import type { LotTestValue } from '@/lib/types';
import { Combobox } from '../ui/combobox';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  HeatNo: z.string(),
  LabName: z.string().min(1, "Laboratory Name is required"),
  Lab_TC_No: z.string().optional(),
  Lab_TC_Date: z.string().optional(),
  ImpactTest: z.array(z.object({
    Id: z.number().optional(),
    Temperature: z.preprocess((val) => val === '' ? null : Number(val), z.number().nullable()),
    Size: z.string().optional(),
    Value1: z.string().optional(),
    Value2: z.string().optional(),
    Value3: z.string().optional(),
    AvgValue: z.string().optional(),
  })),
  ChemicalComp: z.array(z.object({
    Id: z.number().optional(),
    Element: z.string().min(1, 'Element name is required.'),
    Value: z.string().optional().nullable(),
  })),
  PhysicalProp: z.array(z.object({
    Id: z.number().optional(),
    Property: z.string(),
    UOM: z.string().optional(),
    Value: z.string().optional(),
  })),
});


interface LotTestValueFormProps {
  initialData: LotTestValue;
  onSave?: () => void;
  isEditing: boolean;
}

const physicalProperties = ['Y.S', 'U.T.S', 'Elongation %', 'RA %', 'Hardness'];
const standardChemicalElements = ['C%', 'Mn%', 'Si%', 'S%', 'P%', 'Cr%', 'Ni%', 'Mo%', 'Cu%', 'V%', 'CE%'];


export function LotTestValueForm({ initialData, onSave, isEditing }: LotTestValueFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [labOptions, setLabOptions] = React.useState<{label: string, value: string}[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });
  
  const { fields: impactFields, replace: impactReplace, append: appendImpact, remove: removeImpact } = useFieldArray({ control: form.control, name: "ImpactTest" });
  const { fields: chemicalFields, replace: chemicalReplace, append: appendChemical, remove: removeChemical } = useFieldArray({ control: form.control, name: "ChemicalComp" });
  const { fields: physicalFields, replace: physicalReplace } = useFieldArray({ control: form.control, name: "PhysicalProp" });
  
  React.useEffect(() => {
    async function fetchLabs() {
      try {
        const response = await axios.get('/api/laboratories');
        const data = response.data.map((item: any) => ({
          label: item.LabName,
          value: item.LabName,
        }));
        setLabOptions(data);
      } catch (error) {
        console.error("Failed to fetch labs:", error);
      }
    }
    fetchLabs();
  }, []);

  React.useEffect(() => {
    form.setValue("HeatNo", initialData.HeatNo);
    form.setValue("LabName", initialData.LabName);
    form.setValue("Lab_TC_No", initialData.Lab_TC_No);
    form.setValue("Lab_TC_Date", initialData.Lab_TC_Date);

    const physicalData = physicalProperties.map(prop => {
        const found = initialData.PhysicalProp?.find(p => p.Property === prop);
        let uom = found?.UOM || '';
        if ((prop === 'Y.S' || prop === 'U.T.S') && !uom) {
            uom = 'N/mm²';
        }
        return { Id: found?.Id, Property: prop, UOM: uom, Value: found?.Value || '' };
    });
    physicalReplace(physicalData);

    const chemicalDataMap = new Map<string, { Id?: number; Element: string; Value: string | null | number; }>();
     initialData.ChemicalComp?.forEach(item => {
        chemicalDataMap.set(item.Element, item);
    });

    const finalChemicalData = standardChemicalElements.map(elem => {
      return chemicalDataMap.get(elem) || { Element: elem, Value: '' };
    });

    const additionalChemicals = initialData.ChemicalComp?.filter(
      c => !standardChemicalElements.includes(c.Element)
    ) || [];

    chemicalReplace([...finalChemicalData, ...additionalChemicals]);

    const impactTestData = initialData.ImpactTest?.length > 0 
        ? initialData.ImpactTest 
        : [{ Id: undefined, Temperature: null, Size: '', Value1: '', Value2: '', Value3: '', AvgValue: '' }];
    impactReplace(impactTestData);

}, [initialData, form, chemicalReplace, physicalReplace, impactReplace]);

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    const values = form.getValues();
    
    const flatData: any[] = [];
    
    const impactTestData = values.ImpactTest.length > 0 ? values.ImpactTest[0] : {
        Temperature: null,
        Size: '',
        Value1: '',
        Value2: '',
        Value3: '',
        AvgValue: '',
    };

    const commonData = {
        HeatNo: values.HeatNo,
        Lab_Name: values.LabName,
        Lab_TC_No: values.Lab_TC_No,
        Lab_TC_Date: values.Lab_TC_Date,
        ITJ_Temp: impactTestData.Temperature,
        ITJ_Size: impactTestData.Size,
        ITJ_Value_1: impactTestData.Value1,
        ITJ_Value_2: impactTestData.Value2,
        ITJ_Value_3: impactTestData.Value3,
        ITJ_Value_Avg: impactTestData.AvgValue,
    };

    values.ChemicalComp.forEach(item => {
        if(item.Value) {
            flatData.push({
                ...commonData,
                Parm_Type: 'CC',
                Parm_Name: item.Element,
                Test_ValueC: item.Value || '',
                Test_ValueN: 0,
            });
        }
    });

    values.PhysicalProp.forEach(item => {
         if(item.Value) {
            flatData.push({
                ...commonData,
                Parm_Type: 'PP',
                Parm_Name: item.Property,
                Parm_UOM: item.UOM || '',
                Test_ValueC: item.Value || '',
            });
         }
    });

    values.ImpactTest.forEach(item => {
        if (item.Temperature !== null || item.Size || item.Value1 || item.Value2 || item.Value3 || item.AvgValue) {
             flatData.push({
                HeatNo: values.HeatNo,
                Lab_Name: values.LabName,
                Lab_TC_No: values.Lab_TC_No,
                Lab_TC_Date: values.Lab_TC_Date,
                Parm_Type: 'IT',
                ITJ_Temp: item.Temperature,
                ITJ_Size: item.Size,
                ITJ_Value_1: item.Value1,
                ITJ_Value_2: item.Value2,
                ITJ_Value_3: item.Value3,
                ITJ_Value_Avg: item.AvgValue,
             });
        }
    });

    try {
        const existingRecordsResponse = await axios.get('/api/lot-test-values');
        const existingRecordIds = existingRecordsResponse.data
            .filter((rec: any) => rec.HeatNo === values.HeatNo)
            .map((rec: any) => rec.Id);
        
        if (existingRecordIds.length > 0) {
          await Promise.all(existingRecordIds.map((id: number) => axios.delete(`/api/lot-test-values/${id}`)));
        }

        if (flatData.length > 0) {
          await Promise.all(flatData.map(record => axios.post('/api/lot-test-values', record)));
        }

        toast({
            title: "Data Saved",
            description: `Test values for lot ${values.HeatNo} have been saved.`,
        });
        if (onSave) {
          onSave();
        }
    } catch (error) {
        console.error("Failed to save lot test values:", error);
        toast({
            title: "Save Failed",
            description: "An error occurred while saving the data.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
        setIsConfirmOpen(false);
    }
  }

  const onFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  }

  return (
    <Form {...form}>
      <form onSubmit={onFinalSubmit}>
       <fieldset disabled={!isEditing} className="space-y-4">
        <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-4 p-1">
            <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-2">
                <h2 className="text-xl font-semibold">Heat / Lot No: {initialData.HeatNo}</h2>
                <Button type="submit" disabled={isSubmitting || !isEditing}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save</>}
                </Button>
            </div>
            
            <Card>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="LabName"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Laboratory Name</FormLabel>
                            <Combobox options={labOptions} {...field} placeholder="Select Lab..." />
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField control={form.control} name="Lab_TC_No" render={({ field }) => (
                        <FormItem><FormLabel>Laboratory TC No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField
                        control={form.control}
                        name="Lab_TC_Date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>TC Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(new Date(field.value), "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card>
            <CardHeader>
                <CardTitle>Impact Test (Joules) Details</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Value 1</TableHead>
                    <TableHead>Value 2</TableHead>
                    <TableHead>Value 3</TableHead>
                    <TableHead>Average</TableHead>
                    <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {impactFields.map((field, index) => (
                    <TableRow key={field.id}>
                        <TableCell><Input {...form.register(`ImpactTest.${index}.Temperature`)} type="number" /></TableCell>
                        <TableCell><Input {...form.register(`ImpactTest.${index}.Size`)} /></TableCell>
                        <TableCell><Input {...form.register(`ImpactTest.${index}.Value1`)} /></TableCell>
                        <TableCell><Input {...form.register(`ImpactTest.${index}.Value2`)} /></TableCell>
                        <TableCell><Input {...form.register(`ImpactTest.${index}.Value3`)} /></TableCell>
                        <TableCell><Input {...form.register(`ImpactTest.${index}.AvgValue`)} /></TableCell>
                        <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeImpact(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
                <Button type="button" variant="outline" size="sm" onClick={() => appendImpact({ Id: undefined, Temperature: null, Size: '', Value1: '', Value2: '', Value3: '', AvgValue: '' })} className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Row
                </Button>
            </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Chemical Composition (%)</CardTitle>
                        <Button type="button" size="sm" variant="outline" onClick={() => appendChemical({ Id: undefined, Element: '', Value: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Element
                        </Button>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Element</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {chemicalFields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell>
                                    <Input {...form.register(`ChemicalComp.${index}.Element`)} placeholder="e.g. Fe %" />
                                </TableCell>
                                <TableCell><Input type="text" {...form.register(`ChemicalComp.${index}.Value`)} /></TableCell>
                                <TableCell>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeChemical(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Physical Properties</CardTitle></CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>UOM</TableHead>
                                <TableHead>Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {physicalFields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell><FormLabel>{field.Property}</FormLabel></TableCell>
                                <TableCell><Input {...form.register(`PhysicalProp.${index}.UOM`)} /></TableCell>
                                <TableCell><Input {...form.register(`PhysicalProp.${index}.Value`)} /></TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
      </ScrollArea>
      </fieldset>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to save?</AlertDialogTitle>
            <AlertDialogDescription>
            This will overwrite the existing test values for this lot. This action cannot be undone.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>Continue</AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </form>
    </Form>
  );
}
