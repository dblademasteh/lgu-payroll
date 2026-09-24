import PDFDocument from 'pdfkit';
import { formatCurrency } from './currency.js';

/**
 * Generate PDF payslip
 * @param {object} params - Payslip data
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generatePayslipPDF(params) {
  const {
    employee,
    payrollRun,
    payrollRecord,
    companyName = 'LGU Payroll',
    companyAddress = 'Local Government Unit',
  } = params;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Payslip - ${employee?.firstName} ${employee?.lastName} - ${payrollRun?.name}`,
          Author: companyName,
          Subject: 'Employee Payslip',
        }
      });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      drawHeader(doc, companyName, companyAddress, payrollRun);
      
      // Employee Info
      drawEmployeeInfo(doc, employee);
      
      // Earnings & Deductions
      drawEarningsDeductions(doc, payrollRecord);
      
      // Summary
      drawSummary(doc, payrollRecord);
      
      // Footer
      drawFooter(doc);

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

function drawHeader(doc, companyName, companyAddress, payrollRun) {
  // Company name
  doc.fontSize(20).font('Helvetica-Bold').text(companyName, 50, 50);
  
  // Company address
  doc.fontSize(10).font('Helvetica').text(companyAddress, 50, 75);
  
  // Payslip title
  doc.fontSize(16).font('Helvetica-Bold').text('PAYSLIP', 50, 100);
  
  // Period
  doc.fontSize(11).font('Helvetica')
    .text(`Pay Period: ${payrollRun?.name || payrollRun?.period}`, 50, 125);
  
  // Line separator
  doc.moveTo(50, 145).lineTo(545, 145).strokeColor('#cccccc').stroke();
  
  doc.moveDown(2);
}

function drawEmployeeInfo(doc, employee) {
  const startY = doc.y;
  const col1X = 50;
  const col2X = 250;
  const col3X = 450;
  
  doc.fontSize(10).font('Helvetica-Bold');
  
  // Row 1
  doc.text('Employee No:', col1X, startY);
  doc.font('Helvetica').text(employee?.employeeNumber || '—', col1X + 80, startY);
  
  doc.font('Helvetica-Bold').text('Name:', col2X, startY);
  doc.font('Helvetica').text(`${employee?.firstName || ''} ${employee?.middleName ? employee.middleName[0] + '. ' : ''}${employee?.lastName || ''}`, col2X + 45, startY);
  
  doc.font('Helvetica-Bold').text('Department:', col3X, startY);
  doc.font('Helvetica').text(employee?.department || '—', col3X + 70, startY);
  
  // Row 2
  const row2Y = startY + 20;
  doc.font('Helvetica-Bold').text('Position:', col1X, row2Y);
  doc.font('Helvetica').text(employee?.position || '—', col1X + 55, row2Y);
  
  doc.font('Helvetica-Bold').text('Hired Date:', col2X, row2Y);
  doc.font('Helvetica').text(employee?.hiredDate ? new Date(employee.hiredDate).toLocaleDateString() : '—', col2X + 70, row2Y);
  
  doc.font('Helvetica-Bold').text('Status:', col3X, row2Y);
  doc.font('Helvetica').text(employee?.status || '—', col3X + 45, row2Y);
  
  doc.y = row2Y + 30;
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
  doc.moveDown(1);
}

function drawEarningsDeductions(doc, payrollRecord) {
  if (!payrollRecord) return;
  
  const startY = doc.y;
  const tableTop = startY;
  const colWidths = { item: 200, amount: 100 };
  const tableLeft = 50;
  const tableRight = tableLeft + colWidths.item + colWidths.amount;
  
  // Earnings section
  doc.fontSize(11).font('Helvetica-Bold').text('EARNINGS', tableLeft, tableTop);
  
  let y = tableTop + 25;
  drawTableHeader(doc, tableLeft, y, colWidths);
  y += 20;
  
  // Basic salary
  drawTableRow(doc, tableLeft, y, colWidths, 'Basic Salary', formatCurrency(payrollRecord.basicSalary));
  y += 20;
  
  // Overtime
  if (payrollRecord.overtimePay && Number(payrollRecord.overtimePay) > 0) {
    drawTableRow(doc, tableLeft, y, colWidths, 'Overtime Pay', formatCurrency(payrollRecord.overtimePay));
    y += 20;
  }
  
  // Allowances
  if (payrollRecord.allowances && Number(payrollRecord.allowances) > 0) {
    drawTableRow(doc, tableLeft, y, colWidths, 'Allowances', formatCurrency(payrollRecord.allowances));
    y += 20;
  }
  
  // Gross pay total
  doc.font('Helvetica-Bold');
  drawTableRow(doc, tableLeft, y, colWidths, 'GROSS PAY', formatCurrency(payrollRecord.grossPay));
  doc.font('Helvetica');
  y += 30;
  
  // Deductions section
  doc.fontSize(11).font('Helvetica-Bold').text('DEDUCTIONS', tableLeft, y);
  y += 25;
  
  drawTableHeader(doc, tableLeft, y, colWidths);
  y += 20;
  
  // Deduction details
  if (payrollRecord.details && payrollRecord.details.length > 0) {
    for (const detail of payrollRecord.details) {
      if (detail.amountType !== 'TABLE') {
        drawTableRow(doc, tableLeft, y, colWidths, detail.name, formatCurrency(detail.computedAmount));
        y += 20;
      }
    }
  }
  
  // Withholding tax
  if (payrollRecord.withholdingTax && Number(payrollRecord.withholdingTax) > 0) {
    drawTableRow(doc, tableLeft, y, colWidths, 'Withholding Tax', formatCurrency(payrollRecord.withholdingTax));
    y += 20;
  }
  
  // Total deductions
  doc.font('Helvetica-Bold');
  drawTableRow(doc, tableLeft, y, colWidths, 'TOTAL DEDUCTIONS', formatCurrency(payrollRecord.totalDeductions));
  doc.font('Helvetica');
  y += 30;
  
  // Net pay
  doc.fontSize(12).font('Helvetica-Bold');
  drawTableRow(doc, tableLeft, y, colWidths, 'NET PAY', formatCurrency(payrollRecord.netPay));
  
  doc.y = y + 40;
}

function drawTableHeader(doc, x, y, colWidths) {
  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Item', x, y);
  doc.text('Amount', x + colWidths.item, y, { width: colWidths.amount, align: 'right' });
  
  // Underline
  doc.moveTo(x, y + 15).lineTo(x + colWidths.item + colWidths.amount, y + 15)
    .strokeColor('#cccccc').stroke();
}

function drawTableRow(doc, x, y, colWidths, item, amount) {
  doc.fontSize(9);
  doc.text(item, x, y);
  doc.text(amount, x + colWidths.item, y, { width: colWidths.amount, align: 'right' });
}

function drawSummary(doc, payrollRecord) {
  if (!payrollRecord) return;
  
  const startY = doc.y;
  const boxLeft = 50;
  const boxWidth = 495;
  const boxHeight = 80;
  
  // Summary box
  doc.rect(boxLeft, startY, boxWidth, boxHeight)
    .fillAndStroke('#f8f9fa', '#dee2e6');
  
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
  
  const items = [
    { label: 'Gross Pay:', value: formatCurrency(payrollRecord.grossPay) },
    { label: 'Total Deductions:', value: formatCurrency(payrollRecord.totalDeductions) },
    { label: 'Taxable Income:', value: formatCurrency(payrollRecord.taxableIncome) },
    { label: 'Withholding Tax:', value: formatCurrency(payrollRecord.withholdingTax) },
    { label: 'NET PAY:', value: formatCurrency(payrollRecord.netPay) },
  ];
  
  let y = startY + 10;
  for (const item of items) {
    const isNet = item.label === 'NET PAY:';
    doc.font(isNet ? 'Helvetica-Bold' : 'Helvetica');
    doc.fontSize(isNet ? 12 : 10);
    doc.text(item.label, boxLeft + 20, y);
    doc.text(item.value, boxLeft + boxWidth - 150, y, { width: 130, align: 'right' });
    y += isNet ? 22 : 16;
  }
  
  doc.fillColor('#000');
  doc.y = startY + boxHeight + 20;
}

function drawFooter(doc) {
  const pageHeight = doc.page.height;
  const footerY = pageHeight - 80;
  
  doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#cccccc').stroke();
  doc.moveDown(0.5);
  
  doc.fontSize(8).font('Helvetica').fillColor('#666666');
  doc.text('This is a system-generated payslip. No signature required.', 50, footerY + 10, { align: 'center', width: 495 });
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 50, footerY + 25, { align: 'center', width: 495 });
  doc.text('LGU Payroll Management System', 50, footerY + 40, { align: 'center', width: 495 });
  
  doc.fillColor('#000');
}