import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPDF = () => {
  const doc = new jsPDF();
  doc.text('QA Report Summary', 14, 15);
  doc.autoTable({ html: '#my-table' }); // Assume table ID
  doc.save('qa-report.pdf');
};

export const exportToCSV = () => {
  const ws = XLSX.utils.json_to_sheet([/* data from analytics */ { name: 'Test', value: 100 }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reports');
  XLSX.writeFile(wb, 'qa-report.csv');
};