import React from 'react';

const Banner: React.FC = () => {
  const handleCreateNote = () => {
    // In a real application, this would open a modal or navigate to a new page.
    alert('Chức năng "Tạo phiếu giao nhận" sẽ được triển khai!');
  };

  return (
    <div className="bg-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <button
          onClick={handleCreateNote}
          className="bg-yellow-500 text-white font-bold py-4 px-10 rounded-lg shadow-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-yellow-500 transition-all duration-300 ease-in-out transform hover:scale-105"
          aria-label="Tạo phiếu giao nhận mới"
        >
          Tạo phiếu giao nhận
        </button>
      </div>
    </div>
  );
};

export default Banner;
