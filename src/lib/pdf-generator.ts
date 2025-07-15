
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
    { sr: '1', poSr: '1', desc: 'coupling', spec: 'ASTM A105', dim: 'ASME B16.11', size: '15 nb', lot: 'N514', qty: '10', uom: 'NOS' },
    { sr: '2', poSr: '', desc: '', spec: '', dim: '', size: '', lot: '', qty: '-', uom: '' },
    { sr: '3', poSr: '', desc: '', spec: '', dim: '', size: '', lot: '', qty: '-', uom: '' },
    { sr: '4', poSr: '', desc: '', spec: '', dim: '', size: '', lot: '', qty: '-', uom: '' },
    { sr: '5', poSr: '', desc: '', spec: '', dim: '', size: '', lot: '', qty: '-', uom: '' },
    { sr: '6', poSr: '', desc: '', spec: '', dim: '', size: '', lot: '', qty: '-', uom: '' },
    { sr: '7', poSr: '', desc: '', spec: '', dim: '', size: '', lot: '', qty: '-', uom: '' },
    { sr: '8', poSr: '', desc: '', spec: '', dim: '', size: '', lot: '', qty: '-', uom: '' },
    { sr: '9', poSr: '', desc: '', spec: '', dim: '', size: '', lot: '', qty: '-', uom: '' },
    { sr: '10', poSr: '', desc: '', spec: '', dim: '', size: '', lot: '', qty: '-', uom: '' },
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
  doc.text('EN-10204-3.1', doc.internal.pageSize.getWidth() / 2, 37, { align: 'center' });

  // Top Info Block
  doc.autoTable({
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1, fontStyle: 'bold', minCellHeight: 6 },
    body: [
        [
            { content: `Customer Name: ${certificate.customerName}` },
            { content: `TC No.: ${certificate.certificateNumber}` },
            { content: `Date: ${certificate.date}` }
        ],
        [
            { content: 'P.O.No. & Date: jhgjgjh Date: 11/06/2025' },
            { content: 'Start Material: C.S.BAR', colSpan: 2 },
        ]
    ],
    columnStyles: {
        0: { cellWidth: 91 },
        1: { cellWidth: 50 },
    },
  });

  // Item Description Table
  doc.autoTable({
    head: [['Sr.No', 'P.O.\nSr.No.', 'Item Description', 'Material\nSpecification', 'Dimension\nStandard', 'Size', 'Lot No.', 'Qty', 'UOM']],
    body: itemDescriptionData.map(i => [i.sr, i.poSr, i.desc, i.spec, i.dim, i.size, i.lot, i.qty, i.uom]),
    startY: (doc as any).lastAutoTable.finalY,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1, halign: 'center', valign: 'middle', minCellHeight: 6 },
    headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
    columnStyles: { 2: { cellWidth: 40 } },
  });

  const finalYItemTable = (doc as any).lastAutoTable.finalY;

  // --- Two Column Layout for Test Results ---

  // Chemical Composition (Left)
  doc.autoTable({
      head: [['Chemical Composition']],
      body: [],
      startY: finalYItemTable + 2,
      theme: 'grid',
      styles: { fontSize: 9, fontStyle: 'bold', halign: 'center' },
      margin: { right: 98 }
  });
  doc.autoTable({
      head: [['Lot No.', 'C%', 'Mn%', 'Si%', 'S%', 'P%', 'Cr%', 'Ni%', 'Mo%', 'V%', 'Cu%', 'CE%']],
      body: chemicalData.map(r => [r.lot, r.c, r.mn, r.si, r.s, r.p, r.cr, r.ni, r.mo, r.v, r.cu, r.ce]),
      startY: (doc as any).lastAutoTable.finalY,
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: 1, halign: 'center', minCellHeight: 6 },
      headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
      margin: { right: 98 }
  });
  const chemicalTableY = (doc as any).lastAutoTable.finalY;
  
  // Physical Properties (Left)
  doc.autoTable({
      head: [['Physical Properties']],
      body: [],
      startY: chemicalTableY + 2,
      theme: 'grid',
      styles: { fontSize: 9, fontStyle: 'bold', halign: 'center' },
      margin: { right: 98 }
  });
  doc.autoTable({
      head: [['Lot No.', 'Y.S\nN/mm2', 'U.T.S\nN/mm2', 'Elongation\n%', 'RA%', 'Hardness\nBHN']],
      body: physicalData.map(r => [r.lot, r.ys, r.uts, r.elong, r.ra, r.hardness]),
      startY: (doc as any).lastAutoTable.finalY,
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: 1, halign: 'center', valign: 'middle', minCellHeight: 6 },
      headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
      margin: { right: 98 }
  });
  const physicalTableY = (doc as any).lastAutoTable.finalY;

  // Laboratory Details (Right)
  doc.autoTable({
      head: [['Laboratory Details']],
      body: [
          [{content: 'Report No.', styles: {fontStyle: 'bold'}}, 'A/3304', {content: 'Report Date', styles: {fontStyle: 'bold'}}, '11/06/2025'],
          [{content: 'Laboratory Name', styles: {fontStyle: 'bold', halign: 'left'}}, {content: 'Industrial Metal Test Lab P.L.', colSpan: 3, styles: {halign: 'left'}}]
      ],
      startY: finalYItemTable + 2,
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold', halign: 'center' },
      margin: { left: 112 }
  });

  // Charpy Impact Test (Right)
  doc.autoTable({
      head: [['Charpy Impact Test (Joules)']],
      body: [],
      startY: (doc as any).lastAutoTable.finalY + 2,
      theme: 'grid',
      styles: { fontSize: 9, fontStyle: 'bold', halign: 'center' },
      margin: { left: 112 }
  });
  doc.autoTable({
      head: [['Size', 'TEMP C', 'I', 'II', 'III', 'Average']],
      body: charpyData.map(r => [r.size, r.tempc, r.i, r.ii, r.iii, {content: r.avg, colSpan: 1, styles: {halign: 'left'}}]),
      startY: (doc as any).lastAutoTable.finalY,
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: 1, halign: 'center', minCellHeight: 6 },
      headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' },
      margin: { left: 112 }
  });

  // Heat Test Details (Right)
  doc.autoTable({
      head: [['Heat Test Details']],
      body: [['']],
      startY: (doc as any).lastAutoTable.finalY,
      theme: 'grid',
      styles: { fontSize: 9, fontStyle: 'bold', halign: 'center', minCellHeight: 12 },
      margin: { left: 112 }
  });


  // Other Test & Remarks
  const otherTestY = physicalTableY + 2;
  doc.autoTable({
    head: [['Other Test Details:']],
    body: [['1. Dye Penetrant Test Done Found Satisfactory']],
    startY: otherTestY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1, fontStyle: 'bold' },
    headStyles: { fillColor: false, textColor: 20 },
    margin: { right: 98 }
  });

  doc.autoTable({
      head: [['Remarks:']],
      body: [
          ['1. We certify that the materials confirm to the dimension and material specification of the order'],
          ['2. Marking - Monogram / Size / Schedule / Rating / Spec / Lot No.'],
      ],
      startY: (doc as any).lastAutoTable.finalY + 2,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: false, textColor: 20, fontStyle: 'bold' },
  });


  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  const finalTableY = (doc as any).lastAutoTable.finalY;

  doc.setFontSize(9).setFont('helvetica', 'bold');
  doc.text('For FORGED INDUSTRIAL CORPORATION', doc.internal.pageSize.getWidth() - 100, finalTableY + 10);
  doc.text('SURVEYOR', 25, finalTableY + 20);
  doc.text('Auth. Signatory', doc.internal.pageSize.getWidth() - 45, finalTableY + 20, { align: 'right' });

  doc.setFontSize(8).setFont('helvetica', 'normal');
  const footerText1 = `Regd. Office :- B.P.T. Plot No. 54, Gala No. 7, Ghoradeo 2 st Cross Lane, Mumbai - 400033. Tel.: 23725300 Website: www.ficfittings.com`;
  const footerText2 = `Factory :- Plot No. A-360, T.T.C. Industrial Area, M.I.D.C., Mahape, Dist. Thane, Navi Mumbai-400710. Tel: 27781861 | Email: nimcofittings@hotmail.com`;
  
  doc.text(footerText1, doc.internal.pageSize.getWidth() / 2, pageHeight - 20, { align: 'center' });
  doc.text(footerText2, doc.internal.pageSize.getWidth() / 2, pageHeight - 15, { align: 'center' });


  // Save the PDF
  doc.save(`Certificate-${certificate.certificateNumber}.pdf`);
};
