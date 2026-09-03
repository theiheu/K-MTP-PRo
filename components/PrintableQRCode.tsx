import React from 'react';
import { Product, Variant } from '../types';

interface PrintableQRCodeProps {
  product: Product;
  variant: Variant;
}

const PrintableQRCode: React.FC<PrintableQRCodeProps> = ({ product, variant }) => {
  const variantAttributes = Object.values(variant.attributes).join(' / ') || 'Mặc định';
  const qrData = JSON.stringify({ pId: product.id, vId: variant.id });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="print-only bg-white text-black flex items-center justify-center p-4">
      <div className="border-4 border-black p-4 w-64 text-center rounded-lg">
        <h2 className="text-xl font-bold uppercase mb-2">TRẠI GÀ K-MTP</h2>
        <p className="font-semibold text-lg">{product.name}</p>
        <p className="text-sm italic mb-4">{variantAttributes}</p>
        
        <div className="flex justify-center mb-2">
          <img src={qrUrl} alt="QR Code" width="150" height="150" />
        </div>
        
        <p className="text-xs text-gray-500 font-mono">Mã: {product.id.substring(0, 5).toUpperCase()}-{variant.id.substring(0, 5).toUpperCase()}</p>
      </div>
    </div>
  );
};

export default PrintableQRCode;
