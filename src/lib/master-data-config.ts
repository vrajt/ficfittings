import { GenericMaster, Customer, Certificate } from './types';
import { genericMasterData, customerData, certificateData } from './placeholder-data';
import type { ColumnDef } from '@tanstack/react-table';

interface MasterConfig<T> {
  title: string;
  description: string;
  columns: ColumnDef<T>[];
  data: T[];
}

export const masterDataConfig: Record<string, MasterConfig<any>> = {};

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
