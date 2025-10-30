
import React, { useMemo } from 'react';
import { GoodsReceiptNote, Product, AdminTab } from '../types';
import ReceiptCard from './ReceiptCard';

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

interface ReceiptListProps {
    receipts: GoodsReceiptNote[];
    products: Product[];
    onNavigate: (view: 'create-receipt', tab?: AdminTab) => void;
}

const ReceiptList: React.FC<ReceiptListProps> = ({ receipts, products, onNavigate }) => {

    const sortedReceipts = useMemo(() => {
        return [...receipts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [receipts]);

    const handleCreateReceipt = () => {
        onNavigate('create-receipt');
    }

    const renderEmptyState = () => (
        <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-700">Chưa có Phiếu Nhập Kho nào</h2>
            <p className="mt-2 text-gray-500">Bắt đầu quản lý hàng tồn kho bằng cách tạo phiếu nhập đầu tiên của bạn.</p>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Lịch sử Nhập Kho</h2>
                <button
                    onClick={handleCreateReceipt}
                    className="inline-flex items-center gap-2 justify-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700"
                >
                    <PlusIcon className="w-5 h-5"/>
                    Tạo Phiếu Nhập Kho
                </button>
            </div>
            {sortedReceipts.length > 0 ? (
                <div className="space-y-6">
                    {sortedReceipts.map(receipt => (
                        <ReceiptCard key={receipt.id} receipt={receipt} allProducts={products} />
                    ))}
                </div>
            ) : (
                renderEmptyState()
            )}
        </div>
    );
};

export default ReceiptList;
