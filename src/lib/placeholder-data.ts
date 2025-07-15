import { GenericMaster, Customer, Certificate } from './types';

const defaultAuditFields = {
  createdBy: 'Admin',
  createdAt: '2024-07-20',
  updatedBy: 'Admin',
  updatedAt: '2024-07-20',
};

export const genericMasterData: Record<string, GenericMaster[]> = {
  units: [
    { id: 'U001', name: 'Kilogram', code: 'KG', description: 'Unit of mass', status: 'Active', ...defaultAuditFields },
    { id: 'U002', name: 'Meter', code: 'M', description: 'Unit of length', status: 'Active', ...defaultAuditFields },
    { id: 'U003', name: 'Square Meter', code: 'M2', description: 'Unit of area', status: 'Inactive', ...defaultAuditFields },
  ],
  grades: [
    { id: 'G001', name: 'Grade A', code: 'GR-A', description: 'Premium quality grade', status: 'Active', ...defaultAuditFields },
    { id: 'G002', name: 'Grade B', code: 'GR-B', description: 'Standard quality grade', status: 'Active', ...defaultAuditFields },
  ],
  'product-grades': [
    { id: 'PG001', name: 'Stainless Steel 304', code: 'SS304', description: 'Austenitic stainless steel', status: 'Active', ...defaultAuditFields },
    { id: 'PG002', name: 'Carbon Steel A36', code: 'CS-A36', description: 'Common structural steel', status: 'Active', ...defaultAuditFields },
  ],
  'tc-remarks': [
    { id: 'R001', name: 'Standard Remark', description: 'This material conforms to standard specifications.', status: 'Active', ...defaultAuditFields },
    { id: 'R002', name: 'Special Handling', description: 'Handle with care, fragile material.', status: 'Active', ...defaultAuditFields },
  ],
  'dimension-standards': [
    { id: 'DS001', name: 'ASME B16.5', code: 'ASME-B16.5', description: 'Pipe Flanges and Flanged Fittings', status: 'Active', ...defaultAuditFields },
    { id: 'DS002', name: 'ISO 9001', code: 'ISO-9001', description: 'Quality management systems', status: 'Active', ...defaultAuditFields },
  ],
  'start-materials': [
    { id: 'SM001', name: 'Raw Ingot', code: 'INGOT', description: 'Basic raw material ingot.', status: 'Active', ...defaultAuditFields },
    { id: 'SM002', name: 'Steel Billet', code: 'BILLET', description: 'Semi-finished steel product', status: 'Active', ...defaultAuditFields },
  ],
  laboratories: [
    { id: 'L001', name: 'Central Lab', code: 'C-LAB', description: 'Main testing laboratory', status: 'Active', ...defaultAuditFields },
    { id: 'L002', name: 'QA Lab', code: 'QA-LAB', description: 'Quality assurance laboratory', status: 'Inactive', ...defaultAuditFields },
  ],
  'heat-tests': [
    { id: 'HT001', name: 'Tensile Strength', code: 'TENS', description: 'Measures resistance to being pulled apart', status: 'Active', ...defaultAuditFields },
    { id: 'HT002', name: 'Hardness Test', code: 'HRD', description: 'Measures resistance to indentation', status: 'Active', ...defaultAuditFields },
  ],
  'other-tests': [
    { id: 'OT001', name: 'Corrosion Test', code: 'CORR', description: 'Measures resistance to corrosion', status: 'Active', ...defaultAuditFields },
  ],
};

export const customerData: Customer[] = [
  { id: 'C001', name: 'Global Tech Inc.', address: '123 Innovation Drive, Tech City', contactPerson: 'John Doe', status: 'Active', ...defaultAuditFields },
  { id: 'C002', name: 'Advanced Builders Co.', address: '456 Construction Ave, Metropolis', contactPerson: 'Jane Smith', status: 'Active', ...defaultAuditFields },
  { id: 'C003', name: 'Future Systems', address: '789 Silicon Way, Futureville', contactPerson: 'Sam Wilson', status: 'Inactive', ...defaultAuditFields },
];

export const certificateData: Certificate[] = [
    { id: 'TC-2024-001', certificateNumber: 'TC-2024-001', customerName: 'Global Tech Inc.', date: '2024-07-15', status: 'Issued', ...defaultAuditFields },
    { id: 'TC-2024-002', certificateNumber: 'TC-2024-002', customerName: 'Advanced Builders Co.', date: '2024-07-16', status: 'Draft', ...defaultAuditFields },
    { id: 'TC-2024-003', certificateNumber: 'TC-2024-003', customerName: 'Global Tech Inc.', date: '2024-07-18', status: 'Issued', ...defaultAuditFields },
];
