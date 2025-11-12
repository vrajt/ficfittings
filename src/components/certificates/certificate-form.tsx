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
import { FileDown, Loader2, PlusCircle, Trash2, GripVertical } from "lucide-react";
import { useTabs } from "../tabs/tab-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import type { TcMain, Customer, GenericMaster, TcItem, LotTestValue, TcHeatTest, TcOtherTest, TcRemark } from "@/lib/types";
import axios from "axios";
import { generateCertificatePDF } from "@/lib/pdf-generator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { HeatTestFormDialog } from "./heat-test-form-dialog";
import { OtherTestFormDialog } from "./other-test-form-dialog";
import { ItemFormDialog } from "./item-form-dialog";
import { DataTable } from "../data-table";

// DnD
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  SM_RM_Name: z.string().optional(),
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
        const key = `${rec.ITJ_Temp || 'N/A'}-${rec.ITJ_Size || 'N/A'}`;
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

// DnD Row Components
function SortableItemRow({ item, render, id }: { item: TcItem; render: (item: TcItem) => React.ReactNode; id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 border rounded-md bg-background">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 text-muted-foreground hover:text-foreground"
        aria-label="Drag handle"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">{render(item)}</div>
    </div>
  );
}

function SortableHeatTestRow({ item, render, id }: { item: TcHeatTest; render: (item: TcHeatTest) => React.ReactNode; id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 border rounded-md bg-background">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 text-muted-foreground hover:text-foreground"
        aria-label="Drag handle"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">{render(item)}</div>
    </div>
  );
}

function SortableOtherTestRow({ item, render, id }: { item: TcOtherTest; render: (item: TcOtherTest) => React.ReactNode; id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 border rounded-md bg-background">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 text-muted-foreground hover:text-foreground"
        aria-label="Drag handle"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">{render(item)}</div>
    </div>
  );
}

export function CertificateForm({ initialData, onSave }: CertificateFormProps) {
  const router = useRouter();
  const { addTab, removeTab, setActiveTab } = useTabs();
  const currentPath = usePathname();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDropdownDataLoading, setIsDropdownDataLoading] = React.useState(true);

  const pidCounter = React.useRef<number>(Date.now());
  const heatTestPidCounter = React.useRef<number>(1);
  const tcItemPidCounter = React.useRef<number>(1);
  const remarkPidCounter = React.useRef<number>(1);
  const otherTestPidCounter = React.useRef<number>(1);

  const getNextPid = () => {
    pidCounter.current += 1;
    return pidCounter.current;
  };

  // Helper functions
  const renumberItemsByOrder = (arr: TcItem[]) =>
    arr.map((it, idx) => ({ ...it, PId: idx + 1 }));

  const renumberHeatTestsByOrder = (arr: TcHeatTest[]) =>
    arr.map((it, idx) => ({ ...it, PId: idx + 1 }));

  const renumberOtherTestsByOrder = (arr: TcOtherTest[]) =>
    arr.map((it, idx) => ({ ...it, PId: idx + 1 }));

  const getItemKey = (it: any) => (it._tempId ?? it.PId ?? getNextPid()).toString();
  const getHeatTestKey = (it: any) => (it._tempId ?? it.PId ?? getNextPid()).toString();
  const getOtherTestKey = (it: any) => (it._tempId ?? it.PId ?? getNextPid()).toString();

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
      PoDate: "",
      InvNo: "",
      InvDate: "",
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

      const mainData = initialData.dataValues || initialData;

      const assignTempId = (item: any) => ({ ...item, _tempId: item._tempId || getNextPid() });

      const itemsWithTempIds = (mainData.items || []).map(assignTempId);
      const heatTestsWithTempIds = (mainData.heatTreatDetails || []).map(assignTempId);
      const otherTestsWithTempIds = (mainData.otherTestDetails || []).map(assignTempId);
      const remarksWithTempIds = (mainData.remarks || []).map(assignTempId);

      const dataForForm = {
        ...mainData,
        DocDate: mainData.DocDate ? new Date(mainData.DocDate).toISOString().split('T')[0] : '',
        PoDate: mainData.PoDate ? new Date(mainData.PoDate).toISOString().split('T')[0] : '',
        InvDate: mainData.InvDate ? new Date(mainData.InvDate).toISOString().split('T')[0] : '',
        AccCode: mainData.AccCode?.toString(),
        Std_Id: mainData.Std_Id?.toString(),
        GradeId: mainData.GradeId?.toString(),
        DStd_Id: mainData.DStd_Id?.toString(),
        SM_Id: mainData.SM_Id?.toString(),
        BranchId: mainData.BranchId,
      };

      form.reset(dataForForm);

      // Ensure items are in PId order and renumber 1..n
      const sortedItems = [...itemsWithTempIds].sort((a: any, b: any) => (Number(a.PId) || 0) - (Number(b.PId) || 0));
      setItems(renumberItemsByOrder(sortedItems));

      const sortedHeatTests = [...heatTestsWithTempIds].sort((a: any, b: any) => (Number(a.PId) || 0) - (Number(b.PId) || 0));
      setHeatTests(renumberHeatTestsByOrder(sortedHeatTests));

      const sortedOtherTests = [...otherTestsWithTempIds].sort((a: any, b: any) => (Number(a.PId) || 0) - (Number(b.PId) || 0));
      setOtherTests(renumberOtherTestsByOrder(sortedOtherTests));

      setRemarks(remarksWithTempIds);

      if (sortedItems.length > 0) {
        const maxPId = Math.max(0, ...sortedItems.map((i: any) => parseInt(i.PId, 10) || 0));
        tcItemPidCounter.current = maxPId + 1;
      }
      if (sortedHeatTests.length > 0) {
        const maxHeatPId = Math.max(0, ...sortedHeatTests.map((t: any) => parseInt(t.PId, 10) || 0));
        heatTestPidCounter.current = maxHeatPId + 1;
      }
      if (sortedOtherTests.length > 0) {
        const maxOtherPId = Math.max(0, ...sortedOtherTests.map((t: any) => parseInt(t.PId, 10) || 0));
        otherTestPidCounter.current = maxOtherPId + 1;
      }
      if (remarksWithTempIds.length > 0) {
        const maxRemarkPId = Math.max(0, ...remarksWithTempIds.map((r: any) => parseInt(r.PId, 10) || 0));
        remarkPidCounter.current = maxRemarkPId + 1;
      }

    } else if (!isEditMode) {
      form.reset({
        DocDate: new Date().toISOString().split("T")[0],
        PoDate: '',
        InvDate: '',
        AccName: "",
        AccCode: "",
        PoNo: "",
        InvNo: "",
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
      });
      const fetchMasterRemarks = async () => {
        try {
          const response = await axios.get('/api/tcremarksfix');
          const masterRemarks = response.data.map((r: any) => ({
            _tempId: getNextPid(),
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
    if (customer) {
      form.setValue('AccName', customer.name);
      form.setValue('AccCode', customer.id);
      form.setValue('Address1', customer.address);
    }
  }

  const handleGradeChange = (gradeId: string) => {
    const grade = grades.find(g => g.id === gradeId);
    if (grade) {
      form.setValue('GradeName', grade.name);
      form.setValue('GradeId', grade.id);
    }
  }

  const handleDimStandardChange = (standardId: string) => {
    const standard = dimensionStandards.find(s => s.id === standardId);
    if (standard) {
      form.setValue('DStd_Type', standard.name);
      form.setValue('DStd_Id', standard.id);
    }
  }

  const handleStartMaterialChange = (materialId: string) => {
    const material = startMaterials.find(m => m.id === materialId);
    if (material) {
      form.setValue('SM_RM_Name', material.name);
      form.setValue('SM_Id', material.id);
    }
  }

  const handleStandardChange = (standardId: string) => {
    const standard = mtcStandards.find(s => s.Std_Id.toString() === standardId);
    if (standard) {
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

    const processedValues: any = { ...values };
    if (processedValues.PoDate === '') {
      processedValues.PoDate = null;
    }
    if (processedValues.InvDate === '') {
      processedValues.InvDate = null;
    }

    const cleanArray = (arr: any[], isRemark = false) => arr.map(item => {
      const { _tempId, ...rest } = item;

      if (isRemark && typeof rest.Id === 'number' && rest.Id < 0) {
        delete rest.Id;
      }

      if (!isRemark && typeof rest.Id === 'string' && rest.Id.startsWith('new-')) {
        delete rest.Id;
      }

      return rest;
    });

    // Always renumber by current order before submit
    const renumberedItems = renumberItemsByOrder(items);
    const renumberedHeat = renumberHeatTestsByOrder(heatTests);
    const renumberedOther = renumberOtherTestsByOrder(otherTests);

    try {
      if (isEditMode && initialData) {

        const tcMainData = { ...processedValues };
        delete (tcMainData as any).items;
        delete (tcMainData as any).heatTests;
        delete (tcMainData as any).otherTests;
        delete (tcMainData as any).remarks;

        const payload = {
          tcMainData,
          itemsData: cleanArray(renumberedItems),
          heatTests: cleanArray(renumberedHeat),
          otherTests: cleanArray(renumberedOther),
          remarksData: cleanArray(remarks, true),
        };

        await axios.put(`/api/tcmain/${initialData.Id}`, payload);
        toast({ title: "Certificate Updated", description: "The test certificate has been updated successfully." });
        if (onSave) {
          onSave();
        }
      } else {
        const payload = {
          ...processedValues,
          items: cleanArray(renumberedItems),
          heatTests: cleanArray(renumberedHeat),
          otherTests: cleanArray(renumberedOther),
          remarks: cleanArray(remarks, true),
        };
        const response = await axios.post(`/api/tcmain`, payload);
        toast({ title: "Certificate Saved", description: "The new test certificate has been saved successfully." });
        const newId = response.data.TcMain.Id;
        const newPath = `/certificates/${newId}`;

        removeTab(currentPath);
        addTab({ id: newPath, title: `Edit: ${response.data.TcMain.ApsFullDoc}`, path: newPath });
        setActiveTab(newPath);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "An error occurred while saving the certificate.";
      console.error("--- CERT FORM: Submission Error ---", error);
      toast({ title: "Submission Failed", description: errorMessage, variant: 'destructive' });
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
    const idToDelete = (row as any)._tempId;
    setItems(prev => renumberItemsByOrder(prev.filter(item => (item as any)._tempId !== idToDelete)));
  }

  const handleSaveItem = (itemToSave: TcItem) => {
    try {
      setItems((prev) => {
        const byTemp = prev.findIndex((i: any) => (i as any)._tempId === (itemToSave as any)._tempId);
        const byPid = byTemp === -1 ? prev.findIndex((i: any) => (i as any).PId === (itemToSave as any).PId) : byTemp;

        if (byPid > -1) {
          const next = [...prev];
          const existing = next[byPid] as any;
          next[byPid] = { ...existing, ...itemToSave, _tempId: existing._tempId, PId: existing.PId } as TcItem;
          return renumberItemsByOrder(next);
        }

        const newItem: TcItem = { ...itemToSave, _tempId: getNextPid(), PId: tcItemPidCounter.current++ };
        delete (newItem as any).Id;
        return renumberItemsByOrder([...prev, newItem]);
      });
    } finally {
      setIsItemDialogOpen(false);
      setEditingItem(null);
    }
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
    const idToDelete = (row as any)._tempId;
    setHeatTests(prev => renumberHeatTestsByOrder(prev.filter(t => (t as any)._tempId !== idToDelete)));
  }

  const handleSaveHeatTest = (testToSave: Omit<TcHeatTest, 'ApsFullDoc' | 'Id'> & { _tempId?: number }) => {
    setHeatTests(prev => {
      const tempId = (testToSave as any)._tempId;
      const isExisting = editingHeatTest && prev.some(t => (t as any)._tempId === tempId);

      if (isExisting) {
        const updated = prev.map(t => ((t as any)._tempId === tempId ? { ...t, ...testToSave } : t));
        return renumberHeatTestsByOrder(updated);
      } else {
        const newTest: TcHeatTest = {
          ...(testToSave as TcHeatTest),
          _tempId: getNextPid(),
          PId: heatTestPidCounter.current++,
        };
        delete (newTest as any).Id;
        return renumberHeatTestsByOrder([...prev, newTest]);
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
    const idToDelete = (row as any)._tempId;
    setOtherTests(prev => renumberOtherTestsByOrder(prev.filter(t => (t as any)._tempId !== idToDelete)));
  }

  const handleSaveOtherTest = (testToSave: Omit<TcOtherTest, 'ApsFullDoc' | 'Id' | 'PId'> & { _tempId?: number }) => {
    setOtherTests(prev => {
      const tempId = (testToSave as any)._tempId;
      const isExisting = editingOtherTest && prev.some(t => (t as any)._tempId === tempId);

      if (isExisting) {
        const updated = prev.map(t => ((t as any)._tempId === tempId ? { ...t, ...testToSave } : t));
        return renumberOtherTestsByOrder(updated);
      } else {
        const newTest: TcOtherTest = {
          ...(testToSave as TcOtherTest),
          _tempId: getNextPid(),
          PId: otherTestPidCounter.current++,
        };
        delete (newTest as any).Id;
        return renumberOtherTestsByOrder([...prev, newTest]);
      }
    });
    setIsOtherTestDialogOpen(false);
    setEditingOtherTest(null);
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
    { accessorKey: 'ProductName', header: 'Product' },
    { accessorKey: 'Specification', header: 'Size' },
    { accessorKey: 'Po_Inv_PId', header: 'PO Number' },
    { accessorKey: 'HeatNo', header: 'Heat No.' },
    { accessorKey: 'Qty1', header: 'Quantity' },
    { accessorKey: 'Qty1Unit', header: 'UOM' },
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

  // Reorder List Components
  function ItemReorderList({
    items,
    setItems,
  }: {
    items: TcItem[];
    setItems: React.Dispatch<React.SetStateAction<TcItem[]>>;
  }) {
    const ids = items.map((it) => getItemKey(it));
    const onDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      const moved = arrayMove(items, oldIndex, newIndex);
      setItems(renumberItemsByOrder(moved));
    };

    return (
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((it) => (
              <SortableItemRow
                key={getItemKey(it)}
                id={getItemKey(it)}
                item={it}
                render={(row) => (
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="font-medium">#{row.PId}</span>
                    <span>{row.ProductName}</span>
                    <span className="text-muted-foreground">{row.Specification}</span>
                    <span className="text-muted-foreground">Heat: {row.HeatNo}</span>
                    <span>{row.Qty1} {row.Qty1Unit}</span>
                  </div>
                )}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  function HeatTestReorderList({
    items,
    setItems,
  }: {
    items: TcHeatTest[];
    setItems: React.Dispatch<React.SetStateAction<TcHeatTest[]>>;
  }) {
    const ids = items.map((it) => getHeatTestKey(it));
    const onDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      const moved = arrayMove(items, oldIndex, newIndex);
      setItems(renumberHeatTestsByOrder(moved));
    };

    return (
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((it) => (
              <SortableHeatTestRow
                key={getHeatTestKey(it)}
                id={getHeatTestKey(it)}
                item={it}
                render={(row) => (
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="font-medium">#{row.PId}</span>
                    <span>{row.Heat_Code}</span>
                    <span className="text-muted-foreground">{row.Heat_Desc}</span>
                  </div>
                )}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  function OtherTestReorderList({
    items,
    setItems,
  }: {
    items: TcOtherTest[];
    setItems: React.Dispatch<React.SetStateAction<TcOtherTest[]>>;
  }) {
    const ids = items.map((it) => getOtherTestKey(it));
    const onDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      const moved = arrayMove(items, oldIndex, newIndex);
      setItems(renumberOtherTestsByOrder(moved));
    };

    return (
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((it) => (
              <SortableOtherTestRow
                key={getOtherTestKey(it)}
                id={getOtherTestKey(it)}
                item={it}
                render={(row) => (
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="font-medium">#{row.PId}</span>
                    <span>{row.Test_Code}</span>
                    <span className="text-muted-foreground">{row.Test_Desc}</span>
                    <span>{row.Test_Result}</span>
                  </div>
                )}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
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
                              {mtcStandards.map((standard, index) => (
                                <SelectItem key={`standard-${standard.Std_Id}-${index}`} value={standard.Std_Id.toString()}>
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
              <div>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Product Details</CardTitle>
                    <Button type="button" onClick={handleAddNewItem}><PlusCircle className="mr-2 h-4 w-4" /> Add New Item</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Drag to reorder items. PId will be set to row order (1..n).</div>
                      <ItemReorderList items={items} setItems={setItems} />
                    </div>
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
                            {allChemElements.map((col, index) => <TableHead key={`chem-head-${col}-${index}`}>{col}</TableHead>)}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {heatDetailsArray.map(([heatNo, details], rowIndex) => (
                            <TableRow key={`chem-row-${heatNo}-${rowIndex}`}>
                              <TableCell>{heatNo}</TableCell>
                              {allChemElements.map((col, colIndex) => {
                                const item = details.ChemicalComp.find(cc => cc.Element === col);
                                return <TableCell key={`chem-cell-${heatNo}-${col}-${colIndex}`}>{item?.Value ?? '-'}</TableCell>;
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
                            {allPhysProps.map((col, index) => <TableHead key={`phys-head-${col}-${index}`}>{col}</TableHead>)}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {heatDetailsArray.map(([heatNo, details], rowIndex) => (
                            <TableRow key={`phys-row-${heatNo}-${rowIndex}`}>
                              <TableCell>{heatNo}</TableCell>
                              {allPhysProps.map((prop, propIndex) => {
                                const item = details.PhysicalProp.find(pp => pp.Property === prop);
                                return <TableCell key={`phys-cell-${heatNo}-${prop}-${propIndex}`}>{item?.Value ?? '-'}</TableCell>;
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="heat-test">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Heat Test Details</CardTitle>
                  <Button type="button" onClick={handleAddNewHeatTest}>Add Heat Test</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Drag to reorder tests. PId will be set to row order (1..n).</div>
                    <HeatTestReorderList items={heatTests} setItems={setHeatTests} />
                  </div>
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
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Drag to reorder tests. PId will be set to row order (1..n).</div>
                    <OtherTestReorderList items={otherTests} setItems={setOtherTests} />
                  </div>
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
                      <div key={remark._tempId} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                        <p className="text-sm flex-1">{index + 1}. {remark.TcTerms}</p>
                        <Button variant="ghost" size="icon" onClick={() => setRemarks(prev => prev.filter(r => r._tempId !== remark._tempId))}>
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
                      <Button
                        type="button"
                        onClick={() => {
                          if (customRemark.trim()) {
                            const newRemark: TcRemark = {
                              _tempId: getNextPid(),
                              PId: remarkPidCounter.current++,
                              Id: -Date.now(),
                              TcTerms: customRemark.trim(),
                              TcChoice: true,
                            };
                            setRemarks(prev => [...prev, newRemark]);
                            setCustomRemark('');
                          }
                        }}
                      >
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