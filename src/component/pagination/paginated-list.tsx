import React, { useState, useMemo, useEffect, useRef } from 'react';
import Pagination from './pagination';
import { GoArrowUpRight } from 'react-icons/go'
import './pagination.css'
import { Button, Drawer, Empty, Skeleton, Tabs, TabsProps, Tooltip } from 'antd';
import { ListSegmentType } from 'modal/index';
import { useDispatch, useSelector } from 'react-redux';
import { setBooking, setOutPage, setSelectedItem } from 'store/reducers';
import { calculateTimeDifference, convertCity, formatDate, formatDayByDate, formatHoursMinutes, formatNgayThangNam2, formatNgayThangNam3, formatNgayThangNam4, formatTimeByDate, getAirlineFullName, getAirlineLogo, getAirlinePlane, getCode, getNumberOfStops, getNumberOfStops2 } from 'utils/custom/custom-format';
import { FaPlaneArrival, FaPlaneDeparture } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { PiWarningCircleThin } from 'react-icons/pi'
import axios from 'axios';
import { airportName } from 'utils/airport/airport';

interface IProps {
  paginatedData: any[],
  loading: boolean,
  pageRevert: number,
  onNumberChange: any
}

const PaginatedList = (props: IProps) => {

  const { paginatedData, loading, pageRevert, onNumberChange } = props

  const { tripType, selectedItem} = useSelector((state: any) => state)

  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, _] = useState(30);
  const [visibleDropdowns, setVisibleDropdowns] = useState<any>({});
  const [sliceLoadMore, setSliceLoadMore] = useState([])
  const [open, setOpen] = useState(false)
  const [refresh, setRefresh] = useState(0);
  const [activeTabDetail, setActiveTabDetail] = useState('1')
  const [conditions, setConditions] = useState<Array<any> | null>(null)
  const [isLoadingCdt, setIsLoadingCdt] = useState(true)
  const [openBooking, setOpenBooking] = useState(false)
  const [dataBooking, setDataBooking] = useState<any[]>([])

  const dispatch = useDispatch()

  const existingColumn = 1;
  const paginatedColumn = [];
  for (let i = 0; i < existingColumn; i++) {
    paginatedColumn.push(i);
  }

  const handlePageChange = (selectedPage: number) => {
    setCurrentPage(selectedPage);
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [paginatedData]);

  const pagedItems = useMemo(() => {
    const offset = currentPage * itemsPerPage;
    const startIndex = offset;
    const endIndex = offset + itemsPerPage;
    return paginatedData.slice(startIndex, endIndex);
  }, [currentPage, itemsPerPage, paginatedData]);

  const handleDivClick = (key: any) => {
    setVisibleDropdowns((prevVisibleDropdowns: { [x: string]: any; }) => ({
      ...prevVisibleDropdowns,
      [key]: !prevVisibleDropdowns[key],
    }));
  };


  const handleButtonClick = () => {
    const targetElement = document.getElementById('scroll');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const addNewItem = (item: any) => {
    handleButtonClick()
    setOpen(false)
    localStorage.setItem('outPage', JSON.stringify(true));
    dispatch(setOutPage(1))
    setRefresh(prev => prev + 1)
    if (tripType) {
      if (pageRevert === 2) {
        onNumberChange(1);
      } else {
        onNumberChange(2);
      }
      let bookingInf = JSON.parse(localStorage.getItem('bookingInf') || '[]');

      const existingItemIndex = bookingInf.findIndex((element: any) => element.key === item.key);

      if (existingItemIndex !== -1) {
        bookingInf.splice(existingItemIndex, 1, item);
      } else {
        if (bookingInf.length === 2) {
          bookingInf.pop();
        }
        if (item.key === 1) {
          bookingInf.unshift(item);
        } else {
          bookingInf.push(item);
        }
      }
      setDataBooking(bookingInf)
      localStorage.setItem('bookingInf', JSON.stringify(bookingInf));
      dispatch(setBooking(bookingInf))
    } else {;
      setDataBooking([item])
      localStorage.setItem('bookingInf', JSON.stringify([item]));
      dispatch(setBooking([item]))
    }
  };

  function formatNumber(number: number) {
    const roundedNumber = Math.ceil(number / 1000) * 1000;
    const formattedNumber = new Intl.NumberFormat('vi-VN').format(roundedNumber);

    return formattedNumber;
  }

  const onClose = () => {
    setOpen(false);
  };

  const onOpen = (item: any) => {
    setOpen(true)
    setActiveTabDetail('1')
    dispatch(setSelectedItem(item))
  }

  const onCloseBooking = () => {
    setOpenBooking(false);
  };

  useEffect(() => {
    const existingTripType = tripType
    if (existingTripType === true && dataBooking.length === 2) {
      setOpenBooking(true)
    }
  }, [tripType, dispatch, dataBooking, refresh])

  useEffect(() => {
    const newData: any = paginatedData.slice(0, itemsPerPage)
    setSliceLoadMore(newData)
  }, [itemsPerPage, paginatedData])

  const onChangeActiveDetail = (value: string) => {
    setActiveTabDetail(value)
  }

  const getAirPortName = (key: string) => {
    if (key) {
      const airport = airportName.find((element) => element.code === key)?.name
      // console.log(airport)
      return airport
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const AuthorizationCode = await getCode()
      setIsLoadingCdt(true)
      try {
        const headers = {
          Authorization: AuthorizationCode,
        };

        const response = await axios.get(`https://api.vinajet.vn/get-price-term?airline=${selectedItem.airline}&groupClass=${selectedItem.listFlight[0].groupClass}&fareClass=${selectedItem.listFlight[0].fareClass}&AgCode=VINAJET145`, {
          headers: headers
        });
        setConditions(response.data.bookingRules ?? [])
        setIsLoadingCdt(false)
      } catch (error) {
        console.log(error)
      } finally {
        setIsLoadingCdt(false)
      }
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabDetail === '2'])

  // console.log(selectedItem)

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: `Chi tiết chuyến bay`,
      children: <>
        {selectedItem
          &&
          <div className='tab-item-flex-col'>
            <div className='tab-item-row'>
              <span className='trip-type'>{pageRevert === 1 ? 'Chuyến đi' : 'Chuyến về'}</span>
              <span className='text-15'>{getNumberOfStops(selectedItem)}</span>
            </div>
            <div className='tab-item-row'>
              <span className='gr-flex'>
                {getAirlineLogo(selectedItem.airline, '60px')}
                {getAirlineFullName(selectedItem.airline)}
              </span>
              <span className='gr-flex' style={{ alignItems: 'flex-end' }}>
                <span className='text-15'>Chuyến bay: <strong>{selectedItem.listFlight[0].flightNumber}</strong> </span>
                <span className='text-15'>Loại máy bay: <strong>{getAirlinePlane(selectedItem.listFlight[0].listSegment[0].plane)} {selectedItem.listFlight[0].listSegment[0].plane}</strong> </span>
                <span className='text-15'>Hạng ghế: <strong>{selectedItem.listFlight[0].fareClass}</strong> </span>
              </span>
            </div>
            <div className='tab-item-row'>
              <div className='row-plane-trip'>
                <div className='timeline-plane'>
                  <FaPlaneDeparture />
                  <div className='line-frame'>
                    <div className='dot'></div>
                    <div className='line'></div>
                    <div className='dot bottom'></div>
                  </div>
                  <FaPlaneArrival />
                </div>
              </div>
              <div className='plane-trip-inf'>
                <div className='trip-inf-row'>
                  <span className='gr-flex'>
                    <span className='text-15'><strong>{formatTimeByDate(selectedItem.listFlight[0].startDate)}</strong> </span>
                    <span className='text-15'>{formatDayByDate(selectedItem.listFlight[0].startDate)}</span>
                  </span>
                  <span className='gr-flex' style={{ alignItems: 'flex-end' }}>
                    <span className='text-15'>{selectedItem.listFlight[0].startPointName} ({selectedItem && selectedItem.listFlight[0].startPoint})</span>
                    <span className='text-14' style={{ color: '#9b9b9b' }}>{getAirPortName(selectedItem.listFlight[0].startPoint)}</span>
                  </span>
                </div>
                <div className='trip-inf-row'>
                  <span className='gr-flex'>
                    {/* <span className='text-14' style={{ color: '#3554d1' }}>Thời gian bay {selectedItem.DurationFormat}</span> */}
                    <span className='text-14' style={{ color: '#3554d1' }}>Thời gian bay {calculateTimeDifference(selectedItem.listFlight[0].endDate, selectedItem.listFlight[0].startDate)}</span>
                  </span>
                </div>
                <div className='trip-inf-row'>
                  <span className='gr-flex'>
                    <span className='text-15'><strong>{formatTimeByDate(selectedItem.listFlight[0].endDate)}</strong> </span>
                    <span className='text-15'>{formatDayByDate(selectedItem.listFlight[0].endDate)}</span>
                  </span>
                  <span className='gr-flex' style={{ alignItems: 'flex-end' }}>
                    <span className='text-15'>{selectedItem.listFlight[0].endPointName} ({selectedItem && selectedItem.listFlight[0].endPoint})</span>
                    <span className='text-14' style={{ color: '#9b9b9b' }}>{getAirPortName(selectedItem.listFlight[0].endPoint)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
      </>,
    },
    {
      key: '2',
      label: `Hành lý & điều kiện vé`,
      children: <>
        {selectedItem && Array.isArray(conditions) && conditions.length > 0
          &&
          <div className='tab-item-flex-col'>
            <div className='tab-item-row'>
              <span className='trip-type'>{pageRevert === 1 ? 'Điều kiện chuyến đi' : 'Điều kiện chuyến về'}</span>
            </div>
            {isLoadingCdt
              ? <Skeleton paragraph={{ rows: 4 }} active />
              : conditions.length > 0
                ? conditions.map((element) => {
                  return (
                    <div className='tab-item-row'>
                      <div className='item-condition'>
                        <h3 className='title-condition'>{element.title}</h3>
                        <p>{element.content}</p>
                      </div>
                    </div>
                  )
                })
                : <Empty description={'Không tìm thấy thông tin.'} />
            }
          </div>
        }
      </>,
    },
  ];

  console.log(selectedItem, conditions)

  const Bookingitems: TabsProps['items'] = dataBooking.map((element, index) => (
    {
      key: String(index),
      label: `Chuyến ${dataBooking.length > 0 && index === 0 ? `đi` : 'về'}`,
      children: (
        <>
          <div className='tab-item-flex-col'>
            <h3 className='title-drawer'>
              {convertCity(element.listFlight[0].startPoint)} ({element.listFlight[0].startPoint}) - {convertCity(element.listFlight[0].endPoint)} ({element.listFlight[0].endPoint})
            </h3>
            <div className='tab-item-row'>
              <span className='trip-type'>{element.listFlight[0].flightNumber}</span>
              <span className='text-15'>{getNumberOfStops2(element)}</span>
            </div>
            <div className='tab-item-row'>
              <span className='gr-flex'>
                {getAirlineLogo(element.airline, '60px')}
                {getAirlineFullName(element.airline)}
              </span>
              <span className='gr-flex' style={{ alignItems: 'flex-end' }}>
                <span className='text-15'>Chuyến bay: <strong>{element.listFlight[0].flightNumber}</strong> </span>
                {/* <span className='text-15'>Loại máy bay: <strong>{getTypePlaneMap(element)} {element.ListSegment[0]?.Plane}</strong> </span> */}
                <span className='text-15'>Hạng ghế: <strong>{element.listFlight[0].fareClass}</strong></span>
              </span>
            </div>
            <div className='tab-item-row'>
              <div className='row-plane-trip'>
                <div className='timeline-plane'>
                  <FaPlaneDeparture />
                  <div className='line-frame'>
                    <div className='dot'></div>
                    <div className='line'></div>
                    <div className='dot bottom'></div>
                  </div>
                  <FaPlaneArrival />
                </div>
              </div>
              <div className='plane-trip-inf'>
                <div className='trip-inf-row'>
                  <span className='gr-flex'>
                  <span className='text-15'><strong>{formatTimeByDate(element.listFlight[0].startDate)}</strong> </span>
                    <span className='text-15'>{formatDayByDate(element.listFlight[0].startDate)}</span>
                  </span>
                  <span className='gr-flex' style={{ alignItems: 'flex-end' }}>
                    <span className='text-15'>{convertCity(element.listFlight[0].startPoint)} ({element.listFlight[0].startPoint})</span>
                    <span className='text-14' style={{ color: '#9b9b9b' }}>{getAirPortName(element.listFlight[0].startPoint)}</span>
                  </span>
                </div>
                <div className='trip-inf-row'>
                  <span className='gr-flex'>
                    <span className='text-14' style={{ color: '#3554d1' }}>Thời gian bay {calculateTimeDifference(element.listFlight[0].endDate, element.listFlight[0].startDate)}</span>
                  </span>
                </div>
                <div className='trip-inf-row'>
                  <span className='gr-flex'>
                    <span className='text-15'><strong>{formatTimeByDate(element.listFlight[0].endDate)}</strong> </span>
                    <span className='text-15'>{formatDayByDate(element.listFlight[0].endDate)}</span>
                  </span>
                  <span className='gr-flex' style={{ alignItems: 'flex-end' }}>
                    <span className='text-15'>{convertCity(element.EndPoint)} ({element.listFlight[0].endPoint})</span>
                    <span className='text-14' style={{ color: '#9b9b9b' }}>{getAirPortName(element.listFlight[0].endPoint)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ),
    }
  ));

  const totalAdt = dataBooking.reduce((num, cur) =>
    num +=
    ((cur.fareAdt + cur.feeAdt + cur.taxAdt + cur.serviceFeeAdt) * cur.adt)
    , 0)

  const totalChd = dataBooking.reduce((num, cur) =>
    num +=
    (((cur.fareChd + cur.feeChd + cur.taxChd + cur.serviceFeeChd) * cur.chd))
    , 0)

  const totalInf = dataBooking.reduce((num, cur) =>
    num +=
    (((cur.fareInf + cur.feeInf + cur.taxInf + cur.serviceFeeInf) * cur.inf))
    , 0)

    console.log(pagedItems)
  return (
    <>
      <Drawer
        className='drawer-class-paginated'
        placement={'right'}
        closable={true}
        onClose={onClose}
        width={'fit-content'}
        open={open}
        footer={<div className='tab-footer'>

          <Tooltip color='white' placement="topLeft" title={
            <div className='tooltip-content'>
              {selectedItem && selectedItem.adt > 0
                && <div className='content-flex-row'>
                  <span className='text-13'>Vé người lớn x {selectedItem && selectedItem.adt}</span>
                  <span className='text-13'>{selectedItem
                    && formatNumber((
                      selectedItem.fareAdt + selectedItem.feeAdt + selectedItem.taxAdt + selectedItem.serviceFeeAdt))}
                    {selectedItem && selectedItem.currency}</span>
                </div>
              }
              {selectedItem && selectedItem.chd > 0
                && <div className='content-flex-row'>
                  <span className='text-13'>Vé trẻ em x {selectedItem && selectedItem.chd}</span>
                  <span className='text-13'>{selectedItem
                    && formatNumber((
                      selectedItem.fareChd + selectedItem.feeChd + selectedItem.taxChd + selectedItem.serviceFeeChd))}
                    {selectedItem && selectedItem.currency}</span>
                </div>
              }
              {selectedItem && selectedItem.inf > 0
                && <div className='content-flex-row'>
                  <span className='text-13'>Vé em bé x {selectedItem && selectedItem.inf}</span>
                  <span className='text-13'>{selectedItem
                    && formatNumber((selectedItem.fareInf + selectedItem.feeInf + selectedItem.taxInf + selectedItem.serviceFeeInf))}
                    {selectedItem && selectedItem.currency}</span>
                </div>
              }
            </div>
          }>
            <span className='gr-flex'>
              <span className='text-15' style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                fontWeight: '400',
                gap: '8px'
              }}>Tổng chi phí tạm tính  <PiWarningCircleThin /></span>
              <span className='text-13' style={{ color: '#9b9b9b' }}>(Đã bao gồm Thuế và phí)</span>
            </span>
          </Tooltip>
          <span className='text-15' style={{ fontWeight: '500' }}>{selectedItem && formatNumber(selectedItem.fullPrice)} {selectedItem && (selectedItem.currency ?? 'VNĐ')}</span>
          {selectedItem && tripType === true
            ? <button className={'view-deal'} onClick={() => addNewItem({ ...selectedItem, key: pageRevert })}>
              Chọn
              <GoArrowUpRight />
            </button>
            : <Link to={'/booking'}>
              <button className={'view-deal'} onClick={() => addNewItem({ ...selectedItem, key: pageRevert })}>
                Chọn
                <GoArrowUpRight />
              </button>
            </Link>
          }
        </div>}
      >
        <div className='flex-col'>
          <h3 className='title-drawer'>
            {selectedItem && selectedItem.listFlight[0].startPointName} ({selectedItem && selectedItem.listFlight[0].startPoint}) - {selectedItem && selectedItem.listFlight[0].endPointName} ({selectedItem && selectedItem.listFlight[0].endPoint})
          </h3>
          <Tabs defaultActiveKey="1" activeKey={activeTabDetail} items={items} onChange={(value) => onChangeActiveDetail(value)} />
        </div>
      </Drawer>
      <Drawer
        className='drawer-class-paginated'
        placement={'right'}
        closable={true}
        onClose={onCloseBooking}
        width={'fit-content'}
        open={openBooking}
        footer={<div className='tab-footer'>

          <Tooltip color='white' placement="topLeft" title={
            <div className='tooltip-content'>
              {dataBooking.length > 0 && dataBooking[0].adt > 0
                && <div className='content-flex-row'>
                  <span className='text-13'>Vé người lớn x {dataBooking[0].adt}</span>
                  <span className='text-13'>{formatNumber(totalAdt)} {dataBooking[0].Currency}</span>
                </div>
              }
              {dataBooking.length > 0 && dataBooking[0].chd > 0
                && <div className='content-flex-row'>
                  <span className='text-13'>Vé trẻ em x {dataBooking[0].Chd}</span>
                  <span className='text-13'>{formatNumber(totalChd)} {dataBooking[0].Currency}</span>
                </div>
              }
              {dataBooking.length > 0 && dataBooking[0].inf > 0
                && <div className='content-flex-row'>
                  <span className='text-13'>Vé em bé x {dataBooking[0].Inf}</span>
                  <span className='text-13'>{formatNumber(totalInf)} {dataBooking[0].Currency}</span>
                </div>
              }
            </div>
          }>
            <span className='gr-flex'>
              <span className='text-15' style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                fontWeight: '400',
                gap: '8px'
              }}>Tổng chi phí tạm tính  <PiWarningCircleThin /></span>
              <span className='text-13' style={{ color: '#9b9b9b' }}>(Đã bao gồm Thuế và phí)</span>
            </span>
          </Tooltip>
          <span className='text-15' style={{ fontWeight: '500' }}>{formatNumber(totalAdt + totalChd + totalInf)} VNĐ</span>
          <Link to={'/booking'}>
            <button className='continue'>Tiếp tục</button>
          </Link>
        </div>}
      >
        <div className='flex-col'>
          <Tabs defaultActiveKey="1" items={Bookingitems} />
        </div>
      </Drawer>
      <div className='paginated-main'>
        <div className='paginated-row grid-container'>
          {loading
            ? <Skeleton avatar paragraph={{ rows: 4 }} style={{ gridColumn: 'span 2 / span 2' }} active />
            : pagedItems.length > 0 ? pagedItems
              .map((element: any, index: number) => {
                // const isActive = bookingInf.some((ele) => String(ele.Id) === String(element.Id))
                return (
                  <div className='paginated-item items' key={`element_${index}`}>
                    {element.promo === true && <label className="fast500 top-company__label">Khuyến mãi</label>}
                    <div className='frame-item-col'>
                      <div className='item-flex' onClick={() => handleDivClick(index)}>
                        {getAirlineLogo(element.airline, '60px')}
                        <div className='flex-center-item'>
                          <div className='item-col fix-content'>
                            <h4 className="searchMenu__title text-truncate">{formatTimeByDate(element.listFlight[0].startDate)}</h4>
                            <p className="filter-item text-truncate">{element.listFlight[0].startPoint}</p>
                          </div>
                          <div className='item-col'>
                            <div className='frame-time-line'>
                              <div className='dot left'></div>
                              <div className='line'></div>
                              <div className='dot right'></div>
                            </div>
                            <p className='filter-item fix-content'>{getNumberOfStops(element)}</p>
                          </div>
                          <div className='item-col fix-content'>
                            <h4 className="searchMenu__title text-truncate">{formatTimeByDate(element.listFlight[0].endDate)}</h4>
                            <p className="filter-item text-truncate">{element.listFlight[0].endPoint}</p>
                          </div>
                        </div>
                        <p className="filter-item fix-content">{element.listFlight[0].flightNumber}</p>
                      </div>
                      <Button className='detail' style={{ maxWidth: 'fit-content' }} onClick={() => onOpen(element)}>Chi tiết</Button>
                    </div>
                    <div className='item-col-1'>
                      <h3 className='text-18 text-truncate'>{formatNumber((element.fareAdt + element.taxAdt + element.feeAdt + element.serviceFeeAdt))} {element.Currency ?? 'VNĐ'}</h3>
                      {/* <p className="filter-item text-truncate">16 deals</p> */}
                      {tripType === true
                        ? <button className={'view-deal'} onClick={() => addNewItem({ ...element, key: pageRevert })}>
                          Chọn
                          <GoArrowUpRight />
                        </button>
                        : <Link to={'/booking'}>
                          <button className={'view-deal'} onClick={() => addNewItem({ ...element, key: pageRevert })}>
                            Chọn
                            <GoArrowUpRight />
                          </button>
                        </Link>
                      }

                    </div>
                  </div>
                )
              })
              : <Empty description={'Không tìm thấy chuyến bay bạn yêu cầu.'} style={{ gridColumn: 'span 2 / span 2' }} />
          }
        </div>
      </div>
      <Pagination
        pageCount={Math.ceil(paginatedData.length / itemsPerPage)}
        onPageChange={handlePageChange}
        initialPage={currentPage}
      />
    </>
  );
};
export default PaginatedList;
