import React, { useState, useMemo } from "react";
import { DeliveryNote, DeliveryStatus, Product, User } from "../types";

interface DeliveryNoteListProps {
  deliveryNotes: DeliveryNote[];
  products: Product[];
  currentUser: User;
  onNavigate: (view: string) => void;
  createDeliveryNote: (
    items: DeliveryNote["items"],
    receiptId: string,
    shipperId: string
  ) => void;
  verifyDeliveryNote: (
    noteId: string,
    verifierName: string,
    verificationNotes?: string
  ) => void;
  rejectDeliveryNote: (
    noteId: string,
    verifierName: string,
    rejectionReason: string
  ) => void;
}

const statusLabels: Record<DeliveryStatus, string> = {
  pending: "Chờ kiểm tra",
  verified: "Đã xác nhận",
  rejected: "Đã từ chối",
};

const statusStyles: Record<DeliveryStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const DeliveryNoteList: React.FC<DeliveryNoteListProps> = ({
  deliveryNotes,
  products,
  currentUser,
  onNavigate,
  createDeliveryNote,
  verifyDeliveryNote,
  rejectDeliveryNote,
}) => {
  const [currentDelivery, setCurrentDelivery] = useState<DeliveryNote | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DeliveryStatus>(
    "all"
  );
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [actualQuantities, setActualQuantities] = useState<{
    [key: string]: number;
  }>({});
  const [issues, setIssues] = useState<{
    [key: string]: { hasIssue: boolean; note?: string };
  }>({});
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const getProductDetails = (productId: number, variantId: number) => {
    const product = products.find((p) => p.id === productId);
    const variant = product?.variants.find((v) => v.id === variantId);
    return {
      productName: product?.name || "Unknown Product",
      variantName:
        Object.values(variant?.attributes || {}).join(" / ") || "Mặc định",
      unit: variant?.unit,
    };
  };

  const filteredDeliveries = useMemo(() => {
    return deliveryNotes.filter((note) => {
      const noteDate = new Date(note.createdAt);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end day

      const matchesSearch =
        searchTerm === "" ||
        note.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.shipperId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.createdBy.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || note.status === statusFilter;

      const matchesDate = noteDate >= startDate && noteDate <= endDate;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [deliveryNotes, searchTerm, statusFilter, dateRange]);

  const sortedDeliveries = useMemo(() => {
    return [...filteredDeliveries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredDeliveries]);

  const handleStartCheck = (delivery: DeliveryNote) => {
    setCurrentDelivery(delivery);
    const initialQuantities: { [key: string]: number } = {};
    const initialIssues: {
      [key: string]: { hasIssue: boolean; note?: string };
    } = {};

    delivery.items.forEach((item) => {
      const key = `${item.productId}-${item.variantId}`;
      initialQuantities[key] = item.quantity;
      initialIssues[key] = { hasIssue: false };
    });

    setActualQuantities(initialQuantities);
    setIssues(initialIssues);
  };

  const handleVerify = () => {
    if (!currentDelivery) return;
    verifyDeliveryNote(currentDelivery.id, currentUser.name);
    setCurrentDelivery(null);
  };

  const handleSubmitReject = () => {
    if (!currentDelivery || !rejectionReason.trim()) return;
    rejectDeliveryNote(
      currentDelivery.id,
      currentUser.name,
      rejectionReason.trim()
    );
    setShowRejectionModal(false);
    setCurrentDelivery(null);
    setRejectionReason("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Phiếu Giao Hàng
          </h2>
          <button
            onClick={() => onNavigate("create-delivery")}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Tạo phiếu giao hàng
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã phiếu, người giao..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ kiểm tra</option>
                <option value="verified">Đã xác nhận</option>
                <option value="rejected">Đã từ chối</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">Tổng số phiếu</div>
          <div className="mt-1 text-2xl font-semibold">
            {filteredDeliveries.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">Chờ xác nhận</div>
          <div className="mt-1 text-2xl font-semibold text-yellow-600">
            {filteredDeliveries.filter((d) => d.status === "pending").length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">Đã xác nhận</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {filteredDeliveries.filter((d) => d.status === "verified").length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">Đã từ chối</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {filteredDeliveries.filter((d) => d.status === "rejected").length}
          </div>
        </div>
      </div>

      {/* Delivery Notes List */}
      {filteredDeliveries.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">Không tìm thấy phiếu giao hàng nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDeliveries.map((delivery) => {
            return (
              <div
                key={delivery.id}
                className="bg-white shadow-sm rounded-lg p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Phiếu #{delivery.id}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Mã phiếu nhập: {delivery.receiptId}</p>
                      <p>Mã người giao: {delivery.shipperId}</p>
                      <p>
                        Người tạo: {delivery.createdBy} (
                        {new Date(delivery.createdAt).toLocaleString("vi-VN")})
                      </p>
                      {delivery.verifiedBy && delivery.verifiedAt && (
                        <p>
                          {delivery.status === "verified"
                            ? "Người xác nhận: "
                            : "Người từ chối: "}
                          {delivery.verifiedBy} (
                          {new Date(delivery.verifiedAt).toLocaleString(
                            "vi-VN"
                          )}
                          )
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusStyles[delivery.status]
                    }`}
                  >
                    {statusLabels[delivery.status]}
                  </span>
                </div>

                <div className="mt-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vật tư
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Biến thể
                        </th>
                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SL Giao
                        </th>
                        {delivery.status === "verified" && (
                          <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SL Thực tế
                          </th>
                        )}
                        {delivery.status === "verified" && (
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vấn đề
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {delivery.items.map((item, index) => {
                        const { productName, variantName, unit } =
                          getProductDetails(item.productId, item.variantId);
                        const itemKey = `${item.productId}-${item.variantId}`;
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {productName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {variantName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {item.quantity} {unit}
                            </td>
                            {currentDelivery?.id === delivery.id ? (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <input
                                    type="number"
                                    value={actualQuantities[itemKey]}
                                    onChange={(e) =>
                                      setActualQuantities({
                                        ...actualQuantities,
                                        [itemKey]: Math.max(
                                          0,
                                          parseInt(e.target.value) || 0
                                        ),
                                      })
                                    }
                                    className="w-20 rounded-md border-gray-300"
                                    min="0"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={
                                        issues[itemKey]?.hasIssue || false
                                      }
                                      onChange={(e) =>
                                        setIssues({
                                          ...issues,
                                          [itemKey]: {
                                            ...issues[itemKey],
                                            hasIssue: e.target.checked,
                                          },
                                        })
                                      }
                                      className="rounded border-gray-300 text-yellow-600"
                                    />
                                    {issues[itemKey]?.hasIssue && (
                                      <input
                                        type="text"
                                        value={issues[itemKey]?.note || ""}
                                        onChange={(e) =>
                                          setIssues({
                                            ...issues,
                                            [itemKey]: {
                                              ...issues[itemKey],
                                              note: e.target.value,
                                            },
                                          })
                                        }
                                        placeholder="Ghi chú vấn đề..."
                                        className="flex-1 rounded-md border-gray-300 text-sm"
                                      />
                                    )}
                                  </div>
                                </td>
                              </>
                            ) : (
                              delivery.status !== "pending" && (
                                <>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                    {item.actualQuantity} {unit}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.hasIssue && (
                                      <span className="text-red-600">
                                        {item.issueNote}
                                      </span>
                                    )}
                                  </td>
                                </>
                              )
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {delivery.status === "pending" &&
                  currentUser.role === "manager" && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleStartCheck(delivery)}
                        className="px-4 py-2 text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                      >
                        Bắt đầu kiểm tra
                      </button>
                    </div>
                  )}

                {currentDelivery?.id === delivery.id && (
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowRejectionModal(true)}
                      className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={handleVerify}
                      className="px-4 py-2 text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                    >
                      Xác nhận kiểm tra
                    </button>
                  </div>
                )}

                {delivery.status === "checking" &&
                  currentUser.role === "manager" && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() =>
                          verifyDeliveryNote(delivery.id, currentUser.name)
                        }
                        className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Xác nhận nhập kho
                      </button>
                    </div>
                  )}

                {delivery.status === "rejected" && delivery.rejectionReason && (
                  <div className="mt-4 p-4 bg-red-50 rounded-md">
                    <p className="text-sm text-red-700">
                      <strong>Lý do từ chối:</strong> {delivery.rejectionReason}
                    </p>
                  </div>
                )}

                {delivery.notes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">
                      <strong>Ghi chú:</strong> {delivery.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Lý do từ chối
                </h3>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  placeholder="Nhập lý do từ chối phiếu giao nhận..."
                />
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmitReject}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Xác nhận từ chối
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason("");
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryNoteList;
