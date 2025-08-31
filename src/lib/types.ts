
import type { LucideIcon } from "lucide-react";

export type MasterType =
  | 'generic'
  | 'units'
  | 'grades'
  | 'product-grades'
  | 'tc-remarks'
  | 'tcremarksfix'
  | 'customers'
  | 'dimension-standards'
  | 'start-materials'
  | 'laboratories'
  | 'heattestmaster'
  | 'other-tests';

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
  createdBy: string;
  date: string;
  updatedBy: string;
  updatedAt: string;
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
  tcChoice?: string;
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
    Temperature: number;
    Size: string;
    Value1: string;
    Value2: string;
    Value3: string;
    AvgValue: string;
  }[];
  ChemicalComp: {
    Element: string;
    Value: number;
  }[];
  PhysicalProp: {
    Property: string;
    Value: string;
  }[];
}
