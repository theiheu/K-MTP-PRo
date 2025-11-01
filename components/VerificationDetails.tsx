import React from "react";
import { DeliveryNote, DeliveryVerification } from "../types";
import { ItemCheck } from "../types/verification";

interface VerificationDetailsProps {
  delivery: DeliveryNote;
  verification: DeliveryVerification;
}

export const VerificationDetails: React.FC<VerificationDetailsProps> = ({
  delivery,
  verification,
}) => {
  const renderTimeline = () => {
    const events = [
      {
        date: new Date(delivery.createdAt),
        title: "Tạo phiếu",
        person: delivery.createdBy,
        type: "create",
      },
      ...(delivery.history || []).map((h) => ({
        date: new Date(h.timestamp),
        title: h.action,
        person: h.user,
        notes: h.notes,
        type: "history",
        metadata: h.metadata,
      })),
      ...(verification
        ? [
            {
              date: new Date(verification.verifiedAt),
              title: "Xác nhận",
              person: verification.verifiedBy,
              notes: verification.notes,
              type: "verify",
            },
          ]
        : []),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
      <div className="flow-root">
        <ul role="list" className="-mb-8">
          {events.map((event, eventIdx) => (
            <li key={eventIdx}>
              <div className="relative pb-8">
                {eventIdx !== events.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        event.type === "create"
                          ? "bg-blue-500"
                          : event.type === "verify"
                          ? "bg-green-500"
                          : "bg-gray-500"
                      }`}
                    >
                      <svg
                        className="h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        {event.type === "create" ? (
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 00-1 1v4H5a1 1 0 100 2h4v4a1 1 0 102 0v-4h4a1 1 0 100-2h-4V4a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        ) : event.type === "verify" ? (
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                            clipRule="evenodd"
                          />
                        )}
                      </svg>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {event.title}{" "}
                        <span className="font-medium text-gray-900">
                          {event.person}
                        </span>
                      </p>
                      {event.notes && (
                        <p className="mt-1 text-sm text-gray-500">
                          {event.notes}
                        </p>
                      )}
                      {event.metadata && (
                        <div className="mt-1 text-sm text-gray-500">
                          {event.metadata.type === "quantity_change" && (
                            <span>
                              Thay đổi số lượng: {event.metadata.oldValue} →{" "}
                              {event.metadata.newValue}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <time dateTime={event.date.toISOString()}>
                        {event.date.toLocaleString("vi-VN")}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderChecks = () => {
    return (
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900">Chi tiết kiểm tra</h3>
        <div className="mt-4 space-y-6">
          {Object.entries(verification.itemChecks).map(
            ([itemId, check]: [string, ItemCheck]) => {
              const [productId, variantId] = itemId.split("-");
              const item = delivery.items.find(
                (i) =>
                  i.productId.toString() === productId &&
                  i.variantId.toString() === variantId
              );
              if (!item) return null;

              return (
                <div
                  key={itemId}
                  className="bg-white shadow overflow-hidden sm:rounded-lg"
                >
                  <div className="px-4 py-5 sm:px-6">
                    <h4 className="text-sm font-medium text-gray-900">
                      {item.productName}
                      {item.variantAttributes &&
                        ` - ${Object.values(item.variantAttributes).join(
                          " / "
                        )}`}
                    </h4>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>
                        Số lượng giao: {item.quantity} {item.unit}
                      </p>
                      <p>
                        Số lượng thực tế: {check.actualQuantity} {item.unit}
                      </p>
                    </div>
                    {check.hasIssue && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Có vấn đề
                        </span>
                        {check.issueNote && (
                          <p className="mt-1 text-sm text-red-600">
                            {check.issueNote}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <p className="text-xs text-gray-500">
                      Kiểm tra bởi {check.checkedBy} lúc{" "}
                      {new Date(check.checkedAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Chi tiết xác nhận
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Thông tin về quá trình kiểm tra và xác nhận phiếu giao hàng.
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        {renderTimeline()}
        {verification && renderChecks()}
      </div>
    </div>
  );
};
