
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
import { Search } from 'lucide-react';

// Helper to structure the flat data from the API
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

  // Group records by their specific test types
  const impactTests = new Map<string, any>();

  records.forEach(rec => {
    switch (rec.Parm_Type) {
      case 'CC':
        structuredData.ChemicalComp.push({ Element: rec.Parm_Name, Value: rec.Test_ValueN });
        break;
      case 'PP':
        structuredData.PhysicalProp.push({ Property: rec.Parm_Name, Value: rec.Test_ValueC });
        break;
      case 'IT':
        // Group impact tests by temperature, as there can be multiple readings
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
  if (structuredData.ImpactTest.length === 0) {
      structuredData.ImpactTest.push({ Temperature: 0, Size: '', Value1: '', Value2: '', Value3: '', AvgValue: '' });
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


  const fetchLotNumbers = async () => {
    try {
      setIsLoadingList(true);
      const response = await axios.get('/api/lot-test-values');
      const uniqueLots = [...new Set(response.data.map((item: any) => item.HeatNo))].filter(Boolean) as string[];
      setLotNumbers(uniqueLots);
      if (uniqueLots.length > 0 && !selectedLot) {
        handleLotSelect(uniqueLots[0]);
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
    setSelectedLot(lotNo);
    setIsLoadingDetails(true);
    setLotData(null);
    try {
      const response = await axios.get('/api/lot-test-values');
      const recordsForLot = response.data.filter((item: any) => item.HeatNo === lotNo);
      
      if (recordsForLot.length > 0) {
        const structuredData = structureLotData(recordsForLot, lotNo);
        setLotData(structuredData);
      } else {
        // This is a new lot, so we create a default structure.
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
    setLotNumbers(prev => [newLotNumber, ...prev]);
    handleLotSelect(newLotNumber);
    setNewLotNumber('');
    setIsAddDialogOpen(false);
  }

  const handleSave = async () => {
    // After saving, we should refetch the data for the current lot
    // to ensure the form is up-to-date with any backend transformations.
    if(selectedLot){
        await handleLotSelect(selectedLot);
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
                    <Button
                      key={lot}
                      variant="ghost"
                      onClick={() => handleLotSelect(lot)}
                      className={cn(
                        "w-full justify-start text-left",
                        selectedLot === lot && "bg-accent text-accent-foreground"
                      )}
                    >
                      {lot}
                    </Button>
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
            <LotTestValueForm initialData={lotData} onSave={handleSave} />
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
