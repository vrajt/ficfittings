import { GenericMaster, Customer, Certificate } from './types';

const defaultAuditFields = {
  createdBy: 'Admin',
  date: '2024-07-20',
  updatedBy: 'Admin',
  updatedAt: '2024-07-20',
};

const generateAuditFields = (index: number) => ({
  createdBy: index % 2 === 0 ? 'Admin' : 'UserX',
  date: `2024-07-${(10 + index) % 28 + 1}`,
  updatedBy: index % 3 === 0 ? 'Admin' : 'UserY',
  updatedAt: `2024-07-${(20 + index) % 28 + 1}`,
});

export const genericMasterData: Record<string, GenericMaster[]> = {
  generic: Array.from({ length: 5 }, (_, i) => ({
    id: `GEN${String(i + 1).padStart(3, '0')}`,
    name: `Generic Item ${i + 1}`,
    code: `GEN-${i + 1}`,
    description: `Description for Generic Item ${i + 1}`,
    status: i % 2 === 0 ? 'Active' : 'Inactive',
    ...generateAuditFields(i),
  })),
  units: Array.from({ length: 15 }, (_, i) => ({
    id: `U${String(i + 1).padStart(3, '0')}`,
    name: `Unit ${i + 1}`,
    code: `U${i + 1}`,
    description: `Description for Unit ${i + 1}`,
    status: i % 3 === 0 ? 'Inactive' : 'Active',
    ...generateAuditFields(i),
  })),
  grades: Array.from({ length: 12 }, (_, i) => ({
    id: `G${String(i + 1).padStart(3, '0')}`,
    name: `Grade ${String.fromCharCode(65 + i)}`,
    code: `GR-${String.fromCharCode(65 + i)}`,
    description: `Description for Grade ${String.fromCharCode(65 + i)}`,
    status: i % 4 === 0 ? 'Inactive' : 'Active',
    ...generateAuditFields(i),
  })),
  'product-grades': Array.from({ length: 18 }, (_, i) => ({
    id: `PG${String(i + 1).padStart(3, '0')}`,
    name: `Product Grade ${i + 1}`,
    code: `PG-${i + 1}`,
    description: `Description for Product Grade ${i + 1}`,
    status: 'Active',
    ...generateAuditFields(i),
  })),
  'tc-remarks': Array.from({ length: 11 }, (_, i) => ({
    id: `R${String(i + 1).padStart(3, '0')}`,
    name: `Remark Title ${i + 1}`,
    description: `This is a standard testing comment remark no. ${i + 1}.`,
    status: 'Active',
    ...generateAuditFields(i),
  })),
  'dimension-standards': Array.from({ length: 14 }, (_, i) => ({
    id: `DS${String(i + 1).padStart(3, '0')}`,
    name: `Standard ${i + 1}`,
    code: `DS-${i + 1}`,
    description: `Dimensional Standard ${i + 1}`,
    status: i % 5 === 0 ? 'Inactive' : 'Active',
    ...generateAuditFields(i),
  })),
  'start-materials': Array.from({ length: 13 }, (_, i) => ({
    id: `SM${String(i + 1).padStart(3, '0')}`,
    name: `Material ${i + 1}`,
    code: `SM-${i + 1}`,
    description: `Starting Material ${i + 1}`,
    status: 'Active',
    ...generateAuditFields(i),
  })),
  laboratories: Array.from({ length: 10 }, (_, i) => ({
    id: `L${String(i + 1).padStart(3, '0')}`,
    name: `Lab ${i + 1}`,
    code: `LAB-${i + 1}`,
    description: `Laboratory facility ${i + 1}`,
    status: i % 2 === 0 ? 'Active' : 'Inactive',
    ...generateAuditFields(i),
  })),
  'heat-tests': Array.from({ length: 16 }, (_, i) => ({
    id: `HT${String(i + 1).padStart(3, '0')}`,
    name: `Heat Test ${i + 1}`,
    code: `HT-${i + 1}`,
    description: `Details for heat test ${i + 1}`,
    status: 'Active',
    ...generateAuditFields(i),
  })),
  'other-tests': Array.from({ length: 12 }, (_, i) => ({
    id: `OT${String(i + 1).padStart(3, '0')}`,
    name: `Other Test ${i + 1}`,
    code: `OT-${i + 1}`,
    description: `Details for other test ${i + 1}`,
    status: 'Active',
    ...generateAuditFields(i),
  })),
};

export const customerData: Customer[] = Array.from({ length: 25 }, (_, i) => ({
  id: `C${String(i + 1).padStart(3, '0')}`,
  name: `Customer Name ${i + 1} Corp`,
  address: `${i + 1}23 Market St, Suite ${i + 1}00, Cityville`,
  contactPerson: `Person ${i + 1}`,
  status: i % 5 === 0 ? 'Inactive' : 'Active',
  ...generateAuditFields(i),
}));

export const certificateData: Certificate[] = Array.from({ length: 30 }, (_, i) => ({
    id: `TC-2024-${String(i + 1).padStart(3, '0')}`,
    certificateNumber: `TC-2024-${String(i + 1).padStart(3, '0')}`,
    customerName: customerData[i % customerData.length].name,
    date: `2024-07-${(i % 28) + 1}`,
    status: i % 4 === 0 ? 'Draft' : 'Issued',
    ...generateAuditFields(i),
}));
