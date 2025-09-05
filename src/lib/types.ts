
import type { LucideIcon } from "lucide-react";

export type MasterType =
  | 'generic'
  | 'units'
  | 'grades'
  | 'product-grades'
  | 'tc-remarks'
  | 'tc-remarks-fix'
  | 'customers'
  | 'dimension-standards'
  | 'standards'
  | 'start-materials'
  | 'laboratories'
  | 'heat-tests'
  | 'other-tests'
  | 'lot-test-values';

export type PageType = 'alerts';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  masterType?: MasterType;
  pageType?: PageType;
  children?: NavItem[];
};

interface BaseEntity {
  id: string;
  createdBy?: string;
  date?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export type GenericMaster = BaseEntity & {
  name: string;
  description?: string;
  code?: string;
  status?: 'Active' | 'Inactive';
  // Fields for Unit Master
  uDecimal?: number;
  gstUom?: string;
  uomType?: string;
  // Fields for Customer Master
  address?: string;
  teleOff?: string;
  mobile?: string;
  email1?: string;
  isBlocked?: boolean;
  // Fields for TC Remarks
  tcChoice?: string | boolean;
};

export type Customer = BaseEntity & {
    name: string;
    address: string;
    teleOff?: string;
    mobile?: string;
    email1?: string;
    isBlocked?: boolean;
    status: 'Active' | 'Inactive';
};

export type Certificate = BaseEntity & {
  certificateNumber: string;
  customerName: string;
  status: 'Draft' | 'Issued';
};

export interface LotTestValue {
  Id: number;
  HeatNo: string;
  LabName: string;
  Lab_TC_No: string;
  Lab_TC_Date: string;
  ImpactTest: {
    Temperature: number | null;
    Size: string;
    Value1: string;
    Value2: string;
    Value3: string;
    AvgValue: string;
  }[];
  ChemicalComp: {
    Element: string;
    Value: number | null | string;
  }[];
  PhysicalProp: {
    Property: string;
    Value: string;
  }[];
}

export interface TcItem {
  Id?: number; // This is the TcMain ID
  ApsFullDoc?: string;
  PId: number; // This is the actual unique ID for the TcItem
  Po_Inv_PId?: number;
  HeatNo: string;
  ProductName: string;
  Qty1: number;
  Qty1Unit: string;
  PoNo?: string;
  GradeName?: string;
  Specification: string;
  CreatedDate?: string;
  UpdateDate?: string;
}

export interface TcHeatTest {
    Id?: number; // TcMain ID
    PId: number; // Unique ID for this record
    ApsFullDoc?: string;
    Heat_Code: string;
    Heat_Desc: string;
}

export interface TcOtherTest {
    Id?: number; // TcMain ID
    PId: number; // Unique ID for this record
    ApsFullDoc?: string;
    Test_Code: string;
    Test_Desc: string;
    Test_Result: string;
}

export interface TcRemark {
    _tempId?: number; // Client-side only temporary id
    PId?: number; // Unique temporary ID for React key
    Id: number; // Master remark ID
    TcTerms: string;
    TcChoice: boolean;
}


export interface TcMain {
    Id: number;
    ApsFullDoc: string;
    DocDate: string;
    PoNo: string;
    PoDate: string;
    InvNo: string;
    InvDate: string;
    AccCode: string;
    AccName: string;
    Address1: string;
    SM_Id: string;
    SM_RM_Name: string; // Start Material
    items: TcItem[];
    heatTreatDetails: TcHeatTest[];
    otherTestDetails: TcOtherTest[];
    remarks: TcRemark[];
    StandardName?: string;
    DStd_Type?: string;
    GradeName?: string;
    BranchId?: number;
    Std_Id?: string;
    [key: string]: any; // Allow other properties
}
