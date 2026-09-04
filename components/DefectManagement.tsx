import React, { useMemo, useState } from 'react';
import {
  DefectiveItem,
  InventoryTransaction,
  Product,
  RepairBatch,
  RepairBatchItem,
  RepairBatchStatus,
  User,
} from '../types';

interface DefectManagementProps {
  products: Product[];
  transactions: InventoryTransaction[];
  defectiveItems: DefectiveItem[];
  repairBatches: RepairBatch[];
  onCreateTransaction: (transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>) => Promise<void>;
  onCreateRepairBatch: (
    details: { code?: string; repairVendor?: string; sentAt: string; expectedReturnAt?: string; notes?: string; createdBy: string },
    items: Array<{ defectiveItemId: string; quantity: number }>
  ) => Promise<void>;
  onReceiveRepairBatchItems: (
    batchId: string,
    items: Array<{ repairBatchItemId: string; quantityReturned: number; returnNotes?: string }>,
    receivedBy: string
  ) => Promise<void>;
  onDisposeDefectiveItems: (
    items: Array<{ defectiveItemId: string; quantity: number; source?: 'waiting' | 'repairing' }>,
    reason: string,
    disposedBy: string
  ) => Promise<void>;
  currentUser: User | null;
}

type TabKey = 'warehouse' | 'batches' | 'history';

const today = () => new Date().toISOString().slice(0, 10);

const formatDate = (value?: string) => {
  if (!value) return 'Chưa ghi nhận';
  return new Date(value).toLocaleDateString('vi-VN');
};

const formatDateTime = (value: string) => new Date(value).toLocaleString('vi-VN');

const getVariantLabel = (attributes?: { [key: string]: string }) => {
  const values = Object.values(attributes || {}).filter(Boolean);
  return values.length > 0 ? values.join(' / ') : 'Mặc định';
};

const stateLabels: Record<DefectiveItem['currentState'], string> = {
  waiting_repair: 'Chờ gửi sửa',
  sent_to_repair: 'Đang sửa',
  repaired: 'Đã sửa nhập kho',
  disposed: 'Đã thanh lý',
};

const stateClasses: Record<DefectiveItem['currentState'], string> = {
  waiting_repair: 'bg-red-100 text-red-800',
  sent_to_repair: 'bg-blue-100 text-blue-800',
  repaired: 'bg-green-100 text-green-800',
  disposed: 'bg-gray-200 text-gray-800',
};

const batchStatusLabels: Record<RepairBatchStatus, string> = {
  draft: 'Nháp',
  sent: 'Đang sửa',
  partially_returned: 'Đã nhập một phần',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

const transactionTypeLabels: Record<string, string> = {
  RETURN: 'Thu hồi hàng hỏng',
  RETURN_DEFECTIVE: 'Thu hồi hàng hỏng',
  REPAIR_EXPORT: 'Phiếu xuất đi sửa',
  REPAIR_IMPORT: 'Phiếu nhập hàng đã sửa',
  DISPOSAL: 'Thanh lý / Huỷ',
};

const getOpenQuantity = (item: RepairBatchItem) =>
  item.quantitySent - item.quantityReturned - item.quantityDisposed;

const DefectManagement: React.FC<DefectManagementProps> = ({
  transactions,
  defectiveItems,
  repairBatches,
  onCreateRepairBatch,
  onReceiveRepairBatchItems,
  onDisposeDefectiveItems,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('warehouse');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [repairVendor, setRepairVendor] = useState('');
  const [sentAt, setSentAt] = useState(today());
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [disposeReason, setDisposeReason] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnNotes, setReturnNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const isManager = currentUser?.role === 'manager';
  const waitingItems = defectiveItems.filter(item => item.currentState === 'waiting_repair');
  const activeBatches = repairBatches.filter(batch => ['sent', 'partially_returned'].includes(batch.status));

  const selectedBatch = useMemo(() => {
    return repairBatches.find(batch => batch.id === selectedBatchId) || activeBatches[0];
  }, [activeBatches, repairBatches, selectedBatchId]);

  const stats = useMemo(() => ({
    waiting: defectiveItems.filter(item => item.currentState === 'waiting_repair').reduce((sum, item) => sum + item.quantity, 0),
    repairing: repairBatches.flatMap(batch => batch.items).reduce((sum, item) => sum + getOpenQuantity(item), 0),
    repaired: repairBatches.flatMap(batch => batch.items).reduce((sum, item) => sum + item.quantityReturned, 0),
    disposed: defectiveItems.filter(item => item.currentState === 'disposed').reduce((sum, item) => sum + item.quantity, 0),
  }), [defectiveItems, repairBatches]);

  const toggleSelected = (id: string) => {
    setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const clearForm = () => {
    setSelectedIds([]);
    setRepairVendor('');
    setSentAt(today());
    setExpectedReturnAt('');
    setBatchNotes('');
    setDisposeReason('');
    setError('');
  };

  const handleCreateRepairBatch = async () => {
    setError('');
    if (!isManager) return;
    if (selectedIds.length === 0) {
      setError('Vui lòng chọn ít nhất một vật tư hỏng để gửi sửa.');
      return;
    }

    const selectedItems = waitingItems.filter(item => selectedIds.includes(item.id));
    await onCreateRepairBatch({
      repairVendor: repairVendor.trim() || undefined,
      sentAt: new Date(`${sentAt}T00:00:00`).toISOString(),
      expectedReturnAt: expectedReturnAt ? new Date(`${expectedReturnAt}T00:00:00`).toISOString() : undefined,
      notes: batchNotes.trim() || undefined,
      createdBy: currentUser?.name || 'Quản trị viên',
    }, selectedItems.map(item => ({ defectiveItemId: item.id, quantity: item.quantity })));

    clearForm();
    setActiveTab('batches');
  };

  const handleDispose = async () => {
    setError('');
    if (!isManager) return;
    if (selectedIds.length === 0) {
      setError('Vui lòng chọn vật tư cần thanh lý.');
      return;
    }
    if (!disposeReason.trim()) {
      setError('Vui lòng nhập lý do thanh lý.');
      return;
    }

    const selectedItems = waitingItems.filter(item => selectedIds.includes(item.id));
    await onDisposeDefectiveItems(
      selectedItems.map(item => ({ defectiveItemId: item.id, quantity: item.quantity, source: 'waiting' })),
      disposeReason.trim(),
      currentUser?.name || 'Quản trị viên'
    );

    clearForm();
  };

  const handleReceive = async () => {
    setError('');
    if (!isManager || !selectedBatch) return;

    const itemsToReceive = selectedBatch.items
      .map(item => ({
        repairBatchItemId: item.id,
        quantityReturned: returnQuantities[item.id] || 0,
        returnNotes: returnNotes[item.id],
      }))
      .filter(item => item.quantityReturned > 0);

    if (itemsToReceive.length === 0) {
      setError('Vui lòng nhập số lượng vật tư đã sửa xong.');
      return;
    }

    await onReceiveRepairBatchItems(
      selectedBatch.id,
      itemsToReceive,
      currentUser?.name || 'Quản trị viên'
    );

    setReturnQuantities({});
    setReturnNotes({});
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Sự cố & Sửa chữa vật tư</h2>
        <p className="mt-1 text-sm text-gray-600">
          Theo dõi vật tư hỏng từ lúc cấp đổi, gom đi sửa, nhập lại kho hoặc thanh lý.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">Chờ gửi sửa</p>
          <p className="mt-2 text-3xl font-bold text-red-900">{stats.waiting}</p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700">Đang sửa</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">{stats.repairing}</p>
        </div>
        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-700">Đã nhập lại</p>
          <p className="mt-2 text-3xl font-bold text-green-900">{stats.repaired}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">Đã thanh lý</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.disposed}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto" aria-label="Tabs">
            {[
              ['warehouse', 'Kho vật tư hỏng'],
              ['batches', 'Lô sửa chữa'],
              ['history', 'Lịch sử kho'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as TabKey)}
                className={`min-w-fit flex-1 py-4 px-3 text-center border-b-2 text-sm font-medium ${
                  activeTab === key ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-800">{error}</div>}

          {activeTab === 'warehouse' && (
            <div className="space-y-5">
              {isManager && (
                <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 lg:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Đơn vị sửa chữa</label>
                    <input
                      value={repairVendor}
                      onChange={(e) => setRepairVendor(e.target.value)}
                      placeholder="Tổ cơ điện, nhà cung cấp..."
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày gửi sửa</label>
                    <input
                      type="date"
                      value={sentAt}
                      onChange={(e) => setSentAt(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dự kiến nhập lại</label>
                    <input
                      type="date"
                      value={expectedReturnAt}
                      onChange={(e) => setExpectedReturnAt(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lý do thanh lý</label>
                    <input
                      value={disposeReason}
                      onChange={(e) => setDisposeReason(e.target.value)}
                      placeholder="Không sửa được, hỏng nặng..."
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="lg:col-span-4">
                    <label className="block text-sm font-medium text-gray-700">Ghi chú lô sửa</label>
                    <textarea
                      value={batchNotes}
                      onChange={(e) => setBatchNotes(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row lg:col-span-4">
                    <button
                      type="button"
                      onClick={handleCreateRepairBatch}
                      disabled={selectedIds.length === 0}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      Tạo phiếu xuất đi sửa ({selectedIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleDispose}
                      disabled={selectedIds.length === 0}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      Thanh lý đã chọn
                    </button>
                  </div>
                </div>
              )}

              {defectiveItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                  Chưa có vật tư hỏng nào được ghi nhận.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {isManager && <th className="px-4 py-3 text-left font-medium text-gray-600">Chọn</th>}
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Vật tư hỏng</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Thông tin hỏng</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Số lượng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {defectiveItems.map(item => (
                        <tr key={item.id}>
                          {isManager && (
                            <td className="px-4 py-4 align-top">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item.id)}
                                disabled={item.currentState !== 'waiting_repair'}
                                onChange={() => toggleSelected(item.id)}
                                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
                              />
                            </td>
                          )}
                          <td className="px-4 py-4 align-top">
                            <p className="font-medium text-gray-900">{item.productName || 'Vật tư'}</p>
                            <p className="text-gray-500">{getVariantLabel(item.variantAttributes)}</p>
                            <p className="mt-1 text-xs text-gray-500">Phiếu gốc: {item.sourceRequisitionId ? item.sourceRequisitionId.substring(0, 8).toUpperCase() : 'Không có'}</p>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${stateClasses[item.currentState]}`}>
                              {stateLabels[item.currentState]}
                            </span>
                            <p className="mt-2 font-medium text-gray-800">{item.defectStatus}</p>
                            <p className="mt-1 text-gray-600">{item.defectDescription || 'Chưa ghi mô tả chi tiết.'}</p>
                            <p className="mt-1 text-gray-600"><span className="font-medium">Cần sửa:</span> {item.repairNeeds || 'Chưa ghi'}</p>
                            <p className="mt-1 text-xs text-gray-500">Ngày đổi: {formatDate(item.exchangedAt)}</p>
                            {item.images.length > 0 && (
                              <div className="mt-2 flex gap-2">
                                {item.images.slice(0, 4).map((src, index) => (
                                  <button key={index} type="button" onClick={() => window.open(src, '_blank')} className="h-12 w-12 overflow-hidden rounded border border-gray-200">
                                    <img src={src} alt="Ảnh vật tư hỏng" className="h-full w-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right align-top font-bold text-red-700">
                            {item.quantity} {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'batches' && (
            <div className="space-y-5">
              {repairBatches.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                  Chưa có lô sửa chữa nào.
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="sm:w-96">
                      <label className="block text-sm font-medium text-gray-700">Chọn lô sửa chữa để nhập lại</label>
                      <select
                        value={selectedBatch?.id || ''}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {activeBatches.map(batch => (
                          <option key={batch.id} value={batch.id}>
                            {batch.code} - {batchStatusLabels[batch.status]}
                          </option>
                        ))}
                      </select>
                    </div>
                    {isManager && selectedBatch && (
                      <button
                        type="button"
                        onClick={handleReceive}
                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                      >
                        Nhập vật tư đã sửa
                      </button>
                    )}
                  </div>

                  {selectedBatch && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{selectedBatch.code}</p>
                          <p className="text-sm text-gray-600">Đơn vị sửa: {selectedBatch.repairVendor || 'Không ghi'}</p>
                          <p className="text-sm text-gray-600">Ngày gửi: {formatDate(selectedBatch.sentAt)} - Dự kiến về: {formatDate(selectedBatch.expectedReturnAt)}</p>
                        </div>
                        <span className="inline-flex w-fit rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                          {batchStatusLabels[selectedBatch.status]}
                        </span>
                      </div>

                      <div className="mt-4 overflow-x-auto rounded border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium text-gray-600">Vật tư</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-600">Gửi sửa</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-600">Đã nhập</th>
                              <th className="px-4 py-3 text-right font-medium text-gray-600">Còn lại</th>
                              {isManager && <th className="px-4 py-3 text-left font-medium text-gray-600">Nhập lần này</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedBatch.items.map(item => {
                              const openQuantity = getOpenQuantity(item);
                              return (
                                <tr key={item.id}>
                                  <td className="px-4 py-4 align-top">
                                    <p className="font-medium text-gray-900">{item.productName || item.defectiveItem?.productName || 'Vật tư'}</p>
                                    <p className="text-gray-500">{getVariantLabel(item.variantAttributes || item.defectiveItem?.variantAttributes)}</p>
                                    <p className="mt-1 text-xs text-gray-500">{item.defectiveItem?.defectStatus}</p>
                                  </td>
                                  <td className="px-4 py-4 text-right align-top">{item.quantitySent} {item.unit}</td>
                                  <td className="px-4 py-4 text-right align-top text-green-700 font-semibold">{item.quantityReturned} {item.unit}</td>
                                  <td className="px-4 py-4 text-right align-top text-blue-700 font-semibold">{openQuantity} {item.unit}</td>
                                  {isManager && (
                                    <td className="px-4 py-4 align-top">
                                      <input
                                        type="number"
                                        min={0}
                                        max={openQuantity}
                                        value={returnQuantities[item.id] || ''}
                                        onChange={(e) => setReturnQuantities(current => ({ ...current, [item.id]: Number(e.target.value) || 0 }))}
                                        disabled={openQuantity <= 0}
                                        className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-gray-100"
                                      />
                                      <input
                                        value={returnNotes[item.id] || ''}
                                        onChange={(e) => setReturnNotes(current => ({ ...current, [item.id]: e.target.value }))}
                                        placeholder="Ghi chú nhập"
                                        disabled={openQuantity <= 0}
                                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-gray-100"
                                      />
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {repairBatches.map(batch => (
                      <div key={batch.id} className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{batch.code}</p>
                            <p className="text-sm text-gray-600">{batch.repairVendor || 'Không ghi đơn vị sửa'} - {formatDate(batch.sentAt)}</p>
                          </div>
                          <span className="inline-flex w-fit rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800">
                            {batchStatusLabels[batch.status]}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {batch.items.length} dòng, gửi {batch.items.reduce((sum, item) => sum + item.quantitySent, 0)}, đã nhập {batch.items.reduce((sum, item) => sum + item.quantityReturned, 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                  Chưa có giao dịch vật tư hỏng.
                </div>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          {transactionTypeLabels[tx.type] || tx.type}
                        </span>
                        <p className="mt-1 text-sm text-gray-500">#{tx.id.substring(0, 8).toUpperCase()} - {formatDateTime(tx.createdAt)}</p>
                      </div>
                      <p className="text-sm text-gray-500">Người tạo: {tx.createdBy}</p>
                    </div>

                    <div className="mt-3 overflow-hidden rounded border border-gray-200 bg-white">
                      {tx.items.map((item, index) => (
                        <div key={`${item.variantId}-${index}`} className="border-b border-gray-100 p-3 last:border-b-0">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{item.productName || 'Vật tư'}</p>
                              <p className="text-sm text-gray-500">{getVariantLabel(item.variantAttributes)}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-800">SL: {item.quantity} {item.unit}</p>
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-600 lg:grid-cols-3">
                            <p><span className="font-medium text-gray-800">Ngày đổi:</span> {formatDate(item.exchangedAt)}</p>
                            <p><span className="font-medium text-gray-800">Tình trạng:</span> {item.reason || 'Không ghi'}</p>
                            <p><span className="font-medium text-gray-800">Cần sửa:</span> {item.repairNeeds || 'Không ghi'}</p>
                          </div>
                          {item.defectDescription && (
                            <p className="mt-2 text-sm text-gray-600"><span className="font-medium text-gray-800">Mô tả hỏng:</span> {item.defectDescription}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {tx.notes && <p className="mt-3 whitespace-pre-line text-sm text-gray-600">{tx.notes}</p>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefectManagement;
