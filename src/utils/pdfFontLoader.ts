import jsPDF from 'jspdf';

// Cache for the loaded font to avoid repeated fetches
let cachedFontBase64: string | null = null;

export const loadDevanagariFont = async (doc: jsPDF): Promise<void> => {
  try {
    // Return early if font is already added
    if (cachedFontBase64) {
      doc.addFileToVFS('NotoSansDevanagari.ttf', cachedFontBase64);
      doc.addFont('NotoSansDevanagari.ttf', 'NotoSansDevanagari', 'normal');
      return;
    }

    // Fetch the font file from public folder
    const response = await fetch('/fonts/NotoSansDevanagari.ttf');
    if (!response.ok) {
      throw new Error('Failed to load Devanagari font');
    }

    // Convert to ArrayBuffer
    const fontData = await response.arrayBuffer();
    
    // Convert ArrayBuffer to base64
    const fontDataArray = new Uint8Array(fontData);
    const base64Font = btoa(
      Array.from(fontDataArray)
        .map(byte => String.fromCharCode(byte))
        .join('')
    );

    // Cache the font
    cachedFontBase64 = base64Font;

    // Add font to jsPDF
    doc.addFileToVFS('NotoSansDevanagari.ttf', base64Font);
    doc.addFont('NotoSansDevanagari.ttf', 'NotoSansDevanagari', 'normal');
    
    console.log('Devanagari font loaded successfully');
  } catch (error) {
    console.error('Error loading Devanagari font:', error);
    // Fallback to default font if loading fails
  }
};

export const setFontForLanguage = (doc: jsPDF, language?: string): void => {
  // Use Devanagari font for Hindi, otherwise use default helvetica
  if (language?.toLowerCase() === 'hindi') {
    doc.setFont('NotoSansDevanagari', 'normal');
  } else {
    doc.setFont('helvetica', 'normal');
  }
};
