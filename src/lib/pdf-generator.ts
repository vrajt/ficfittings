
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
        return lotTestValuesCache;
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
  const contentStartY = 37;
  const footerEndY = pageHeight - 22;
  const contentWidth = pageWidth - leftMargin - rightMargin;


  // --- Title Header ---
  doc.setFontSize(8).setFont('helvetica', 'bold');
  doc.text('TEST CERTIFICATE', pageWidth / 2, 32, { align: 'center'});
  doc.setFontSize(8).setFont('helvetica', 'normal');
  doc.text('EN-10204-3.1', pageWidth / 2, 36, { align: 'center' });
  
  // --- Main Border ---
  const mainBorderHeight = footerEndY - contentStartY;
  doc.setLineWidth(0.5);
  doc.rect(leftMargin, contentStartY, contentWidth, mainBorderHeight);

  let currentY = contentStartY;

  // --- Top Info Block ---
  const poDate = certificate.PoDate ? format(new Date(certificate.PoDate), 'dd/MM/yyyy') : '';
  const docDate = certificate.DocDate ? format(new Date(certificate.DocDate), 'dd/MM/yyyy') : '';
  const invDate = certificate.InvDate ? format(new Date(certificate.InvDate), 'dd/MM/yyyy') : '';
  const topInfoHeight = 15;
  const midPoint = leftMargin + contentWidth / 2;

  doc.setFontSize(8).setFont('helvetica', 'normal');
  doc.text(`Customer Name: ${certificate.AccName || ''}`, leftMargin + 2, currentY + 5);
  doc.text(`P.O.No. & Date: ${certificate.PoNo || ''} Date: ${poDate}`, leftMargin + 2, currentY + 9);
 
  
  doc.text(`TC No.: ${certificate.ApsFullDoc || ''}`, midPoint + 15, currentY + 5);
  doc.text(`Date: ${docDate}`, midPoint + 15, currentY + 9);
  doc.text(`Start Material: ${certificate.SM_RM_Name || ''}`, midPoint + 15, currentY + 13);
  
  doc.setLineWidth(0.4);
  doc.line(leftMargin, currentY + topInfoHeight, 6 + contentWidth, currentY + topInfoHeight); // Horizontal line
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
    styles: { lineWidth: 0.4, font: 'helvetica', valign: 'middle', fontSize: 7, cellPadding: 1, textColor: [0, 0, 0], lineColor: [0, 0, 0] },
    headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [0, 0, 0], halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0] },
    columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
        8: { halign: 'center' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY;

  // --- Nested Two-Column Layout ---
  const nestedTableStartY = currentY;
  
  const leftColumnWidth = contentWidth * 0.58;
  const rightColumnWidth = contentWidth * 0.42;

  // --- Left Column Tables ---
  let leftY = nestedTableStartY;
  
  const standardChemicalElements = ['C%', 'Mn%', 'Si%', 'S%', 'P%', 'Cr%', 'Ni%', 'Mo%', 'Cu%', 'V%', 'CE%'];
  const allChemElementsFromData = Array.from(new Set(lotDetailsArray.flatMap(lot => lot.ChemicalComp.map(cc => cc.Element))));
  const allChemElements = [...new Set([...standardChemicalElements, ...allChemElementsFromData])];
  
  if (lotDetailsArray.length > 0 && allChemElements.length > 0) {
    const chemBody = lotDetailsArray.map(lot => {
        const row: (string | number)[] = [lot.HeatNo];
        const chemMap = new Map(lot.ChemicalComp.map(cc => [cc.Element, cc.Value]));
        allChemElements.forEach(col => row.push(chemMap.get(col) as string | number ?? '-'));
        return row;
    });
    const chemHeader = ['Lot No', ...allChemElements];

    doc.autoTable({
        head: [
          [{ content: 'Chemical Composition', colSpan: chemHeader.length, styles: { halign: 'center', fontStyle: 'bold', fillColor: [230, 230, 230] } }],
          chemHeader
        ],
        body: chemBody,
        startY: leftY,
        theme: 'grid',
        tableWidth: leftColumnWidth,
        margin: { left: leftMargin },
        styles: { lineWidth: 0.4, fontSize: 7, cellPadding: 1, halign: 'center', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
        headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [0, 0, 0], halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0] },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
    });
    leftY = (doc as any).lastAutoTable.finalY;
  }
if (lotDetailsArray.length > 0) {
  const physHeader = [
    'Lot No.',
    'Y.S (N/mm²)',
    'U.T.S (N/mm²)',
    'Elongation %',
    'RA %',
    'Hardness'
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

    Object.keys(propMap).forEach(key => {
      // Try to find any matching property name
      const value = propMap[key].map(k => physMap.get(k)).find(v => v !== undefined);
      row.push(value ?? '-');
    });

    return row;
  });

  doc.autoTable({
    head: [
      [
        {
          content: 'Physical Properties',
          colSpan: physHeader.length,
          styles: {
            halign: 'center',
            fontStyle: 'bold',
            fillColor: [230, 230, 230],
          },
        },
      ],
      physHeader,
    ],
    body: physBody,
    startY: leftY,
    theme: 'grid',
    tableWidth: leftColumnWidth,
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
      fillColor: [230, 230, 230],
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

  leftY = doc.lastAutoTable.finalY;
}



 const otherTestBody = certificate.otherTestDetails?.map(
  (test, index) => [`${index + 1}. ${test.Test_Desc}`]
) || [];

if (otherTestBody.length > 0) {
  doc.autoTable({
    head: [[{ content: 'Other Test Details', styles: { fontStyle: 'bold' } }]],
    body: otherTestBody,
    startY: leftY,
    theme: 'grid',
    tableWidth: leftColumnWidth,
    margin: { left: leftMargin },
    styles: {
      lineWidth: 0.4,
      fontSize: 7,
      cellPadding: 1,
      halign: 'left',
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
    },
    headStyles: {
      fontStyle: 'bold',
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      halign: 'center',
      valign: 'middle',
      fontSize: 7,
      cellPadding: 1,
      lineColor: [0, 0, 0],
    },
  });
  leftY = (doc as any).lastAutoTable.finalY;
}


  
    const remarksBody = certificate.remarks.map((remark) => [remark.TcTerms]);
    if (remarksBody.length > 0) {
    doc.autoTable({
        head: [[{ content: 'Remarks', styles: { fontStyle: 'bold' } }]],
        body: remarksBody,
        startY: leftY,
        theme: 'grid',
        tableWidth: leftColumnWidth,
        margin: { left: leftMargin },
        styles: { lineWidth: 0.4, fontSize: 7, cellPadding: 1, halign: 'left', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
        headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [0, 0, 0], halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0] },
    });
    leftY = (doc as any).lastAutoTable.finalY;
  }

  // --- Right Column Tables ---
  let rightY = nestedTableStartY;
  
  const labBody = lotDetailsArray.map(lot => [lot.Lab_TC_No, lot.Lab_TC_Date ? format(new Date(lot.Lab_TC_Date), 'dd/MM/yyyy') : '', lot.LabName]).filter(row => row.some(cell => cell));
  if (labBody.length > 0) {
    doc.autoTable({
      head: [
          [{ content: 'Laboratory Details', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fillColor: [230, 230, 230] } }],
          ['Report No.', 'Report Date', 'Laboratory Name']
      ],
      body: labBody,
      startY: rightY,
      theme: 'grid',
      tableWidth: rightColumnWidth,
      margin: { left: leftMargin + leftColumnWidth },
      styles: { lineWidth: 0.4, fontSize: 7, cellPadding: 1, halign: 'center', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
      headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [0, 0, 0], halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0] },
    });
    rightY = (doc as any).lastAutoTable.finalY;
  }

  const impactTestBody = lotDetailsArray.flatMap(lot => 
    lot.ImpactTest.map(it => [
        it.Size ?? 'N/A',
        it.Temperature ?? 'N/A',
        it.Value1 ?? 'N/A',
        it.Value2 ?? 'N/A',
        it.Value3 ?? 'N/A',
        it.AvgValue ?? 'N/A'
    ])
  ).filter(row => row.some(cell => cell && cell !== 'N/A'));
  
  if (impactTestBody.length > 0) {
      doc.autoTable({
        head: [
            [{ content: 'Charpy Impact Test (Joules)', colSpan: 6, styles: { halign: 'center', fontStyle: 'bold', fillColor: [230, 230, 230] } }],
            ['Size', 'Temp C', 'I', 'II', 'III', 'Average']
        ],
        body: impactTestBody,
        startY: rightY,
        theme: 'grid',
        tableWidth: rightColumnWidth,
        margin: { left: leftMargin + leftColumnWidth },
        styles: { lineWidth: 0.4, fontSize: 7, cellPadding: 1, halign: 'center', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
        headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [0, 0, 0], halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0] },
      });
      rightY = (doc as any).lastAutoTable.finalY;
  }

  const heatTestBody = certificate.heatTreatDetails?.map((test, index) => [
    `${index + 1}. ${test.Heat_Desc}`
  ]);
  if (heatTestBody && heatTestBody.length > 0) {
    doc.autoTable({
        head: [[{ content: 'Heat Test Details', styles: { fontStyle: 'bold' } }]],
        body: heatTestBody,
        startY: rightY,
        theme: 'grid',
        tableWidth: rightColumnWidth,
        margin: { left: leftMargin + leftColumnWidth },
        styles: { lineWidth: 0.4, fontSize: 7, cellPadding: 1, halign: 'left', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
        headStyles: { 
          fontStyle: 'bold', 
          fillColor: [230, 230, 230], 
          textColor: [0, 0, 0], 
          halign: 'center', 
          valign: 'middle', 
          fontSize: 7, 
          cellPadding: 1,
          lineColor: [0, 0, 0]
        },
    });
    rightY = (doc as any).lastAutoTable.finalY;
  }
  
  // --- Footer Section ---
  const companyTitle = certificate.BranchId == 2 ? "For FORGED INDUSTRIAL CORPORATION" : "For NEW INDIA MANUFACTURING CO";
  const footerContentY = footerEndY - 12;
  
  doc.setFontSize(9).setFont('helvetica', 'normal');
  doc.text('SURVEYOR', leftMargin + 2, footerContentY + 8, { align: 'left' });
  doc.text(companyTitle, pageWidth - rightMargin - 2, footerContentY-14, { align: 'right' });
  doc.text('Auth. Signatory', pageWidth - rightMargin - 2, footerContentY + 8, { align: 'right' });

  // Save the PDF
  doc.save(`Certificate-${certificate.ApsFullDoc}.pdf`);
};
