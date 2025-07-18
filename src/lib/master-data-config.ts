import { GenericMaster, Customer, Certificate } from './types';
import { genericMasterData, customerData, certificateData } from './placeholder-data';
import type { ColumnDef } from '@tanstack/react-table';

interface MasterConfig<T> {
  title: string;
  description: string;
  columns: ColumnDef<T>[];
  data: T[];
}

const auditColumns: ColumnDef<any>[] = [
    { accessorKey: 'createdBy', header: 'Created By' },
    // Removed duplicate date column. The main `date` column in each config will be used.
    { accessorKey: 'updatedBy', header: 'Updated By' },
    { accessorKey: 'updatedAt', header: 'Updated At' },
];

export const masterDataConfig: Record<string, MasterConfig<any>> = {
  generic: {
    title: 'Generic Master',
    description: 'Manage generic master data.',
    columns: [
      { accessorKey: 'code', header: 'Code' },
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'description', header: 'Description' },
      { accessorKey: 'date', header: 'Created At' },
      ...auditColumns
    ],
    data: genericMasterData.generic,
  },
  units: {
    title: 'Unit Master',
    description: 'Manage measurement units used in certificates.',
    columns: [
      { accessorKey: 'code', header: 'Code' },
      { accessorKey: 'name', header: 'Unit Name' },
      { accessorKey: 'description', header: 'Description' },
      { accessorKey: 'date', header: 'Created At' },
      ...auditColumns
    ],
    data: genericMasterData.units,
  },
  grades: {
    title: 'Grade Master',
    description: 'Manage quality grades for products.',
    columns: [
        { accessorKey: 'code', header: 'Code' },
        { accessorKey: 'name', header: 'Grade Name' },
        { accessorKey: 'description', header: 'Description' },
        { accessorKey: 'date', header: 'Created At' },
        ...auditColumns
    ],
    data: genericMasterData.grades,
  },
  'product-grades': {
    title: 'Product Grade Master',
    description: 'Manage specific grades associated with products.',
    columns: [
        { accessorKey: 'code', header: 'Code' },
        { accessorKey: 'name', header: 'Product Grade Name' },
        { accessorKey: 'description', header: 'Description' },
        { accessorKey: 'date', header: 'Created At' },
        ...auditColumns
    ],
    data: genericMasterData['product-grades'],
  },
  'tc-remarks': {
    title: 'TC Remark Master',
    description: 'Manage standard remarks for test certificates.',
    columns: [
      { accessorKey: 'name', header: 'Remark' },
      { accessorKey: 'description', header: 'Details' },
      { accessorKey: 'date', header: 'Created At' },
      ...auditColumns
    ],
    data: genericMasterData['tc-remarks'],
  },
  customers: {
    title: 'Customer Master',
    description: 'Manage customer information.',
    columns: [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'address', header: 'Address' },
      { accessorKey: 'contactPerson', header: 'Contact Person' },
      { accessorKey: 'date', header: 'Created At' },
      ...auditColumns
    ],
    data: customerData,
  },
  'dimension-standards': {
    title: 'Dimension Standard Master',
    description: 'Manage dimensional standards for products.',
    columns: [
        { accessorKey: 'code', header: 'Code' },
        { accessorKey: 'name', header: 'Standard Name' },
        { accessorKey: 'description', header: 'Description' },
        { accessorKey: 'date', header: 'Created At' },
        ...auditColumns
    ],
    data: genericMasterData['dimension-standards'],
  },
  'start-materials': {
    title: 'Start Material Master',
    description: 'Manage types of starting materials.',
    columns: [
        { accessorKey: 'code', header: 'Code' },
        { accessorKey: 'name', header: 'Material Name' },
        { accessorKey: 'description', header: 'Description' },
        { accessorKey: 'date', header: 'Created At' },
        ...auditColumns
    ],
    data: genericMasterData['start-materials'],
  },
  laboratories: {
    title: 'Laboratory Master',
    description: 'Manage testing laboratories.',
    columns: [
        { accessorKey: 'code', header: 'Code' },
        { accessorKey: 'name', header: 'Laboratory Name' },
        { accessorKey: 'description', header: 'Description' },
        { accessorKey: 'date', header: 'Created At' },
        ...auditColumns
    ],
    data: genericMasterData.laboratories,
  },
  'heat-tests': {
    title: 'Heat Test Master',
    description: 'Manage types of heat tests performed.',
    columns: [
        { accessorKey: 'code', header: 'Code' },
        { accessorKey: 'name', header: 'Test Name' },
        { accessorKey: 'description', header: 'Description' },
        { accessorKey: 'date', header: 'Created At' },
        ...auditColumns
    ],
    data: genericMasterData['heat-tests'],
  },
  'other-tests': {
    title: 'Other Test Master',
    description: 'Manage other miscellaneous tests.',
    columns: [
        { accessorKey: 'code', header: 'Code' },
        { accessorKey: 'name', header: 'Test Name' },
        { accessorKey: 'description', header: 'Description' },
        { accessorKey: 'date', header: 'Created At' },
        ...auditColumns
    ],
    data: genericMasterData['other-tests'],
  },
};

export const certificateConfig: MasterConfig<Certificate> = {
    title: 'Test Certificates',
    description: 'Manage and generate test certificates.',
    columns: [
      { accessorKey: 'certificateNumber', header: 'Certificate No.' },
      { accessorKey: 'customerName', header: 'Customer' },
      { accessorKey: 'date', header: 'Date' },
      { accessorKey: 'createdBy', header: 'Created By' },
      { accessorKey: 'updatedBy', header: 'Updated By' },
      { accessorKey: 'updatedAt', header: 'Updated At' },
    ],
    data: certificateData,
  };
