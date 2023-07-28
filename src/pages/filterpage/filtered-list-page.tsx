import React, { useEffect, useRef, useState } from 'react'
import './filtered-list-page.css'
import { DatePicker, Skeleton, Slider, Spin } from 'antd';
import { HiOutlineArrowsUpDown } from 'react-icons/hi2'
import PaginatedList from 'component/pagination/paginated-list';
import md5 from 'md5';
import axios from 'axios';
import {
    format,
} from 'date-fns';
import TopFilter from './top-filter/top-filter';
import { Link, useLocation } from 'react-router-dom';
import { BiFilterAlt, BiSortDown } from 'react-icons/bi'
import { TbBrandBooking, TbLayoutGridRemove } from 'react-icons/tb'
import { LoadingFrame } from 'component/loading-frame/loadingFrame';
import { dataCountry } from 'utils/data-country';
import { Tabs, Drawer } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import weekday from 'dayjs/plugin/weekday';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { FaRegCalendarAlt } from 'react-icons/fa'
import LoadingBar from 'component/loading-bar/loading-bar';
import SliderDateTrend from './slider/slider-date-trend';
import { useDispatch, useSelector } from 'react-redux';
import MiniBooking from './mini-booking/mini-booking';
import { setAllData, setAllDataTwo, setBooking, setListGeoCodeOneTrip, setListGeoCodeTwoTrip } from 'store/reducers';
import { formatNgayThangNam3, getAirlineFullName } from 'utils/custom/custom-format';
dayjs.extend(customParseFormat);
dayjs.extend(weekday);
dayjs.extend(localizedFormat);
dayjs.locale('vi')


const listValueStopsFilter = [
    'Nonstop',
    '1 Stop',
    '2+ Stops'
]

interface MinFareByAirlines {
    airline: string;
    minFareAdtFull: number;
}

interface MinFareByCabin {
    cabin: string;
    minFareAdtFull: number;
}

function FilteredListPage() {

    const url = new URL(window.location.href);
    const searchParams = new URLSearchParams(url.search);
    const startPoint = searchParams.get('startPoint') ?? '';
    const endPoint = searchParams.get('endPoint') ?? '';
    const departDate = searchParams.get('departDate') ?? '';
    const returnDate = searchParams.get('returnDate') ?? '';
    const adults = searchParams.get('adults') ?? '';
    const children = searchParams.get('children') ?? '';
    const inf = searchParams.get('Inf') ?? '';
    const [open, setOpen] = useState(false);

    const { tripType, booking, outPage } = useSelector((state: any) => state)
    const dispatch = useDispatch()

    const location = useLocation();
    const encrypt = (str: string) => {
        return md5(str);
    };
    const [filters, setFilters] = useState({
        airline: [] as string[],
        cabin: [] as string[],
        handBaggage: [] as string[],
        promo: false,
        timeLine: '',
        stops: [] as string[]
    });
    const [paginatedData, setPaginatedData] = useState<any[]>([])
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [filteredData2, setFilteredData2] = useState<any[]>([]);
    const [paginatedData2, setPaginatedData2] = useState<any[]>([])
    const [ascending, setAscending] = useState<boolean>(false);
    const [loading, setLoading] = useState(true)
    const [loading2, setLoading2] = useState(true)
    const [isArray2D, setIsArray2D] = useState(false)
    const [pageRevert, setPageRevert] = useState(1)
    const [flyingTo, setFlyingTo] = useState('')
    const [flyingToReturn, setFlyingToReturn] = useState('')
    const [departDay, setDepart] = useState('')
    const [minFareAdtFull, setMinFareAdtFull] = useState(0)
    const [minFareAdtFull2, setMinFareAdtFull2] = useState(0)
    const [minFaresByAirlines, setMinFaresByAirlines] = useState<MinFareByAirlines[]>([]);
    const [minFaresByCabin, setMinFaresByCabin] = useState<MinFareByCabin[]>([]);
    const [minFaresByAirlines2, setMinFaresByAirlines2] = useState<MinFareByAirlines[]>([]);
    const [minFaresByCabin2, setMinFaresByCabin2] = useState<MinFareByCabin[]>([]);
    const [statusOpenTab2, setStatusOpenTab2] = useState(false);
    const [progress, setProgress] = useState(0);
    const maxProgress = 96;
    const loadingRef = useRef(false);
    const intervalRef = useRef<number>();

    const apiUrl = "http://plugin.datacom.vn/flightsearch";

    const [timeLine, setTimeLine] = useState('01:00')

    const onChangeTimeline = (time: number) => {
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        const formattedTime = format(new Date().setHours(hours, minutes), 'HH:mm');
        setTimeLine(formattedTime)
        setFilters((prevFilters) => ({ ...prevFilters, timeLine: formattedTime }));
    }

    const flattenDomesticDatas = (response: any) => {
        if (response.DomesticDatas && Array.isArray(response.DomesticDatas)) {
            return response.DomesticDatas;
        }
        return [];
    };
    const flattenListGeoCodeDatas = (response: any) => {
        if (response.ListGeoCode && Array.isArray(response.ListGeoCode)) {
            return response.ListGeoCode;
        }
        return [];
    };

    const fetchData = async () => {
        const convert = dataCountry.find((element) => element.code === endPoint)?.city ?? ''
        const convertReturn = dataCountry.find((element) => element.code === startPoint)?.city ?? ''
        setFlyingTo(convert)
        setFlyingToReturn(convertReturn)
        loadingRef.current = true;
        setProgress(0);
        try {
            setLoading(true)
            const airlines = ["VJ", "VN", "VU", "QH"];
            const Adt = adults;
            const Chd = children;
            const Inf = inf;
            const StartPoint = startPoint;
            const EndPoint = endPoint;
            const DepartDate = departDate;
            const timestamp = Date.now();
            const keyEncryct = encrypt(String(timestamp));
            const keyEncryctWithParams =
                keyEncryct.slice(0, 6) +
                Adt +
                keyEncryct.slice(6, 12) +
                Chd +
                keyEncryct.slice(12, 20) +
                Inf +
                keyEncryct.slice(20, 32);

            const fetchFlightData = async (airline: string) => {
                const data = {
                    Key: keyEncryctWithParams,
                    ProductKey: "c4bpzngvqzxh2lm",
                    Adt: Adt,
                    Chd: Chd,
                    Inf: Inf,
                    ViewMode: false,
                    ListFlight: [
                        {
                            StartPoint: StartPoint,
                            EndPoint: EndPoint,
                            DepartDate: DepartDate,
                            Airline: airline,
                        },
                    ],
                };
                return (await axios.post(apiUrl, data)).data;
            };

            const responses = await Promise.all(airlines.map(fetchFlightData));
            dispatch(setAllData(responses))

            dispatch(setListGeoCodeOneTrip(responses.flatMap((response) => flattenListGeoCodeDatas(response))))

            const allDomesticDatas = responses.flatMap((response) => flattenDomesticDatas(response));

            const minFaresByAirlines: MinFareByAirlines[] = [];
            const minFaresByCabin: MinFareByCabin[] = [];

            allDomesticDatas.forEach((flight: { FareAdtFull?: any; ListSegment?: any; }) => {
                const { ListSegment } = flight;

                ListSegment.forEach((segment: { Airline: any; }) => {
                    const { Airline } = segment;
                    let airlineObj = minFaresByAirlines.find((item) => item.airline === Airline);
                    if (!airlineObj) {
                        airlineObj = { airline: Airline, minFareAdtFull: flight.FareAdtFull };
                        minFaresByAirlines.push(airlineObj);
                    } else {
                        if (flight.FareAdtFull < airlineObj.minFareAdtFull) {
                            airlineObj.minFareAdtFull = flight.FareAdtFull;
                        }
                    }
                });
                ListSegment.forEach((segment: { Cabin: any; }) => {
                    const { Cabin } = segment;
                    let cabinObj = minFaresByCabin.find((item) => item.cabin === Cabin);
                    if (!cabinObj) {
                        cabinObj = { cabin: Cabin, minFareAdtFull: flight.FareAdtFull };
                        minFaresByCabin.push(cabinObj);
                    } else {
                        if (flight.FareAdtFull < cabinObj.minFareAdtFull) {
                            cabinObj.minFareAdtFull = flight.FareAdtFull;
                        }
                    }
                });
            });
            setMinFaresByAirlines(minFaresByAirlines)
            setMinFaresByCabin(minFaresByCabin)
            const sortByFareAdtFullAscending = allDomesticDatas.sort((a: any, b: any) => a.FareAdtFull - b.FareAdtFull)
            setPaginatedData(sortByFareAdtFullAscending)
            setFilteredData(sortByFareAdtFullAscending)
            setLoading(false)

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false)
            loadingRef.current = false;
        }
    };

    const fetchData2 = async () => {
        const convert = dataCountry.find((element) => element.code === endPoint)?.city ?? ''
        const convertReturn = dataCountry.find((element) => element.code === startPoint)?.city ?? ''
        setFlyingTo(convert)
        setFlyingToReturn(convertReturn)
        try {
            setLoading2(true)
            const airlines = ["VJ", "VN", "VU", "QH"];
            const Adt = adults;
            const Chd = children;
            const Inf = inf;
            const StartPoint = startPoint;
            const EndPoint = endPoint;
            // const DepartDate = departDate;
            const ReturnDate = returnDate ? returnDate : departDate;
            const timestamp = Date.now();
            const keyEncryct = encrypt(String(timestamp));
            const keyEncryctWithParams =
                keyEncryct.slice(0, 6) +
                Adt +
                keyEncryct.slice(6, 12) +
                Chd +
                keyEncryct.slice(12, 20) +
                Inf +
                keyEncryct.slice(20, 32);

            if (statusOpenTab2 === true) {
                const fetchFlightData2 = async (airline: string) => {
                    const data = {
                        Key: keyEncryctWithParams,
                        ProductKey: "c4bpzngvqzxh2lm",
                        Adt: Adt,
                        Chd: Chd,
                        Inf: Inf,
                        ViewMode: false,
                        ListFlight: [
                            {
                                StartPoint: EndPoint,
                                EndPoint: StartPoint,
                                DepartDate: ReturnDate,
                                Airline: airline,
                            },
                        ],
                    };
                    return (await axios.post(apiUrl, data)).data;
                };

                const responses2 = await Promise.all(airlines.map(fetchFlightData2));
                dispatch(setListGeoCodeTwoTrip(responses2.flatMap((response) => flattenListGeoCodeDatas(response))))
                dispatch(setAllDataTwo(responses2))
                const allDomesticDatas2 = responses2.flatMap((response) => flattenDomesticDatas(response));

                const minFaresByAirlines2: MinFareByAirlines[] = [];
                const minFaresByCabin2: MinFareByCabin[] = [];

                allDomesticDatas2.forEach((flight: { FareAdtFull?: any; ListSegment?: any; }) => {
                    const { ListSegment } = flight;

                    ListSegment.forEach((segment: { Airline: any; }) => {
                        const { Airline } = segment;
                        let airlineObj = minFaresByAirlines2.find((item) => item.airline === Airline);
                        if (!airlineObj) {
                            airlineObj = { airline: Airline, minFareAdtFull: flight.FareAdtFull };
                            minFaresByAirlines2.push(airlineObj);
                        } else {
                            if (flight.FareAdtFull < airlineObj.minFareAdtFull) {
                                airlineObj.minFareAdtFull = flight.FareAdtFull;
                            }
                        }
                    });
                    ListSegment.forEach((segment: { Cabin: any; }) => {
                        const { Cabin } = segment;
                        let cabinObj = minFaresByCabin2.find((item) => item.cabin === Cabin);
                        if (!cabinObj) {
                            cabinObj = { cabin: Cabin, minFareAdtFull: flight.FareAdtFull };
                            minFaresByCabin2.push(cabinObj);
                        } else {
                            if (flight.FareAdtFull < cabinObj.minFareAdtFull) {
                                cabinObj.minFareAdtFull = flight.FareAdtFull;
                            }
                        }
                    });
                });
                setMinFaresByAirlines2(minFaresByAirlines2)
                setMinFaresByCabin2(minFaresByCabin2)
                const sortByFareAdtFullAscending2 = allDomesticDatas2.sort((a: any, b: any) => a.FareAdtFull - b.FareAdtFull)
                setPaginatedData2(sortByFareAdtFullAscending2)
                setFilteredData2(sortByFareAdtFullAscending2)
                setLoading2(false)
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading2(false)
        }
    };

    const handleSort = () => {
        if (pageRevert === 2) {
            const sortedData = [...filteredData2].sort((a, b) => {
                if (a.TotalPrice < b.TotalPrice) return ascending ? 1 : -1;
                if (a.TotalPrice > b.TotalPrice) return ascending ? -1 : 1;
                return 0;
            });
            setFilteredData2(sortedData);
            setAscending((prevAscending) => !prevAscending);
        } else {
            const sortedData = [...filteredData].sort((a, b) => {
                if (a.FareAdtFull < b.FareAdtFull) return ascending ? 1 : -1;
                if (a.FareAdtFull > b.FareAdtFull) return ascending ? -1 : 1;
                return 0;
            });
            setFilteredData(sortedData);
            setAscending((prevAscending) => !prevAscending);
        }
    };

    useEffect(() => {
        intervalRef.current = window.setInterval(() => {
            setProgress((prevProgress) => Math.min(prevProgress + 1, maxProgress));
        }, 20);

        return () => clearInterval(intervalRef.current);
    }, [maxProgress]);

    useEffect(() => {
        if (!loadingRef.current && progress < maxProgress) {
            clearInterval(intervalRef.current);
            setProgress(100);
        }
    }, [progress, maxProgress]);

    
    useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location])

    useEffect(() => {
        fetchData2()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location, statusOpenTab2])


    const handleFilterChange = (filterKey: string, checkedValues: string[] | boolean) => {
        setFilters((prevFilters) => ({ ...prevFilters, [filterKey]: checkedValues }));
    };

    const getNumberOfStops = (item: any) => {
        const numSegments = item.ListSegment.length;
        if (numSegments > 1) {
            return `${numSegments - 1} Stops`;
        } else {
            return 'Nonstop';
        }
    };

    useEffect(() => {
        if (tripType === false) {
            setPageRevert(1)
            setStatusOpenTab2(false)
        } else {
            setStatusOpenTab2(true)
        }
    }, [tripType])

    useEffect(() => {
        const existingValue = JSON.parse(localStorage.getItem('outPage') || 'false');
        const existingTripType = tripType
        const existingLength = booking.length
        if (existingTripType === true && existingLength > 1 && existingValue === true) {
            window.open('/booking', '_blank')
        }
        if (existingTripType === false && existingLength === 1 && existingValue === true) {
            window.open('/booking', '_blank')
        }
    }, [tripType, booking, dispatch, outPage])

    useEffect(() => {
        if (tripType) {
            const filteredData = paginatedData.filter((item) => {
                const isAirlineMatch = filters.airline.length === 0 || item.ListSegment.some((segment: any) => filters.airline.includes(segment.Airline));
                const isCabinMatch =
                    filters.cabin.length === 0 || item.ListSegment.some((segment: any) => filters.cabin.includes(segment.Cabin));
                const isHandBaggageMatch =
                    filters.handBaggage.length === 0 || item.ListSegment.some((segment: any) => filters.handBaggage.includes(segment.HandBaggage));
                const isPromoMatch = !filters.promo || item.Promo;
                const isItemStartTimeMatch = !filters.timeLine || item.StartTime >= filters.timeLine;
                const isStopsMatch = filters.stops.length === 0 || filters.stops.includes(getNumberOfStops(item));

                return isAirlineMatch && isCabinMatch && isHandBaggageMatch && isPromoMatch && isItemStartTimeMatch && isStopsMatch;
            });

            const filteredData2 = paginatedData2.filter((item) => {
                const isAirlineMatch = filters.airline.length === 0 || item.ListSegment.some((segment: any) => filters.airline.includes(segment.Airline));
                const isCabinMatch =
                    filters.cabin.length === 0 || item.ListSegment.some((segment: any) => filters.cabin.includes(segment.Cabin));
                const isHandBaggageMatch =
                    filters.handBaggage.length === 0 || item.ListSegment.some((segment: any) => filters.handBaggage.includes(segment.HandBaggage));
                const isPromoMatch = !filters.promo || item.Promo;
                const isItemStartTimeMatch = !filters.timeLine || item.StartTime >= filters.timeLine;
                const isStopsMatch = filters.stops.length === 0 || filters.stops.includes(getNumberOfStops(item));

                return isAirlineMatch && isCabinMatch && isHandBaggageMatch && isPromoMatch && isItemStartTimeMatch && isStopsMatch;
            });

            setFilteredData2(filteredData2);
            setFilteredData(filteredData)
        } else {
            const filteredData = paginatedData.filter((item) => {
                const isAirlineMatch = filters.airline.length === 0 || item.ListSegment.some((segment: any) => filters.airline.includes(segment.Airline));;
                const isCabinMatch =
                    filters.cabin.length === 0 || item.ListSegment.some((segment: any) => filters.cabin.includes(segment.Cabin));
                const isHandBaggageMatch =
                    filters.handBaggage.length === 0 || item.ListSegment.some((segment: any) => filters.handBaggage.includes(segment.HandBaggage));
                const isPromoMatch = !filters.promo || item.Promo;
                const isItemStartTimeMatch = !filters.timeLine || item.StartTime >= filters.timeLine;
                const isStopsMatch = filters.stops.length === 0 || filters.stops.includes(getNumberOfStops(item));

                return isAirlineMatch && isCabinMatch && isHandBaggageMatch && isPromoMatch && isItemStartTimeMatch && isStopsMatch;
            });

            setFilteredData(filteredData);
        }
    }, [filters, paginatedData, paginatedData2, tripType]);

    console.log(filteredData)

    const handleNumberChange = (number: number) => {
        console.log(number)
        setPageRevert(number)
    };

    const onClose = () => {
        setOpen(false);
    };

    return (
        <div className='filter-page'>
            <TopFilter />
            <section className='list-url-filter landing-page'>
                <Drawer
                    className='drawer-class'
                    placement={'left'}
                    closable={true}
                    onClose={onClose}
                    open={open}
                >
                    <div className='container-filter'>
                        <div className='frame-filter-flex'>
                            <div className='list-gr-filter' style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className='gr-filter'>
                                    <h5 className='filter-title'>Stops</h5>
                                    {listValueStopsFilter.map((option) => (
                                        <div className="flex-col-item">
                                            <div className="flex-between">
                                                <input
                                                    type="checkbox"
                                                    value={option}
                                                    checked={filters.stops.includes(option)}
                                                    onChange={() => handleFilterChange("stops", filters.stops.includes(option) ? filters.stops.filter((item) => item !== option) : [...filters.stops, option])}
                                                />
                                                <p className="title text-truncate">
                                                    {option}
                                                </p>
                                            </div>
                                            <p className="filter-item text-truncate">{pageRevert === 1 ? minFareAdtFull.toLocaleString('en-US') : minFareAdtFull2.toLocaleString('en-US')} VNĐ</p>
                                        </div>
                                    ))
                                    }
                                </div>
                                <div className='gr-filter'>
                                    <h5 className='filter-title'>Airlines</h5>
                                    {pageRevert === 1
                                        ? minFaresByAirlines.length === 1
                                            ? minFaresByAirlines.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.airline}
                                                            checked={filters.airline.includes(option.airline)}
                                                            defaultChecked
                                                    
                                                        />
                                                        <p className="title text-truncate">
                                                            {getAirlineFullName(option.airline)}
                                                        </p>
                                                    </div>
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                                </div>
                                            ))
                                            : minFaresByAirlines.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.airline}
                                                            checked={filters.airline.includes(option.airline)}
                                                            onChange={() => handleFilterChange("airline", filters.airline.includes(option.airline) ? filters.airline.filter((item) => item !== option.airline) : [...filters.airline, option.airline])}
                                                        />
                                                        <p className="title text-truncate">
                                                            {getAirlineFullName(option.airline)}
                                                        </p>
                                                    </div>
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                                </div>
                                            ))
                                        : minFaresByAirlines2.length === 1
                                            ? minFaresByAirlines2.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.airline}
                                                            checked={filters.airline.includes(option.airline)}
                                                            defaultChecked
                                                        />
                                                        <p className="title text-truncate">
                                                            {getAirlineFullName(option.airline)}
                                                        </p>
                                                    </div>
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                        
                                                </div>
                                            ))
                                            : minFaresByAirlines2.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.airline}
                                                            checked={filters.airline.includes(option.airline)}
                                                            onChange={() => handleFilterChange("airline", filters.airline.includes(option.airline) ? filters.airline.filter((item) => item !== option.airline) : [...filters.airline, option.airline])}
                                                        />
                                                        <p className="title text-truncate">
                                                            {getAirlineFullName(option.airline)}
                                                        </p>
                                                    </div>
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                        
                                                </div>
                                            ))
                                    }

                                </div>
                                <div className='line-row'>
                                </div>
                                <div className='gr-filter'>
                                    <h5 className='filter-title'>Cabin</h5>
                                    {pageRevert === 1
                                        ? minFaresByCabin.length === 1
                                            ? minFaresByCabin.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.cabin}
                                                            checked={filters.cabin.includes(option.cabin)}
                                                            defaultChecked
                                                        />
                                                        <p className="title text-truncate">
                                                            {option.cabin}
                                                        </p>
                                                    </div>
                                                    {/* <p className="filter-item text-truncate">{pageRevert === 1 ? option.MinFareAdtFull.toLocaleString('en-US') : minFareAdtFull2.toLocaleString('en-US')} VNĐ</p> */}
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                                </div>
                                            ))
                                            : minFaresByCabin.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.cabin}
                                                            checked={filters.cabin.includes(option.cabin)}
                                                            onChange={() => handleFilterChange("cabin", filters.cabin.includes(option.cabin) ? filters.cabin.filter((item) => item !== option.cabin) : [...filters.cabin, option.cabin])}
                                                        />
                                                        <p className="title text-truncate">
                                                            {option.cabin}
                                                        </p>
                                                    </div>
                                                    {/* <p className="filter-item text-truncate">{pageRevert === 1 ? option.MinFareAdtFull.toLocaleString('en-US') : minFareAdtFull2.toLocaleString('en-US')} VNĐ</p> */}
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                                </div>
                                            ))
                                        : minFaresByCabin2.length === 1
                                            ? minFaresByCabin2.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.cabin}
                                                            checked={filters.cabin.includes(option.cabin)}
                                                            defaultChecked
                                                        />
                                                        <p className="title text-truncate">
                                                            {option.cabin}
                                                        </p>
                                                    </div>
                                                    {/* <p className="filter-item text-truncate">{pageRevert === 1 ? option.MinFareAdtFull.toLocaleString('en-US') : minFareAdtFull2.toLocaleString('en-US')} VNĐ</p> */}
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                                </div>
                                            ))
                                            : minFaresByCabin2.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.cabin}
                                                            checked={filters.cabin.includes(option.cabin)}
                                                            onChange={() => handleFilterChange("cabin", filters.cabin.includes(option.cabin) ? filters.cabin.filter((item) => item !== option.cabin) : [...filters.cabin, option.cabin])}
                                                        />
                                                        <p className="title text-truncate">
                                                            {option.cabin}
                                                        </p>
                                                    </div>
                                                    {/* <p className="filter-item text-truncate">{pageRevert === 1 ? option.MinFareAdtFull.toLocaleString('en-US') : minFareAdtFull2.toLocaleString('en-US')} VNĐ</p> */}
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                                </div>
                                            ))
                                    }
                                </div>
                                <div className='line-row'>
                                </div>
                                <div className='gr-filter'>
                                    <h5 className='filter-title'>Flight Times</h5>
                                    <div className='gr-flex-col'>
                                        <div className='flex-col-item'>
                                            <div className='flex-between'>
                                                <p className='title text-truncate' style={{ fontWeight: '600' }}>Take-off</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='gr-flex-col'>
                                        <div className='flex-col-item'>
                                            <div className='flex-between'>
                                                <p className='filter-item text-truncate'>01:00</p>
                                            </div>
                                            <p className='filter-item text-truncate'>{timeLine}</p>
                                        </div>
                                    </div>
                                    <div className='gr-flex-col'>
                                        <Slider
                                            step={30}
                                            min={60}
                                            max={1440}
                                            onChange={onChangeTimeline}
                                            tooltip={{ formatter: null }}
                                        />
                                    </div>
                                </div>
                                <div className='line-row'>
                                </div>
                            </div>
                        </div>
                    </div>
                </Drawer>
                <div className='container-filter'>
                    {loading && <LoadingBar progress={progress} />}
                    <MiniBooking />
                    <div className='frame-filter-flex'>
                        <div className='list-gr-filter visible'>
                            <div className='gr-filter'>
                                <h5 className='filter-title'>Stops</h5>
                                {loading
                                    ? <Skeleton paragraph={{ rows: 4 }} active />
                                    : listValueStopsFilter.map((option) => (
                                        <div className="flex-col-item">
                                            <div className="flex-between">
                                                <input
                                                    type="checkbox"
                                                    value={option}
                                                    checked={filters.stops.includes(option)}
                                                    onChange={() => handleFilterChange("stops", filters.stops.includes(option) ? filters.stops.filter((item) => item !== option) : [...filters.stops, option])}
                                                />
                                                <p className="title text-truncate">
                                                    {option}
                                                </p>
                                            </div>
                                            <p className="filter-item text-truncate">{pageRevert === 1 ? minFareAdtFull.toLocaleString('en-US') : minFareAdtFull2.toLocaleString('en-US')} VNĐ</p>
                                        </div>
                                    ))
                                }
                            </div>
                            <div className='gr-filter'>
                                <h5 className='filter-title'>Airlines</h5>
                                {loading
                                    ? <Skeleton paragraph={{ rows: 4 }} active />
                                    : pageRevert === 1
                                        ? minFaresByAirlines.length === 1
                                            ? minFaresByAirlines.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.airline}
                                                            checked={filters.airline.includes(option.airline)}
                                                            defaultChecked
                                                        // onChange={() => handleFilterChange("airline", filters.airline.includes(option.airline) ? filters.airline.filter((item) => item !== option.airline) : [...filters.airline, option.airline])}
                                                        />
                                                        <p className="title text-truncate">
                                                            {getAirlineFullName(option.airline)}
                                                        </p>
                                                    </div>
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                        
                                                </div>
                                            ))
                                            : minFaresByAirlines.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.airline}
                                                            checked={filters.airline.includes(option.airline)}
                                                            onChange={() => handleFilterChange("airline", filters.airline.includes(option.airline) ? filters.airline.filter((item) => item !== option.airline) : [...filters.airline, option.airline])}
                                                        />
                                                        <p className="title text-truncate">
                                                            {getAirlineFullName(option.airline)}
                                                        </p>
                                                    </div>
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                        
                                                </div>
                                            ))
                                        : minFaresByAirlines2.length === 1
                                            ? minFaresByAirlines2.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.airline}
                                                            checked={filters.airline.includes(option.airline)}
                                                            defaultChecked
                                                        // onChange={() => handleFilterChange("airline", filters.airline.includes(option.airline) ? filters.airline.filter((item) => item !== option.airline) : [...filters.airline, option.airline])}
                                                        />
                                                        <p className="title text-truncate">
                                                            {getAirlineFullName(option.airline)}
                                                        </p>
                                                    </div>
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                        
                                                </div>
                                            ))
                                            : minFaresByAirlines2.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.airline}
                                                            checked={filters.airline.includes(option.airline)}
                                                            onChange={() => handleFilterChange("airline", filters.airline.includes(option.airline) ? filters.airline.filter((item) => item !== option.airline) : [...filters.airline, option.airline])}
                                                        />
                                                        <p className="title text-truncate">
                                                            {getAirlineFullName(option.airline)}
                                                        </p>
                                                    </div>
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                        
                                                </div>
                                            ))
                                }
                            </div>
                            <div className='line-row'>
                            </div>
                            <div className='gr-filter'>
                                <h5 className='filter-title'>Cabin</h5>
                                {loading
                                    ? <Skeleton paragraph={{ rows: 4 }} active />
                                    : pageRevert === 1
                                        ? minFaresByCabin.length === 1
                                            ? minFaresByCabin.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.cabin}
                                                            checked={filters.cabin.includes(option.cabin)}
                                                            defaultChecked
                                                        />
                                                        <p className="title text-truncate">
                                                            {option.cabin}
                                                        </p>
                                                    </div>
                                                    {/* <p className="filter-item text-truncate">{pageRevert === 1 ? option.MinFareAdtFull.toLocaleString('en-US') : minFareAdtFull2.toLocaleString('en-US')} VNĐ</p> */}
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                                </div>
                                            ))
                                            : minFaresByCabin.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.cabin}
                                                            checked={filters.cabin.includes(option.cabin)}
                                                            onChange={() => handleFilterChange("cabin", filters.cabin.includes(option.cabin) ? filters.cabin.filter((item) => item !== option.cabin) : [...filters.cabin, option.cabin])}
                                                        />
                                                        <p className="title text-truncate">
                                                            {option.cabin}
                                                        </p>
                                                    </div>
                                                    {/* <p className="filter-item text-truncate">{pageRevert === 1 ? option.MinFareAdtFull.toLocaleString('en-US') : minFareAdtFull2.toLocaleString('en-US')} VNĐ</p> */}
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                                </div>
                                            ))
                                        : minFaresByCabin2.length === 1
                                            ? minFaresByCabin2.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.cabin}
                                                            checked={filters.cabin.includes(option.cabin)}
                                                            defaultChecked
                                                        />
                                                        <p className="title text-truncate">
                                                            {option.cabin}
                                                        </p>
                                                    </div>
                                                    {/* <p className="filter-item text-truncate">{pageRevert === 1 ? option.MinFareAdtFull.toLocaleString('en-US') : minFareAdtFull2.toLocaleString('en-US')} VNĐ</p> */}
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                                </div>
                                            ))
                                            : minFaresByCabin2.map((option) => (
                                                <div className="flex-col-item">
                                                    <div className="flex-between">
                                                        <input
                                                            type="checkbox"
                                                            value={option.cabin}
                                                            checked={filters.cabin.includes(option.cabin)}
                                                            onChange={() => handleFilterChange("cabin", filters.cabin.includes(option.cabin) ? filters.cabin.filter((item) => item !== option.cabin) : [...filters.cabin, option.cabin])}
                                                        />
                                                        <p className="title text-truncate">
                                                            {option.cabin}
                                                        </p>
                                                    </div>
                                                    {/* <p className="filter-item text-truncate">{pageRevert === 1 ? option.MinFareAdtFull.toLocaleString('en-US') : minFareAdtFull2.toLocaleString('en-US')} VNĐ</p> */}
                                                    <p className="filter-item text-truncate">{option.minFareAdtFull.toLocaleString('en-US')} VNĐ</p>
                                                </div>
                                            ))
                                }
                            </div>
                            <div className='line-row'>
                            </div>
                            <div className='gr-filter'>
                                <h5 className='filter-title'>Flight Times</h5>
                                {loading
                                    ? <Skeleton paragraph={{ rows: 4 }} active />
                                    : <>
                                        <div className='gr-flex-col'>
                                            <div className='flex-col-item'>
                                                <div className='flex-between'>
                                                    <p className='title text-truncate' style={{ fontWeight: '600' }}>Take-off</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='gr-flex-col'>
                                            <div className='flex-col-item'>
                                                <div className='flex-between'>
                                                    <p className='filter-item text-truncate'>01:00</p>
                                                </div>
                                                <p className='filter-item text-truncate'>{timeLine}</p>
                                            </div>
                                        </div>
                                        <div className='gr-flex-col'>
                                            <Slider
                                                step={30}
                                                min={60}
                                                max={1440}
                                                onChange={onChangeTimeline}
                                                tooltip={{ formatter: null }}
                                            />
                                        </div>
                                    </>
                                }
                            </div>
                            <div className='line-row'>
                            </div>
                        </div>
                        <div className='frame-paginated-flex'>
                            <div className='flex-col-top'>
                                <div className='flex-row'>
                                    {loading
                                        ? <LoadingFrame divWidth={'250px'} divHeight={'27px'} maxDivWidth={'100%'} borderRadius={'4px'} />
                                        : <div className='flex-col'>
                                            {pageRevert === 1
                                                ? <>
                                                    <span className="content text-18">Chuyến bay từ {flyingToReturn} đến {flyingTo}</span>
                                                    <span className="content text-14">{formatNgayThangNam3(departDate)}</span>
                                                </>
                                                : <>
                                                    <span className="content text-18">Chuyến bay từ {flyingTo} đến {flyingToReturn}</span>
                                                    <span className="content text-14">{formatNgayThangNam3(returnDate)}</span>
                                                </>
                                            }
                                        </div>
                                    }
                                    <div className='frame-action-booking'>
                                        {loading === true
                                            ?
                                            <span className="content"><Spin /> Đang tìm kiếm</span>
                                            :
                                            <span className="content">Tìm thấy {paginatedData.length + paginatedData2.length} chuyến</span>
                                        }
                                    </div>
                                </div>
                                <div className='flex-row'>
                                    <div className='frame-action-booking'>
                                        <span className="content text-14"><span style={{ color: '#85898d' }}>Sắp xếp theo:</span> Giá chuyến bay</span>
                                        <BiSortDown onClick={handleSort} style={{ fontSize: '20px', cursor: 'pointer' }} />
                                        <button className='sort-action filter' onClick={() => setOpen(true)}>
                                            <BiFilterAlt />
                                            Filter
                                        </button>
                                    </div>
                                    <div className='frame-action-booking'>
                                        <span className="content text-14"><span style={{ color: '#85898d' }}>Giá đã bao gồm Thuế & một số phí / VND / cho 1 khách</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className='slider-top-filter'>
                               {tripType === false &&  <SliderDateTrend />}
                            </div>

                            <Tabs
                                defaultActiveKey="1"
                                onChange={(value) => setPageRevert(Number(value))}
                                activeKey={String(pageRevert)}
                                items={[
                                    {
                                        label: 'Chuyến đi',
                                        key: '1',
                                        children: <PaginatedList paginatedData={filteredData} loading={loading} pageRevert={1} onNumberChange={handleNumberChange} />,
                                    },
                                    {
                                        label: 'Chuyến về',
                                        key: '2',
                                        children: <PaginatedList paginatedData={filteredData2} loading={loading2} pageRevert={2} onNumberChange={handleNumberChange} />,
                                        disabled: statusOpenTab2 === false,
                                    },
                                ]}
                            />

                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default FilteredListPage