import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { inventoryDocumentsCoreService } from '../services/inventoryCoreService';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import type { Product, Variant } from '../types';

type CartLine = {
  product: Product;
  variant: Variant;
  quantity: number;
  purposeType: string;
  notes: string;
};

const purposeOptions: Array<{ value: string; label: string }> = [
  { value: 'regular_use', label: 'Dùng hằng ngày' },
  { value: 'farm_repair', label: 'Sửa chữa khu' },
  { value: 'exchange', label: 'Đổi hàng hỏng' },
  { value: 'supplement', label: 'Bổ sung' },
  { value: 'other', label: 'Khác' },
];

const getVariantLabel = (attributes?: Record<string, string>) => {
  const values = Object.values(attributes || {}).filter(Boolean);
  return values.length > 0 ? values.join(' / ') : 'Mặc định';
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);

const CoreRequisitionPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const products = useDataStore(state => state.products);
  const zones = useDataStore(state => state.zones);

  const [zoneId, setZoneId] = useState('');
  const [requesterName, setRequesterName] = useState(user?.name || '');
  const [generalNotes, setGeneralNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userZone = zones.find(zone => zone.name === user?.zone);
    if (userZone && !zoneId) setZoneId(userZone.id);
  }, [user?.zone, zoneId, zones]);

  const categories = useMemo(
    () => ['Tất cả', ...Array.from(new Set(products.map(product => product.category))).filter(Boolean)],
    [products]
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const visibleProducts = useMemo(
    () => products.filter(product => {
      if (category !== 'Tất cả' && product.category !== category) return false;
      if (!normalizedSearch) return true;
      return [
        product.name,
        product.category,
        ...product.variants.flatMap(variant => [
          getVariantLabel(variant.attributes),
          variant.sku || '',
        ]),
      ].some(value => (value || '').toLowerCase().includes(normalizedSearch));
    }).slice(0, 80),
    [category, normalizedSearch, products]
  );

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const cartCount = useMemo(() => cartLines.reduce((total, line) => total + line.quantity, 0), [cartLines]);

  const handleAdd = (product: Product, variant: Variant) => {
    setCart(prev => {
      const current = prev[variant.id];
      return {
        ...prev,
        [variant.id]: {
          product,
          variant,
          quantity: (current?.quantity || 0) + 1,
          purposeType: current?.purposeType || 'regular_use',
          notes: current?.notes || '',
        },
      };
    });
  };

  const handleChangeQuantity = (variantId: string, delta: number) => {
    setCart(prev => {
      const current = prev[variantId];
      if (!current) return prev;
      const nextQuantity = current.quantity + delta;
      if (nextQuantity <= 0) {
        const next = { ...prev };
        delete next[variantId];
        return next;
      }
      return { ...prev, [variantId]: { ...current, quantity: nextQuantity } };
    });
  };

  const handleChangeField = (variantId: string, field: 'purposeType' | 'notes', value: string) => {
    setCart(prev => {
      const current = prev[variantId];
      if (!current) return prev;
      return { ...prev, [variantId]: { ...current, [field]: value } };
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

    if (cartLines.length === 0) {
      toast.error('Giỏ yêu cầu đang trống.');
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
        notes: generalNotes.trim() || undefined,
        metadata: { source: 'requisition_cart_page' },
        items: cartLines.map((line, index) => ({
          productId: line.product.id,
          variantId: line.variant.id,
          quantityRequested: line.quantity,
          unit: line.variant.unit,
          purposeType: line.purposeType,
          notes: line.notes.trim() || undefined,
          displayOrder: index,
          metadata: { source: 'requisition_cart' },
        })),
      });

      toast.success('Đã gửi yêu cầu vật tư.');
      setCart({});
      setIsCartOpen(false);
      navigate('/warehouse/requisitions');
    } catch (error) {
      console.error('Không gửi được yêu cầu vật tư:', error);
      toast.error('Không gửi được yêu cầu vật tư.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCartForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900">Khu yêu cầu</label>
        <select
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
        <label className="block text-sm font-medium text-gray-900">Người yêu cầu</label>
        <input
          type="text"
          value={requesterName}
          onChange={event => setRequesterName(event.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900">Mục đích chung</label>
        <textarea
          value={generalNotes}
          onChange={event => setGeneralNotes(event.target.value)}
          rows={2}
          placeholder="Ví dụ: thay bóng đèn khu A, bổ sung vật tư vệ sinh..."
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900">Vật tư trong giỏ ({formatNumber(cartLines.length)} dòng)</p>
        <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
          {cartLines.length === 0 ? (
            <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-500">
              Bấm nút <span className="font-semibold">+</span> ở danh sách vật tư để thêm vào giỏ.
            </p>
          ) : cartLines.map(line => (
            <div key={line.variant.id} className="rounded-md bg-gray-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{line.product.name}</p>
                  <p className="text-xs text-gray-500">{getVariantLabel(line.variant.attributes)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleChangeQuantity(line.variant.id, -1)}
                    className="h-8 w-8 rounded-md border border-gray-300 bg-white text-lg font-semibold text-gray-700 hover:bg-gray-100"
                    aria-label="Giảm số lượng"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{formatNumber(line.quantity)}</span>
                  <button
                    type="button"
                    onClick={() => handleChangeQuantity(line.variant.id, 1)}
                    className="h-8 w-8 rounded-md border border-gray-300 bg-white text-lg font-semibold text-gray-700 hover:bg-gray-100"
                    aria-label="Tăng số lượng"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <select
                  value={line.purposeType}
                  onChange={event => handleChangeField(line.variant.id, 'purposeType', event.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {purposeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={line.notes}
                  onChange={event => handleChangeField(line.variant.id, 'notes', event.target.value)}
                  placeholder="Ghi chú dòng"
                  className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setIsCartOpen(false);
            setCart({});
          }}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Xoá giỏ
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isSubmitting ? 'Đang gửi...' : `Gửi yêu cầu (${formatNumber(cartCount)})`}
        </button>
      </div>
    </form>
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-blue-700">Phiếu yêu cầu core</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Yêu cầu vật tư</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tìm vật tư, bấm <span className="font-semibold">+</span> để thêm vào giỏ, rồi gửi yêu cầu cho quản kho.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/warehouse/requisitions')}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Xem phiếu yêu cầu của tôi
        </button>
      </div>

      <div className="min-h-0 flex-1 gap-5 lg:grid lg:grid-cols-[1fr_380px]">
        <section className="space-y-3">
          <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row">
            <input
              type="text"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Tìm vật tư, biến thể, mã SKU..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex gap-2 overflow-x-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                    category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Không tìm thấy vật tư phù hợp.
            </div>
          ) : visibleProducts.map(product => (
            <article key={product.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900">{product.name}</h2>
                  <p className="mt-0.5 text-xs text-gray-500">{product.category}</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {product.variants.map(variant => {
                  const line = cart[variant.id];
                  const isComposite = variant.components && variant.components.length > 0;
                  return (
                    <div key={variant.id} className="flex items-center justify-between gap-3 rounded-md bg-gray-50 p-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{getVariantLabel(variant.attributes)}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {isComposite ? 'Vật tư lắp ráp (bộ)' : `Còn ${formatNumber(variant.stock)} ${variant.unit || ''}`}
                        </p>
                      </div>
                      {line && line.quantity > 0 ? (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleChangeQuantity(variant.id, -1)}
                            className="h-8 w-8 rounded-md border border-blue-300 bg-white text-lg font-semibold text-blue-700 hover:bg-blue-50"
                            aria-label="Bớt 1"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-gray-900">{formatNumber(line.quantity)}</span>
                          <button
                            type="button"
                            onClick={() => handleChangeQuantity(variant.id, 1)}
                            className="h-8 w-8 rounded-md border border-blue-300 bg-white text-lg font-semibold text-blue-700 hover:bg-blue-50"
                            aria-label="Thêm 1"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdd(product, variant)}
                          className="flex shrink-0 items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          <span className="text-base leading-none">+</span> Yêu cầu
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </section>

        <aside className="hidden max-h-[calc(100dvh-9rem)] self-start rounded-lg border border-gray-200 bg-white p-4 lg:sticky lg:top-24 lg:block">
          <h2 className="text-base font-semibold text-gray-900">
            Giỏ yêu cầu <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{formatNumber(cartCount)}</span>
          </h2>
          <div className="mt-4">{renderCartForm()}</div>
        </aside>
      </div>

      {/* Mobile: fixed bottom bar + cart sheet */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white p-3 shadow-lg lg:hidden">
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Giỏ yêu cầu ({formatNumber(cartCount)} vật tư) — Xem & gửi
        </button>
      </div>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:max-w-lg sm:rounded-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Giỏ yêu cầu ({formatNumber(cartCount)} vật tư)</h2>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
            {renderCartForm()}
          </div>
        </div>
      )}
    </main>
  );
};

export default CoreRequisitionPage;
