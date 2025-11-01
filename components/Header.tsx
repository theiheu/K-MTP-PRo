import React from "react";
import { User } from "../types";

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (
    view:
      | "shop"
      | "requisitions"
      | "create-requisition"
      | "admin"
      | "deliveries"
      | "create-delivery"
  ) => void;
  currentView: string;
  user: User;
  onLogout: () => void;
}

const ClipboardDocumentListIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 5.25 6h.008a2.25 2.25 0 0 1 2.242 2.135 48.47 48.47 0 0 0 1.123.08m-1.123-.08a2.252 2.252 0 0 0-1.343.364M5.25 6h.008a2.25 2.25 0 0 0 2.242-2.135 48.47 48.47 0 0 1 1.123-.08m-1.123.08a2.252 2.252 0 0 1 1.343-.364m0 0A48.421 48.421 0 0 1 12 4.5c2.252 0 4.403.334 6.443.952m-6.443-.952c-.2.115-.38.243-.54.382m12.448 0c-.16-.139-.34-.267-.54-.382M12 4.5a2.252 2.252 0 0 0-1.343.364m1.343-.364a2.252 2.252 0 0 1 1.343.364m-1.343.364c-.2.115-.38.243-.54.382"
    />
  </svg>
);

const StoreIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 21v-7.5A.75.75 0 0 1 14.25 12h.75c.414 0 .75.336.75.75v7.5m0 0H18A2.25 2.25 0 0 0 20.25 18v-7.5a2.25 2.25 0 0 0-2.25-2.25H15M13.5 21H3.75A2.25 2.25 0 0 1 1.5 18.75V8.25A2.25 2.25 0 0 1 3.75 6h16.5a2.25 2.25 0 0 1 2.25 2.25v7.5A2.25 2.25 0 0 1 18 21h-4.5m-4.5 0H9.75c-.414 0-.75-.336-.75-.75V13.5c0-.414.336-.75.75-.75h.75c.414 0 .75.336.75.75v7.5m0 0H12m0-9.75h.008v.008H12V11.25Z"
    />
  </svg>
);

const ArrowRightOnRectangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
    />
  </svg>
);

const Header: React.FC<HeaderProps> = ({
  cartItemCount,
  onCartClick,
  onNavigate,
  currentView,
  user,
  onLogout,
}) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex-1 flex justify-start items-center">
            {/* Cart Button for Mobile */}
            {currentView === "shop" ? (
              <div className="sm:hidden flow-root">
                <button
                  onClick={onCartClick}
                  className="group -m-2 p-2 flex items-center relative"
                >
                  <ClipboardDocumentListIcon
                    className="flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500"
                    aria-hidden="true"
                  />
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                  <span className="sr-only">Xem phiếu yêu cầu tạm thời</span>
                </button>
              </div>
            ) : (
              // Placeholder to balance the logout icon when cart is not shown
              <div className="sm:hidden" style={{ width: "40px" }}></div>
            )}

            {/* User info for Desktop */}
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-800">
                {user.name}
              </div>
              <div className="text-xs text-gray-500">
                {user.role === "manager"
                  ? "Quản lý kho"
                  : `Người yêu cầu (Khu: ${user.zone})`}
              </div>
            </div>
          </div>

          {/* Center Section (Logo) */}
          <div className="flex-shrink-0 px-4">
            <button
              onClick={() => onNavigate("shop")}
              className="flex items-center space-x-2 text-xl sm:text-2xl font-bold text-gray-800"
            >
              <StoreIcon className="h-8 w-8 text-yellow-600" />
              <span className="hidden sm:inline">Vật tư Trại Gà</span>
              <span className="sm:hidden text-lg">Vật tư Trại Gà</span>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex-1 flex justify-end items-center">
            {/* Cart Button for Desktop */}
            {currentView === "shop" && (
              <div className="hidden sm:ml-6 sm:flow-root">
                <button
                  onClick={onCartClick}
                  className="group -m-2 p-2 flex items-center relative"
                >
                  <ClipboardDocumentListIcon
                    className="flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500"
                    aria-hidden="true"
                  />
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 -right-2 block h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center ring-2 ring-white">
                      {cartItemCount}
                    </span>
                  )}
                  <span className="sr-only">Xem phiếu yêu cầu tạm thời</span>
                </button>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="ml-4 p-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
