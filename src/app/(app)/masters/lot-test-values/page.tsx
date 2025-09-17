'use client';

import * as React from 'react';
import axios from 'axios';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LotTestValueForm } from '@/components/masters/lot-test-value-form';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import type { LotTestValue } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const structureLotData = (records: any[], lotNo: string): LotTestValue => {
  const baseRecord = records[0] || {};
  
  const structuredData: LotTestValue = {
    Id: baseRecord.Id || 0,
    HeatNo: lotNo,
    LabName: baseRecord.Lab_Name || '',
    Lab_TC_No: baseRecord.Lab_TC_No || '',
    Lab_TC_Date: baseRecord.Lab_TC_Date ? new Date(baseRecord.Lab_TC_Date).toISOString().split('T')[0] : '',
    ImpactTest: [],
    ChemicalComp: [],
    PhysicalProp: [],
  };

  const impactTests = new Map<string, any>();

    records.forEach(rec => {
        // This logic ensures that even if IT values are on other records, they are picked up.
        if (rec.ITJ_Temp || rec.ITJ_Size || rec.ITJ_Value_1) {
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
        }
        
        switch (rec.Parm_Type) {
            case 'CC':
            case 'C':
                if (rec.Parm_Name && !structuredData.ChemicalComp.some(c => c.Element === rec.Parm_Name)) {
                    structuredData.ChemicalComp.push({ Element: rec.Parm_Name, Value: rec.Test_ValueC });
                }
                break;
            case 'PP':
            case 'MP':
                 if (rec.Parm_Name && !structuredData.PhysicalProp.some(p => p.Property === rec.Parm_Name)) {
                    structuredData.PhysicalProp.push({ Property: rec.Parm_Name, Value: rec.Test_ValueC });
                }
                break;
        }
    });

  structuredData.ImpactTest = Array.from(impactTests.values());
  if (structuredData.ImpactTest.length === 0 && records.length > 0) {
      const firstRec = records[0];
      structuredData.ImpactTest.push({
        Temperature: firstRec.ITJ_Temp,
        Size: firstRec.ITJ_Size,
        Value1: firstRec.ITJ_Value_1,
        Value2: firstRec.ITJ_Value_2,
        Value3: firstRec.ITJ_Value_3,
        AvgValue: firstRec.ITJ_Value_Avg,
      });
  }

  return structuredData;
};


export default function LotTestValuesPage() {
  const [lotNumbers, setLotNumbers] = React.useState<string[]>([]);
  const [selectedLot, setSelectedLot] = React.useState<string | null>(null);
  const [lotData, setLotData] = React.useState<LotTestValue | null>(null);
  const [isLoadingList, setIsLoadingList] = React.useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newLotNumber, setNewLotNumber] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);

  const fetchLotNumbers = async () => {
    try {
      setIsLoadingList(true);
      const response = await axios.get('/api/lot-test-values');
      const uniqueLots = [...new Set(response.data.map((item: any) => item.HeatNo))].filter(Boolean) as string[];
      setLotNumbers(uniqueLots.sort());
      if (uniqueLots.length > 0 && !selectedLot) {
        await handleLotSelect(uniqueLots[0]);
      }
    } catch (error) {
      console.error("Failed to fetch lot numbers:", error);
      toast({
        title: "Fetch Failed",
        description: "Could not fetch lot numbers.",
        variant: "destructive",
      });
    } finally {
        setIsLoadingList(false);
    }
  };

  React.useEffect(() => {
    fetchLotNumbers();
  }, []);
  
  const filteredLotNumbers = lotNumbers.filter(lot => 
    lot.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLotSelect = async (lotNo: string) => {
    if (!lotNo) return;
    if (isEditing && lotNo !== selectedLot) {
        toast({ title: "Cancel Edit", description: "Exited edit mode without saving."});
    }
    setSelectedLot(lotNo);
    setIsEditing(false); // Always start in view mode
    setIsLoadingDetails(true);
    setLotData(null);
    try {
      const response = await axios.get('/api/lot-test-values');
      const recordsForLot = response.data.filter((item: any) => item.HeatNo === lotNo);
      
      if (recordsForLot.length > 0) {
        const structuredData = structureLotData(recordsForLot, lotNo);
        setLotData(structuredData);
      } else {
        // This is a new lot, so we create a default structure and enter edit mode
        setLotData({
          Id: 0,
          HeatNo: lotNo,
          LabName: '',
          Lab_TC_No: '',
          Lab_TC_Date: '',
          ImpactTest: [],
          ChemicalComp: [],
          PhysicalProp: [],
        });
        setIsEditing(true);
      }
    } catch (error) {
      console.error(`Failed to fetch details for lot ${lotNo}:`, error);
      toast({
        title: "Fetch Failed",
        description: `Could not fetch details for lot ${lotNo}.`,
        variant: "destructive",
      });
      setLotData(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  const handleAddNewLot = () => {
    if (!newLotNumber || lotNumbers.includes(newLotNumber)) {
        toast({
            title: "Invalid Lot Number",
            description: "Please enter a unique, non-empty lot number.",
            variant: "destructive"
        });
        return;
    }
    setLotNumbers(prev => [newLotNumber, ...prev].sort());
    handleLotSelect(newLotNumber);
    setNewLotNumber('');
    setIsAddDialogOpen(false);
  }

  const handleSave = async () => {
    setIsEditing(false);
    if(selectedLot){
        await handleLotSelect(selectedLot); // Refreshes data and resets to view mode
    }
  }
  
  const handleEditClick = (e: React.MouseEvent, lotNo: string) => {
    e.stopPropagation(); // Prevent lot selection from firing
    if (selectedLot !== lotNo) {
        handleLotSelect(lotNo).then(() => setIsEditing(true));
    } else {
        setIsEditing(true);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Lot Test Values"
        description="Manage chemical, physical, and impact test values for each lot."
        actionButtonText="Add New Lot"
        onActionClick={() => setIsAddDialogOpen(true)}
      />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="p-2 border-b">
             <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filter lots..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </CardHeader>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <CardContent className="p-2">
              {isLoadingList ? (
                <div className="space-y-2 p-2">
                  {Array.from({length: 15}).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : filteredLotNumbers.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-4">No lots found.</div>
              ) : (
                <div className="space-y-1">
                  {filteredLotNumbers.map((lot) => (
                    <div
                      key={lot}
                      onClick={() => handleLotSelect(lot)}
                      className={cn(
                        "w-full justify-start text-left flex items-center pr-2 rounded-md group",
                        "hover:bg-accent hover:text-accent-foreground cursor-pointer",
                        selectedLot === lot && "bg-accent text-accent-foreground"
                      )}
                    >
                      <span className='flex-1 p-2'>{lot}</span>
                       <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => handleEditClick(e, lot)}
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Edit Lot {lot}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
        <div className="md:col-span-3">
          {isLoadingDetails ? (
             <div className="space-y-4 rounded-lg border p-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
             </div>
          ) : lotData ? (
             <LotTestValueForm 
                initialData={lotData} 
                onSave={handleSave}
                isEditing={isEditing}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground rounded-lg border">
              <p>Select a lot to view or edit its details.</p>
            </div>
          )}
        </div>
      </div>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Add New Lot</DialogTitle>
                <DialogDescription>
                    Enter the new Heat / Lot number to start adding test values.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lot-number" className="text-right">Lot Number</Label>
                    <Input 
                        id="lot-number" 
                        value={newLotNumber}
                        onChange={(e) => setNewLotNumber(e.target.value)}
                        className="col-span-3" 
                    />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleAddNewLot}>Add Lot</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
