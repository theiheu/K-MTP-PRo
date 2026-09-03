import React from "react";
import { User, AdminTab } from "../types";

interface DesktopNavProps {
  onNavigate: (
    view:
      | "shop"
      | "requisitions"
      | "receipts"
      | "admin"
      | "deliveries"
      | "create-delivery",
    tab?: AdminTab
  ) => void;
  currentView: string;
  user: User;
}

const DesktopNav: React.FC<DesktopNavProps> = ({
  onNavigate,
  currentView,
  user,
}) => {
  return (
    <nav className="hidden sm:block bg-white shadow-sm sticky top-16 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center space-x-4 h-12">
          <button
            onClick={() => onNavigate("shop")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentView === "shop"
                ? "bg-amber-100 text-amber-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Kho vật tư
          </button>
          <button
            onClick={() => onNavigate("requisitions")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentView === "requisitions"
                ? "bg-amber-100 text-amber-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Phiếu yêu cầu
          </button>
          {["manager", "auditor"].includes(user.role) && (
            <>
              <button
                onClick={() => onNavigate("receipts")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  ["receipts", "create-receipt"].includes(currentView)
                    ? "bg-amber-100 text-amber-800"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                Nhập Kho
              </button>
              <button
                onClick={() => onNavigate("deliveries")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  ["deliveries", "create-delivery"].includes(currentView)
                    ? "bg-amber-100 text-amber-800"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                Giao Hàng
              </button>
              <div className="h-6 border-l border-gray-300 mx-2"></div>
              <button
                onClick={() => onNavigate("admin", "products")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  currentView === "admin"
                    ? "bg-amber-100 text-amber-800"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                Quản lý
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DesktopNav;

