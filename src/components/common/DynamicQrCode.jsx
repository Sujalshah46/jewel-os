import React, { useMemo } from 'react';
import { generateQrMatrix, qrMatrixToSvg } from '../../utils/qrCode';

export default function DynamicQrCode({ text, size = 100, className = '' }) {
  const svgHtml = useMemo(() => {
    if (!text) return null;
    try {
      const matrix = generateQrMatrix(text);
      return qrMatrixToSvg(matrix, size);
    } catch (err) {
      console.warn('QR Code generation error:', err);
      return null;
    }
  }, [text, size]);

  if (!svgHtml) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] rounded ${className}`}
      >
        QR Unavailable
      </div>
    );
  }

  return (
    <div
      className={`inline-block overflow-hidden rounded bg-white p-1 shadow-sm ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
