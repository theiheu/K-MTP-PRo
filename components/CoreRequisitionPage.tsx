import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { inventoryDocumentsCoreService, stockCoreService } from '../services/inventoryCoreService';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import type { StockBalance } from '../types/inventory';

type DraftLine = {
  quantity: number;
  purposeType: string;
  notes: string;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);

const getVariantLabel = (attributes?: Record<string, string>) => {
  const values = Object.values(attributes || {}).filter(Boolean);
  return values.length > 0 ? values.join(' / ') : 'Mặc định';
};

const CoreRequisitionPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const products = useDataStore(state => state.products);
  const zones = useDataStore(state => state.zones);

  const [zoneId, setZoneId] = useState('');
  const [requesterName, setRequesterName] = useState(user?.name || '');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [draft, setDraft] = useState<Record<string, DraftLine>>({});
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userZone = zones.find(zone => zone.name === user?.zone);
    if (userZone && !zoneId) setZoneId(userZone.id);
  }, [user?.zone, zoneId, zones]);

  useEffect(() => {
    let isMounted = true;

    const loadBalances = async () => {
      setIsLoadingBalances(true);
      try {
        const nextBalances = await stockCoreService.getBalances();
        if (isMounted) setBalances(nextBalances);
      } catch (error) {
        console.warn('Không tải được tồn core:', error);
        toast.error('Không tải được tồn kho mới.');
      } finally {
        if (isMounted) setIsLoadingBalances(false);
      }
    };

    loadBalances();

    return () => {
      isMounted = false;
    };
  }, []);

  const availableQuantityByVariant = useMemo(
    () => balances.reduce<Record<string, number>>((acc, item) => {
      if (item.balanceState !== 'available') return acc;
      acc[item.variantId] = (acc[item.variantId] || 0) + item.quantity;
      return acc;
    }, {}),
    [balances]
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredProducts = useMemo(
    () => products
      .filter(product => {
        if (!normalizedSearch) return true;
        return [
          product.name,
          product.category,
          ...product.variants.map(variant => getVariantLabel(variant.attributes)),
          ...product.variants.map(variant => variant.sku || ''),
        ].some(value => value.toLowerCase().includes(normalizedSearch));
      })
      .slice(0, 60),
    [normalizedSearch, products]
  );

  const selectedItems = useMemo(
    () => products.flatMap(product => product.variants.map(variant => ({
      product,
      variant,
      draft: draft[variant.id],
    }))).filter(item => (item.draft?.quantity || 0) > 0),
    [draft, products]
  );

  const updateDraftLine = (variantId: string, field: keyof DraftLine, value: string) => {
    setDraft(prev => {
      const current = prev[variantId] || {
        quantity: 0,
        purposeType: 'regular_use',
        notes: '',
      };

      if (field === 'quantity') {
        const quantity = Number(value);
        return {
          ...prev,
          [variantId]: {
            ...current,
            quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 0,
          },
        };
      }

      return {
        ...prev,
        [variantId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!zoneId) {
      toast.error('Vui lòng chọn khu yêu cầu.');
      return;
    }

    if (!requesterName.trim()) {
      toast.error('Vui lòng nhập người yêu cầu.');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Vui lòng nhập ít nhất một vật tư.');
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryDocumentsCoreService.createDraft({
        documentType: 'requisition',
        status: 'submitted',
        zoneId,
        requesterId: user?.id,
        requesterName: requesterName.trim(),
        createdBy: user?.id,
        notes: notes.trim() || undefined,
        metadata: {
          source: 'mobile_core_requisition_page',
        },
        items: selectedItems.map(({ product, variant, draft: line }, index) => ({
          productId: product.id,
          variantId: variant.id,
          quantityRequested: line.quantity,
          unit: variant.unit,
          purposeType: line.purposeType,
          notes: line.notes.trim() || undefined,
          displayOrder: index,
          metadata: {
            source: 'mobile_core_requisition',
            availableAtRequest: availableQuantityByVariant[variant.id] || 0,
          },
        })),
      });

      toast.success('Đã gửi yêu cầu vật tư.');
      navigate('/requisitions');
    } catch (error) {
      console.error('Không gửi được yêu cầu core:', error);
      toast.error('Không gửi được yêu cầu vật tư.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase text-blue-700">Phiếu yêu cầu core</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Yêu cầu vật tư</h1>
        <p className="mt-1 text-sm text-gray-600">Chọn vật tư cần cấp cho khu, gửi thẳng vào sổ kho mới.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Tìm vật tư..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {isLoadingBalances && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
              Đang tải tồn kho mới...
            </div>
          )}

          <div className="space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                Không tìm thấy vật tư phù hợp.
              </div>
            ) : filteredProducts.map(product => (
              <article key={product.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <h2 className="text-sm font-semibold text-gray-900">{product.name}</h2>
                <p className="mt-0.5 text-xs text-gray-500">{product.category}</p>

                <div className="mt-3 space-y-2">
                  {product.variants.map(variant => {
                    const line = draft[variant.id] || {
                      quantity: 0,
                      purposeType: 'regular_use',
                      notes: '',
                    };
                    const availableQuantity = availableQuantityByVariant[variant.id] || 0;

                    return (
                      <div key={variant.id} className="rounded-md bg-gray-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900">{getVariantLabel(variant.attributes)}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              Kho còn {formatNumber(availableQuantity)} {variant.unit || ''}
                            </p>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.quantity || ''}
                            onChange={event => updateDraftLine(variant.id, 'quantity', event.target.value)}
                            placeholder="SL"
                            className="w-24 rounded-md border border-gray-300 px-2 py-2 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr]">
                          <select
                            value={line.purposeType}
                            onChange={event => updateDraftLine(variant.id, 'purposeType', event.target.value)}
                            className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="regular_use">Dùng hằng ngày</option>
                            <option value="farm_repair">Sửa chữa khu</option>
                            <option value="exchange">Đổi hàng hỏng</option>
                            <option value="supplement">Bổ sung</option>
                            <option value="other">Khác</option>
                          </select>
                          <input
                            value={line.notes}
                            onChange={event => updateDraftLine(variant.id, 'notes', event.target.value)}
                            placeholder="Ghi chú dòng"
                            className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 lg:sticky lg:top-32 lg:self-start">
          <div>
            <label htmlFor="core-mobile-zone" className="block text-sm font-medium text-gray-900">
              Khu yêu cầu
            </label>
            <select
              id="core-mobile-zone"
              value={zoneId}
              onChange={event => setZoneId(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Chọn khu</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="core-mobile-requester" className="block text-sm font-medium text-gray-900">
              Người yêu cầu
            </label>
            <input
              id="core-mobile-requester"
              value={requesterName}
              onChange={event => setRequesterName(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="core-mobile-notes" className="block text-sm font-medium text-gray-900">
              Mục đích chung
            </label>
            <textarea
              id="core-mobile-notes"
              value={notes}
              onChange={event => setNotes(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ví dụ: thay bóng đèn khu A, bổ sung vật tư vệ sinh..."
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">Đã chọn ({formatNumber(selectedItems.length)})</h2>
            <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
              {selectedItems.length === 0 ? (
                <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-500">
                  Nhập số lượng ở danh sách vật tư.
                </p>
              ) : selectedItems.map(({ product, variant, draft: line }) => (
                <div key={variant.id} className="rounded-md bg-gray-50 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{getVariantLabel(variant.attributes)}</p>
                    </div>
                    <p className="shrink-0 font-semibold text-gray-900">
                      {formatNumber(line.quantity)} {variant.unit || ''}
                    </p>
                  </div>
                  {line.notes && <p className="mt-2 text-xs text-gray-500">{line.notes}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </aside>
      </form>
    </main>
  );
};

export default CoreRequisitionPage;
