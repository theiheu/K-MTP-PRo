import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from "react";
import { Toaster, toast } from "react-hot-toast";
import Header from "./components/Header";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import Chatbot from "./components/Chatbot";
import BottomNav from "./components/BottomNav";
import DesktopNav from "./components/DesktopNav";
import LoginPage from "./components/LoginPage";
import Pagination from "./components/Pagination";
import SearchBar from "./components/SearchBar";
import CategoryNav from "./components/CategoryNav";
import {
  Product,
  CartItem,
  RequisitionForm,
  User,
  Category,
  Variant,
  GoodsReceiptNote,
  AdminTab,
  Zone,
  DeliveryNote,
} from "./types";
import { PRODUCTS, DEFAULT_CATEGORIES } from "./constants";
import { calculateVariantStock } from "./utils/stockCalculator";
import { cloneProductList } from "./utils/productUtils";

const RequisitionListPage = lazy(
  () => import("./components/RequisitionListPage")
);
const CreateRequisitionPage = lazy(
  () => import("./components/CreateRequisitionPage")
);
const AdminPage = lazy(() => import("./components/AdminPage"));
const CreateReceiptPage = lazy(() => import("./components/CreateReceiptPage"));
const ReceiptList = lazy(() => import("./components/ReceiptList"));
const DeliveryNoteList = lazy(() => import("./components/DeliveryNoteList"));
const CreateDeliveryNote = lazy(
  () => import("./components/CreateDeliveryNote")
);

const USER_STORAGE_KEY = "chicken_farm_user";
const REQUISITIONS_STORAGE_KEY = "chicken_farm_requisitions";
const PRODUCTS_STORAGE_KEY = "chicken_farm_products";
const CATEGORIES_STORAGE_KEY = "chicken_farm_categories";
const RECEIPTS_STORAGE_KEY = "chicken_farm_receipts";
const ZONES_STORAGE_KEY = "chicken_farm_zones";
const DELIVERY_NOTES_STORAGE_KEY = "chicken_farm_delivery_notes";

const PRODUCTS_PER_PAGE = 10;

type ViewKey =
  | "shop"
  | "requisitions"
  | "receipts"
  | "create-requisition"
  | "admin"
  | "create-receipt"
  | "deliveries"
  | "create-delivery";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [masterProductList, setMasterProductList] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      return savedProducts ? JSON.parse(savedProducts) : PRODUCTS;
    } catch (error) {
      console.error("Không thể tải sản phẩm từ localStorage", error);
      return PRODUCTS;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const savedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      const parsed = savedCategories
        ? JSON.parse(savedCategories)
        : DEFAULT_CATEGORIES;
      return parsed.filter((c: Category) => c.name !== "Tất cả");
    } catch (error) {
      console.error("Không thể tải danh mục từ localStorage", error);
      return DEFAULT_CATEGORIES.filter((c) => c.name !== "Tất cả");
    }
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [productCurrentPage, setProductCurrentPage] = useState(1);

  const [currentView, setCurrentView] = useState<ViewKey>("shop");
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>("products");

  const [requisitionForms, setRequisitionForms] = useState<RequisitionForm[]>(
    () => {
      try {
        const savedRequisitions = localStorage.getItem(
          REQUISITIONS_STORAGE_KEY
        );
        return savedRequisitions ? JSON.parse(savedRequisitions) : [];
      } catch (error) {
        console.error("Không thể tải phiếu yêu cầu từ localStorage", error);
        return [];
      }
    }
  );

  const [goodsReceiptNotes, setGoodsReceiptNotes] = useState<
    GoodsReceiptNote[]
  >(() => {
    try {
      const savedReceipts = localStorage.getItem(RECEIPTS_STORAGE_KEY);
      return savedReceipts ? JSON.parse(savedReceipts) : [];
    } catch (error) {
      console.error("Không thể tải phiếu nhập kho từ localStorage", error);
      return [];
    }
  });

  const [zones, setZones] = useState<Zone[]>(() => {
    try {
      const savedZones = localStorage.getItem(ZONES_STORAGE_KEY);
      return savedZones
        ? JSON.parse(savedZones)
        : [
            {
              id: "1",
              name: "Khu 1",
              description: "",
              createdAt: new Date().toISOString(),
            },
            {
              id: "2",
              name: "Khu 2",
              description: "",
              createdAt: new Date().toISOString(),
            },
            {
              id: "3",
              name: "Khu 3",
              description: "",
              createdAt: new Date().toISOString(),
            },
            {
              id: "4",
              name: "Khu 4",
              description: "",
              createdAt: new Date().toISOString(),
            },
          ];
    } catch (error) {
      console.error("Không thể tải danh sách khu vực từ localStorage", error);
      return [];
    }
  });

  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>(() => {
    try {
      const savedNotes = localStorage.getItem(DELIVERY_NOTES_STORAGE_KEY);
      return savedNotes ? JSON.parse(savedNotes) : [];
    } catch (error) {
      console.error("Không thể tải phiếu giao hàng từ localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error(
        "Không thể đọc thông tin người dùng từ localStorage",
        error
      );
    }
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentUser, currentView, productCurrentPage]);

  useEffect(() => {
    try {
      localStorage.setItem(
        REQUISITIONS_STORAGE_KEY,
        JSON.stringify(requisitionForms)
      );
    } catch (error) {
      console.error("Không thể lưu phiếu yêu cầu vào localStorage", error);
    }
  }, [requisitionForms]);

  useEffect(() => {
    try {
      localStorage.setItem(
        RECEIPTS_STORAGE_KEY,
        JSON.stringify(goodsReceiptNotes)
      );
    } catch (error) {
      console.error("Không thể lưu phiếu nhập kho vào localStorage", error);
    }
  }, [goodsReceiptNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(
        PRODUCTS_STORAGE_KEY,
        JSON.stringify(masterProductList)
      );
    } catch (error) {
      console.error("Không thể lưu sản phẩm vào localStorage", error);
    }
  }, [masterProductList]);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error("Không thể lưu danh mục vào localStorage", error);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(ZONES_STORAGE_KEY, JSON.stringify(zones));
      window.zones = zones;
    } catch (error) {
      console.error("Không thể lưu khu vực vào localStorage", error);
    }
  }, [zones]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DELIVERY_NOTES_STORAGE_KEY,
        JSON.stringify(deliveryNotes)
      );
    } catch (error) {
      console.error("Không thể lưu phiếu giao hàng vào localStorage", error);
    }
  }, [deliveryNotes]);

  useEffect(() => {
    setProductCurrentPage(1);
  }, [searchTerm, category]);

  const filteredAndSortedProducts = useMemo(() => {
    let tempProducts = masterProductList;

    if (searchTerm) {
      tempProducts = tempProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (category !== "Tất cả") {
      tempProducts = tempProducts.filter((p) => p.category === category);
    }

    return tempProducts;
  }, [searchTerm, category, masterProductList]);

  const paginatedProducts = useMemo(
    () =>
      filteredAndSortedProducts.slice(
        (productCurrentPage - 1) * PRODUCTS_PER_PAGE,
        productCurrentPage * PRODUCTS_PER_PAGE
      ),
    [filteredAndSortedProducts, productCurrentPage]
  );

  const totalPages = useMemo(
    () => Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE),
    [filteredAndSortedProducts]
  );

  const allCategoriesForNav: Category[] = useMemo(
    () => [{ name: "Tất cả", icon: "" }, ...categories],
    [categories]
  );

  const cartItemCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const showDesktopNav = useMemo(
    () =>
      [
        "shop",
        "requisitions",
        "receipts",
        "admin",
        "deliveries",
        "create-delivery",
      ].includes(currentView),
    [currentView]
  );

  const handleNavigate = useCallback((view: ViewKey, tab?: AdminTab) => {
    setCurrentView(view);
    if (view === "admin" && tab) {
      setAdminInitialTab(tab);
    }
  }, []);

  const showToast = useCallback(
    (product: Product, quantity: number, isUpdate: boolean) => {
      const message = isUpdate
        ? `Đã cập nhật: ${product.name} (${quantity})`
        : `Đã thêm: ${product.name} (${quantity})`;

      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-yellow-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{message}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Nhấn giỏ hàng để xem chi tiết
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-yellow-600 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Đóng
              </button>
            </div>
          </div>
        ),
        {
          position: "top-right",
          duration: 3000,
        }
      );
    },
    []
  );
  const addToCart = useCallback(
    (product: Product, variant: Variant, quantity: number) => {
      const toastId = `cart-${product.id}-${variant.id}-${Date.now()}`;

      setCart((prevCart) => {
        const existingItem = prevCart.find(
          (item) => item.variant.id === variant.id
        );

        if (existingItem) {
          // Nếu sản phẩm đã tồn tại, cập nhật số lượng
          const newQuantity = existingItem.quantity + quantity;

          // Hiển thị toast
          toast.custom(
            (t) => (
              <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5">
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <svg
                        className="h-6 w-6 text-yellow-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Đã cập nhật: {product.name} ({newQuantity})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ),
            {
              id: toastId,
              duration: 2000,
              position: "top-right",
            }
          );

          return prevCart.map((item) =>
            item.variant.id === variant.id
              ? { ...item, quantity: newQuantity }
              : item
          );
        }

        // Nếu là sản phẩm mới
        toast.custom(
          (t) => (
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5">
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-yellow-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Đã thêm: {product.name} ({quantity})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ),
          {
            id: toastId,
            duration: 2000,
            position: "top-right",
          }
        );

        return [...prevCart, { product, variant, quantity }];
      });
    },
    []
  );

  const removeFromCart = useCallback((variantId: number) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.variant.id !== variantId)
    );
  }, []);

  const updateCartItem = useCallback(
    (variantId: number, quantity: number, oldVariantId?: number) => {
      setCart((prevCart) => {
        // Check if new variant already exists in cart
        const existingItemIndex = prevCart.findIndex(
          (item) => item.variant.id === variantId
        );

        // If changing variant
        if (oldVariantId) {
          const oldItemIndex = prevCart.findIndex(
            (item) => item.variant.id === oldVariantId
          );

          if (oldItemIndex === -1) return prevCart;

          const oldItem = prevCart[oldItemIndex];
          const newVariant = oldItem.product.variants.find(
            (v) => v.id === variantId
          );

          if (!newVariant) return prevCart;

          // If new variant already exists, remove old item and update quantity
          if (existingItemIndex !== -1) {
            return prevCart
              .filter((_, index) => index !== oldItemIndex)
              .map((item, index) => {
                if (index === existingItemIndex) {
                  return {
                    ...item,
                    quantity: item.quantity + quantity,
                  };
                }
                return item;
              });
          }

          // Otherwise, just update the variant
          return prevCart.map((item, index) => {
            if (index === oldItemIndex) {
              return {
                ...item,
                variant: newVariant,
                quantity,
              };
            }
            return item;
          });
        }

        // If just updating quantity
        return prevCart.map((item) => {
          if (item.variant.id === variantId) {
            return {
              ...item,
              quantity: Math.max(1, quantity),
            };
          }
          return item;
        });
      });
    },
    []
  );

  // Delivery note handlers
  const handleCreateDeliveryNote = useCallback(
    (items: DeliveryNote["items"], receiptId: string, shipperId: string) => {
      if (!currentUser) return;
      const newNote: DeliveryNote = {
        id: `DN-${Date.now()}`,
        items,
        status: "pending",
        receiptId,
        shipperId,
        createdBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      setDeliveryNotes((prev) => [newNote, ...prev]);
      handleNavigate("deliveries");
      return newNote;
    },
    [currentUser, handleNavigate]
  );

  const handleVerifyDeliveryNote = useCallback(
    (noteId: string, verifierName: string, verificationNotes: string = "") => {
      setDeliveryNotes((prev) =>
        prev.map((note) => {
          if (note.id === noteId) {
            return {
              ...note,
              status: "verified",
              verifiedBy: verifierName,
              verificationNotes,
              verifiedAt: new Date().toISOString(),
            };
          }
          return note;
        })
      );
    },
    []
  );

  const handleRejectDeliveryNote = useCallback(
    (noteId: string, verifierName: string, rejectionReason: string) => {
      setDeliveryNotes((prev) =>
        prev.map((note) => {
          if (note.id === noteId) {
            return {
              ...note,
              status: "rejected",
              verifiedBy: verifierName,
              verificationNotes: rejectionReason,
              verifiedAt: new Date().toISOString(),
            };
          }
          return note;
        })
      );
    },
    []
  );

  const handleNavigateToCreateRequisition = useCallback(() => {
    if (cartItemCount === 0) {
      alert("Vui lòng thêm vật tư vào phiếu trước khi tạo.");
      return;
    }
    handleNavigate("create-requisition");
  }, [cartItemCount, handleNavigate]);

  const handleCreateRequisition = useCallback(
    (details: { requesterName: string; zone: string; purpose: string }) => {
      if (!currentUser) return;
      const newForm: RequisitionForm = {
        id: `REQ-${Date.now()}`,
        ...details,
        items: cart,
        status: "Đang chờ xử lý",
        createdAt: new Date().toISOString(),
      };
      setRequisitionForms((prev) => [newForm, ...prev]);
      setCart([]);
      alert("Đã tạo phiếu yêu cầu thành công!");
      handleNavigate("requisitions");
    },
    [cart, currentUser, handleNavigate]
  );

  const handleFulfillRequisition = useCallback(
    (
      formId: string,
      details: { notes: string; fulfillerName: string },
      currentProductList: Product[],
      shouldClone: boolean = true
    ): { success: boolean; updatedProducts: Product[]; message?: string } => {
      const formToFulfill = requisitionForms.find((f) => f.id === formId);
      if (!formToFulfill) {
        return {
          success: false,
          updatedProducts: currentProductList,
          message: "Lỗi: Không tìm thấy phiếu yêu cầu.",
        };
      }

      const workingProductList = shouldClone
        ? cloneProductList(currentProductList)
        : currentProductList;

      let stockSufficient = true;
      const stockErrors: string[] = [];

      for (const item of formToFulfill.items) {
        const currentStock = calculateVariantStock(
          item.variant,
          workingProductList
        );
        if (currentStock < item.quantity) {
          const variantName =
            Object.values(item.variant.attributes).join(" / ") || "";
          stockErrors.push(
            `- Không đủ tồn kho cho "${item.product.name}" ${variantName}. Yêu cầu ${item.quantity}, còn lại ${currentStock}.`
          );
          stockSufficient = false;
        }
      }

      if (!stockSufficient) {
        return {
          success: false,
          updatedProducts: currentProductList,
          message: "Không thể hoàn thành phiếu:\n" + stockErrors.join("\n"),
        };
      }

      formToFulfill.items.forEach((item) => {
        const parentProductIndex = workingProductList.findIndex(
          (p) => p.id === item.product.id
        );
        if (parentProductIndex === -1) return;

        const isComposite =
          item.variant.components && item.variant.components.length > 0;
        if (isComposite) {
          item.variant.components!.forEach((component) => {
            const componentVariantIndex = workingProductList[
              parentProductIndex
            ].variants.findIndex((v) => v.id === component.variantId);
            if (componentVariantIndex !== -1) {
              workingProductList[parentProductIndex].variants[
                componentVariantIndex
              ].stock -= item.quantity * component.quantity;
            }
          });
        } else {
          const variantIndex = workingProductList[
            parentProductIndex
          ].variants.findIndex((v) => v.id === item.variant.id);
          if (variantIndex !== -1) {
            workingProductList[parentProductIndex].variants[
              variantIndex
            ].stock -= item.quantity;
          }
        }
      });

      setRequisitionForms((prev) =>
        prev.map((form) =>
          form.id === formId
            ? {
                ...form,
                status: "Đã hoàn thành",
                fulfilledBy: details.fulfillerName,
                fulfillmentNotes: details.notes,
                fulfilledAt: new Date().toISOString(),
              }
            : form
        )
      );

      return {
        success: true,
        updatedProducts: workingProductList,
        message: "Đã hoàn thành phiếu yêu cầu thành công!",
      };
    },
    [requisitionForms]
  );

  const triggerFulfillRequisition = useCallback(
    (formId: string, details: { notes: string; fulfillerName: string }) => {
      const result = handleFulfillRequisition(
        formId,
        details,
        masterProductList
      );
      if (result.success) {
        setMasterProductList(result.updatedProducts);
      }
      if (result.message) {
        alert(result.message);
      }
    },
    [handleFulfillRequisition, masterProductList]
  );

  const handleAddProduct = useCallback(
    (productData: Omit<Product, "id">) =>
      setMasterProductList((prev) => [
        ...prev,
        { ...productData, id: Date.now() },
      ]),
    []
  );

  const handleUpdateProduct = useCallback(
    (updatedProduct: Product) =>
      setMasterProductList((prev) =>
        prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
      ),
    []
  );

  const handleDeleteProduct = useCallback(
    (productId: number) =>
      setMasterProductList((prev) => prev.filter((p) => p.id !== productId)),
    []
  );

  const handleAddCategory = useCallback(
    (categoryData: Category) => {
      if (
        categories.some(
          (c) => c.name.toLowerCase() === categoryData.name.toLowerCase()
        )
      ) {
        alert("Một danh mục với tên này đã tồn tại.");
        return;
      }
      setCategories((prev) => [...prev, categoryData]);
    },
    [categories]
  );

  const handleDeleteCategory = useCallback(
    (categoryName: string): boolean => {
      if (masterProductList.some((p) => p.category === categoryName))
        return false;
      setCategories((prev) => prev.filter((c) => c.name !== categoryName));
      return true;
    },
    [masterProductList]
  );

  const handleUpdateCategory = useCallback(
    (originalName: string, updatedCategory: Category) => {
      if (
        originalName !== updatedCategory.name &&
        categories.some(
          (c) => c.name.toLowerCase() === updatedCategory.name.toLowerCase()
        )
      ) {
        alert("Một danh mục với tên này đã tồn tại.");
        return;
      }
      setCategories((prev) =>
        prev.map((c) => (c.name === originalName ? updatedCategory : c))
      );
      if (originalName !== updatedCategory.name) {
        setMasterProductList((prev) =>
          prev.map((p) =>
            p.category === originalName
              ? { ...p, category: updatedCategory.name }
              : p
          )
        );
      }
    },
    [categories]
  );

  const handleReorderCategories = useCallback(
    (reorderedCategories: Category[]) => {
      setCategories(reorderedCategories);
    },
    []
  );

  const handleAddZone = useCallback(
    (zoneData: Omit<Zone, "id" | "createdAt">) => {
      setZones((prev) => [
        ...prev,
        {
          ...zoneData,
          id: `ZONE-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    []
  );

  const handleUpdateZone = useCallback(
    (id: string, zoneData: Omit<Zone, "id" | "createdAt">) => {
      setZones((prev) =>
        prev.map((zone) => (zone.id === id ? { ...zone, ...zoneData } : zone))
      );
    },
    []
  );

  const handleDeleteZone = useCallback(
    (id: string): boolean => {
      // Kiểm tra xem khu vực có đang được sử dụng trong phiếu yêu cầu không
      const isUsed = requisitionForms.some(
        (form) => form.zone === zones.find((z) => z.id === id)?.name
      );
      if (isUsed) return false;

      setZones((prev) => prev.filter((zone) => zone.id !== id));
      return true;
    },
    [requisitionForms, zones]
  );

  const handleLogin = useCallback((user: User) => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      setCurrentUser(user);
    } catch (error) {
      console.error(
        "Không thể lưu thông tin người dùng vào localStorage",
        error
      );
      alert("Đã xảy ra lỗi khi lưu thông tin của bạn.");
    }
  }, []);

  const handleLogout = useCallback(() => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
        setCurrentUser(null);
      } catch (error) {
        console.error(
          "Không thể xóa thông tin người dùng khỏi localStorage",
          error
        );
      }
    }
  }, []);

  const handleConfirmReceipt = useCallback(
    (receiptData: Omit<GoodsReceiptNote, "id" | "createdAt">) => {
      if (!currentUser) return;

      let updatedProducts = cloneProductList(masterProductList);

      receiptData.items.forEach((item) => {
        const productIndex = updatedProducts.findIndex(
          (p) => p.id === item.productId
        );
        if (productIndex !== -1) {
          const variantIndex = updatedProducts[productIndex].variants.findIndex(
            (v) => v.id === item.variantId
          );
          if (variantIndex !== -1) {
            updatedProducts[productIndex].variants[variantIndex].stock +=
              item.quantity;
          }
        }
      });

      const fulfilledReqIds: string[] = [];
      const pendingRequisitions = requisitionForms
        .filter((f) => f.status === "Đang chờ xử lý")
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      for (const form of pendingRequisitions) {
        const result = handleFulfillRequisition(
          form.id,
          {
            notes: `Tự động cấp phát từ Phiếu nhập kho GRN-${Date.now()}`,
            fulfillerName: "Hệ thống (Nhập kho)",
          },
          updatedProducts,
          false
        );

        if (result.success) {
          updatedProducts = result.updatedProducts;
          fulfilledReqIds.push(form.id);
        }
      }

      const newReceipt: GoodsReceiptNote = {
        ...receiptData,
        id: `GRN-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name,
        linkedRequisitionIds: fulfilledReqIds,
      };

      setGoodsReceiptNotes((prev) => [newReceipt, ...prev]);
      setMasterProductList(updatedProducts);

      let alertMessage =
        "Đã tạo Phiếu nhập kho thành công và cập nhật tồn kho.";
      if (fulfilledReqIds.length > 0) {
        alertMessage += `\nHệ thống đã tự động cấp phát cho các phiếu yêu cầu: ${fulfilledReqIds.join(
          ", "
        )}.`;
      }
      alert(alertMessage);
      handleNavigate("receipts");
    },
    [
      currentUser,
      handleFulfillRequisition,
      handleNavigate,
      masterProductList,
      requisitionForms,
    ]
  );

  // Pass delivery note handlers to child components
  const deliveryHandlers = useMemo(
    () => ({
      createDeliveryNote: handleCreateDeliveryNote,
      verifyDeliveryNote: handleVerifyDeliveryNote,
      rejectDeliveryNote: handleRejectDeliveryNote,
    }),
    [
      handleCreateDeliveryNote,
      handleVerifyDeliveryNote,
      handleRejectDeliveryNote,
    ]
  );

  // For dependencies array
  const contentDependencies = [
    currentView,
    searchTerm,
    allCategoriesForNav,
    category,
    paginatedProducts,
    addToCart,
    filteredAndSortedProducts.length,
    masterProductList,
    totalPages,
    productCurrentPage,
    requisitionForms,
    triggerFulfillRequisition,
    currentUser,
    goodsReceiptNotes,
    handleNavigate,
    cart,
    handleCreateRequisition,
    updateCartItem,
    removeFromCart,
    categories,
    adminInitialTab,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleAddCategory,
    handleDeleteCategory,
    handleUpdateCategory,
    handleReorderCategories,
    handleConfirmReceipt,
    deliveryNotes,
    deliveryHandlers,
  ];

  const content = useMemo(() => {
    switch (currentView) {
      case "shop":
        return (
          <>
            <div className="bg-white sm:bg-gray-50 pt-6 pb-2 sm:pb-4">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              </div>
            </div>
            <CategoryNav
              categories={allCategoriesForNav}
              activeCategory={category}
              onSelectCategory={setCategory}
            />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <ProductList
                products={paginatedProducts}
                onAddToCart={addToCart}
                totalProducts={filteredAndSortedProducts.length}
                allProducts={masterProductList}
              />
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={productCurrentPage}
                    totalPages={totalPages}
                    onPageChange={setProductCurrentPage}
                  />
                </div>
              )}
            </div>
          </>
        );
      case "requisitions":
        return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <RequisitionListPage
              forms={requisitionForms}
              onFulfill={triggerFulfillRequisition}
              currentUser={currentUser!}
              cartItems={cart}
              allProducts={masterProductList}
              onCartRemove={removeFromCart}
              onCartUpdateItem={updateCartItem}
              onCreateRequisition={handleNavigateToCreateRequisition}
            />
          </main>
        );
      case "receipts":
        return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ReceiptList
              receipts={goodsReceiptNotes}
              products={masterProductList}
              onNavigate={handleNavigate}
            />
          </main>
        );
      case "create-requisition":
        return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <CreateRequisitionPage
              user={currentUser}
              allProducts={masterProductList}
              cartItems={cart}
              onSubmit={handleCreateRequisition}
              onCancel={() => handleNavigate("shop")}
              onUpdateItem={updateCartItem}
              onRemoveItem={removeFromCart}
            />
          </main>
        );
      case "admin":
        return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AdminPage
              products={masterProductList}
              categories={categories}
              zones={zones}
              initialTab={adminInitialTab}
              onNavigate={handleNavigate}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onUpdateCategory={handleUpdateCategory}
              onReorderCategories={handleReorderCategories}
              onAddZone={handleAddZone}
              onUpdateZone={handleUpdateZone}
              onDeleteZone={handleDeleteZone}
            />
          </main>
        );
      case "create-receipt":
        return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <CreateReceiptPage
              user={currentUser}
              products={masterProductList}
              categories={categories}
              onSubmit={handleConfirmReceipt}
              onCancel={() => handleNavigate("receipts")}
              onAddProduct={handleAddProduct}
            />
          </main>
        );
      case "deliveries":
        return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Suspense fallback={<div>Loading...</div>}>
              <DeliveryNoteList
                deliveryNotes={deliveryNotes}
                products={masterProductList}
                currentUser={currentUser!}
                onNavigate={handleNavigate}
                {...deliveryHandlers}
              />
            </Suspense>
          </main>
        );
      case "create-delivery":
        return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <CreateDeliveryNote
              user={currentUser}
              products={masterProductList}
              receipts={goodsReceiptNotes}
              onSubmit={handleCreateDeliveryNote}
              onCancel={() => handleNavigate("deliveries")}
            />
          </main>
        );
      default:
        return null;
    }
  }, contentDependencies);

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-yellow-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
      <Toaster
        containerStyle={{
          top: 80,
          right: 20,
        }}
        toastOptions={{
          className: "",
          style: {
            padding: "0",
            margin: "0",
            background: "transparent",
            boxShadow: "none",
          },
        }}
      />
      <Header
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
        onNavigate={handleNavigate}
        currentView={currentView}
        user={currentUser}
        onLogout={handleLogout}
      />
      {showDesktopNav && (
        <DesktopNav
          onNavigate={handleNavigate}
          currentView={currentView}
          user={currentUser}
        />
      )}
      <Suspense
        fallback={
          <div className="py-10 text-center text-gray-500">
            Đang tải nội dung...
          </div>
        }
      >
        {content}
      </Suspense>

      <Chatbot allProducts={masterProductList} />
      <BottomNav
        onNavigate={handleNavigate}
        currentView={currentView}
        user={currentUser}
      />
    </div>
  );
};

export default App;
