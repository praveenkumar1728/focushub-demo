import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
} from 'docx';

/**
 * Utility to download a generated Blob as a file in the browser.
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format currency number as Indian Rupee (INR - ₹) string.
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Get formatted date stamp for filename.
 */
function getDateStamp() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Export Service for PDF, Excel (XLSX), CSV, and Word (DOCX) in Indian Rupees (₹).
 */
export const exportService = {
  // -------------------------------------------------------------
  // CSV EXPORT (RFC-4180 COMPLIANT)
  // -------------------------------------------------------------
  exportCSV({ filename, headers, rows }) {
    const escapeCell = (cell) => {
      if (cell === null || cell === undefined) return '""';
      const str = String(cell).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvContent = [
      headers.map(escapeCell).join(','),
      ...rows.map((row) => row.map(escapeCell).join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    downloadBlob(blob, `${filename}_${getDateStamp()}.csv`);
  },

  // -------------------------------------------------------------
  // EXCEL (XLSX) EXPORT
  // -------------------------------------------------------------
  exportExcel({ title, sheetName = 'Report', headers, rows, filename }) {
    const wb = XLSX.utils.book_new();

    const aoa = [
      ['FOCUS飞UB V1 - PERSONAL MANAGEMENT REPORT (₹ INR)'],
      [`Report: ${title}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [], // blank row
      headers,
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    const colWidths = headers.map((header, colIndex) => {
      let maxLen = header.length;
      rows.forEach((row) => {
        const val = row[colIndex] ? String(row[colIndex]) : '';
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(Math.max(maxLen + 3, 14), 40) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}_${getDateStamp()}.xlsx`);
  },

  // -------------------------------------------------------------
  // PDF EXPORT (jsPDF + autoTable)
  // -------------------------------------------------------------
  exportPDF({ title, subtitle, headers, rows, filename, summaryNotes = [] }) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    // Brand Header banner
    doc.setFillColor(79, 70, 229); // #4f46e5 Indigo-600
    doc.rect(0, 0, doc.internal.pageSize.width, 55, 'F');

    // Title & Logo
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('FocusHub V1', 36, 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(224, 231, 255);
    doc.text(`|  ${title}`, 145, 32);

    const rightText = `Exported: ${new Date().toLocaleDateString()}`;
    doc.text(rightText, doc.internal.pageSize.width - 36 - doc.getTextWidth(rightText), 32);

    // Document Subtitle / Metadata
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    let startY = 75;
    if (subtitle) {
      doc.text(subtitle, 36, startY);
      startY += 16;
    }

    // AutoTable
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: startY,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left',
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 6,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 36, right: 36 },
      didDrawPage: () => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        const footerStr = `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount} — FocusHub V1 (Amounts in INR ₹)`;
        doc.text(
          footerStr,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 20,
          { align: 'center' }
        );
      },
    });

    if (summaryNotes.length > 0) {
      const finalY = (doc).lastAutoTable?.finalY || startY + 200;
      if (finalY + 40 < doc.internal.pageSize.height) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text('Summary Overview:', 36, finalY + 25);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        summaryNotes.forEach((note, idx) => {
          doc.text(`• ${note}`, 45, finalY + 40 + idx * 14);
        });
      }
    }

    doc.save(`${filename}_${getDateStamp()}.pdf`);
  },

  // -------------------------------------------------------------
  // WORD (DOCX) EXPORT
  // -------------------------------------------------------------
  async exportWord({ title, subtitle, headers, rows, filename, summaryNotes = [] }) {
    const tableHeaderRow = new TableRow({
      tableHeader: true,
      children: headers.map(
        (header) =>
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: header,
                    bold: true,
                    color: 'FFFFFF',
                    size: 19,
                  }),
                ],
              }),
            ],
            shading: {
              fill: '4F46E5',
            },
            margins: {
              top: 120,
              bottom: 120,
              left: 140,
              right: 140,
            },
          })
      ),
    });

    const dataRows = rows.map((row, rIdx) => {
      const isEven = rIdx % 2 === 0;
      return new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cell !== null && cell !== undefined ? String(cell) : '',
                      size: 18,
                      color: '1E293B',
                    }),
                  ],
                }),
              ],
              shading: {
                fill: isEven ? 'FFFFFF' : 'F8FAFC',
              },
              margins: {
                top: 90,
                bottom: 90,
                left: 140,
                right: 140,
              },
            })
        ),
      });
    });

    const docxTable = new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows: [tableHeaderRow, ...dataRows],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
      },
    });

    const docChildren = [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: 'FocusHub V1 — ' + title,
            bold: true,
            color: '4F46E5',
            size: 32,
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `${subtitle || 'Generated Report'} | Date: ${new Date().toLocaleString()} (All amounts in INR ₹)`,
            color: '64748B',
            size: 19,
          }),
        ],
      }),
      new Paragraph({ text: '' }),
      docxTable,
      new Paragraph({ text: '' }),
    ];

    if (summaryNotes.length > 0) {
      docChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: 'Summary & Key Metrics',
              bold: true,
              size: 24,
              color: '1E293B',
            }),
          ],
        })
      );
      summaryNotes.forEach((note) => {
        docChildren.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: note,
                size: 20,
                color: '334155',
              }),
            ],
          })
        );
      });
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${filename}_${getDateStamp()}.docx`);
  },

  // -------------------------------------------------------------
  // HIGH-LEVEL MODULE EXPORT DISPATCHERS
  // -------------------------------------------------------------
  async exportData({ moduleName, format, isFiltered, filteredData, allData, user }) {
    const data = isFiltered ? filteredData : allData;
    const scopeLabel = isFiltered ? `Filtered View (${data.length} records)` : `All Records (${data.length} total)`;
    const title = `${moduleName} Report`;
    const subtitle = `Scope: ${scopeLabel} • Generated by: ${user?.name || 'User'}`;
    const filename = `focushub_${moduleName.toLowerCase()}_${isFiltered ? 'filtered' : 'all'}`;

    let headers = [];
    let rows = [];
    let summaryNotes = [];

    switch (moduleName) {
      case 'Income': {
        headers = ['ID', 'Title', 'Category', 'Amount (₹)', 'Date', 'Notes'];
        rows = data.map((item) => [
          item.id,
          item.title,
          item.category,
          formatCurrency(item.amount),
          item.date,
          item.notes || '-',
        ]);
        const total = data.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        summaryNotes = [
          `Total Income: ${formatCurrency(total)} across ${data.length} entries.`,
        ];
        break;
      }

      case 'Expenses': {
        headers = ['ID', 'Title', 'Category', 'Amount (₹)', 'Date', 'Notes'];
        rows = data.map((item) => [
          item.id,
          item.title,
          item.category,
          formatCurrency(item.amount),
          item.date,
          item.notes || '-',
        ]);
        const total = data.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        summaryNotes = [
          `Total Expenses: ${formatCurrency(total)} across ${data.length} entries.`,
        ];
        break;
      }

      case 'Learnings': {
        headers = ['ID', 'Topic', 'Category', 'Target Hours', 'Completed Hours', 'Progress %', 'Status'];
        rows = data.map((item) => [
          item.id,
          item.title,
          item.category,
          `${item.targetHours}h`,
          `${item.completedHours}h`,
          `${item.progress}%`,
          item.status,
        ]);
        const totalDone = data.reduce((s, l) => s + (Number(l.completedHours) || 0), 0);
        const completedCount = data.filter((l) => l.status === 'Completed').length;
        summaryNotes = [
          `Total Learning Hours Logged: ${totalDone} hrs.`,
          `Completed Topics: ${completedCount} of ${data.length}.`,
        ];
        break;
      }

      case 'Users': {
        headers = ['User ID', 'Full Name', 'Email', 'Role', 'Status', 'Date Added'];
        rows = data.map((item) => [
          item.id,
          item.name,
          item.email,
          item.role,
          item.status,
          item.createdAt ? item.createdAt.split('T')[0] : '-',
        ]);
        summaryNotes = [`Total Users: ${data.length} registered accounts.`];
        break;
      }

      default:
        headers = Object.keys(data[0] || {});
        rows = data.map((item) => Object.values(item));
        break;
    }

    if (format === 'csv') {
      this.exportCSV({ filename, headers, rows });
    } else if (format === 'xlsx') {
      this.exportExcel({ title, headers, rows, filename });
    } else if (format === 'pdf') {
      this.exportPDF({ title, subtitle, headers, rows, filename, summaryNotes });
    } else if (format === 'docx') {
      await this.exportWord({ title, subtitle, headers, rows, filename, summaryNotes });
    }
  },
};
