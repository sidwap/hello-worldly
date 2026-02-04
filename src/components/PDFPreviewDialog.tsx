import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface PDFPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  generatePDF: () => Promise<jsPDF>;
  fileName: string;
}

const PDFPreviewDialog = ({ isOpen, onClose, title, generatePDF, fileName }: PDFPreviewDialogProps) => {
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      loadPDFPreview();
    } else {
      // Cleanup when dialog closes
      setPdfDataUrl(null);
      setPdfDoc(null);
      setError(null);
    }
  }, [isOpen]);

  const loadPDFPreview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const doc = await generatePDF();
      setPdfDoc(doc);
      
      // Use data URL instead of blob URL for better mobile compatibility
      const dataUrl = doc.output('datauristring');
      setPdfDataUrl(dataUrl);
    } catch (err) {
      console.error('Error generating PDF preview:', err);
      setError('Failed to generate PDF preview. Please try downloading directly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfDoc) {
      pdfDoc.save(fileName);
      onClose();
    }
  };

  const handleDirectDownload = async () => {
    setIsLoading(true);
    try {
      const doc = await generatePDF();
      doc.save(fileName);
      onClose();
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Preview: {title}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-[70vh] border rounded-lg overflow-hidden bg-muted">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Generating preview...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
              <p className="text-muted-foreground text-center">{error}</p>
              <Button onClick={handleDirectDownload} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF Directly
              </Button>
            </div>
          ) : pdfDataUrl ? (
            <iframe
              src={pdfDataUrl}
              className="w-full h-full"
              title="PDF Preview"
              style={{ minHeight: '60vh' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <p>Failed to generate preview</p>
              <Button onClick={handleDirectDownload} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF Directly
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={!pdfDoc || isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewDialog;
