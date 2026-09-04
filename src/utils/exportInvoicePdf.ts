/**
 * Utility for high-fidelity client-side PDF export of Invoices and Custom Templates.
 * Captures clean, unscaled 794x1123 (A4 @ 96 DPI / 2x Retina) vector-like raster PDFs.
 */

export const sanitizeClonedDocForPdf = (clonedDoc: Document) => {
  // 1. Process all existing <style> tags
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach((s: any) => {
    if (s.textContent) {
      s.textContent = s.textContent
        .replace(/oklch\([^)]+\)/gi, '#006d6f')
        .replace(/color-mix\([^)]+\)/gi, '#006d6f')
        .replace(/lab\([^)]+\)/gi, '#006d6f')
        .replace(/lch\([^)]+\)/gi, '#006d6f');
    }
  });

  // 2. Process all <link rel="stylesheet"> tags: extract CSS rules, sanitize, add as <style>, and remove <link>
  const linkTags = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));
  linkTags.forEach((link: any) => {
    try {
      const matchingSheet = Array.from(document.styleSheets).find(
        sheet => sheet.href === link.href || (sheet.ownerNode as any)?.href === link.href
      );
      if (matchingSheet) {
        let cssText = '';
        try {
          const rules = Array.from(matchingSheet.cssRules || []);
          cssText = rules.map(r => r.cssText).join('\n');
        } catch {
          // ignore CORS issues
        }
        if (cssText) {
          const sanitizedCss = cssText
            .replace(/oklch\([^)]+\)/gi, '#006d6f')
            .replace(/color-mix\([^)]+\)/gi, '#006d6f')
            .replace(/lab\([^)]+\)/gi, '#006d6f')
            .replace(/lch\([^)]+\)/gi, '#006d6f');
          const newStyle = clonedDoc.createElement('style');
          newStyle.textContent = sanitizedCss;
          clonedDoc.head.appendChild(newStyle);
        }
      }
    } catch {}
    link.remove();
  });

  // 3. Fallback: Import parent document stylesheets into clonedDoc as sanitized inline <style> tags
  Array.from(document.styleSheets).forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      const cssText = rules.map(r => r.cssText).join('\n');
      if (cssText && (cssText.includes('oklch') || cssText.includes('color-mix') || cssText.includes('lab('))) {
        const sanitizedCss = cssText
          .replace(/oklch\([^)]+\)/gi, '#006d6f')
          .replace(/color-mix\([^)]+\)/gi, '#006d6f')
          .replace(/lab\([^)]+\)/gi, '#006d6f')
          .replace(/lch\([^)]+\)/gi, '#006d6f');
        const newStyle = clonedDoc.createElement('style');
        newStyle.textContent = sanitizedCss;
        clonedDoc.head.appendChild(newStyle);
      }
    } catch {}
  });

  // 4. Sanitize all elements: inline styles & attributes
  const allElements = clonedDoc.querySelectorAll('*');
  allElements.forEach((node: any) => {
    if (node && node.style) {
      if (node.style.transform) node.style.transform = 'none';
      if (node.style.zoom) node.style.zoom = '1';
      for (let i = 0; i < node.style.length; i++) {
        const prop = node.style[i];
        const val = node.style.getPropertyValue(prop);
        if (val && (val.includes('oklch') || val.includes('color-mix') || val.includes('lab(') || val.includes('lch('))) {
          node.style.setProperty(prop, '#006d6f');
        }
      }
    }
    ['fill', 'stroke', 'color', 'background', 'style'].forEach(attr => {
      const attrVal = node.getAttribute?.(attr);
      if (attrVal && (attrVal.includes('oklch') || attrVal.includes('color-mix') || attrVal.includes('lab('))) {
        node.setAttribute(attr, attrVal.replace(/oklch\([^)]+\)/gi, '#006d6f').replace(/color-mix\([^)]+\)/gi, '#006d6f'));
      }
    });
  });
};

export const exportInvoiceToPdf = async (
  containerOrSelector: HTMLElement | string,
  fileName: string = 'Invoice.pdf'
): Promise<void> => {
  const [html2canvas, jsPDFModule] = await Promise.all([
    import('html2canvas').then(m => m.default),
    import('jspdf').then(m => m.default),
  ]);

  let targetEl: HTMLElement | null = null;
  if (typeof containerOrSelector === 'string') {
    targetEl = (document.getElementById(containerOrSelector) ||
      document.querySelector(containerOrSelector)) as HTMLElement | null;
  } else {
    targetEl = containerOrSelector;
  }

  if (!targetEl) {
    throw new Error('Invoice container element not found for PDF export.');
  }

  const sheetEl = (targetEl.querySelector('.a4-page-sheet') as HTMLElement) || targetEl;

  const canvas = await html2canvas(sheetEl, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 794,
    windowHeight: 1123,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      sanitizeClonedDocForPdf(clonedDoc);

      // Inject explicit override styles for crisp capture without modal scale/border
      const overrideStyle = clonedDoc.createElement('style');
      overrideStyle.innerHTML = `
        *, *::before, *::after {
          letter-spacing: normal !important;
          word-spacing: normal !important;
          font-kerning: normal !important;
          transform: none !important;
          zoom: 1 !important;
          -webkit-font-smoothing: antialiased !important;
          text-rendering: geometricPrecision !important;
        }
        table {
          border-collapse: collapse !important;
        }
        td, th {
          box-sizing: border-box !important;
        }
        .invoice-status-badge {
          display: inline-block !important;
          height: 18px !important;
          line-height: 16px !important;
          text-align: center !important;
          vertical-align: middle !important;
          box-sizing: border-box !important;
        }
        .live-invoice-preview-wrapper {
          width: 794px !important;
          height: auto !important;
          transform: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .live-invoice-preview-container {
          width: 794px !important;
          transform: none !important;
          margin: 0 !important;
        }
        .a4-page-sheet {
          width: 794px !important;
          min-height: 1123px !important;
          height: 1123px !important;
          transform: none !important;
          margin: 0 !important;
          box-shadow: none !important;
          border: none !important;
          box-sizing: border-box !important;
          background: #ffffff !important;
        }
      `;
      clonedDoc.head.appendChild(overrideStyle);
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const pdf = new jsPDFModule({
    orientation: 'portrait',
    unit: 'px',
    format: [794, 1123],
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, 794, 1123);
  pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
};
