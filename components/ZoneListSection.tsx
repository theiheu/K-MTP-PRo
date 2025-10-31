import React, { useState } from "react";
import { Zone } from "../types";
import ZoneFormModal from "./ZoneFormModal";
import ConfirmationModal from "./ConfirmationModal";

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    {...props}
  >
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
    />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

interface ZoneListSectionProps {
  zones: Zone[];
  onAddZone: (zone: Omit<Zone, "id" | "createdAt">) => void;
  onUpdateZone: (id: string, zone: Omit<Zone, "id" | "createdAt">) => void;
  onDeleteZone: (id: string) => boolean;
}

const ZoneListSection: React.FC<ZoneListSectionProps> = ({
  zones,
  onAddZone,
  onUpdateZone,
  onDeleteZone,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const handleOpenAddModal = () => {
    setEditingZone(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (zone: Zone) => {
    setEditingZone(zone);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingZone(null);
  };

  const handleSubmit = (zoneData: Omit<Zone, "id" | "createdAt">) => {
    if (editingZone) {
      onUpdateZone(editingZone.id, zoneData);
    } else {
      onAddZone(zoneData);
    }
    handleCloseModal();
  };

  const handleCloseDeleteModal = () => {
    setZoneToDelete(null);
    setDeleteError("");
  };

  const handleConfirmDelete = () => {
    if (zoneToDelete) {
      const success = onDeleteZone(zoneToDelete.id);
      if (success) {
        handleCloseDeleteModal();
      } else {
        setDeleteError("Không thể xóa khu vực này vì nó đang được sử dụng.");
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Danh sách Khu vực
        </h2>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 justify-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700"
        >
          <PlusIcon className="w-5 h-5" />
          Thêm Khu vực
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col h-full">
              <h3 className="text-lg font-medium text-gray-900">{zone.name}</h3>
              {zone.description && (
                <p className="mt-1 text-sm text-gray-500 flex-grow">
                  {zone.description}
                </p>
              )}
              <div className="mt-4 flex justify-end space-x-2 border-t pt-4">
                <button
                  onClick={() => handleOpenEditModal(zone)}
                  className="text-gray-600 hover:text-yellow-600 p-2 rounded-full hover:bg-gray-100"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setZoneToDelete(zone)}
                  className="text-gray-600 hover:text-red-600 p-2 rounded-full hover:bg-gray-100"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ZoneFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingZone={editingZone}
      />

      <ConfirmationModal
        isOpen={!!zoneToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Xác nhận Xóa Khu vực"
        message={`Bạn có chắc chắn muốn xóa khu vực "${zoneToDelete?.name}" không? Hành động này không thể hoàn tác.`}
        confirmButtonText="Xác nhận Xóa"
        error={deleteError}
      />
    </div>
  );
};

export default ZoneListSection;
