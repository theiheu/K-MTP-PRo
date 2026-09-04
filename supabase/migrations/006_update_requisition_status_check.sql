ALTER TABLE requisition_forms DROP CONSTRAINT IF EXISTS requisition_forms_status_check;

ALTER TABLE requisition_forms ADD CONSTRAINT requisition_forms_status_check 
CHECK (status IN ('Đang chờ xử lý', 'Đã duyệt yêu cầu', 'Đã hoàn thành', 'Đã huỷ'));
