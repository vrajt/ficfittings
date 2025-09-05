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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";
import { FileDown, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useTabs } from "../tabs/tab-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import type { TcMain, Customer, GenericMaster, TcItem, LotTestValue, TcHeatTest, TcOtherTest, TcRemark } from "@/lib/types";
import axios from "axios";
import { generateCertificatePDF } from "@/lib/pdf-generator";
import { DataTable } from "../data-table";
import { ItemFormDialog } from "./item-form-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { HeatTestFormDialog } from "./heat-test-form-dialog";
import { OtherTestFormDialog } from "./other-test-form-dialog";

const formSchema = z.object({
  DocDate: z.string().min(1, "Date is required"),
  AccName: z.string().min(1, "Customer is required"),
  AccCode: z.string().optional(),
  PoNo: z.string().optional(),
  PoDate: z.string().optional(),
  InvNo: z.string().optional(),
  InvDate: z.string().optional(),
  Address1: z.string().optional(),
  SM_Id: z.string().optional(),
  SM_RM_Name: z.string().optional(), // Start material
  BranchId: z.preprocess((val) => Number(val), z.number().default(1)),
  ApsFullDoc: z.string().optional(),
  GradeId: z.string().optional(),
  GradeName: z.string().optional(),
  DStd_Id: z.string().optional(),
  DStd_Type: z.string().optional(),
  Std_Id: z.string().optional(),
  StandardName: z.string().optional(),
  TCode: z.string().default("TC"),
  STCode: z.string().optional(),
});

interface CertificateFormProps {
    initialData?: TcMain | null;
    onSave?: () => void;
}

type StructuredLotData = Omit<LotTestValue, 'Id' | 'HeatNo' | 'Lab_TC_Date'>;

// A simple counter to generate unique IDs for new items.
let pidCounter = Date.now();

const structureLotData = (records: any[]): StructuredLotData => {
  const baseRecord = records[0] || {};
  
  const structuredData: StructuredLotData = {
    LabName: baseRecord.Lab_Name || '',
    Lab_TC_No: baseRecord.Lab_TC_No || '',
    ImpactTest: [],
    ChemicalComp: [],
    PhysicalProp: [],
  };

  const impactTests = new Map<string, any>();
  records.forEach(rec => {
    switch (rec.Parm_Type) {
      case 'CC':
        structuredData.ChemicalComp.push({ Element: rec.Parm_Name, Value: rec.Test_ValueC });
        break;
      case 'PP':
        structuredData.PhysicalProp.push({ Property: rec.Parm_Name, Value: rec.Test_ValueC });
        break;
      case 'IT':
        const key = `\${rec.ITJ_Temp || 'N/A'}-\${rec.ITJ_Size || 'N/A'}`;
        if (!impactTests.has(key)) {
            impactTests.set(key, {
                Temperature: rec.ITJ_Temp,
                Size: rec.ITJ_Size,
                Value1: rec.ITJ_Value_1,
                Value2: rec.ITJ_Value_2,
                Value3: rec.ITJ_Value_3,
                AvgValue: rec.ITJ_Value_Avg,
            });
        }
        break;
    }
  });

  structuredData.ImpactTest = Array.from(impactTests.values());
  return structuredData;
};


export function CertificateForm({ initialData, onSave }: CertificateFormProps) {
  const router = useRouter();
  const { addTab, removeTab, setActiveTab } = useTabs();
  const currentPath = usePathname();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDropdownDataLoading, setIsDropdownDataLoading] = React.useState(true);

  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [startMaterials, setStartMaterials] = React.useState<GenericMaster[]>([]);
  const [grades, setGrades] = React.useState<GenericMaster[]>([]);
  const [dimensionStandards, setDimensionStandards] = React.useState<GenericMaster[]>([]);
  const [mtcStandards, setMtcStandards] = React.useState<{Std_Id: string, Std_Type: string}[]>([]);
  
  const [items, setItems] = React.useState<TcItem[]>([]);
  const [heatTests, setHeatTests] = React.useState<TcHeatTest[]>([]);
  const [otherTests, setOtherTests] = React.useState<TcOtherTest[]>([]);
  const [remarks, setRemarks] = React.useState<TcRemark[]>([]);
  const [customRemark, setCustomRemark] = React.useState('');

  const [isItemDialogOpen, setIsItemDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<TcItem | null>(null);

  const [isHeatTestDialogOpen, setIsHeatTestDialogOpen] = React.useState(false);
  const [editingHeatTest, setEditingHeatTest] = React.useState<TcHeatTest | null>(null);

  const [isOtherTestDialogOpen, setIsOtherTestDialogOpen] = React.useState(false);
  const [editingOtherTest, setEditingOtherTest] = React.useState<TcOtherTest | null>(null);

  const [heatNoDetailsMap, setHeatNoDetailsMap] = React.useState<Map<string, StructuredLotData>>(new Map());


  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      DocDate: new Date().toISOString().split("T")[0],
      AccName: "",
      AccCode: "",
      PoNo: "",
      PoDate: new Date().toISOString().split("T")[0],
      InvNo: "",
      InvDate: new Date().toISOString().split("T")[0],
      Address1: "",
      SM_Id: "",
      SM_RM_Name: "",
      BranchId: 1,
      ApsFullDoc: "",
      GradeId: "",
      GradeName: "",
      DStd_Id: "",
      DStd_Type: "",
      Std_Id: "",
      StandardName: "",
      TCode: "TC",
      STCode: "NIMC",
    },
  });

  const branchId = form.watch("BranchId");

  React.useEffect(() => {
    const numericBranchId = parseInt(branchId as unknown as string, 10);
    if (numericBranchId === 1) {
        form.setValue("STCode", "NIMC");
    } else if (numericBranchId === 2) {
        form.setValue("STCode", "FIC");
    }
  }, [branchId, form]);

  React.useEffect(() => {
    const fetchAllHeatNoDetails = async () => {
        const uniqueHeatNos = [...new Set(items.map(item => item.HeatNo).filter(Boolean))];
        if (uniqueHeatNos.length === 0) {
            setHeatNoDetailsMap(new Map());
            return;
        }

        try {
            const response = await axios.get('/api/lot-test-values');
            const allLotRecords = response.data;
            
            const detailsMap = new Map<string, StructuredLotData>();

            for (const heatNo of uniqueHeatNos) {
                const recordsForLot = allLotRecords.filter((rec: any) => rec.HeatNo === heatNo);
                if (recordsForLot.length > 0) {
                    const structured = structureLotData(recordsForLot);
                    detailsMap.set(heatNo as string, structured);
                }
            }
            setHeatNoDetailsMap(detailsMap);
        } catch (error) {
            console.error(`Failed to fetch details for lots:`, error);
            toast({
                title: "Fetch Failed",
                description: `Could not fetch test details for one or more lots.`,
                variant: "destructive",
            });
        }
    };
    fetchAllHeatNoDetails();
}, [items]);

  React.useEffect(() => {
    const fetchDropdownData = async () => {
        try {
            setIsDropdownDataLoading(true);
            const [customerRes, materialRes, gradeRes, dimStdRes, mtcStdRes] = await Promise.all([
                axios.get("/api/customers"),
                axios.get("/api/start-materials"),
                axios.get("/api/productgrades"),
                axios.get("/api/dimension-standards"),
                axios.get("/api/mtcstandards"),
            ]);
            
            const customerData = customerRes.data.map((item: any) => {
                 const source = item.dataValues || item;
                 return {
                    id: source.Id.toString(),
                    name: source.CName,
                    address: source.CAddress,
                };
            });
    
            setCustomers(customerData);
 setStartMaterials(materialRes.data.map((item:any) => ({ id: item.Id.toString(), name: item.SM_RM_Name })));
            setGrades(gradeRes.data.map((item: any) => ({ id: item.Id.toString(), name: item.GradeName })));
            setDimensionStandards(dimStdRes.data.map((item: any) => ({ id: item.Id.toString(), name: item.DStd_Type })));
            setMtcStandards(mtcStdRes.data.filter((item: any) => item && item.Std_Id != null));
    
        } catch (error) {
             toast({ title: "Error fetching master data", description: "Could not load required master data.", variant: "destructive" });
        } finally {
            setIsDropdownDataLoading(false);
        }
      };
      fetchDropdownData();
  }, [])

  React.useEffect(() => {
    if (isEditMode && initialData && !isDropdownDataLoading) {
      const dataForForm = {
        ...initialData,
        DocDate: initialData.DocDate ? new Date(initialData.DocDate).toISOString().split('T')[0] : '',
        PoDate: initialData.PoDate ? new Date(initialData.PoDate).toISOString().split('T')[0] : '',
        InvDate: initialData.InvDate ? new Date(initialData.InvDate).toISOString().split('T')[0] : '',
        AccCode: initialData.AccCode?.toString(),
        Std_Id: initialData.Std_Id?.toString(),
        GradeId: initialData.GradeId?.toString(),
        DStd_Id: initialData.DStd_Id?.toString(),
        SM_Id: initialData.SM_Id?.toString(),
        BranchId: initialData.BranchId,
      };
      form.reset(dataForForm);
      setItems(initialData.items || []);
      setHeatTests(initialData.heatTreatDetails || []);
      setOtherTests(initialData.otherTestDetails || []);
      setRemarks(initialData.remarks || []);
    } else if (!isEditMode) {
      const fetchMasterRemarks = async () => {
        try {
          const response = await axios.get('/api/tcremarksfix');
          const masterRemarks = response.data.map((r: any) => ({ 
            _tempId: pidCounter++,
            PId: r.Id,
            Id: r.Id, 
            TcTerms: r.TcTerms, 
            TcChoice: r.TcChoice 
          }));
          setRemarks(masterRemarks);
        } catch (error) {
          console.error("Failed to fetch master remarks", error);
        }
      }
      fetchMasterRemarks();
    }
  }, [initialData, form, isEditMode, isDropdownDataLoading]);

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if(customer) {
        form.setValue('AccName', customer.name);
        form.setValue('AccCode', customer.id);
        form.setValue('Address1', customer.address);
    }
  }

  const handleGradeChange = (gradeId: string) => {
    const grade = grades.find(g => g.id === gradeId);
    if(grade) {
      form.setValue('GradeName', grade.name);
      form.setValue('GradeId', grade.id);
    }
  }
  
  const handleDimStandardChange = (standardId: string) => {
    const standard = dimensionStandards.find(s => s.id === standardId);
    if(standard) {
      form.setValue('DStd_Type', standard.name);
      form.setValue('DStd_Id', standard.id);
    }
  }

  const handleStartMaterialChange = (materialId: string) => {
    const material = startMaterials.find(m => m.id === materialId);
    if(material) {
      form.setValue('SM_RM_Name', material.name);
      form.setValue('SM_Id', material.id);
    }
  }
  
  const handleStandardChange = (standardId: string) => {
    const standard = mtcStandards.find(s => s.Std_Id.toString() === standardId);
    if(standard) {
      form.setValue('StandardName', standard.Std_Type);
      form.setValue('Std_Id', standard.Std_Id);
    }
  }

  const handleGeneratePdf = () => {
    if (!initialData) return;
    const currentFormData = form.getValues();
    const dataForPdf = {
      ...initialData,
      ...currentFormData,
      items: items,
      heatTreatDetails: heatTests,
      otherTestDetails: otherTests,
      remarks: remarks,
    };
    generateCertificatePDF(dataForPdf as TcMain);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    // Create a clean version of remarks without the temporary ID
    const cleanRemarks = remarks.map(r => {
        const { _tempId, ...rest } = r;
        return rest;
    });

    const cleanItems = items.map(i => {
        const { _tempId, ...rest } = i as any;
        return rest;
    });
     const cleanHeatTests = heatTests.map(i => {
        const { _tempId, ...rest } = i as any;
        return rest;
    });
     const cleanOtherTests = otherTests.map(i => {
        const { _tempId, ...rest } = i as any;
        return rest;
    });

    try {
        if (isEditMode && initialData) {
            const payload = {
                tcMainData: values,
                itemsData: cleanItems,
                heatTests: cleanHeatTests,
                otherTests: cleanOtherTests,
                remarksData: cleanRemarks,
            };
            await axios.put(`/api/tcmain/${initialData.Id}`, payload);
            toast({ title: "Certificate Updated", description: "The test certificate has been updated successfully." });
            if (onSave) {
              onSave();
            }
        } else {
            const payload = { 
                ...values, 
                items: cleanItems, 
                heatTests: cleanHeatTests,
                otherTests: cleanOtherTests,
                remarks: cleanRemarks
            };
            const response = await axios.post(`/api/tcmain`, payload);
            toast({ title: "Certificate Saved", description: "The new test certificate has been saved successfully." });
            const newId = response.data.TcMain.Id;
            const newPath = `/certificates/${newId}`;
            
            removeTab(currentPath);
            addTab({ id: newPath, title: `Edit: ${response.data.TcMain.ApsFullDoc}`, path: newPath });
            setActiveTab(newPath);
        }
    } catch (error) {
        toast({ title: "Submission Failed", description: "An error occurred while saving the certificate.", variant: 'destructive' });
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  }
  
  // Item Handlers
  const handleAddNewItem = () => {
    setEditingItem(null);
    setIsItemDialogOpen(true);
  }

  const handleEditItem = (item: TcItem) => {
    setEditingItem(item);
    setIsItemDialogOpen(true);
  }

  const handleDeleteItem = (row: TcItem) => {
    const idToDelete = (row as any)._tempId || row.PId;
    setItems(prev => prev.filter(item => ((item as any)._tempId || item.PId) !== idToDelete));
    toast({ title: "Item Removed", description: "The product item has been removed from the list." });
  }
  
  const handleSaveItem = (itemToSave: TcItem) => {
    setItems(prev => {
        const key = (itemToSave as any)._tempId || itemToSave.PId;
        const existingIndex = prev.findIndex(i => ((i as any)._tempId || i.PId) === key);
        
        if (existingIndex > -1) {
            const newItems = [...prev];
            newItems[existingIndex] = itemToSave;
            return newItems;
        } else {
            return [...prev, { ...itemToSave, _tempId: pidCounter++ }];
        }
    });
    setIsItemDialogOpen(false);
  }


  // Heat Test Handlers
  const handleAddNewHeatTest = () => {
    setEditingHeatTest(null);
    setIsHeatTestDialogOpen(true);
  }

  const handleEditHeatTest = (test: TcHeatTest) => {
    setEditingHeatTest(test);
    setIsHeatTestDialogOpen(true);
  }

  const handleDeleteHeatTest = (row: TcHeatTest) => {
      const idToDelete = (row as any)._tempId || row.PId;
      setHeatTests(prev => prev.filter(t => ((t as any)._tempId || t.PId) !== idToDelete));
  }

  const handleSaveHeatTest = (testToSave: Omit<TcHeatTest, 'ApsFullDoc' | 'Id' | 'PId'>) => {
    setHeatTests(prev => {
      if (editingHeatTest) {
        const key = (editingHeatTest as any)._tempId || editingHeatTest.PId;
        return prev.map(t => (((t as any)._tempId || t.PId) === key) ? { ...t, ...testToSave } : t);
      } else {
        const newTest: TcHeatTest = {
          ...(testToSave as TcHeatTest),
          _tempId: pidCounter++,
        };
        return [...prev, newTest];
      }
    });
    setIsHeatTestDialogOpen(false);
    setEditingHeatTest(null);
  }


  // Other Test Handlers
  const handleAddNewOtherTest = () => {
    setEditingOtherTest(null);
    setIsOtherTestDialogOpen(true);
  }

  const handleEditOtherTest = (test: TcOtherTest) => {
    setEditingOtherTest(test);
    setIsOtherTestDialogOpen(true);
  }

  const handleDeleteOtherTest = (row: TcOtherTest) => {
      const idToDelete = (row as any)._tempId || row.PId;
      setOtherTests(prev => prev.filter(t => ((t as any)._tempId || t.PId) !== idToDelete));
  }
  
  const handleSaveOtherTest = (testToSave: Omit<TcOtherTest, 'ApsFullDoc' | 'Id' | 'PId'>) => {
    setOtherTests(prev => {
      if (editingOtherTest) {
        const key = (editingOtherTest as any)._tempId || editingOtherTest.PId;
        return prev.map(t => (((t as any)._tempId || t.PId) === key) ? { ...t, ...testToSave } : t);
      } else {
        const newTest: TcOtherTest = {
           ...(testToSave as TcOtherTest),
          _tempId: pidCounter++,
        };
        return [...prev, newTest];
      }
    });
    setIsOtherTestDialogOpen(false);
    setEditingOtherTest(null);
  }
  
  // Remark Handlers
  const handleAddCustomRemark = () => {
    if (customRemark.trim()) {
      const newRemark: TcRemark = {
        _tempId: pidCounter++,
        Id: 0,
        TcTerms: customRemark.trim(),
        TcChoice: true,
      };
      setRemarks(prev => [...prev, newRemark]);
      setCustomRemark('');
    }
  }

  const handleDeleteRemark = (idToDelete: number) => {
    setRemarks(prev => prev.filter(r => (r._tempId || r.PId) !== idToDelete));
  }

  const heatDetailsArray = Array.from(heatNoDetailsMap.entries());
  
  const allChemElements = Array.from(new Set(heatDetailsArray.flatMap(([, details]) => details.ChemicalComp.map(cc => cc.Element))))
                             .filter(element => heatDetailsArray.some(lot => {
                                const [, details] = lot;
                                const chem = details.ChemicalComp.find(cc => cc.Element === element);
                                return chem && chem.Value;
                              }));

  const allPhysProps = Array.from(new Set(heatDetailsArray.flatMap(([, details]) => details.PhysicalProp.map(pp => pp.Property))))
                            .filter(prop => heatDetailsArray.some(lot => {
                               const [, details] = lot;
                               const phys = details.PhysicalProp.find(pp => pp.Property === prop);
                               return phys && phys.Value;
                            }));


  const itemColumns = [
    { 
      accessorKey: '_tempId', 
      header: 'Sr. No',
      cell: ({ row }: any) => row.index + 1 
    },
    { accessorKey: 'PoNo', header: 'PO No.'},
    { accessorKey: 'ProductName', header: 'Item Description' },
    { accessorKey: 'Specification', header: 'Size' },
    { accessorKey: 'HeatNo', header: 'Heat No / Lot No' },
    { accessorKey: 'Qty1', header: 'Qty' },
    { accessorKey: 'Qty1Unit', header: 'Unit' },
  ];
  
  const heatTestColumns = [
      { accessorKey: 'Heat_Code', header: 'Test Code' },
      { accessorKey: 'Heat_Desc', header: 'Test Description' }
  ];

  const otherTestColumns = [
      { accessorKey: 'Test_Code', header: 'Test Code' },
      { accessorKey: 'Test_Desc', header: 'Test Description' },
      { accessorKey: 'Test_Result', header: 'Result' }
  ];

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
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Certificate" }
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Save the current certificate details.</p></TooltipContent>
                </Tooltip>
                {initialData && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleGeneratePdf}>
                            <FileDown className="mr-2 h-4 w-4" /> Export PDF
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Export the certificate as a PDF document.</p></TooltipContent>
                </Tooltip>
                )}
            </div>
          </div>
          <div className="mt-6">
            <TabsContent value="document">
                <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Document Details</CardTitle>
                        <CardDescription>Main document and company information.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <FormField
                            control={form.control}
                            name="BranchId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Branch / Company</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a branch" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="1">NEW INDIA MANUFACTURING CO</SelectItem>
                                            <SelectItem value="2">FORGED INDUSTRIAL CORPORATION</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="Std_Id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>TC Standard Type (Header)</FormLabel>
                                    <Select onValueChange={(value) => { field.onChange(value); handleStandardChange(value); }} value={field.value || ''}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a standard" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {mtcStandards.map(standard => (
                                                <SelectItem key={standard.Std_Id} value={standard.Std_Id.toString()}>
                                                    {standard.Std_Type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div>
                            <FormLabel>Document Type & Code</FormLabel>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <FormField control={form.control} name="TCode" render={({ field }) => (
                                    <Input {...field} disabled />
                                )}/>
                                <FormField control={form.control} name="STCode" render={({ field }) => (
                                    <Input {...field} disabled />
                                )}/>
                                <Input value="TEST CERTIFICATE" disabled />
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="ApsFullDoc" render={({ field }) => (
                               <FormItem><FormLabel>Document No.</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="DocDate" render={({ field }) => (
                                <FormItem><FormLabel>Document Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Customer & Order Details</CardTitle>
                        <CardDescription>Information about the customer and their order.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <FormField control={form.control} name="AccCode" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer Name</FormLabel>
                                    <Select onValueChange={(value) => { field.onChange(value); handleCustomerChange(value); }} value={field.value || ''}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="Address1" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl><Textarea {...field} disabled rows={5} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormItem>
                                <FormLabel>City</FormLabel>
                                <Input disabled />
                            </FormItem>
                            <FormItem>
                                <FormLabel>State</FormLabel>
                                <Input disabled />
                            </FormItem>
                        </div>
                        <div className="space-y-4">
                           <FormField control={form.control} name="PoNo" render={({ field }) => (
                               <FormItem><FormLabel>Buyer Order No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="PoDate" render={({ field }) => (
                               <FormItem><FormLabel>Order Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="InvNo" render={({ field }) => (
                               <FormItem><FormLabel>Invoice No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="InvDate" render={({ field }) => (
                               <FormItem><FormLabel>Invoice Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Other Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="GradeId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Material Specification/Grade</FormLabel>
                                <Select onValueChange={(value) => { field.onChange(value); handleGradeChange(value); }} value={field.value || ''}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {grades.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="DStd_Id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dimension Standard</FormLabel>
                                <Select onValueChange={(value) => { field.onChange(value); handleDimStandardChange(value); }} value={field.value || ''}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select standard" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {dimensionStandards.map(ds => <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}/>
                        <FormField
                          control={form.control}
                          name="SM_Id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start (Base) Material Name</FormLabel>
                              <Select onValueChange={(value) => { field.onChange(value); handleStartMaterialChange(value); }} value={field.value || ''}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select material" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {startMaterials.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                      {m.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </CardContent>
                </Card>
                </div>
            </TabsContent>
            <TabsContent value="product">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Product Details</CardTitle>
                        <Button type="button" onClick={handleAddNewItem}>Add Product Line</Button>
                    </CardHeader>
                    <CardContent>
                      <DataTable 
                        columns={itemColumns as any} 
                        data={items} 
                        onEdit={handleEditItem as any}
                        onDelete={handleDeleteItem}
                      />
                    </CardContent>
                </Card>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    <Card>
                        <CardHeader><CardTitle>Chemical Composition</CardTitle></CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Heat No</TableHead>
                                        {allChemElements.map((col, index) => <TableHead key={`\${col}-\${index}`}>{col}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {heatDetailsArray.map(([heatNo, details]) => (
                                        <TableRow key={heatNo}>
                                            <TableCell>{heatNo}</TableCell>
                                            {allChemElements.map((col, index) => {
                                                const item = details.ChemicalComp.find(cc => cc.Element === col);
                                                return <TableCell key={`\${heatNo}-\${col}-\${index}`}>{item?.Value ?? '-'}</TableCell>;
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                           </Table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Mechanical Properties</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Heat No</TableHead>
                                        {allPhysProps.map((col, index) => <TableHead key={`\${col}-\${index}`}>{col}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {heatDetailsArray.map(([heatNo, details]) => (
                                        <TableRow key={heatNo}>
                                            <TableCell>{heatNo}</TableCell>
                                            {allPhysProps.map((prop, index) => {
                                                const item = details.PhysicalProp.find(pp => pp.Property === prop);
                                                return <TableCell key={`\${heatNo}-\${prop}-\${index}`}>{item?.Value ?? '-'}</TableCell>;
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
            <TabsContent value="heat-test">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Heat Test Details</CardTitle>
                        <Button type="button" onClick={handleAddNewHeatTest}>Add Heat Test</Button>
                    </CardHeader>
                    <CardContent>
                      <DataTable
                        columns={heatTestColumns as any}
                        data={heatTests}
                        onEdit={handleEditHeatTest as any}
                        onDelete={handleDeleteHeatTest}
                      />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="other-test">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Other Test Details</CardTitle>
                        <Button type="button" onClick={handleAddNewOtherTest}>Add Other Test</Button>
                    </CardHeader>
                    <CardContent>
                      <DataTable
                        columns={otherTestColumns as any}
                        data={otherTests}
                        onEdit={handleEditOtherTest as any}
                        onDelete={handleDeleteOtherTest}
                      />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="remarks">
                <Card>
                    <CardHeader><CardTitle>Remarks</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {remarks.map((remark, index) => (
                                <div key={remark._tempId || remark.PId} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                                    <p className="text-sm flex-1">{index + 1}. {remark.TcTerms}</p>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRemark(remark._tempId || remark.PId)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            {remarks.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center p-4">No remarks added.</p>
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-medium mb-2">Add Custom Remark</h4>
                            <div className="flex items-start gap-2">
                                <Textarea
                                    value={customRemark}
                                    onChange={(e) => setCustomRemark(e.target.value)}
                                    placeholder="Type your custom remark here..."
                                    rows={3}
                                    className="flex-1"
                                />
                                <Button type="button" onClick={handleAddCustomRemark}>
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Add Remark
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
          </div>
        </Tabs>
      </form>
      <ItemFormDialog
        isOpen={isItemDialogOpen}
        setIsOpen={setIsItemDialogOpen}
        initialData={editingItem}
        tcMainData={form.getValues() as unknown as TcMain}
        onSave={handleSaveItem}
      />
      <HeatTestFormDialog
        isOpen={isHeatTestDialogOpen}
        setIsOpen={setIsHeatTestDialogOpen}
        initialData={editingHeatTest}
        onSave={handleSaveHeatTest}
       />
       <OtherTestFormDialog
        isOpen={isOtherTestDialogOpen}
        setIsOpen={setIsOtherTestDialogOpen}
        initialData={editingOtherTest}  
        onSave={handleSaveOtherTest}
       />
    </Form>
  );
}

