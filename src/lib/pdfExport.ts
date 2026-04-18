import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const generatePDFPreview = async (elementId: string): Promise<string | null> => {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth + 100,
      windowHeight: element.scrollHeight + 100,
    });

    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error('Error generating preview:', error);
    return null;
  }
};

export const savePDFFromImage = (imageData: string, filename: string) => {
  const img = new Image();
  img.src = imageData;
  img.onload = () => {
    const pdf = new jsPDF({
      orientation: img.width > img.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [img.width / 2, img.height / 2]
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight);
    pdf.save(`${filename}.pdf`);
  };
};

export const exportSectionToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth + 100,
      windowHeight: element.scrollHeight + 100,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'l' : 'p',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2]
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

export const exportFullProjectReport = async (sectionIds: string[], projectTitle: string) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let firstPage = true;

  for (const id of sectionIds) {
    const element = document.getElementById(id);
    if (!element) continue;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      if (!firstPage) {
        pdf.addPage();
      }

      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      firstPage = false;
    } catch (error) {
      console.error(`Error capturing section ${id}:`, error);
    }
  }

  pdf.save(`${projectTitle.replace(/\s+/g, '_')}_Full_Report.pdf`);
};
