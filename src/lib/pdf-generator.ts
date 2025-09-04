
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

  // --- Fetch All Lot Details Concurrently ---
  const allLotData = await fetchAllLotDetails();
  const uniqueHeatNos = [...new Set(certificate.items.map(item => item.HeatNo).filter(Boolean))];
  const lotDetailsArray = uniqueHeatNos.map(heatNo => getLotDetails(allLotData, heatNo as string)).filter(Boolean) as LotTestValue[];


  // --- PDF Generation ---
  const page_width = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentStartY = 37; // 3.7cm from top
  const footerStartY = doc.internal.pageSize.getHeight() - 24; // 2.4cm from bottom


  const tableStyles = {
    fontSize: 7,
    cellPadding: 0.8,
    lineWidth: 0.2, // Bolder borders
    lineColor: 0,
    fillColor: false,
    textColor: 0,
  };
  const headStyles = {
    fontStyle: 'bold',
    fillColor: [230, 230, 230],
    textColor: 0,
    lineColor: 0,
    halign: 'center',
    valign: 'middle',
    fontSize: 7,
  };

  doc.setFontSize(12).setFont('helvetica', 'bold');
  doc.text(certificate.StandardName || 'TEST CERTIFICATE', page_width / 2, contentStartY - 10, { align: 'center'});
  doc.setFontSize(9).setFont('helvetica', 'normal');
  doc.text('EN-10204-3.1', page_width / 2, contentStartY - 5, { align: 'center' });


  // --- Top Info Block ---
  const poDate = certificate.PoDate ? format(new Date(certificate.PoDate), 'dd/MM/yyyy') : '';
  const docDate = certificate.DocDate ? format(new Date(certificate.DocDate), 'dd/MM/yyyy') : '';
  
  doc.autoTable({
    startY: contentStartY,
    theme: 'grid',
    styles: { ...tableStyles, cellPadding: 1, fontSize: 8, lineWidth: 0.2, fontStyle: 'bold' },
    body: [
        [
            { content: `Customer Name: ${certificate.AccName || ''}`, colSpan: 2 },
            { content: `TC No.` },
            { content: `${certificate.ApsFullDoc || ''}` },
        ],
        [
            { content: `P.O.No. & Date: ${certificate.PoNo || ''}  ${poDate}` , colSpan: 2},
            { content: `Date` },
            { content: `${docDate}` },
        ],
        [
            { content: `Start Material`},
            { content: `${certificate.SM_RM_Name || ''}`},
            { content: `Size`},
            { content: ``}, // Placeholder for size, to be decided
        ]
    ],
    columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 139 },
        2: { cellWidth: 20 },
        3: { cellWidth: 83 },
    }
  });


  // --- Item Description Table ---
  const itemDescriptionData = certificate.items.map((item, index) => [
      index + 1,
      '', // PO Sr No - not in data
      item.ProductName || '',
      certificate.GradeName || '',
      certificate.DStd_Type || '',
      item.Specification, // Size
      item.HeatNo,
      item.Qty1,
      item.Qty1Unit
  ]);
  // Add empty rows to make it 8
  while (itemDescriptionData.length < 8) {
      itemDescriptionData.push(['','','','','','','','','']);
  }

  doc.autoTable({
    head: [['Sr.\nNo', 'P.O.\nSr.No.', 'Item Description', 'Material Specification', 'Dimension Standard', 'Size', 'Lot No.', 'Qty', 'UOM']],
    body: itemDescriptionData.slice(0, 8), // Ensure max 8 rows
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    styles: { ...tableStyles, halign: 'center', valign: 'middle', cellPadding: 1, lineWidth: 0.2 },
    headStyles: { ...headStyles, cellPadding: 1, valign: 'middle', lineWidth: 0.2 },
    columnStyles: { 
        0: {cellWidth: 8}, 
        1: {cellWidth: 12},
        2: { cellWidth: 65, halign: 'left' }, 
        3: { cellWidth: 35, halign: 'left' },
        4: { cellWidth: 35, halign: 'left' },
        5: {cellWidth: 30}, 
        6: {cellWidth: 30},
        7: {cellWidth: 15, halign:'right'}, 
        8: {cellWidth: 15, halign: 'left'} 
    },
    didParseCell: function(data) {
        if ([2,3,4].includes(data.column.dataKey as number)) {
            data.cell.styles.halign = 'left';
        }
    }
  });

  const bottomTablesStartY = (doc as any).lastAutoTable.finalY;


  // --- Two Column Layout Container ---
  doc.autoTable({
    startY: bottomTablesStartY,
    theme: 'plain',
    body: [['', '']], // Two empty cells for the two columns
    styles: {cellPadding: 0, lineWidth:0, minCellHeight: 80}, // Ensure container is tall enough
    columnStyles: {
        0: { cellWidth: (page_width - (margin * 2)) * 0.65 }, // Left column 65% width
        1: { cellWidth: (page_width - (margin * 2)) * 0.35 }, // Right column 35% width
    },
    didDrawCell: (data) => {
        if (data.section !== 'body') return;

        let finalLeftY = data.cell.y;
        let finalRightY = data.cell.y;
        const leftCellX = data.cell.x;
        const rightCellX = data.cell.x + data.cell.width;

        // --- LEFT COLUMN CONTENT ---
        if (data.column.index === 0) {
            // Chemical Composition
            const allChemElements = ['C%', 'Mn%', 'Si%', 'S%', 'P%', 'Cr%', 'Ni%', 'Mo%', 'Cu%', 'V%', 'CE%'];
            const chemBody = lotDetailsArray.map(lot => {
                const row: (string|number)[] = [lot.HeatNo];
                const chemMap = new Map(lot.ChemicalComp.map(cc => [cc.Element, cc.Value]));
                allChemElements.forEach(col => row.push(chemMap.get(col) as (string|number) ?? '-'));
                return row;
            });
            
            doc.autoTable({
                head: [['Chemical Composition']],
                body: [],
                startY: finalLeftY,
                theme: 'grid', styles: { ...tableStyles, fontSize: 8, fontStyle: 'bold', halign: 'center', lineWidth: 0.2 }, headStyles: {...headStyles, fontSize: 8, minCellHeight: 6, lineWidth: 0.2},
                tableWidth: data.cell.width,
                margin: { left: leftCellX }
            });
            doc.autoTable({
                head: [['Lot No', ...allChemElements]],
                body: chemBody,
                startY: (doc as any).lastAutoTable.finalY,
                theme: 'grid', styles: { ...tableStyles, halign: 'center', cellPadding: 0.5, lineWidth: 0.2 }, headStyles: { ...headStyles, halign: 'center', cellPadding: 0.5, lineWidth: 0.2 },
                tableWidth: data.cell.width,
                margin: { left: leftCellX },
                columnStyles: { 0: { cellWidth: 20 } }
            });
            finalLeftY = (doc as any).lastAutoTable.finalY;

            // Physical Properties
            const allPhysProps = ['Y.S\nN/mm2', 'U.T.S\nN/mm2', 'Elongation\n%', 'RA %', 'Hardness\nBHN'];
            const physBody = lotDetailsArray.map(lot => {
                const row: (string|number)[] = [lot.HeatNo];
                const physMap = new Map(lot.PhysicalProp.map(pp => [pp.Property, pp.Value]));
                allPhysProps.forEach(propName => {
                    const cleanPropName = propName.replace('\n', ' ');
                    row.push(physMap.get(cleanPropName) ?? '-');
                });
                return row;
            });

            doc.autoTable({
                head: [['Physical Properties']],
                startY: finalLeftY + 1,
                theme: 'grid', styles: { ...tableStyles, fontSize: 8, fontStyle: 'bold', halign: 'center', lineWidth: 0.2 }, headStyles: {...headStyles, fontSize: 8, minCellHeight: 6, lineWidth: 0.2},
                tableWidth: data.cell.width,
                margin: { left: leftCellX }
            });
            doc.autoTable({
                head: [['Lot No.', ...allPhysProps]],
                body: physBody,
                startY: (doc as any).lastAutoTable.finalY,
                theme: 'grid', styles: { ...tableStyles, halign: 'center', valign: 'middle', lineWidth: 0.2 }, headStyles: {...headStyles, fontSize: 7, lineWidth: 0.2},
                tableWidth: data.cell.width,
                margin: { left: leftCellX },
                columnStyles: { 0: { cellWidth: 20 } }
            });
            finalLeftY = (doc as any).lastAutoTable.finalY;

            // Other Tests
            doc.autoTable({
                head: [['Other Test Details:']],
                body: certificate.otherTestDetails?.map((test, i) => [`${i+1}. ${test.Test_Desc} - ${test.Test_Result}`]),
                startY: finalLeftY + 1,
                theme: 'grid', styles: {...tableStyles, fontStyle: 'normal', halign: 'left', fontSize: 7, lineWidth: 0.2}, headStyles: {...headStyles, halign: 'left', fontSize: 8, lineWidth: 0.2},
                tableWidth: data.cell.width,
                margin: { left: leftCellX }
            });
            finalLeftY = (doc as any).lastAutoTable.finalY;

            // Remarks
            doc.autoTable({
                head: [['Remarks:']],
                body: certificate.remarks.map((remark, i) => [`${i+1}. ${remark.TcTerms}`]),
                startY: finalLeftY + 1,
                theme: 'grid', styles: {...tableStyles, fontStyle: 'normal', halign: 'left', fontSize: 7, lineWidth: 0.2}, headStyles: {...headStyles, halign: 'left', fontSize: 8, lineWidth: 0.2},
                tableWidth: data.cell.width,
                margin: { left: leftCellX }
            });
        }
        
        // --- RIGHT COLUMN CONTENT ---
        if (data.column.index === 1) {
            
            // Laboratory Details
            const labBody = lotDetailsArray.map(lot => [
                lot.HeatNo,
                lot.LabName,
                lot.Lab_TC_No,
                lot.Lab_TC_Date ? format(new Date(lot.Lab_TC_Date), 'dd/MM/yyyy') : '-'
            ]);

            doc.autoTable({
                head: [['Laboratory Details']],
                startY: finalRightY, 
                theme: 'grid', styles: {...tableStyles, fontSize: 8, lineWidth: 0.2 }, headStyles: {...headStyles, fontStyle: 'bold', halign: 'center', fontSize: 8, lineWidth: 0.2},
                tableWidth: data.cell.width,
                margin: { left: rightCellX - data.cell.width },
            });
             doc.autoTable({
                head: [['Lot No', 'Laboratory Name', 'Report No.', 'Report Dt.']],
                body: labBody,
                startY: (doc as any).lastAutoTable.finalY,
                theme: 'grid', 
                styles: {...tableStyles, fontSize: 7, halign: 'center', valign: 'middle', lineWidth: 0.2 }, 
                headStyles: {...headStyles, fontSize: 7, lineWidth: 0.2},
                tableWidth: data.cell.width,
                margin: { left: rightCellX - data.cell.width },
            });
            finalRightY = (doc as any).lastAutoTable.finalY;

            // Charpy Impact Test
            const charpyBody = lotDetailsArray.flatMap(lot => lot.ImpactTest.map(it => [it.Size, it.Temperature, it.Value1, it.Value2, it.Value3, it.AvgValue]));
            doc.autoTable({
                head: [['Charpy Impact Test (Joules)']],
                startY: finalRightY + 1,
                theme: 'grid', styles: { ...tableStyles, fontSize: 8, fontStyle: 'bold', halign: 'center', lineWidth: 0.2 }, headStyles: {...headStyles, fontSize: 8, minCellHeight: 6, lineWidth: 0.2},
                tableWidth: data.cell.width,
                margin: { left: rightCellX - data.cell.width },
            });
            doc.autoTable({
                head: [['Size', 'TEMP C', 'I', 'II', 'III', 'Average']],
                body: charpyBody.length > 0 ? charpyBody : [['', '', '', '', '', '']],
                startY: (doc as any).lastAutoTable.finalY,
                theme: 'grid', styles: { ...tableStyles, halign: 'center', lineWidth: 0.2 }, headStyles: {...headStyles, lineWidth: 0.2},
                tableWidth: data.cell.width,
                margin: { left: rightCellX - data.cell.width },
            });
            finalRightY = (doc as any).lastAutoTable.finalY;

            // Heat Test Details
             doc.autoTable({
                head: [['Heat Test Details']],
                body: certificate.heatTreatDetails?.map(ht => [ht.Heat_Desc]) || [['-']],
                startY: finalRightY + 1,
                theme: 'grid', styles: { ...tableStyles, fontStyle: 'normal', halign: 'left', fontSize: 7, lineWidth: 0.2}, headStyles: {...headStyles, halign: 'left', fontSize: 8, lineWidth: 0.2},
                tableWidth: data.cell.width,
                margin: { left: rightCellX - data.cell.width },
            });
        }
    }
  });


  // --- Footer Section ---
  const companyTitle = certificate.BranchId === 2 ? "For FORGED INDUSTRIAL CORPORATION" : "For NEW INDIA MANUFACTURING CO";
  
  doc.setFontSize(9).setFont('helvetica', 'bold');
  doc.text('SURVEYOR', margin, footerStartY + 10, { align: 'left' });
  doc.text(companyTitle, page_width - margin, footerStartY + 10, { align: 'right' });
  doc.text('Auth. Signatory', page_width - margin, footerStartY + 15, { align: 'right' });

  // Save the PDF
  doc.save(`Certificate-${certificate.ApsFullDoc}.pdf`);
};
