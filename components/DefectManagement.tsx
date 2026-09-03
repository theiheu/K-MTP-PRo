import React, { useState, useMemo } from 'react';
import { Product, InventoryTransaction, InventoryTransactionType, User } from '../types';

interface DefectManagementProps {
  products: Product[];
  transactions: InventoryTransaction[];
  onCreateTransaction: (transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>) => Promise<void>;
  currentUser: User | null;
}

const DefectManagement: React.FC<DefectManagementProps> = ({ products, transactions, onCreateTransaction, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'create'>('overview');
  const [txType, setTxType] = useState<InventoryTransactionType>('RETURN');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Extract all variants with defective or repairing stock
  const defectiveVariants = useMemo(() => {
    const list: any[] = [];
    products.forEach(p => {
      p.variants.forEach(v => {
        if ((v.defective_stock || 0) > 0 || (v.repairing_stock || 0) > 0) {
          list.push({ product: p, variant: v });
        }
      });
    });
    return list;
  }, [products]);

  // All variants for selection
  const allVariants = useMemo(() => {
    const list: any[] = [];
    products.forEach(p => {
      p.variants.forEach(v => {
        list.push({ product: p, variant: v });
      });
    });
    return list;
  }, [products]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId) {
      alert("Vui lòng chọn vật tư.");
      return;
    }

    // validate stock constraints
    const target = allVariants.find(x => x.variant.id === selectedVariantId);
    if (!target) return;
    const { variant } = target;
    const def = variant.defective_stock || 0;
    const rep = variant.repairing_stock || 0;

    if (txType === 'REPAIR_EXPORT' && def < quantity) {
      alert(`Chỉ còn ${def} vật tư hỏng, không đủ xuất ${quantity}.`);
      return;
    }
    if (txType === 'REPAIR_IMPORT' && rep < quantity) {
      alert(`Chỉ còn ${rep} vật tư đang sửa, không đủ nhập ${quantity}.`);
      return;
    }
    if (txType === 'DISPOSAL' && (def + rep) < quantity) {
      alert(`Không đủ vật tư hỏng/đang sửa để thanh lý.`);
      return;
    }

    const tx: Omit<InventoryTransaction, 'id' | 'createdAt'> = {
      type: txType,
      status: 'COMPLETED',
      createdBy: currentUser?.name || 'Admin',
      notes,
      items: [{
        variantId: selectedVariantId,
        quantity,
        reason,
        productName: target.product.name,
        variantAttributes: target.variant.attributes,
        unit: target.variant.unit
      }]
    };

    try {
      await onCreateTransaction(tx);
      alert('Đã lưu phiếu thành công!');
      setQuantity(1);
      setReason('');
      setNotes('');
      setActiveTab('history');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'RETURN': return 'Thu hồi hàng hỏng';
      case 'REPAIR_EXPORT': return 'Xuất đi sửa';
      case 'REPAIR_IMPORT': return 'Nhập lại kho (Đã sửa)';
      case 'DISPOSAL': return 'Thanh lý / Huỷ';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RETURN': return 'bg-orange-100 text-orange-800';
      case 'REPAIR_EXPORT': return 'bg-blue-100 text-blue-800';
      case 'REPAIR_IMPORT': return 'bg-green-100 text-green-800';
      case 'DISPOSAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === 'overview' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tổng quan Vật tư hỏng
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === 'create' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tạo Phiếu xử lý
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === 'history' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Lịch sử giao dịch
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Danh sách Vật tư đang hỏng / đang sửa</h3>
            {defectiveVariants.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Không có vật tư nào bị hỏng hoặc đang đi sửa.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vật tư</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phân loại</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho hỏng</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Đang sửa chữa</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {defectiveVariants.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Object.values(item.variant.attributes || {}).join(' - ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold text-right">
                          {item.variant.defective_stock || 0} {item.variant.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-500 font-bold text-right">
                          {item.variant.repairing_stock || 0} {item.variant.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-6 max-w-2xl mx-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700">Loại nghiệp vụ</label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as InventoryTransactionType)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md border"
              >
                <option value="RETURN">Thu hồi hàng hỏng (Tăng kho hỏng)</option>
                <option value="REPAIR_EXPORT">Xuất đi sửa (Kho hỏng -&gt; Đang sửa)</option>
                <option value="REPAIR_IMPORT">Nhập lại kho (Đang sửa -&gt; Hàng tốt)</option>
                <option value="DISPOSAL">Thanh lý / Huỷ bỏ (Xoá sổ khỏi kho hỏng)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Chọn vật tư</label>
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md border"
              >
                <option value="" disabled>-- Chọn vật tư --</option>
                {allVariants.map((item, idx) => (
                  <option key={item.variant.id} value={item.variant.id}>
                    {item.product.name} - {Object.values(item.variant.attributes || {}).join(' ')}
                    (Tốt: {item.variant.stock} | Hỏng: {item.variant.defective_stock || 0} | Đang sửa: {item.variant.repairing_stock || 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Lý do hỏng hóc / Tình trạng</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Bị vỡ vỏ, đứt dây..."
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ghi chú thêm (Tuỳ chọn)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-amber-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Lưu Phiếu
              </button>
            </div>
          </form>
        )}

        {activeTab === 'history' && (
          <div>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Chưa có giao dịch nào.</p>
            ) : (
              <div className="space-y-4">
                {transactions.map(tx => (
                  <div key={tx.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(tx.type)}`}>
                          {getTypeName(tx.type)}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(tx.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">Bởi: {tx.createdBy}</span>
                    </div>

                    <div className="mt-2 bg-white border border-gray-100 rounded p-2">
                      {tx.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="font-medium text-gray-900">
                            {item.productName} {item.variantAttributes && Object.values(item.variantAttributes).join(' ')}
                          </span>
                          <span className="text-gray-600">
                            SL: <span className="font-bold">{item.quantity}</span> {item.unit}
                          </span>
                        </div>
                      ))}
                      {tx.items[0]?.reason && (
                        <div className="text-sm text-gray-500 mt-1 italic">
                          Lý do: {tx.items[0].reason}
                        </div>
                      )}
                    </div>
                    {tx.notes && (
                      <p className="mt-2 text-sm text-gray-600">
                        Ghi chú: {tx.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DefectManagement;
