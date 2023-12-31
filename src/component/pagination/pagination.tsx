import React, { useState, useEffect } from 'react';
import './pagination.css'
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

interface Props {
  pageCount: number;
  onPageChange: (selectedPage: number) => void;
  initialPage?: number;
}

const Pagination: React.FC<Props> = ({ pageCount, onPageChange, initialPage = 1 }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [inputPage, setInputPage] = useState(initialPage + 1);
  const [endPage, setEndPage] = useState(Math.min(5, pageCount));
  const [startPage, setStartPage] = useState(0);

  useEffect(() => {
    // Cập nhật giá trị ban đầu cho startPage và endPage
    setStartPage(0);
    setEndPage(Math.min(5, pageCount));
  }, [pageCount]);

  useEffect(() => {
    setCurrentPage(initialPage);
    setInputPage(initialPage + 1);
  
    let newStartPage = 0;
    let newEndPage = Math.min(5, pageCount);
  
    if (currentPage >= 3 && currentPage + 2 < pageCount) {
      newStartPage = currentPage - 2;
      newEndPage = currentPage + 3;
    } else if (currentPage >= 3 && currentPage + 2 >= pageCount) {
      newStartPage = Math.max(0, pageCount - 5);
      newEndPage = pageCount;
    }
  
    setStartPage(newStartPage);
    setEndPage(newEndPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, initialPage]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    onPageChange(pageNumber);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 0; i < pageCount; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers.slice(startPage, endPage).map((pageNumber) => (
      <div
        key={pageNumber}
        className={`page-item ${pageNumber === currentPage ? 'active' : ''}`}
        onClick={() => handlePageChange(pageNumber)}
      >
        <button className="page-link">{pageNumber + 1}</button>
      </div>
    ));
  };

  return (
    <div className='class-pagination-action'>
      <div className={'page-item'}>
        {currentPage === 0
          ? <button className="page-link disabled">
            <IoIosArrowBack />
          </button>
          : <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
            <IoIosArrowBack stroke='white' />
          </button>
        }
      </div>
      {renderPageNumbers()}
      <div className={'page-item'}>
        {currentPage === pageCount - 1
          ? <button className="page-link disabled">
            <IoIosArrowForward />
          </button>
          : <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
            <IoIosArrowForward />
          </button>
        }
      </div>
    </div>
  );
};

export default Pagination;
