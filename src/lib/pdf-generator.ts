
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
    if (lotTestValuesCache) {
        return lotTestValuesCache;
    }
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

              const impactTests = new Map<string, any>();
              recordsForLot.forEach((rec: any) => {
                switch (rec.Parm_Type) {
                  case 'CC':
                    structuredData.ChemicalComp.push({ Element: rec.Parm_Name, Value: rec.Test_ValueC });
                    break;
                  case 'PP':
                    structuredData.PhysicalProp.push({ Property: rec.Parm_Name, Value: rec.Test_ValueC });
                    break;
                  case 'IT':
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
  
  const leftMargin = 10;
  const rightMargin = 10;
  const topHeaderMargin = 15;
  const contentStartY = 37; // 3.7 cm
  const footerEndY = pageHeight - 24; // 2.4 cm
  const contentWidth = pageWidth - leftMargin - rightMargin;

  // --- Header ---
  doc.setFontSize(12).setFont('helvetica', 'bold');
  doc.text('TEST CERTIFICATE', pageWidth / 2, topHeaderMargin + 5, { align: 'center'});
  doc.setFontSize(9).setFont('helvetica', 'normal');
  doc.text('EN-10204-3.1', pageWidth / 2, topHeaderMargin + 10, { align: 'center' });
  
  // --- Main Border ---
  const mainBorderHeight = footerEndY - contentStartY;
  doc.setLineWidth(0.4);
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
  doc.text(`P.O.No. & Date: ${certificate.PoNo || ''} ${poDate}`, leftMargin + 2, currentY + 9);
  doc.text(`Invoice No. & Date: ${certificate.InvNo || ''} ${invDate}`, leftMargin + 2, currentY + 13);
  
  doc.text(`TC No.: ${certificate.ApsFullDoc || ''}`, midPoint + 15, currentY + 5);
  doc.text(`Date: ${docDate}`, midPoint + 15, currentY + 9);
  doc.text(`Start Material: ${certificate.SM_RM_Name || ''}`, midPoint + 15, currentY + 13);
  
  doc.setLineWidth(0.2);
  doc.line(leftMargin, currentY + topInfoHeight, rightMargin + contentWidth, currentY + topInfoHeight); // Horizontal line
  doc.line(midPoint, currentY, midPoint, currentY + topInfoHeight); // Vertical line
  
  currentY += topInfoHeight;

  // --- Item Description Table ---
  const itemDescriptionBody = [];
  const requiredRows = 8;
  for (let i = 0; i < requiredRows; i++) {
    const item = certificate.items[i];
    itemDescriptionBody.push([
        item ? i + 1 : '',
        '', // PO SR NO
        item ? item.ProductName || '' : '',
        item ? certificate.GradeName || '' : '',
        item ? certificate.DStd_Type || '' : '',
        item ? item.Specification : '',
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
    styles: { lineWidth: 0.2, font: 'helvetica', valign: 'middle', fontSize: 7, cellPadding: 1 },
    headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: 0, halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1 },
    columnStyles: {
        0: { cellWidth: 10, halign: 'right' },
        1: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 60, halign: 'left' },
        3: { cellWidth: 45, halign: 'left' },
        4: { cellWidth: 45, halign: 'left' },
        5: { cellWidth: 25, halign: 'center' },
        6: { cellWidth: 30, halign: 'center' },
        7: { cellWidth: 20, halign: 'right' },
        8: { cellWidth: 22, halign: 'left' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY;

  // --- Nested Two-Column Layout ---
  const nestedTableStartY = currentY;
  
  const leftColumnWidth = contentWidth * 0.58;
  const rightColumnWidth = contentWidth * 0.42;

  // --- Left Column Tables ---
  let leftY = nestedTableStartY;
  
  // Chemical Composition - DYNAMIC
  const allChemElements = Array.from(new Set(lotDetailsArray.flatMap(lot => lot.ChemicalComp.map(cc => cc.Element))));
  if (allChemElements.length > 0) {
    const chemBody = lotDetailsArray.map(lot => {
        const row: (string | number)[] = [lot.HeatNo];
        const chemMap = new Map(lot.ChemicalComp.map(cc => [cc.Element, cc.Value]));
        allChemElements.forEach(col => row.push(chemMap.get(col) as string | number ?? '-'));
        return row;
    });
    const chemHeader = ['Lot No', ...allChemElements];

    doc.autoTable({
        head: [
          [{ content: 'Chemical Composition (%)', colSpan: chemHeader.length, styles: { halign: 'center', fontStyle: 'bold', fillColor: [230, 230, 230] } }],
          chemHeader
        ],
        body: chemBody,
        startY: leftY,
        theme: 'grid',
        tableWidth: leftColumnWidth,
        margin: { left: leftMargin },
        styles: { lineWidth: 0.2, fontSize: 7, cellPadding: 1, halign: 'center' },
        headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: 0, halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1 },
        columnStyles: { 0: { halign: 'left' } },
    });
    leftY = (doc as any).lastAutoTable.finalY;
  }

  // Physical Properties - DYNAMIC
  const allPhysProps = Array.from(new Set(lotDetailsArray.flatMap(lot => lot.PhysicalProp.map(pp => pp.Property))));
  if (allPhysProps.length > 0) {
    const physBody = lotDetailsArray.map(lot => {
        const row: (string|number)[] = [lot.HeatNo];
        const physMap = new Map(lot.PhysicalProp.map(pp => [pp.Property, pp.Value]));
        allPhysProps.forEach(propName => row.push(physMap.get(propName) ?? '-'));
        return row;
    });
    const physHeader = ['Lot No.', ...allPhysProps];

    doc.autoTable({
        head: [
            [{ content: 'Physical Properties', colSpan: physHeader.length, styles: { halign: 'center', fontStyle: 'bold', fillColor: [230, 230, 230] } }],
            physHeader
        ],
        body: physBody,
        startY: leftY,
        theme: 'grid',
        tableWidth: leftColumnWidth,
        margin: { left: leftMargin },
        styles: { lineWidth: 0.2, fontSize: 7, cellPadding: 1, halign: 'center' },
        headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: 0, halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1 },
        columnStyles: { 0: { halign: 'left' } },
    });
    leftY = (doc as any).lastAutoTable.finalY;
  }

  // Other Tests
  const otherTestBody = certificate.otherTestDetails?.map((test) => [`${test.Test_Desc} - ${test.Test_Result}`]) || [];
  doc.autoTable({
      head: [['Other Test Details']],
      body: otherTestBody,
      startY: leftY,
      theme: 'grid',
      tableWidth: leftColumnWidth,
      margin: { left: leftMargin },
      styles: { lineWidth: 0.2, fontSize: 7, cellPadding: 1, halign: 'left' },
      headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: 0, halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1 },
  });
  leftY = (doc as any).lastAutoTable.finalY;
  
  // Remarks
  const remarksBody = certificate.remarks.map((remark) => [remark.TcTerms]);
  doc.autoTable({
      head: [['Remarks']],
      body: remarksBody,
      startY: leftY,
      theme: 'grid',
      tableWidth: leftColumnWidth,
      margin: { left: leftMargin },
      styles: { lineWidth: 0.2, fontSize: 7, cellPadding: 1, halign: 'left' },
      headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: 0, halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1 },
  });
  leftY = (doc as any).lastAutoTable.finalY;

  // --- Right Column Tables ---
  let rightY = nestedTableStartY;
  
  // Laboratory Details
  const labBody = lotDetailsArray.map(lot => [lot.Lab_TC_No, lot.Lab_TC_Date ? format(new Date(lot.Lab_TC_Date), 'dd/MM/yyyy') : '', lot.LabName]);
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
    styles: { lineWidth: 0.2, fontSize: 7, cellPadding: 1, halign: 'center' },
    headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: 0, halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1 },
  });
  rightY = (doc as any).lastAutoTable.finalY;

  // Charpy Impact Test
  doc.autoTable({
    head: [
        [{ content: 'Charpy Impact Test', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fillColor: [230, 230, 230] } }],
        ['Temp', 'Size', 'KV', 'Result']
    ],
    body: [['As per Standard', '', '', '']],
    startY: rightY,
    theme: 'grid',
    tableWidth: rightColumnWidth,
    margin: { left: leftMargin + leftColumnWidth },
    styles: { lineWidth: 0.2, fontSize: 7, cellPadding: 1, halign: 'center' },
    headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: 0, halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1 },
  });
  rightY = (doc as any).lastAutoTable.finalY;

  // Heat Test Details
  const heatTestBody = certificate.heatTreatDetails?.map((test) => [`${test.Heat_Code} - ${test.Heat_Desc}`]);
  doc.autoTable({
      head: [['Heat Test Details']],
      body: heatTestBody,
      startY: rightY,
      theme: 'grid',
      tableWidth: rightColumnWidth,
      margin: { left: leftMargin + leftColumnWidth },
      styles: { lineWidth: 0.2, fontSize: 7, cellPadding: 1, halign: 'left' },
      headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: 0, halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1 },
  });
  rightY = (doc as any).lastAutoTable.finalY;
  
  // --- Footer Section ---
  const companyTitle = certificate.BranchId === 2 ? "For FORGED INDUSTRIAL CORPORATION" : "For NEW INDIA MANUFACTURING CO";
  const footerContentY = footerEndY - 12; // Position inside the border
  
  doc.setFontSize(9).setFont('helvetica', 'normal');
  doc.text('SURVEYOR', leftMargin + 2, footerContentY, { align: 'left' });
  doc.text(companyTitle, pageWidth - rightMargin - 2, footerContentY, { align: 'right' });
  doc.text('Auth. Signatory', pageWidth - rightMargin - 2, footerContentY + 8, { align: 'right' });

  // Save the PDF
  doc.save(`Certificate-${certificate.ApsFullDoc}.pdf`);
};
