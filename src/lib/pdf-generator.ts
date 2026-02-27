
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { TcMain, LotTestValue } from './types';
import axios from 'axios';
import { format } from 'date-fns';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

// Global cache for lot test values to avoid multiple fetches for the same session
let lotTestValuesCache: any[] | null = null;

const fetchAllLotDetails = async (): Promise<any[]> => {
    // For now, always fetch to ensure data is fresh. Caching can be re-enabled if needed.
    try {
        const response = await axios.get('/api/lot-test-values');
        lotTestValuesCache = response.data || [];
        return lotTestValuesCache || [];
    } catch (error) {
        console.error("Failed to fetch all lot test values:", error);
        return [];
    }
};

// Helper to get and structure lot details from the cached data
const getLotDetails = (allLotData: any[], heatNo: string): LotTestValue | null => {
    if (!heatNo) return null;
    try {
        const recordsForLot = allLotData.filter((item: any) => item.HeatNo === heatNo);

        if (recordsForLot.length > 0) {
            const baseRecord = recordsForLot[0] || {};
            const structuredData: LotTestValue = {
                Id: baseRecord.Id,
                HeatNo: heatNo,
                LabName: baseRecord.Lab_Name || '',
                Lab_TC_No: baseRecord.Lab_TC_No || '',
                Lab_TC_Date: baseRecord.Lab_TC_Date ? new Date(baseRecord.Lab_TC_Date).toISOString().split('T')[0] : '',
                ImpactTest: [],
                ChemicalComp: [],
                PhysicalProp: [],
            };
            
            const uniqueImpactTests = new Map<string, any>();
            const uniqueChemicals = new Map<string, any>();
            const uniquePhysicals = new Map<string, any>();

            recordsForLot.forEach((rec: any) => {
                 // Handle Impact Test data, ensuring no duplicates and covering legacy/new formats
                if (rec.Parm_Type === 'IT' || rec.ITJ_Temp || rec.ITJ_Size || rec.ITJ_Value_1) {
                    const impactKey = `${rec.ITJ_Temp}-${rec.ITJ_Size}`;
                    if (!uniqueImpactTests.has(impactKey)) {
                         uniqueImpactTests.set(impactKey, {
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
                        if (rec.Parm_Name && !uniqueChemicals.has(rec.Parm_Name)) {
                            uniqueChemicals.set(rec.Parm_Name, { Element: rec.Parm_Name, Value: rec.Test_ValueC });
                        }
                        break;
                    case 'PP':
                    case 'MP': // Handle legacy Physical Property type
                         if (rec.Parm_Name && !uniquePhysicals.has(rec.Parm_Name)) {
                            uniquePhysicals.set(rec.Parm_Name, { Property: rec.Parm_Name, Value: rec.Test_ValueC });
                         }
                        break;
                }
            });
            
            structuredData.ImpactTest = Array.from(uniqueImpactTests.values());
            structuredData.ChemicalComp = Array.from(uniqueChemicals.values());
            structuredData.PhysicalProp = Array.from(uniquePhysicals.values());
            
            return structuredData;
        }
        return null;
    } catch (error) {
        console.error(`Failed to structure details for lot ${heatNo}:`, error);
        return null;
    }
};


export const generateCertificatePDF = async (certificate: TcMain) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  }) as jsPDFWithAutoTable;

  const allLotData = await fetchAllLotDetails();
  const uniqueHeatNos = [...new Set(certificate.items.map(item => item.HeatNo).filter(Boolean))];
  const lotDetailsArray = uniqueHeatNos.map(heatNo => getLotDetails(allLotData, heatNo as string)).filter(Boolean) as LotTestValue[];
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const leftMargin = 6;
  const rightMargin = 8;
  const footerEndY = pageHeight - 22;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  // Title at 40mm; box starts at 45mm so content sits below title. Bottom of box (footerEndY) unchanged.
  const contentStartY = 45;

  // --- Title Header ---
  doc.setFontSize(8).setFont('helvetica', 'bold');
  doc.text('TEST CERTIFICATE', pageWidth / 2, 40, { align: 'center'});
  doc.setFontSize(8).setFont('helvetica', 'normal');
  doc.text('EN-10204-3.1', pageWidth / 2, 44, { align: 'center' });
  
  // --- Main Border ---
  const mainBorderHeight = footerEndY - contentStartY;
  doc.setLineWidth(0.5);
  doc.rect(leftMargin, contentStartY, contentWidth, mainBorderHeight);

  let currentY = contentStartY;

  // --- Top Info Block ---
  const poDate = certificate.PoDate ? format(new Date(certificate.PoDate), 'dd/MM/yyyy') : '';
  const docDate = certificate.DocDate ? format(new Date(certificate.DocDate), 'dd/MM/yyyy') : '';
  const invDate = certificate.InvDate ? format(new Date(certificate.InvDate), 'dd/MM/yyyy') : '';
  const topInfoHeight = 10;
  const midPoint = leftMargin + contentWidth / 2;

  doc.setFontSize(8);
  
  // Left side - Customer Name
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Name:', leftMargin + 2, currentY + 5);
  const customerNameLabelWidth = doc.getTextWidth('Customer Name:');
  doc.setFont('helvetica', 'normal');
  doc.text(certificate.AccName || '', leftMargin + 2 + customerNameLabelWidth, currentY + 5);
  
  // P.O.No. & Date
  doc.setFont('helvetica', 'bold');
  doc.text('P.O.No. & Date:', leftMargin + 2, currentY + 9);
  const poLabelWidth = doc.getTextWidth('P.O.No. & Date:');
  doc.setFont('helvetica', 'normal');
  doc.text(`${certificate.PoNo || ''} Date: ${poDate}`, leftMargin + 2 + poLabelWidth, currentY + 9);
 
  // Right side - TC No. and Date on the same line
  doc.setFont('helvetica', 'bold');
  doc.text('TC No.:', midPoint + 2, currentY + 5);
  const tcNoLabelWidth = doc.getTextWidth('TC No.:');
  doc.setFont('helvetica', 'normal');
  doc.text(certificate.ApsFullDoc || '', midPoint + 2 + tcNoLabelWidth, currentY + 5);
  
  const tcNoValueWidth = doc.getTextWidth(certificate.ApsFullDoc || '');
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', midPoint + 2 + tcNoLabelWidth + tcNoValueWidth + 5, currentY + 5);
  const dateLabelWidth = doc.getTextWidth('Date:');
  doc.setFont('helvetica', 'normal');
  doc.text(docDate, midPoint + 2 + tcNoLabelWidth + tcNoValueWidth + 5 + dateLabelWidth, currentY + 5);
  
  // Start Material
  doc.setFont('helvetica', 'bold');
  doc.text('Start Material:', midPoint + 2, currentY + 9);
  const startMaterialLabelWidth = doc.getTextWidth('Start Material:');
  doc.setFont('helvetica', 'normal');
  doc.text(certificate.SM_RM_Name || '', midPoint + 2 + startMaterialLabelWidth, currentY + 9);
  
  doc.setLineWidth(0.4);
  doc.line(leftMargin, currentY + topInfoHeight, leftMargin + contentWidth, currentY + topInfoHeight); // Horizontal line
  doc.line(midPoint, currentY, midPoint, currentY + topInfoHeight); // Vertical line
  
  currentY += topInfoHeight;

  // --- Item Description Table ---
    const itemDescriptionBody = [];
    const requiredRows = certificate.items.length < 4 ? 8 : certificate.items.length;

    for (let i = 0; i < requiredRows; i++) {
        const item = certificate.items[i];
        itemDescriptionBody.push([
            item ? i + 1 : '',
            item ? item.Po_Inv_PId || '' : '',
            item ? item.ProductName || '' : '',
            item ? certificate.GradeName || '' : '',
            item ? certificate.DStd_Type || '' : '',
            item ? item.Specification || '' : '',
            item ? item.HeatNo : '',
            item ? item.Qty1 : '',
            item ? item.Qty1Unit : '',
        ]);
    }

  doc.autoTable({
    head: [['Sr.\nNo', 'P.O.\nSr.No.', 'Item Description', 'Material Specification', 'Dimension Standard', 'Size', 'Heat No / Lot No.', 'Qty', 'UOM']],
    body: itemDescriptionBody,
    startY: currentY,
    theme: 'grid',
    tableWidth: contentWidth,
    margin: { left: leftMargin, right: rightMargin },
    styles: { lineWidth: 0.4, font: 'helvetica', valign: 'middle', fontSize: 7, cellPadding: 1, textColor: [0, 0, 0], lineColor: [0, 0, 0] },
    headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0] },
    columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        2: { halign: 'left' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
        8: { halign: 'left' }
    }
  });

  currentY = (doc as any).lastAutoTable?.finalY || currentY;

  // --- Two-Column Layout: Chemical Composition (left) + Laboratory Details (right) ---
  const leftColumnWidth = contentWidth * 0.58;
  const rightColumnWidth = contentWidth * 0.42;
  let chemY = currentY;
  
  const standardChemicalElements = ['C%', 'Mn%', 'Si%', 'S%', 'P%', 'Cr%', 'Ni%', 'Mo%', 'Cu%', 'V%', 'CE%'];
  const allChemElementsFromData = Array.from(new Set(lotDetailsArray.flatMap(lot => lot.ChemicalComp.map(cc => cc.Element))));
  // Remove duplicates - normalize element names
  const normalizedElements = new Set<string>();
  standardChemicalElements.forEach(el => normalizedElements.add(el));
  allChemElementsFromData.forEach(el => {
    const normalized = el.trim().replace(/\s+/g, '');
    const exists = Array.from(normalizedElements).some(existing => {
      const existingNorm = existing.replace(/\s+/g, '');
      return existingNorm === normalized || (existingNorm.replace(/%/g, '') === normalized.replace(/%/g, ''));
    });
    if (!exists) {
      normalizedElements.add(el);
    }
  });
  const allChemElements = Array.from(normalizedElements);
  
  if (lotDetailsArray.length > 0 && allChemElements.length > 0) {
    const chemBody = lotDetailsArray.map(lot => {
        const row: (string | number)[] = [lot.HeatNo];
        const chemMap = new Map(lot.ChemicalComp.map(cc => {
          const key = cc.Element.trim().replace(/\s+/g, '');
          return [key, cc.Value];
        }));
        allChemElements.forEach(col => {
          const normalizedCol = col.trim().replace(/\s+/g, '');
          const value = Array.from(chemMap.entries()).find(([k]) => k === normalizedCol || k.replace(/%/g, '') === normalizedCol.replace(/%/g, ''))?.[1];
          row.push(value as string | number ?? '-');
        });
        return row;
    });
    const chemHeader = ['Lot No', ...allChemElements];

    doc.autoTable({
        head: [
          [{ content: 'Chemical Composition', colSpan: chemHeader.length, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255] } }],
          chemHeader
        ],
        body: chemBody,
        startY: chemY,
        theme: 'grid',
        tableWidth: leftColumnWidth,
        margin: { left: leftMargin },
        styles: { lineWidth: 0.4, fontSize: 7, cellPadding: 1, halign: 'center', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
        headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0] },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    });
    chemY = (doc as any).lastAutoTable?.finalY || chemY;
  }

  // --- Right Column: Laboratory Details (beside Chemical Composition) ---
  const labBody = lotDetailsArray.map(lot => [lot.Lab_TC_No, lot.Lab_TC_Date ? format(new Date(lot.Lab_TC_Date), 'dd/MM/yyyy') : '', lot.LabName]).filter(row => row.some(cell => cell));
  if (labBody.length > 0) {
    doc.autoTable({
      head: [
          [{ content: 'Laboratory Details', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255] } }],
          ['Report No.', 'Report Date', 'Laboratory Name']
      ],
      body: labBody,
      startY: currentY,
      theme: 'grid',
      tableWidth: rightColumnWidth,
      margin: { left: leftMargin + leftColumnWidth },
      styles: { lineWidth: 0.4, fontSize: 7, cellPadding: 1, halign: 'center', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
      headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0] },
    });
  }
  
  // Use the maximum Y from both tables
  currentY = Math.max(chemY, (doc as any).lastAutoTable?.finalY || currentY);

  // --- Three-Column Layout: Physical Properties, Charpy Impact Test, Heat Test Details ---
  if (lotDetailsArray.length > 0) {
    const physColumnWidth = contentWidth * 0.40;
    const impactColumnWidth = contentWidth * 0.30;
    const heatColumnWidth = contentWidth * 0.30;
    
    const physHeader = [
      'Lot No.',
      'Y.S N/mm2',
      'U.T.S N/mm2',
      'Elongation %',
      'RA %',
      'Hardness BHN'
    ];

    // Define flexible key match mapping
    const propMap = {
      'Y.S': ['Y.S', 'YS', 'Y.S.'],
      'U.T.S': ['U.T.S', 'UTS', 'U.T.S.'],
      'Elongation': ['Elongation', 'Elongation %', 'Elongation(%)'],
      'RA': ['RA', 'RA %', 'R.A', 'R.A.'],
      'Hardness': ['Hardness', 'Hardness (BHN)', 'Hardness BHN']
    };

    const physBody = lotDetailsArray.map(lot => {
      const row = [lot.HeatNo];
      const physMap = new Map(lot.PhysicalProp.map(pp => [pp.Property.trim(), pp.Value]));

      (Object.keys(propMap) as Array<keyof typeof propMap>).forEach(key => {
        const value = propMap[key].map((k: string) => physMap.get(k)).find((v: any) => v !== undefined);
        row.push(value ?? '-');
      });

      return row;
    });

    // --- Left Column: Physical Properties ---
    let physY = currentY;
    doc.autoTable({
      head: [
        [
          {
            content: 'Physical Properties',
            colSpan: physHeader.length,
            styles: {
              halign: 'center',
              fontStyle: 'bold',
              fillColor: [255, 255, 255],
            },
          },
        ],
        physHeader,
      ],
      body: physBody,
      startY: physY,
      theme: 'grid',
      tableWidth: physColumnWidth,
      margin: { left: leftMargin },
      styles: {
        lineWidth: 0.4,
        fontSize: 7,
        cellPadding: 1,
        halign: 'center',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
      },
      headStyles: {
        fontStyle: 'bold',
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle',
        fontSize: 7,
        cellPadding: 1,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
      },
    });
    physY = (doc as any).lastAutoTable?.finalY || physY;
    
    // --- Middle Column: Charpy Impact Test ---
    // Ensure one row per lot, matching Physical Properties
    const impactBody = lotDetailsArray.map(lot => {
      // Take the first impact test for this lot (or use dashes if none)
      if (lot.ImpactTest && lot.ImpactTest.length > 0) {
        const it = lot.ImpactTest[0]; // Use first impact test
        return [
          it.Size ?? '-',
          it.Temperature ?? '-',
          it.Value1 ?? '-',
          it.Value2 ?? '-',
          it.Value3 ?? '-',
          it.AvgValue ?? '-'
        ];
      } else {
        // No impact test data for this lot - show dashes
        return ['-', '-', '-', '-', '-', '-'];
      }
    });
    
    doc.autoTable({
      head: [
        [
          {
            content: 'Charpy Impact Test (Joules)',
            colSpan: 6,
            styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255] },
          },
        ],
        ['Size:', 'TEMP C', 'I', 'II', 'III', 'Average'],
      ],
      body: impactBody,
      startY: currentY,
      theme: 'grid',
      tableWidth: impactColumnWidth,
      margin: { left: leftMargin + physColumnWidth },
      styles: {
        lineWidth: 0.4,
        fontSize: 7,
        cellPadding: 1,
        halign: 'center',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
      },
      headStyles: {
        fontStyle: 'bold',
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle',
        fontSize: 7,
        cellPadding: 1,
        lineColor: [0, 0, 0],
      },
    });
    let impactY = (doc as any).lastAutoTable?.finalY || currentY;
    
    // --- Right Column: Heat Test Details ---
    // Ensure one row per lot, matching Physical Properties
    // Show one heat test detail per row, or "-" if no more details available
    const heatTestBody = lotDetailsArray.map((lot, lotIndex) => {
      if (certificate.heatTreatDetails && certificate.heatTreatDetails.length > 0 && lotIndex < certificate.heatTreatDetails.length) {
        // Show the corresponding heat test detail for this lot index
        const test = certificate.heatTreatDetails[lotIndex];
        return [`${lotIndex + 1}. ${test.Heat_Desc}`];
      } else {
        // No more heat test details available for this lot - show "-"
        return ['-'];
      }
    });
    
    doc.autoTable({
        head: [[{ content: 'Heat Test Details', styles: { fontStyle: 'bold' } }]],
        body: heatTestBody,
        startY: currentY,
        theme: 'grid',
        tableWidth: heatColumnWidth,
        margin: { left: leftMargin + physColumnWidth + impactColumnWidth },
        styles: { lineWidth: 0.4, fontSize: 7, cellPadding: 1, halign: 'left', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
        headStyles: { 
          fontStyle: 'bold', 
          fillColor: [255, 255, 255], 
          textColor: [0, 0, 0], 
          halign: 'center', 
          valign: 'middle', 
          fontSize: 7, 
          cellPadding: 1,
          lineColor: [0, 0, 0]
        },
    });
    let heatY = (doc as any).lastAutoTable?.finalY || currentY;
    
    // Use the maximum Y from all three tables
    currentY = Math.max(physY, impactY, heatY);
  }

  // --- Other Test Details (Full Width) ---
  const otherTestDetails = certificate.otherTestDetails || [];
  if (otherTestDetails.length > 0) {
    // Combine all test details into one row separated by commas
    const combinedText = otherTestDetails.map((test, index) => `${index + 1}. ${test.Test_Desc}`).join(', ');
    const otherTestBody = [[combinedText]];

    doc.autoTable({
      head: [[{ content: 'Other Test Details', styles: { fontStyle: 'bold' } }]],
      body: otherTestBody,
      startY: currentY,
      theme: 'grid',
      tableWidth: contentWidth,
      margin: { left: leftMargin, right: rightMargin },
      styles: { lineWidth: 0.4, fontSize: 7, cellPadding: 1, halign: 'left', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
      headStyles: {
        fontStyle: 'bold',
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        halign: 'left',
        valign: 'middle',
        fontSize: 7,
        cellPadding: 1,
        lineColor: [0, 0, 0],
      },
    });
    currentY = (doc as any).lastAutoTable?.finalY || currentY;
    
    // Add a line below Other Test Details
    doc.setLineWidth(0.4);
    doc.line(leftMargin, currentY, leftMargin + contentWidth, currentY);
  }

  // --- Three-Column Layout: Remarks, Surveyor and Signature (at footer) ---
  const remarksColumnWidth = contentWidth * 0.40;
  const surveyorColumnWidth = contentWidth * 0.25;
  const signatureColumnWidth = contentWidth * 0.35;
  const remarksStartY = currentY;
  const footerLineY = footerEndY; // Footer line position

  // --- Left Column: Remarks (with header table, stops before footer line) ---
  const remarksBody = certificate.remarks.map((remark, index) => [`${index + 1}. ${remark.TcTerms}`]);
  if (remarksBody.length > 0) {
    doc.autoTable({
        head: [[{ content: 'Remarks', styles: { fontStyle: 'bold' } }]],
        body: remarksBody,
        startY: remarksStartY,
        theme: 'grid',
        tableWidth: remarksColumnWidth,
        margin: { left: leftMargin },
        styles: { lineWidth: 0.4, fontSize: 7, cellPadding: 1, halign: 'left', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
        headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'left', valign: 'middle', fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0] },
        horizontalLineColor: [255, 255, 255],
        horizontalLineWidth: 0,
        didDrawCell: (data: any) => {
          // Remove bottom border of the table
          if (data.row.index === data.table.body.length - 1 && data.column.index === data.table.columns.length - 1) {
            // This is the last cell, remove its bottom border
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(0.4);
            const cell = data.cell;
            doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
          }
          // Remove horizontal lines between body rows
          if (data.row.index >= 0 && data.column.index === 0) {
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(0.4);
            const cell = data.cell;
            doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
          }
        },
    });
  }

  // --- Middle Column: Surveyor (just column with text at footer) ---
  const surveyorColumnStartX = leftMargin + remarksColumnWidth;
  const surveyorColumnEndX = surveyorColumnStartX + surveyorColumnWidth;
  
  // Draw column borders
  doc.setLineWidth(0.4);
  doc.line(surveyorColumnStartX, remarksStartY, surveyorColumnStartX, footerLineY); // Left border
  doc.line(surveyorColumnEndX, remarksStartY, surveyorColumnEndX, footerLineY); // Right border
  
  // Write "SURVEYOR" text at the bottom, touching footer
  doc.setFontSize(9).setFont('helvetica', 'bold');
  const surveyorTextX = surveyorColumnStartX + (surveyorColumnWidth / 2);
  doc.text('SURVEYOR', surveyorTextX, footerLineY - 2, { align: 'center' });
  
  // --- Right Column: Company Title and Auth. Signatory (at footer, above footer line) ---
  const companyTitle = certificate.BranchId == 2 ? "For FORGED INDUSTRIAL CORPORATION" : "For NEW INDIA MANUFACTURING CO";
  const rightColumnStartX = leftMargin + remarksColumnWidth + surveyorColumnWidth;
  const signatureY = footerLineY - 12;
  
  doc.setFontSize(9).setFont('helvetica', 'normal');
  doc.text(companyTitle, rightColumnStartX + signatureColumnWidth - 2, signatureY - 14, { align: 'right' });
  doc.text('Auth. Signatory', rightColumnStartX + signatureColumnWidth - 2, signatureY + 8, { align: 'right' });

  // Save the PDF
  doc.save(`Certificate-${certificate.ApsFullDoc}.pdf`);
};
