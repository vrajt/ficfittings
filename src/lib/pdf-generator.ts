
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Certificate } from './types';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export const generateCertificatePDF = (certificate: Certificate) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  }) as jsPDFWithAutoTable;

  // --- Mock Data based on Certificate ---
  const itemDescriptionData = [
    { sr: '1', poSr: '1', desc: 'coupling', spec: 'ASTM A105', dim: 'ASME B16.11', size: '15 nb', lot: 'N514', qty: '10', uom: 'NOS' },
    ...Array.from({ length: 9 }, (_, i) => ({ sr: `${i + 2}`, poSr: '', desc: '', spec: '', dim: '', size: '', lot: '', qty: '-', uom: '' })),
  ];

  const chemicalData = [
    { lot: 'N514', c: 0.190, mn: 1.200, si: 0.200, s: 0.018, p: 0.022, cr: 0.011, ni: 0.003, mo: 0.002, v: 0.007, cu: 0.006, ce: 0.394 },
  ];

  const physicalData = [
    { lot: 'N514', ys: 343.58, uts: 573.06, elong: 38.28, ra: 56.68, hardness: '169,169,170' },
  ];
  
  const charpyData = [
      { size: '', tempc: '', i: '', ii: '', iii: '', avg: '1.Not Applicable' },
  ];

  // --- PDF Generation ---
  const page_width = doc.internal.pageSize.getWidth();
  const margin = 10;
  const tableStyles = {
    fontSize: 8,
    cellPadding: 1,
    lineWidth: 0.1,
    lineColor: 0,
    fillColor: false,
    textColor: 0,
  };
  const headStyles = {
    fontStyle: 'bold',
    fillColor: false,
    textColor: 0,
    lineColor: 0,
  };

  // Header
  doc.setFontSize(18).setFont('helvetica', 'bold');
  doc.text('FORGED INDUSTRIAL CORPORATION', page_width / 2, margin + 5, { align: 'center' });
  doc.setFontSize(10).setFont('helvetica', 'normal');
  doc.text('AN ISO 9001:2015 Certified Company', page_width / 2, margin + 10, { align: 'center' });
  doc.text('Manufacturers, Dealers & Stockist of: Forged Pipe Fitting & Flanges In Carbon Steel, Stainless Steel & Alloy Steel', page_width / 2, margin + 14, { align: 'center' });
  
  // Title
  doc.setFontSize(12).setFont('helvetica', 'bold');
  doc.text('TEST CERTIFICATE', page_width / 2, margin + 22, { align: 'center' });
  doc.setFontSize(9).setFont('helvetica', 'normal');
  doc.text('EN-10204-3.1', page_width / 2, margin + 26, { align: 'center' });

  // Top Info Block
  doc.autoTable({
    startY: margin + 28,
    theme: 'grid',
    styles: { ...tableStyles, cellPadding: 1, fontStyle: 'normal' },
    body: [
      [
        { content: 'Customer Name', styles: { fontStyle: 'bold' } }, { content: 'Airoil Flaregas Pvt.Ltd.' },
        { content: 'TC No.', styles: { fontStyle: 'bold' } }, { content: certificate.certificateNumber },
        { content: 'Date', styles: { fontStyle: 'bold' } }, { content: certificate.date },
      ],
      [
        { content: 'P.O.No. & Date', styles: { fontStyle: 'bold' } }, { content: 'jhgjgjh Date: 11/06/2025' },
        { content: 'Start Material', styles: { fontStyle: 'bold' } }, { content: 'C.S.BAR', colSpan: 3 },
      ]
    ],
    columnStyles: {
      0: { cellWidth: 35 }, 1: { cellWidth: 83 },
      2: { cellWidth: 30 }, 3: { cellWidth: 40 },
      4: { cellWidth: 20 }, 5: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
        data.cell.styles.lineWidth = 0.1;
        data.cell.styles.lineColor = 0;
        data.cell.styles.fillColor = false;
    }
  });

  // Item Description Table
  doc.autoTable({
    head: [['Sr.No', 'P.O.\nSr.No.', 'Item Description', 'Material\nSpecification', 'Dimension\nStandard', 'Size', 'Lot No.', 'Qty', 'UOM']],
    body: itemDescriptionData.map(i => [i.sr, i.poSr, i.desc, i.spec, i.dim, i.size, i.lot, i.qty, i.uom]),
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    styles: { ...tableStyles, halign: 'center', valign: 'middle', minCellHeight: 6 },
    headStyles: headStyles,
    columnStyles: { 2: { cellWidth: 60, halign: 'left' }, 3: {cellWidth: 35}, 4: {cellWidth: 35} },
  });

  const bottomTablesStartY = (doc as any).lastAutoTable.finalY + 2;

  // --- Left Column ---
  let leftColumnFinalY = bottomTablesStartY;

  // Chemical Composition
  doc.autoTable({
      head: [['Chemical Composition']],
      startY: leftColumnFinalY,
      theme: 'grid', styles: { ...tableStyles, fontSize: 9, fontStyle: 'bold', halign: 'center' }, headStyles: {...headStyles, minCellHeight: 7},
      margin: { right: page_width / 2 }
  });
  doc.autoTable({
      head: [['Lot No.', 'C%', 'Mn%', 'Si%', 'S%', 'P%', 'Cr%', 'Ni%', 'Mo%', 'V%', 'Cu%', 'CE%']],
      body: chemicalData.map(r => [r.lot, r.c, r.mn, r.si, r.s, r.p, r.cr, r.ni, r.mo, r.v, r.cu, r.ce]),
      startY: (doc as any).lastAutoTable.finalY,
      theme: 'grid', styles: { ...tableStyles, halign: 'center', minCellHeight: 6 }, headStyles: headStyles,
      margin: { right: page_width / 2 }
  });
  leftColumnFinalY = (doc as any).lastAutoTable.finalY;

  // Physical Properties
  doc.autoTable({
      head: [['Physical Properties']],
      startY: leftColumnFinalY + 2,
      theme: 'grid', styles: { ...tableStyles, fontSize: 9, fontStyle: 'bold', halign: 'center' }, headStyles: {...headStyles, minCellHeight: 7},
      margin: { right: page_width / 2 }
  });
  doc.autoTable({
      head: [['Lot No.', 'Y.S\nN/mm2', 'U.T.S\nN/mm2', 'Elongation\n%', 'RA%', 'Hardness\nBHN']],
      body: physicalData.map(r => [r.lot, r.ys, r.uts, r.elong, r.ra, r.hardness]),
      startY: (doc as any).lastAutoTable.finalY,
      theme: 'grid', styles: { ...tableStyles, halign: 'center', valign: 'middle', minCellHeight: 6 }, headStyles: headStyles,
      columnStyles: { 5: { cellWidth: 40 } },
      margin: { right: page_width / 2 }
  });
  leftColumnFinalY = (doc as any).lastAutoTable.finalY;

  // Other Test & Remarks
  doc.autoTable({
    head: [['Other Test Details:']],
    body: [['1. Dye Penetrant Test Done Found Satisfactory']],
    startY: leftColumnFinalY + 2,
    theme: 'grid', styles: tableStyles, headStyles: headStyles,
    margin: { right: page_width / 2 }
  });
  leftColumnFinalY = (doc as any).lastAutoTable.finalY;

  doc.autoTable({
      head: [['Remarks:']],
      body: [
          ['1. We certify that the materials confirm to the dimension and material specification of the order'],
          ['2. Marking - Monogram / Size / Schedule / Rating / Spec / Lot No.'],
      ],
      startY: leftColumnFinalY,
      theme: 'grid', styles: tableStyles, headStyles: headStyles,
      margin: { right: page_width / 2 }
  });
  leftColumnFinalY = (doc as any).lastAutoTable.finalY;

  // --- Right column ---
  let rightColumnFinalY = bottomTablesStartY;
  const rightColX = page_width / 2 + margin / 2;

  // Laboratory Details
  doc.autoTable({
      head: [['Laboratory Details']],
      body: [
          [{content: 'Report No.', styles: {fontStyle: 'bold'}}, 'A/3304', {content: 'Report Date', styles: {fontStyle: 'bold'}}, '11/06/2025'],
          [{content: 'Laboratory Name', styles: {fontStyle: 'bold', halign: 'left'}}, {content: 'Industrial Metal Test Lab P.L.', colSpan: 3, styles: {halign: 'left'}}]
      ],
      startY: rightColumnFinalY, 
      theme: 'grid', styles: tableStyles, headStyles: {...headStyles, fontStyle: 'bold', halign: 'center'},
      margin: { left: rightColX },
      tableWidth: page_width - rightColX - margin,
  });
  rightColumnFinalY = (doc as any).lastAutoTable.finalY;

  // Charpy Impact Test
  doc.autoTable({
      head: [['Charpy Impact Test (Joules)']],
      startY: rightColumnFinalY + 2,
      theme: 'grid', styles: { ...tableStyles, fontSize: 9, fontStyle: 'bold', halign: 'center' }, headStyles: {...headStyles, minCellHeight: 7},
      margin: { left: rightColX },
      tableWidth: page_width - rightColX - margin,
  });
  doc.autoTable({
      head: [['Size', 'TEMP C', 'I', 'II', 'III', 'Average']],
      body: charpyData.map(r => [r.size, r.tempc, r.i, r.ii, r.iii, {content: r.avg, colSpan: 1, styles: {halign: 'left'}}]),
      startY: (doc as any).lastAutoTable.finalY,
      theme: 'grid', styles: { ...tableStyles, halign: 'center', minCellHeight: 6 }, headStyles: headStyles,
      margin: { left: rightColX },
      tableWidth: page_width - rightColX - margin,
  });
  rightColumnFinalY = (doc as any).lastAutoTable.finalY;

  // Heat Test Details
  doc.autoTable({
      head: [['Heat Test Details']],
      body: [['']],
      startY: rightColumnFinalY + 2,
      theme: 'grid', styles: { ...tableStyles, fontSize: 9, fontStyle: 'bold', halign: 'center', minCellHeight: 10 }, headStyles: headStyles,
      margin: { left: rightColX },
      tableWidth: page_width - rightColX - margin,
  });
  rightColumnFinalY = (doc as any).lastAutoTable.finalY;

  // Footer
  const finalY = Math.max(leftColumnFinalY, rightColumnFinalY);
  doc.setFontSize(9).setFont('helvetica', 'bold');
  doc.text('For FORGED INDUSTRIAL CORPORATION', page_width - 75, finalY + 15);
  doc.text('SURVEYOR', margin + 15, finalY + 25);
  doc.text('Auth. Signatory', page_width - margin - 15, finalY + 25, { align: 'right' });

  doc.setFontSize(8).setFont('helvetica', 'normal');
  const footerText1 = `Regd. Office :- B.P.T. Plot No. 54, Gala No. 7, Ghoradeo 2 st Cross Lane, Mumbai - 400033. Tel.: 23725300 Website: www.ficfittings.com`;
  const footerText2 = `Factory :- Plot No. A-360, T.T.C. Industrial Area, M.I.D.C., Mahape, Dist. Thane, Navi Mumbai-400710. Tel: 27781861 | Email: nimcofittings@hotmail.com`;
  
  doc.text(footerText1, page_width / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
  doc.text(footerText2, page_width / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  // Save the PDF
  doc.save(`Certificate-${certificate.certificateNumber}.pdf`);
};
