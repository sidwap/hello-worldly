import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadDevanagariFont, setFontForLanguage } from './pdfFontLoader';

interface TestResult {
  id: string;
  wpm: number;
  accuracy: number;
  time_taken: number;
  total_words: number;
  correct_words_count: number;
  incorrect_words: number;
  gross_wpm: number;
  completed_at: string;
  total_keystrokes?: number;
  is_qualified?: boolean;
  typing_tests?: {
    title: string;
    category: string;
    language: string;
    content?: string;
  };
}

interface TopUser {
  result_id: string;
  user_id: string;
  wpm: number;
  accuracy: number;
  time_taken: number;
  total_words: number;
  display_name: string;
  completed_at?: string;
  language?: string;
  test_title?: string;
  total_keystrokes?: number;
  is_qualified?: boolean;
}

// Configure jsPDF for UTF-8 support and load Devanagari font
const configurePDFForUnicode = async (doc: jsPDF) => {
  // Load Devanagari font for Hindi support
  await loadDevanagariFont(doc);
  // Set default to helvetica initially
  doc.setFont('helvetica', 'normal');
};

// Add website branding header to PDF
const addBrandingHeader = (doc: jsPDF, title: string) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Add full-page clickable link
  doc.link(0, 0, pageWidth, pageHeight, { url: 'https://typescribe.vercel.app/' });
  
  // Single color modern background
  doc.setFillColor(79, 70, 229); // Indigo
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Add website name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TypeScribe Zen', 15, 16);
  
  // Add tagline
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Master your typing skills', 15, 23);
  
  // Add clickable website link
  doc.setTextColor(253, 224, 71); // Bright yellow for visibility
  doc.setFontSize(9);
  const linkText = 'https://typescribe.vercel.app/';
  doc.textWithLink(linkText, 15, 29, { url: linkText });
  
  // Add report title on the right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, pageWidth - titleWidth - 15, 20);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
};

// Add footer with page numbers and date
const addFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  const pageSize = doc.internal.pageSize;
  const pageHeight = pageSize.height;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleDateString()}`,
      pageSize.width / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
};

// Format time in MM:SS
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Determine qualification status
const getQualificationStatus = (result: any): string => {
  if (result.is_qualified !== undefined && result.is_qualified !== null) {
    return result.is_qualified ? 'Qualified' : 'Not Qualified';
  }
  const isQualified = result.accuracy >= 85 && 
    (result.time_taken >= 600 || (result.total_words || 0) >= 400);
  return isQualified ? 'Qualified' : 'Not Qualified';
};

// Generate user test history PDF document (for preview)
export const generateUserTestHistoryPDF = async (userName: string, testHistory: TestResult[]): Promise<jsPDF> => {
  const doc = new jsPDF();
  await configurePDFForUnicode(doc);
  
  // Add branding header
  addBrandingHeader(doc, `Test History Report - ${userName}`);
  
  // Add user info section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`User: ${userName}`, 15, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Tests Completed: ${testHistory.length}`, 15, 52);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 15, 58);
  
  // Calculate statistics
  if (testHistory.length > 0) {
    const avgWpm = testHistory.reduce((sum, r) => sum + Number(r.wpm), 0) / testHistory.length;
    const avgAccuracy = testHistory.reduce((sum, r) => sum + Number(r.accuracy), 0) / testHistory.length;
    const bestWpm = Math.max(...testHistory.map(r => Number(r.wpm)));
    
    doc.text(`Average WPM: ${avgWpm.toFixed(1)} | Average Accuracy: ${avgAccuracy.toFixed(1)}% | Best WPM: ${bestWpm.toFixed(1)}`, 15, 64);
  }
  
  // Prepare table data with qualification and keystrokes
  const tableData = testHistory.map((result, index) => [
    (index + 1).toString(),
    result.typing_tests?.title || 'Unknown Test',
    result.typing_tests?.category || 'N/A',
    result.typing_tests?.language?.toUpperCase() || 'N/A',
    Number(result.wpm).toFixed(1),
    `${Number(result.accuracy).toFixed(1)}%`,
    formatTime(result.time_taken),
    result.total_words?.toString() || '0',
    result.correct_words_count?.toString() || '0',
    result.incorrect_words?.toString() || '0',
    (result.total_keystrokes || 0).toString(),
    getQualificationStatus(result),
    new Date(result.completed_at).toLocaleDateString()
  ]);
  
  // Add table with font support for Hindi
  autoTable(doc, {
    startY: 72,
    head: [['#', 'Test Title', 'Category', 'Lang', 'WPM', 'Acc', 'Time', 'Words', 'Correct', 'Wrong', 'Keystrokes', 'Status', 'Date']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 6
    },
    didParseCell: function(data) {
      // Use Devanagari font for Test Title column if it contains Hindi text
      if (data.column.index === 1 && data.cell.raw) {
        const text = data.cell.raw.toString();
        // Check if text contains Devanagari characters (U+0900 to U+097F)
        if (/[\u0900-\u097F]/.test(text)) {
          data.cell.styles.font = 'NotoSansDevanagari';
        }
      }
      // Color code qualification status
      if (data.column.index === 11 && data.cell.raw) {
        const text = data.cell.raw.toString();
        if (text === 'Qualified') {
          data.cell.styles.textColor = [22, 163, 74]; // Green
        } else {
          data.cell.styles.textColor = [220, 38, 38]; // Red
        }
      }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 16 },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 10, halign: 'center' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 12, halign: 'center' },
      8: { cellWidth: 12, halign: 'center' },
      9: { cellWidth: 10, halign: 'center' },
      10: { cellWidth: 16, halign: 'center' },
      11: { cellWidth: 20, halign: 'center' },
      12: { cellWidth: 18, halign: 'center' }
    },
    margin: { left: 10, right: 10 }
  });
  
  // Add footer
  addFooter(doc);
  
  return doc;
};

export const exportUserTestHistory = async (userName: string, testHistory: TestResult[]) => {
  const doc = await generateUserTestHistoryPDF(userName, testHistory);
  doc.save(`${userName.replace(/\s+/g, '_')}_test_history_${Date.now()}.pdf`);
};

// Generate top users by date PDF document (for preview)
export const generateTopUsersByDatePDF = async (date: string, topUsers: TopUser[], testTitle?: string): Promise<jsPDF> => {
  const doc = new jsPDF();
  await configurePDFForUnicode(doc);
  
  const reportTitle = testTitle 
    ? `Top Users - ${testTitle}` 
    : `Top Users - ${new Date(date).toLocaleDateString()}`;
  
  // Add branding header
  addBrandingHeader(doc, reportTitle);
  
  // Add report info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, 15, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Qualified Users: ${topUsers.length}`, 15, 52);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 15, 58);
  doc.text('Qualification: 85%+ accuracy AND (10+ minutes OR 400+ words)', 15, 64);
  
  // Prepare table data with test title, date, language, keystrokes, and status
  const tableData = topUsers.map((user, index) => [
    (index + 1).toString(),
    user.display_name,
    user.test_title || 'N/A',
    Number(user.wpm).toFixed(1),
    `${Number(user.accuracy).toFixed(1)}%`,
    formatTime(user.time_taken),
    user.total_words?.toString() || '0',
    (user.total_keystrokes || 0).toString(),
    getQualificationStatus(user),
    new Date(date).toLocaleDateString()
  ]);
  
  // Add table with Hindi font support
  autoTable(doc, {
    startY: 72,
    head: [['Rank', 'User', 'Test', 'WPM', 'Acc', 'Time', 'Words', 'Keys', 'Status', 'Date']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7
    },
    didParseCell: function(data) {
      // Use Devanagari font for Test Title column (index 2) if it contains Hindi text
      if (data.column.index === 2 && data.cell.raw) {
        const text = data.cell.raw.toString();
        if (/[\u0900-\u097F]/.test(text)) {
          data.cell.styles.font = 'NotoSansDevanagari';
        }
      }
      // Color code qualification status
      if (data.column.index === 8 && data.cell.raw) {
        const text = data.cell.raw.toString();
        if (text === 'Qualified') {
          data.cell.styles.textColor = [22, 163, 74];
        } else {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 26 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 22, halign: 'center' },
      9: { cellWidth: 18, halign: 'center' }
    },
    margin: { left: 10, right: 10 }
  });
  
  // Add footer
  addFooter(doc);
  
  return doc;
};

export const exportTopUsersByDate = async (date: string, topUsers: TopUser[], testTitle?: string) => {
  const doc = await generateTopUsersByDatePDF(date, topUsers, testTitle);
  const fileName = testTitle 
    ? `top_users_${testTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`
    : `top_users_${date}_${Date.now()}.pdf`;
  doc.save(fileName);
};

// Generate all-time top users PDF document (for preview)
export const generateAllTimeTopUsersPDF = async (topUsers: TopUser[]): Promise<jsPDF> => {
  const doc = new jsPDF();
  await configurePDFForUnicode(doc);
  
  // Add branding header
  addBrandingHeader(doc, 'All-Time Top Users');
  
  // Add report info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('All-Time Top Users Leaderboard', 15, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Qualified Users: ${topUsers.length}`, 15, 52);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 15, 58);
  doc.text('Qualification: 85%+ accuracy AND (10+ minutes OR 400+ words)', 15, 64);
  
  // Prepare table data with test title, date, language, keystrokes, and status
  const tableData = topUsers.map((user, index) => [
    (index + 1).toString(),
    user.display_name,
    user.test_title || 'N/A',
    Number(user.wpm).toFixed(1),
    `${Number(user.accuracy).toFixed(1)}%`,
    formatTime(user.time_taken),
    user.total_words?.toString() || '0',
    (user.total_keystrokes || 0).toString(),
    getQualificationStatus(user),
    user.completed_at ? new Date(user.completed_at).toLocaleDateString() : 'N/A'
  ]);
  
  // Add table with Hindi font support
  autoTable(doc, {
    startY: 72,
    head: [['Rank', 'User', 'Test', 'WPM', 'Acc', 'Time', 'Words', 'Keys', 'Status', 'Date']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7
    },
    didParseCell: function(data) {
      // Use Devanagari font for Test Title column (index 2) if it contains Hindi text
      if (data.column.index === 2 && data.cell.raw) {
        const text = data.cell.raw.toString();
        if (/[\u0900-\u097F]/.test(text)) {
          data.cell.styles.font = 'NotoSansDevanagari';
        }
      }
      // Color code qualification status
      if (data.column.index === 8 && data.cell.raw) {
        const text = data.cell.raw.toString();
        if (text === 'Qualified') {
          data.cell.styles.textColor = [22, 163, 74];
        } else {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 26 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 14, halign: 'center' },
      8: { cellWidth: 22, halign: 'center' },
      9: { cellWidth: 18, halign: 'center' }
    },
    margin: { left: 10, right: 10 }
  });
  
  // Add footer
  addFooter(doc);
  
  return doc;
};

export const exportAllTimeTopUsers = async (topUsers: TopUser[]) => {
  const doc = await generateAllTimeTopUsersPDF(topUsers);
  doc.save(`all_time_top_users_${Date.now()}.pdf`);
};

// Generate per-test top users PDF document (for preview)
export const generatePerTestTopUsersPDF = async (testTitle: string, testContent: string, topUsers: TopUser[]): Promise<jsPDF> => {
  const doc = new jsPDF();
  await configurePDFForUnicode(doc);
  
  // Add branding header
  addBrandingHeader(doc, `Top Users - ${testTitle}`);
  
  // Add test info section
  doc.setFontSize(14);
  // Check if test title contains Hindi characters and set appropriate font
  if (/[\u0900-\u097F]/.test(testTitle)) {
    doc.setFont('NotoSansDevanagari', 'normal');
  } else {
    doc.setFont('helvetica', 'bold');
  }
  doc.text(`Test: ${testTitle}`, 15, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Qualified Users: ${topUsers.length}`, 15, 52);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 15, 58);
  
  // Add test content preview
  doc.setFontSize(9);
  // Check if content contains Hindi characters
  if (/[\u0900-\u097F]/.test(testContent)) {
    doc.setFont('NotoSansDevanagari', 'normal');
  } else {
    doc.setFont('helvetica', 'italic');
  }
  doc.setTextColor(80, 80, 80);
  const contentPreview = testContent.substring(0, 200) + (testContent.length > 200 ? '...' : '');
  const splitContent = doc.splitTextToSize(contentPreview, 180);
  doc.setFont('helvetica', 'normal');
  doc.text('Test Content Preview:', 15, 66);
  // Set Hindi font for content if needed
  if (/[\u0900-\u097F]/.test(testContent)) {
    doc.setFont('NotoSansDevanagari', 'normal');
  }
  doc.text(splitContent, 15, 71);
  
  doc.setTextColor(0, 0, 0);
  
  // Calculate startY based on content preview length
  const startY = 71 + (splitContent.length * 4) + 6;
  
  // Prepare table data with keystrokes and status
  const tableData = topUsers.map((user, index) => [
    (index + 1).toString(),
    user.display_name,
    Number(user.wpm).toFixed(1),
    `${Number(user.accuracy).toFixed(1)}%`,
    formatTime(user.time_taken),
    user.total_words?.toString() || '0',
    (user.total_keystrokes || 0).toString(),
    getQualificationStatus(user),
    user.completed_at ? new Date(user.completed_at).toLocaleDateString() : 'N/A'
  ]);
  
  // Add table with Hindi font support for test title
  autoTable(doc, {
    startY: startY,
    head: [['Rank', 'User', 'WPM', 'Acc', 'Time', 'Words', 'Keys', 'Status', 'Date']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7
    },
    didParseCell: function(data) {
      // Check if we need Hindi font (test title might have Hindi in it)
      if (data.cell.raw && typeof data.cell.raw === 'string') {
        if (/[\u0900-\u097F]/.test(data.cell.raw)) {
          data.cell.styles.font = 'NotoSansDevanagari';
        }
      }
      // Color code qualification status
      if (data.column.index === 7 && data.cell.raw) {
        const text = data.cell.raw.toString();
        if (text === 'Qualified') {
          data.cell.styles.textColor = [22, 163, 74];
        } else {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 24, halign: 'center' },
      8: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: 10, right: 10 }
  });
  
  // Add footer
  addFooter(doc);
  
  return doc;
};

export const exportPerTestTopUsers = async (testTitle: string, testContent: string, topUsers: TopUser[]) => {
  const doc = await generatePerTestTopUsersPDF(testTitle, testContent, topUsers);
  doc.save(`top_users_${testTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
};
