
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) {
        return null;
    }

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const pageNumbers = [];
    const pageRangeDisplayed = 2; 
    const totalNumbers = (pageRangeDisplayed * 2) + 1; 
    const totalBlocks = totalNumbers + 2; 

    if (totalPages > totalBlocks) {
        const startPage = Math.max(2, currentPage - pageRangeDisplayed);
        const endPage = Math.min(totalPages - 1, currentPage + pageRangeDisplayed);

        pageNumbers.push(1);

        if (startPage > 2) {
            pageNumbers.push('...');
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < totalPages - 1) {
            pageNumbers.push('...');
        }

        pageNumbers.push(totalPages);
    } else {
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }
    }


  return (
    <nav className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm" aria-label="Pagination">
        <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
                Hiển thị trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
            </p>
        </div>
        <div className="flex flex-1 justify-between sm:justify-end items-center">
            <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Trước
            </button>
            <div className="hidden sm:flex sm:items-center sm:space-x-1 sm:mx-4">
                {pageNumbers.map((page, index) =>
                    typeof page === 'number' ? (
                        <button
                            key={index}
                            onClick={() => onPageChange(page)}
                            aria-current={currentPage === page ? 'page' : undefined}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                currentPage === page
                                ? 'z-10 bg-yellow-100 text-yellow-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                            } rounded-md`}
                        >
                            {page}
                        </button>
                    ) : (
                        <span key={index} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700">
                            ...
                        </span>
                    )
                )}
            </div>
             <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Sau
            </button>
        </div>
    </nav>
  );
};

export default Pagination;
