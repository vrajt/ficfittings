
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Certificate } from './types';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export const generateCertificatePDF = (certificate: Certificate) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;

  // --- Mock Data based on Certificate ---
  // In a real app, this data would come from the certificate object or related records
  const itemDescriptionData = [
    { sr: '1', poSr: 'PO/123', desc: 'Forged Pipe Flange', spec: 'ASTM A105', dim: 'ASME B16.11', size: '15 NB', lot: 'N514', qty: '10', uom: 'NOS' },
    // ... more items
  ];

  const chemicalData = [
    { lot: 'N514', c: 0.190, mn: 1.200, s: 0.200, p: 0.018, si: 0.022, cr: 0.011, ni: 0.003, mo: 0.002, v: 0.007, cu: 0.006, ce: 0.394 },
  ];

  const physicalData = [
    { lot: 'N514', ys: 343.58, uts: 573.06, elong: 38.28, ra: 56.68, hardness: '169,169,170' },
  ];

  const charpyData = [
      { i: 'N/A', ii: 'N/A', iii: 'N/A', avg: 'N/A', temp: 'N/A' },
  ];
  
  // --- PDF Generation ---
  
  // Header
  doc.setFontSize(14).setFont('helvetica', 'bold');
  doc.text('FORGED INDUSTRIAL CORPORATION', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
  doc.setFontSize(9).setFont('helvetica', 'normal');
  doc.text('AN ISO 9001:2015 Certified Company', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  doc.text('Manufacturers, Dealers & Stockist of: Forged Pipe Fitting & Flanges In Carbon Steel, Stainless Steel & Alloy Steel', doc.internal.pageSize.getWidth() / 2, 24, { align: 'center' });
  
  // Title
  doc.setFontSize(12).setFont('helvetica', 'bold');
  doc.rect(80, 28, 50, 7);
  doc.text('TEST CERTIFICATE', doc.internal.pageSize.getWidth() / 2, 33, { align: 'center' });
  doc.setFontSize(8).setFont('helvetica', 'normal');
  doc.text('EN-10204-3.1', 118, 36);

  // Top Info Box
  doc.rect(14, 40, 182, 18);
  doc.autoTable({
    startY: 40.5,
    margin: { left: 14.5, right: 14.5 },
    body: [
      [{ content: `Customer Name: ${certificate.customerName}`, styles: { fontStyle: 'bold' } }, { content: `TC No.: ${certificate.certificateNumber}`, styles: { fontStyle: 'bold' } }, { content: `Date: ${certificate.date}`, styles: { fontStyle: 'bold' } }],
      [{ content: 'P.O.No. & Date: PO/123 - 11/06/2025', styles: { fontStyle: 'bold' } }, { content: 'Start Material: C.S.BAR', styles: { fontStyle: 'bold' } }, { content: 'ISO 9001:2015', styles: { fontStyle: 'bold' } }],
    ],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 0.5 },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 60 }, 2: { cellWidth: 'auto' } },
  });

  // Item Description Table
  doc.autoTable({
    head: [['Sr.No', 'P.O.\nSr.No.', 'Item Description', 'Material\nSpecification', 'Dimension\nStandard', 'Size', 'Lot No.', 'Qty', 'UOM']],
    body: itemDescriptionData.map(i => [i.sr, i.poSr, i.desc, i.spec, i.dim, i.size, i.lot, i.qty, i.uom]),
    startY: (doc as any).lastAutoTable.finalY + 2,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
    columnStyles: { 2: { cellWidth: 40 } },
  });

  const tableStartY = (doc as any).lastAutoTable.finalY + 5;

  // --- Two Column Layout Start ---
  
  // Left Column
  doc.autoTable({
    head: [['Chemical Composition']],
    startY: tableStartY,
    theme: 'plain',
    styles: { fontSize: 9, fontStyle: 'bold', halign: 'center' },
    margin: { right: 107 } // Left column
  });
  doc.autoTable({
    head: [['Lot No.', 'C%', 'Mn%', 'S%', 'P%', 'Si%', 'Cr%', 'Ni%', 'Mo%', 'V%', 'Cu%', 'CE%']],
    body: chemicalData.map(r => [r.lot, r.c, r.mn, r.s, r.p, r.si, r.cr, r.ni, r.mo, r.v, r.cu, r.ce]),
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    styles: { fontSize: 6, cellPadding: 1, halign: 'center' },
    headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
    margin: { right: 107 } // Left column
  });
  const leftCol1Y = (doc as any).lastAutoTable.finalY;

  doc.autoTable({
    head: [['Physical Properties']],
    startY: leftCol1Y + 3,
    theme: 'plain',
    styles: { fontSize: 9, fontStyle: 'bold', halign: 'center' },
    margin: { right: 107 }
  });
  doc.autoTable({
    head: [['Lot No.', 'Y.S\nN/mm2', 'U.T.S\nN/mm2', 'Elongation\n%', 'RA%', 'Hardness\nBHN']],
    body: physicalData.map(r => [r.lot, r.ys, r.uts, r.elong, r.ra, r.hardness]),
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    styles: { fontSize: 6, cellPadding: 1, halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
    margin: { right: 107 }
  });
  const leftCol2Y = (doc as any).lastAutoTable.finalY;

  doc.autoTable({
    head: [['Other Test Details:']],
    body: [
      ['1. Dye Penetrant Test Done Found Satisfactory'],
      ['2. We certify that the materials confirm to the dimension and material specification of the order'],
    ],
    startY: leftCol2Y + 3,
    theme: 'grid',
    styles: { fontSize: 8, fontStyle: 'bold', cellPadding: 1 },
    headStyles: { fillColor: false, textColor: 20 },
    margin: { right: 107 }
  });
  const leftColFinalY = (doc as any).lastAutoTable.finalY;


  // Right Column
  doc.autoTable({
    head: [['Charpy Impact Test (Joules)']],
    startY: tableStartY,
    theme: 'plain',
    styles: { fontSize: 9, fontStyle: 'bold', halign: 'center' },
    margin: { left: 107 } // Right column
  });
  doc.autoTable({
    head: [['I', 'II', 'III', 'Average', 'TEMP C']],
    body: charpyData.map(r => [r.i, r.ii, r.iii, r.avg, r.temp]),
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    styles: { fontSize: 6, cellPadding: 1, halign: 'center' },
    headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
    margin: { left: 107 }
  });
  const rightCol1Y = (doc as any).lastAutoTable.finalY;

  doc.autoTable({
    head: [['Laboratory Details']],
    startY: rightCol1Y + 3,
    theme: 'plain',
    styles: { fontSize: 9, fontStyle: 'bold', halign: 'center' },
    margin: { left: 107 }
  });
  doc.autoTable({
    body: [
      ['Report No: A/3304', 'Report Date: 11/06/2025'],
      [{content: 'Laboratory Name: Industrial Metal Test Lab P.L.', colSpan: 2, styles: {fontStyle: 'normal'}}],
    ],
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1, fontStyle: 'bold' },
    margin: { left: 107 }
  });
  const rightCol2Y = (doc as any).lastAutoTable.finalY;

   doc.autoTable({
    head: [['Heat Test Details']],
    startY: rightCol2Y + 3,
    theme: 'plain',
    styles: { fontSize: 9, fontStyle: 'bold', halign: 'center' },
    margin: { left: 107 }
  });
  doc.autoTable({
    body: [['Heat treatment details will be shown here...']],
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1, minCellHeight: 20 },
    margin: { left: 107 }
  });
  const rightColFinalY = (doc as any).lastAutoTable.finalY;
  
  // --- Two Column Layout End ---

  // Remarks
  const finalY = Math.max(leftColFinalY, rightColFinalY);
  doc.autoTable({
      head: [['Remarks:']],
      body: [
          ['1. We certify that the materials confirm to the dimension and material specification of the order'],
          ['2. Marking - Monogram / Size / Schedule / Rating / Spec / Lot No.'],
      ],
      startY: finalY + 10,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: false, textColor: 20, fontStyle: 'bold' },
  });


  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(9).setFont('helvetica', 'bold');
  doc.text('SURVEYOR', 25, pageHeight - 45);
  doc.text('For FORGED INDUSTRIAL CORPORATION', doc.internal.pageSize.getWidth() / 2, pageHeight - 45, { align: 'center' });
  doc.text('Auth. Signatory', doc.internal.pageSize.getWidth() - 25, pageHeight - 45, { align: 'right' });

  doc.setFontSize(8).setFont('helvetica', 'normal');
  const footerText = `Regd. Office :- B.P.T. Plot No. 54, Gala No. 7, Ghoradeo 2 st Cross Lane, Mumbai - 400033. Tel.: 23725300 Website: www.ficfittings.com
Factory :- Plot No. A-360, T.T.C. Industrial Area, M.I.D.C., Mahape, Dist. Thane, Navi Mumbai-400710. Tel: 27781861 | Email: nimcofittings@hotmail.com`;
  doc.text(footerText, doc.internal.pageSize.getWidth() / 2, pageHeight - 30, { align: 'center' });

  // Save the PDF
  doc.save(`Certificate-${certificate.certificateNumber}.pdf`);
};
