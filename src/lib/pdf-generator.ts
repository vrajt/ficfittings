
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
                            uniquePhysicals.set(rec.Parm_Name, {
                              Property: rec.Parm_Name,
                              Value: rec.Test_ValueC,
                              Parm_UOM: rec.Parm_UOM || '',
                            });
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
  // Keep a deterministic item order for PDF (same order basis across item table + lot sections).
  // Prefer PId when present, otherwise preserve incoming order.
  const orderedItems = [...certificate.items]
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aPidRaw = Number(a.item.PId);
      const bPidRaw = Number(b.item.PId);
      const aPid = Number.isFinite(aPidRaw) ? aPidRaw : Number.MAX_SAFE_INTEGER;
      const bPid = Number.isFinite(bPidRaw) ? bPidRaw : Number.MAX_SAFE_INTEGER;
      return aPid === bPid ? a.index - b.index : aPid - bPid;
    })
    .map(({ item }) => item);
  const firstItemHeatNo = orderedItems.find((item) => (item.HeatNo || '').trim())?.HeatNo?.trim() || '';
  const uniqueHeatNos = [...new Set(orderedItems.map(item => item.HeatNo).filter(Boolean))];
  const lotDetailsArray = uniqueHeatNos.map(heatNo => getLotDetails(allLotData, heatNo as string)).filter(Boolean) as LotTestValue[];
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const leftMargin = 6;
  const rightMargin = 8;
  const footerEndY = pageHeight - 22;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  // Left pane (item cols 1–5, chem, phys|charpy) vs right (Size…UOM, lab, heat). Wider left = separator further right; right columns get less width.
  const itemLeftRatio = 0.625;
  const itemLeftWidth = contentWidth * itemLeftRatio;
  const itemRightWidth = contentWidth - itemLeftWidth;
  const separatorX = leftMargin + itemLeftWidth;

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
  const leftLabelDividerX = leftMargin + 2 + Math.max(customerNameLabelWidth, doc.getTextWidth('P.O.No. & Date:')) + 2.5;
  doc.setFont('helvetica', 'normal');
  doc.text(certificate.AccName || '', leftLabelDividerX + 2, currentY + 5);
  
  // P.O.No. & Date
  doc.setFont('helvetica', 'bold');
  doc.text('P.O.No. & Date:', leftMargin + 2, currentY + 9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${certificate.PoNo || ''} Date: ${poDate}`, leftLabelDividerX + 2, currentY + 9);
 
  // Right side - TC No. and Date on the same line
  doc.setFont('helvetica', 'bold');
  doc.text('TC No.:', midPoint + 2, currentY + 5);
  const tcNoLabelWidth = doc.getTextWidth('TC No.:');
  const rightLabelDividerX = midPoint + 2 + Math.max(tcNoLabelWidth, doc.getTextWidth('Start Material:')) + 2.5;
  doc.setFont('helvetica', 'normal');
  doc.text(certificate.ApsFullDoc || '', rightLabelDividerX + 2, currentY + 5);
  
  const dateText = `Date: ${docDate}`;
  const dateColumnRightX = leftMargin + contentWidth;
  const rightTopEndX = dateColumnRightX - 2;
  const dateColumnLeftX = Math.max(
    rightLabelDividerX + 18,
    dateColumnRightX - doc.getTextWidth(dateText) - 4,
  );
  doc.setFont('helvetica', 'normal');
  doc.text(dateText, rightTopEndX, currentY + 5, { align: 'right' });
  
  // Start Material
  doc.setFont('helvetica', 'bold');
  doc.text('Start Material:', midPoint + 2, currentY + 9);
  const startMaterialLabelWidth = doc.getTextWidth('Start Material:');
  doc.setFont('helvetica', 'normal');
  doc.text(certificate.SM_RM_Name || '', rightLabelDividerX + 2, currentY + 9);
  
  doc.setLineWidth(0.4);
  // Internal row divider so top details appear in a clear 2x2 grid.
  doc.line(leftMargin, currentY + 6, leftMargin + contentWidth, currentY + 6);
  doc.line(leftMargin, currentY + topInfoHeight, leftMargin + contentWidth, currentY + topInfoHeight); // Horizontal line
  doc.line(leftLabelDividerX, currentY, leftLabelDividerX, currentY + topInfoHeight); // Left label/value separator
  doc.line(rightLabelDividerX, currentY, rightLabelDividerX, currentY + topInfoHeight); // Right label/value separator
  doc.line(dateColumnLeftX, currentY, dateColumnLeftX, currentY + 6); // Date column left border
  doc.line(dateColumnRightX, currentY, dateColumnRightX, currentY + 6); // Date column right border
  doc.line(midPoint, currentY, midPoint, currentY + topInfoHeight); // Vertical line
  
  currentY += topInfoHeight;

  const labBody = lotDetailsArray
    .map((lot) => [
      lot.Lab_TC_No,
      lot.Lab_TC_Date ? format(new Date(lot.Lab_TC_Date), 'dd/MM/yyyy') : '',
      lot.LabName,
    ])
    .filter((row) => row.some((cell) => cell));

  const heatTestBodyForRightPane =
    lotDetailsArray.length > 0
      ? lotDetailsArray.map((lot, lotIndex) => {
          if (
            certificate.heatTreatDetails &&
            certificate.heatTreatDetails.length > 0 &&
            lotIndex < certificate.heatTreatDetails.length
          ) {
            const test = certificate.heatTreatDetails[lotIndex];
            return [`${lotIndex + 1}. ${test.Heat_Desc}`];
          }
          return ['-'];
        })
      : [];

  // --- Item table: single autoTable so every row has one shared height (avoids misaligned horizontals from two tables) ---
  const itemDescriptionBody: (string | number)[][] = [];
  const requiredRows = orderedItems.length < 4 ? 8 : orderedItems.length;
  const itemTableStartY = currentY;

  for (let i = 0; i < requiredRows; i++) {
    const item = orderedItems[i];
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

  const itemTableStyles = {
    lineWidth: 0.4,
    font: 'helvetica',
    valign: 'middle',
    fontSize: 7,
    cellPadding: 1,
    textColor: [0, 0, 0],
    lineColor: [0, 0, 0],
  } as const;
  const itemHeadStyles = {
    fontStyle: 'bold',
    fillColor: [255, 255, 255],
    textColor: [0, 0, 0],
    halign: 'center',
    valign: 'middle',
    fontSize: 7,
    cellPadding: 1,
    lineColor: [0, 0, 0],
  } as const;

  // Give Sr.No and P.O. Sr.No narrower widths; keep totals aligned with left/right pane widths.
  const leftItemColWeights = [0.28, 0.44, 1.78, 1.2, 1.1];
  const rightItemColWeights = [1.0, 1.3, 0.7, 0.8];
  const leftItemWeightTotal = leftItemColWeights.reduce((sum, weight) => sum + weight, 0);
  const rightItemWeightTotal = rightItemColWeights.reduce((sum, weight) => sum + weight, 0);
  const leftItemColWidths = leftItemColWeights.map((weight) => (itemLeftWidth * weight) / leftItemWeightTotal);
  const rightItemColWidths = rightItemColWeights.map((weight) => (itemRightWidth * weight) / rightItemWeightTotal);

  doc.autoTable({
    head: [
      [
        'Sr.\nNo',
        'P.O.\nSr.No.',
        'Item Description',
        'Material Specification',
        'Dimension Standard',
        'Size',
        'Heat No / Lot No.',
        'Qty',
        'UOM',
      ],
    ],
    body: itemDescriptionBody,
    startY: itemTableStartY,
    theme: 'grid',
    tableWidth: contentWidth,
    margin: { left: leftMargin, right: rightMargin },
    styles: itemTableStyles,
    headStyles: itemHeadStyles,
    columnStyles: {
      0: { halign: 'center', cellWidth: leftItemColWidths[0] },
      1: { halign: 'center', cellWidth: leftItemColWidths[1] },
      2: { halign: 'left', cellWidth: leftItemColWidths[2] },
      3: { halign: 'center', cellWidth: leftItemColWidths[3] },
      4: { halign: 'center', cellWidth: leftItemColWidths[4] },
      5: { halign: 'center', cellWidth: rightItemColWidths[0] },
      6: { halign: 'center', cellWidth: rightItemColWidths[1] },
      7: { halign: 'center', cellWidth: rightItemColWidths[2] },
      8: { halign: 'left', cellWidth: rightItemColWidths[3] },
    },
  });
  const itemSectionEndY = (doc as any).lastAutoTable?.finalY || itemTableStartY;

  let chemBottomY = itemSectionEndY;
  let rightPaneBottomY = itemSectionEndY;
  let chemY = itemSectionEndY;
  
  // Keep chemical columns in first-seen data order across lots (no hardcoded standard ordering).
  const allChemElements: string[] = [];
  const seenChemElements = new Set<string>();
  lotDetailsArray.forEach((lot) => {
    lot.ChemicalComp.forEach((cc) => {
      const rawElement = (cc.Element || '').trim();
      if (!rawElement) return;
      const normalized = rawElement.replace(/\s+/g, '').replace(/%/g, '').toLowerCase();
      if (!seenChemElements.has(normalized)) {
        seenChemElements.add(normalized);
        allChemElements.push(rawElement);
      }
    });
  });
  
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
    const chemCellW = itemLeftWidth / chemHeader.length;
    const chemColumnStyles: Record<number, { cellWidth: number; halign: 'left' | 'center'; fontStyle?: 'bold' }> = {};
    for (let ci = 0; ci < chemHeader.length; ci++) {
      chemColumnStyles[ci] = {
        cellWidth: chemCellW,
        halign: ci === 0 ? 'left' : 'center',
        ...(ci === 0 ? { fontStyle: 'bold' } : {}),
      };
    }

    doc.autoTable({
        head: [
          [{ content: 'Chemical Composition', colSpan: chemHeader.length, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255] } }],
          chemHeader
        ],
        body: chemBody,
        startY: chemY,
        theme: 'grid',
        tableWidth: itemLeftWidth,
        margin: { left: leftMargin },
        styles: { lineWidth: 0.4, fontSize: 7, cellPadding: 1, halign: 'center', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
        headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0] },
        columnStyles: chemColumnStyles,
    });
    chemY = (doc as any).lastAutoTable?.finalY || chemY;
    chemBottomY = chemY;
  }

  // --- Right pane: Laboratory Details, then Heat Test Details (flush under item table) ---
  let rightStackY = itemSectionEndY;
  if (labBody.length > 0) {
    doc.autoTable({
      head: [
        [{ content: 'Laboratory Details', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255] } }],
        ['Report No.', 'Report Date', 'Laboratory Name'],
      ],
      body: labBody,
      startY: rightStackY,
      theme: 'grid',
      tableWidth: itemRightWidth,
      margin: { left: separatorX },
      styles: { lineWidth: 0.4, fontSize: 7, cellPadding: 1, halign: 'center', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
      headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'center', valign: 'middle', fontSize: 7, cellPadding: 1, lineColor: [0, 0, 0] },
    });
    rightStackY = (doc as any).lastAutoTable?.finalY || rightStackY;
  }
  if (heatTestBodyForRightPane.length > 0) {
    doc.autoTable({
      head: [[{ content: 'Heat Test Details', styles: { fontStyle: 'bold' } }]],
      body: heatTestBodyForRightPane,
      startY: rightStackY,
      theme: 'grid',
      tableWidth: itemRightWidth,
      margin: { left: separatorX },
      styles: { lineWidth: 0.4, fontSize: 7, cellPadding: 1, halign: 'left', textColor: [0, 0, 0], lineColor: [0, 0, 0] },
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
    rightStackY = (doc as any).lastAutoTable?.finalY || rightStackY;
  }
  rightPaneBottomY = rightStackY;

  // --- Physical Properties + Charpy: left pane only, directly below Chemical Composition ---
  let leftColumnEndY = chemBottomY;
  if (lotDetailsArray.length > 0) {
    const physColumnWidth = itemLeftWidth * 0.5;
    const physStartY = chemBottomY;
    
    const normalizePhysicalKey = (value: string) =>
      value.trim().replace(/\s+/g, '').replace(/[.%]/g, '').toLowerCase();

    // Keep stable value mapping, but take display labels from first lot's DB parameter names.
    const propMap = {
      'Y.S': ['Y.S', 'YS', 'Y.S.'],
      'U.T.S': ['U.T.S', 'UTS', 'U.T.S.'],
      'Elongation': ['Elongation', 'Elongation %', 'Elongation(%)'],
      'RA': ['RA', 'RA %', 'R.A', 'R.A.'],
      'Hardness': ['Hardness', 'Hardness (BHN)', 'Hardness BHN'],
    };
    const cleanParmUom = (uom: string) => {
      const trimmed = (uom || '').trim();
      if (!trimmed) return '';
      // Source data often carries a trailing "1" marker (e.g. N/mm21, BHN1).
      return trimmed.replace(/1$/, '');
    };
    const headerSourceLot =
      lotDetailsArray.find(
        (lot) => (lot.HeatNo || '').trim().toLowerCase() === firstItemHeatNo.toLowerCase(),
      ) || lotDetailsArray[0];
    const firstLotPhysProps = (headerSourceLot?.PhysicalProp || []).filter(
      (pp) => (pp.Property || '').trim().length > 0,
    );
    const getPhysicalHeaderFromFirstLot = (aliases: string[], fallback: string) => {
      const aliasKeys = aliases.map((a) => normalizePhysicalKey(a));
      const found = firstLotPhysProps.find((pp) =>
        aliasKeys.includes(normalizePhysicalKey((pp.Property || '').trim())),
      );
      if (!found) return { name: fallback, uom: '' };
      const propName = (found.Property || '').trim() || fallback;
      const parmUom = cleanParmUom(found.Parm_UOM || found.UOM || '');
      return { name: propName, uom: parmUom };
    };
    const ysHeader = getPhysicalHeaderFromFirstLot(propMap['Y.S'], 'Y.S');
    const utsHeader = getPhysicalHeaderFromFirstLot(propMap['U.T.S'], 'U.T.S');
    const elongHeader = getPhysicalHeaderFromFirstLot(propMap['Elongation'], 'Elongation %');
    const raHeader = getPhysicalHeaderFromFirstLot(propMap['RA'], 'RA %');
    const hardnessHeader = getPhysicalHeaderFromFirstLot(propMap['Hardness'], 'Hardness');
    const physHeader = [
      'Lot No.',
      ysHeader.uom ? `${ysHeader.name} ${ysHeader.uom}` : ysHeader.name,
      utsHeader.uom ? `${utsHeader.name} ${utsHeader.uom}` : utsHeader.name,
      elongHeader.uom ? `${elongHeader.name} ${elongHeader.uom}` : elongHeader.name,
      raHeader.uom ? `${raHeader.name} ${raHeader.uom}` : raHeader.name,
      hardnessHeader.uom ? `${hardnessHeader.name} ${hardnessHeader.uom}` : hardnessHeader.name,
    ];

    const physBody = lotDetailsArray.map((lot) => {
      const row: (string | number)[] = [lot.HeatNo];
      const physMap = new Map(
        lot.PhysicalProp.map((pp) => [normalizePhysicalKey((pp.Property || '').trim()), pp.Value]),
      );

      (Object.keys(propMap) as Array<keyof typeof propMap>).forEach((key) => {
        const aliases = propMap[key].map((alias) => normalizePhysicalKey(alias));
        const value = aliases.map((alias) => physMap.get(alias)).find((v) => v !== undefined);
        row.push((value as string | number | undefined) ?? '-');
      });
      return row;
    });

    const impactBody = lotDetailsArray.map(lot => {
      if (lot.ImpactTest && lot.ImpactTest.length > 0) {
        const it = lot.ImpactTest[0];
        return [
          it.Size ?? '-',
          it.Temperature ?? '-',
          it.Value1 ?? '-',
          it.Value2 ?? '-',
          it.Value3 ?? '-',
          it.AvgValue ?? '-',
        ];
      }
      return ['-', '-', '-', '-', '-', '-'];
    });

    const physCharpyBody = lotDetailsArray.map((_, idx) => [
      ...physBody[idx],
      ...impactBody[idx],
    ]);

    const charpySubHead = ['Size:', 'TEMP C', 'I', 'II', 'III', 'Average'];
    // Rebalance widths so common physical values stay on one line.
    const physColumnWeights = [1.35, 1.15, 1.2, 1.05, 0.85, 1.4];
    const charpyColumnWeights = [0.95, 1.0, 0.7, 0.7, 0.7, 0.95];
    const physCharpyColWeights = [...physColumnWeights, ...charpyColumnWeights];
    const physCharpyWeightTotal = physCharpyColWeights.reduce((sum, w) => sum + w, 0);
    const physCharpyColumnStyles: Record<number, { cellWidth: number; halign: 'left' | 'center'; fontStyle?: 'bold' }> = {};
    for (let c = 0; c < physCharpyColWeights.length; c++) {
      physCharpyColumnStyles[c] = {
        cellWidth: (itemLeftWidth * physCharpyColWeights[c]) / physCharpyWeightTotal,
        halign: c === 0 ? 'left' : 'center',
        ...(c === 0 ? { fontStyle: 'bold' } : {}),
      };
    }

    let physY = physStartY;
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
          {
            content: 'Charpy Impact Test (Joules)',
            colSpan: 6,
            styles: { halign: 'center', fontStyle: 'bold', fillColor: [255, 255, 255] },
          },
        ],
        [...physHeader, ...charpySubHead],
      ],
      body: physCharpyBody,
      startY: physStartY,
      theme: 'grid',
      tableWidth: itemLeftWidth,
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
      columnStyles: physCharpyColumnStyles,
    });
    physY = (doc as any).lastAutoTable?.finalY || physY;

    leftColumnEndY = physY;
  }

  const midSectionEndY = Math.max(leftColumnEndY, rightPaneBottomY);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);
  doc.line(separatorX, itemTableStartY, separatorX, midSectionEndY);
  doc.setLineWidth(0.4);

  currentY = midSectionEndY;

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
        theme: 'plain',
        tableWidth: remarksColumnWidth,
        margin: { left: leftMargin },
        styles: { lineWidth: 0, fontSize: 7, cellPadding: 1, halign: 'left', textColor: [0, 0, 0] },
        headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], halign: 'left', valign: 'middle', fontSize: 7, cellPadding: 1, lineWidth: 0 },
        bodyStyles: { lineWidth: 0 },
    });
  }

  // Draw a clean full-height border for the remarks block so its right edge
  // aligns in length and weight with adjacent section borders.
  doc.setLineWidth(0.4);
  doc.rect(leftMargin, remarksStartY, remarksColumnWidth, footerLineY - remarksStartY);

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
  const companyTitleY = remarksStartY + 4;
  const signatureY = footerLineY - 12;
  
  doc.setFontSize(9).setFont('helvetica', 'normal');
  doc.text(companyTitle, rightColumnStartX + signatureColumnWidth - 2, companyTitleY, { align: 'right' });
  doc.text('Auth. Signatory', rightColumnStartX + signatureColumnWidth - 2, signatureY + 8, { align: 'right' });

  // Save the PDF
  doc.save(`Certificate-${certificate.ApsFullDoc}.pdf`);
};
