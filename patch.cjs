const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

content = content.replace(
  /const handleCreateRequisition = useCallback\(\(details: any\) => \{\s+createRequisition\(details, cart\);\s+useCartStore\.getState\(\)\.clearCart\(\);\s+toast\.success\('Đã tạo phiếu yêu cầu thành công!'\);\s+navigate\('\/requisitions'\);\s+\}, \[cart, createRequisition, navigate\]\);/g,
  `const handleCreateRequisition = useCallback(async (details: any) => {
    try {
      await createRequisition(details, cart);
      useCartStore.getState().clearCart();
      toast.success('Đã tạo phiếu yêu cầu thành công!');
      navigate('/requisitions');
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
  }, [cart, createRequisition, navigate]);`
);

content = content.replace(
  /const handleFulfillRequisition = useCallback\(\(formId: string, details: any\) => \{\s+const result = fulfillRequisition\(formId, details\);\s+if \(\!result\.success\) \{\s+alert\(result\.message\);\s+\} else \{\s+toast\.success\('Đã hoàn thành phiếu yêu cầu!'\);\s+\}\s+\}, \[fulfillRequisition\]\);/g,
  `const handleFulfillRequisition = useCallback(async (formId: string, details: any) => {
    try {
      const result = await fulfillRequisition(formId, details);
      if (!result.success) {
        alert(result.message);
      } else {
        toast.success('Đã hoàn thành phiếu yêu cầu!');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
  }, [fulfillRequisition]);`
);

content = content.replace(
  /const handleCreateReceipt = useCallback\(\(receiptData: any\) => \{\s+const \{ fulfilledReqIds \} = createReceipt\(\{ \.\.\.receiptData, createdBy: user\?\.name \|\| '' \}\);\s+let msg = 'Đã tạo Phiếu nhập kho thành công!';\s+if \(fulfilledReqIds\.length > 0\) msg \+= \`\\nHệ thống đã tự động cấp phát: \$\{fulfilledReqIds\.join\(', '\)\}\`;\s+alert\(msg\);\s+navigate\('\/receipts'\);\s+\}, \[createReceipt, navigate, user\]\);/g,
  `const handleCreateReceipt = useCallback(async (receiptData: any) => {
    try {
      const { fulfilledReqIds } = await createReceipt({ ...receiptData, createdBy: user?.name || '' });
      let msg = 'Đã tạo Phiếu nhập kho thành công!';
      if (fulfilledReqIds && fulfilledReqIds.length > 0) msg += \`\\nHệ thống đã tự động cấp phát: \$\{fulfilledReqIds.join(', ')}\`;
      alert(msg);
      navigate('/receipts');
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
  }, [createReceipt, navigate, user]);`
);

content = content.replace(
  /const handleCreateDeliveryNoteWrapper = useCallback\(\(items: any, receiptId: string, shipperId: string\) => \{\s+createDelivery\(items, receiptId, shipperId, user\?\.name \|\| ''\);\s+navigate\('\/deliveries'\);\s+\}, \[createDelivery, navigate, user\]\);/g,
  `const handleCreateDeliveryNoteWrapper = useCallback(async (items: any, receiptId: string, shipperId: string) => {
    try {
      await createDelivery(items, receiptId, shipperId, user?.name || '');
      navigate('/deliveries');
    } catch (e: any) {
      alert(e.message || 'Lỗi');
    }
  }, [createDelivery, navigate, user]);`
);

fs.writeFileSync('App.tsx', content);
