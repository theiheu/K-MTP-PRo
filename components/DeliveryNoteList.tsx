import React, { useState, useMemo, useCallback } from "react";
import {
  DeliveryNote,
  DeliveryStatus,
  Product,
  User,
  DeliveryHistory,
  DeliveryVerification
} from "../types";
import { VerificationDetails } from './VerificationDetails';

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

  // Advanced filters and validation
  const [advancedFilter, setAdvancedFilter] = useState({
    shipperId: "",
    hasIssues: false,
    priority: "all" as "all" | "low" | "medium" | "high",
  });

  // Stats for current page
  const stats = useMemo(() => {
    const total = deliveryNotes.length;
    const pending = deliveryNotes.filter((d) => d.status === "pending").length;
    const verified = deliveryNotes.filter(
      (d) => d.status === "verified"
    ).length;
    const rejected = deliveryNotes.filter(
      (d) => d.status === "rejected"
    ).length;
    const withIssues = deliveryNotes.filter((d) =>
      d.items.some((i) => i.hasIssue)
    ).length;

    return {
      total,
      pending,
      verified,
      rejected,
      withIssues,
      percentVerified: total > 0 ? Math.round((verified / total) * 100) : 0,
    };
  }, [deliveryNotes]);

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
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);

  // Validation helpers
  const validateQuantity = (actualQty: number, expectedQty: number) => {
    if (actualQty > expectedQty) {
      alert("Số lượng thực tế không thể lớn hơn số lượng giao");
      return false;
    }
    return true;
  };

  // Filtered deliveries computation
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

      const matchesAdvancedFilter =
        (!advancedFilter.shipperId ||
          note.shipperId === advancedFilter.shipperId) &&
        (!advancedFilter.hasIssues || note.items.some((i) => i.hasIssue)) &&
        (advancedFilter.priority === "all" ||
          note.priority === advancedFilter.priority);

      return (
        matchesSearch && matchesStatus && matchesDate && matchesAdvancedFilter
      );
    });
  }, [deliveryNotes, searchTerm, statusFilter, dateRange, advancedFilter]);

  // Export function
  const exportToCSV = useCallback(() => {
    const csvContent = filteredDeliveries.map((d) => ({
      "Mã phiếu": d.id,
      "Ngày tạo": new Date(d.createdAt).toLocaleDateString(),
      "Người giao": d.shipperId,
      "Trạng thái": statusLabels[d.status],
      "Người xác nhận": d.verifiedBy || "",
      "Ngày xác nhận": d.verifiedAt
        ? new Date(d.verifiedAt).toLocaleDateString()
        : "",
      "Ghi chú": d.verificationNotes || "",
    }));

    // Using native browser features instead of papaparse for now
    const headers = Object.keys(csvContent[0]).join(",");
    const rows = csvContent.map((obj) => Object.values(obj).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `delivery-notes-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
  }, [filteredDeliveries]);

  // Bulk actions
  const handleBulkVerify = useCallback(() => {
    if (
      !window.confirm(`Xác nhận ${selectedDeliveries.length} phiếu giao hàng?`)
    ) {
      return;
    }

    selectedDeliveries.forEach((id) => {
      verifyDeliveryNote(id, currentUser.name);
    });
    setSelectedDeliveries([]);
  }, [selectedDeliveries, verifyDeliveryNote, currentUser.name]);

  // History tracking
  const addHistoryEntry = useCallback(
    (
      delivery: DeliveryNote, 
      action: string, 
      notes?: string,
      metadata?: {
        oldValue?: any;
        newValue?: any;
        type?: string;
      }
    ) => {
      const historyEntry: DeliveryHistory = {
        timestamp: new Date().toISOString(),
        action,
        user: currentUser.name,
        notes,
        metadata
      };
      delivery.history = [...(delivery.history || []), historyEntry];
      delivery.lastModified = new Date().toISOString();
    },
    [currentUser.name]
  );
  
  // Process start time tracking
  const [stopProcessingTimer, setStopProcessingTimer] = useState<(() => void) | null>(null);

  const startProcessingTimer = useCallback((delivery: DeliveryNote) => {
    const startTime = new Date();
    const stopTimer = () => {
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // in minutes
      if (delivery.processingDuration) {
        delivery.processingDuration += duration;
      } else {
        delivery.processingDuration = duration;
      }
    };
    setStopProcessingTimer(() => stopTimer);
  }, []);

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
    const initialVerification: DeliveryVerification = {
      verifiedBy: currentUser.name,
      verifiedAt: new Date().toISOString(),
      itemChecks: {},
    };

    delivery.items.forEach((item) => {
      const key = `${item.productId}-${item.variantId}`;
      initialQuantities[key] = item.quantity;
      initialIssues[key] = { hasIssue: false };
      initialVerification.itemChecks[key] = {
        actualQuantity: item.quantity,
        hasIssue: false,
        checkedBy: currentUser.name,
        checkedAt: new Date().toISOString()
      };
    });

    setActualQuantities(initialQuantities);
    setIssues(initialIssues);
    // Save verification details
    delivery.verification = initialVerification;
  };

  const [showQualityRating, setShowQualityRating] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [qualityRating, setQualityRating] = useState<{
    rating: 1 | 2 | 3 | 4 | 5;
    comments?: string;
  }>({ rating: 5 });

  const handleVerify = () => {
    if (!currentDelivery) return;
    
    // Show quality rating modal
    setShowQualityRating(true);
  };

  const completeVerification = () => {
    if (!currentDelivery) return;
    
    // Add quality info
    currentDelivery.quality = {
      ...qualityRating,
      reviewedBy: currentUser.name,
      reviewedAt: new Date().toISOString()
    };

    // Stop processing timer and record duration
    stopProcessingTimer();

    verifyDeliveryNote(currentDelivery.id, currentUser.name);
    
    // Reset states
    setCurrentDelivery(null);
    setShowQualityRating(false);
    setQualityRating({ rating: 5 });
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
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Phiếu Giao Hàng
            </h2>
            {selectedDeliveries.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkVerify}
                  className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600"
                >
                  Xác nhận {selectedDeliveries.length} phiếu
                </button>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Xuất ${selectedDeliveries.length} phiếu thành file CSV?`
                      )
                    ) {
                      exportToCSV();
                    }
                  }}
                  className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600"
                >
                  Xuất CSV
                </button>
                <button
                  onClick={() => setSelectedDeliveries([])}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
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
          {sortedDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className={`bg-white shadow-sm rounded-lg p-6 ${
                selectedDeliveries.includes(delivery.id)
                  ? "ring-2 ring-yellow-500"
                  : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedDeliveries.includes(delivery.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDeliveries([
                          ...selectedDeliveries,
                          delivery.id,
                        ]);
                      } else {
                        setSelectedDeliveries(
                          selectedDeliveries.filter((id) => id !== delivery.id)
                        );
                      }
                    }}
                    className="mt-1 rounded text-yellow-600 focus:ring-yellow-500"
                  />
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
                      {delivery.quality && (
                        <p className="mt-2">
                          Đánh giá chất lượng: {delivery.quality.rating}/5
                          {delivery.quality.comments && (
                            <span className="block mt-1 italic">
                              "{delivery.quality.comments}"
                            </span>
                          )}
                        </p>
                      )}
                      {delivery.processingDuration && (
                        <p className="mt-1">
                          Thời gian xử lý: {delivery.processingDuration} phút
                        </p>
                      )}
                    </div>

                    {/* History Button */}
                    <button
                      onClick={() => setShowHistory(delivery.id)}
                      className="mt-2 text-sm text-yellow-600 hover:text-yellow-700"
                    >
                      Xem lịch sử
                    </button>
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
                                    checked={issues[itemKey]?.hasIssue || false}
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
          ))}
        </div>
      )}

      {/* Quality Rating Modal */}
      {showQualityRating && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Đánh giá chất lượng
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Xếp hạng
                    </label>
                    <div className="flex gap-4">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setQualityRating(prev => ({ ...prev, rating: rating as 1 | 2 | 3 | 4 | 5 }))}
                          className={`p-2 rounded-full ${
                            qualityRating.rating === rating
                              ? 'bg-yellow-100 ring-2 ring-yellow-500'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <svg
                            className={`w-6 h-6 ${
                              qualityRating.rating >= rating
                                ? 'text-yellow-500'
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhận xét
                    </label>
                    <textarea
                      value={qualityRating.comments || ''}
                      onChange={(e) =>
                        setQualityRating(prev => ({
                          ...prev,
                          comments: e.target.value
                        }))
                      }
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                      placeholder="Nhập nhận xét về chất lượng..."
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={completeVerification}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Hoàn tất xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => setShowQualityRating(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                {deliveryNotes.find(d => d.id === showHistory)?.verification && (
                  <VerificationDetails
                    delivery={deliveryNotes.find(d => d.id === showHistory)!}
                    verification={deliveryNotes.find(d => d.id === showHistory)!.verification!}
                  />
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowHistory(null)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:w-auto sm:text-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
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
