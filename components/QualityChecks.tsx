import React from 'react';
import { DeliveryItem } from '../types';

interface QualityChecksProps {
  item: DeliveryItem;
  onChange: (updates: Partial<DeliveryItem>) => void;
}

const defaultChecklist = [
  'Kiểm tra bao bì',
  'Kiểm tra số lượng',
  'Kiểm tra chất lượng bên ngoài',
  'Kiểm tra thông số kỹ thuật',
  'Kiểm tra tài liệu kèm theo'
];

export const QualityChecks: React.FC<QualityChecksProps> = ({ item, onChange }) => {
  const handleChecklistChange = (index: number, checked: boolean) => {
    const qualityChecks = {
      ...item.qualityChecks,
      [`check_${index}`]: checked
    };
    onChange({ qualityChecks });
  };

  const handleConditionChange = (condition: 'good' | 'damaged' | 'partial') => {
    onChange({ condition });
  };

  const handleReplacementChange = (replacementNeeded: boolean) => {
    onChange({ replacementNeeded });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-900">Kiểm tra chất lượng</h4>
      
      <div className="space-y-2">
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={item.condition === 'good'}
              onChange={() => handleConditionChange('good')}
              className="mr-2 text-green-600"
            />
            <span className="text-sm">Tốt</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={item.condition === 'damaged'}
              onChange={() => handleConditionChange('damaged')}
              className="mr-2 text-red-600"
            />
            <span className="text-sm">Hư hỏng</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={item.condition === 'partial'}
              onChange={() => handleConditionChange('partial')}
              className="mr-2 text-yellow-600"
            />
            <span className="text-sm">Một phần</span>
          </label>
        </div>

        {(item.condition === 'damaged' || item.condition === 'partial') && (
          <div className="ml-4 space-y-2">
            <textarea
              value={item.damageDescription || ''}
              onChange={(e) => onChange({ damageDescription: e.target.value })}
              placeholder="Mô tả chi tiết hư hỏng..."
              className="w-full text-sm rounded-md border-gray-300"
              rows={2}
            />
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={item.replacementNeeded}
                onChange={(e) => handleReplacementChange(e.target.checked)}
                className="mr-2 rounded text-yellow-600"
              />
              Yêu cầu thay thế
            </label>
          </div>
        )}

        <div className="border-t pt-2 mt-2">
          <p className="text-sm font-medium mb-2">Danh sách kiểm tra:</p>
          <div className="space-y-1">
            {defaultChecklist.map((item, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={item.qualityChecks?.['visualInspection'] || false}
                  onChange={(e) => handleChecklistChange(index, e.target.checked)}
                  className="mr-2 rounded text-yellow-600"
                />
                <span className="text-sm">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <textarea
          value={item.qualityChecks?.notes || ''}
          onChange={(e) => onChange({ qualityChecks: { ...item.qualityChecks, notes: e.target.value } })}
          placeholder="Ghi chú thêm về chất lượng..."
          className="w-full text-sm rounded-md border-gray-300 mt-2"
          rows={2}
        />
      </div>
    </div>
  );
};