import type { LucideIcon } from "lucide-react";

export type MasterType =
  | 'units'
  | 'grades'
  | 'product-grades'
  | 'tc-remarks'
  | 'customers'
  | 'dimension-standards'
  | 'start-materials'
  | 'laboratories'
  | 'heat-tests'
  | 'other-tests';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  masterType?: MasterType;
  children?: NavItem[];
};

export type GenericMaster = {
  id: string;
  name: string;
  description?: string;
  code?: string;
  status: 'Active' | 'Inactive';
};

export type Customer = {
    id: string;
    name: string;
    address: string;
    contactPerson: string;
    status: 'Active' | 'Inactive';
};

export type Certificate = {
  id: string;
  certificateNumber: string;
  customerName: string;
  date: string;
  status: 'Draft' | 'Issued';
};
