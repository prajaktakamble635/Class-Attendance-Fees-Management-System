import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Chip, Button, Input, Tooltip, Avatar,
} from "@material-tailwind/react";
import React, { Suspense, useState } from "react";
import {useMaterialTailwindController} from "@/context/index.jsx";
import axios from "axios";
import moment from "moment";
import CSVLink from "react-csv/src/components/Link.jsx";
import {useNavigate} from "react-router-dom";
import { handleError } from '@/hooks/errorHandling'
import { formatDate } from '@/hooks/formatDate';
import { ShowDateTime, TableHeaderCell, TableCell, TableStatusButton, TablePagination } from '@/widgets/components'
import {toast} from "react-toastify";
import dayjs from "dayjs";
import Add from "@/page-sections/admin/tags/add";
import Edit from "@/page-sections/admin/tags/edit";

export default function TagsHolder(){

    const navigate = useNavigate();
    const [controller] = useMaterialTailwindController();
    const { sidenavColor } = controller;
    const [isAddOpen,setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState({});
    const [tableData, setTableData ] = useState([]);
    const [isDownloadPrepare, setIsDownloadPrepare] = useState(false);
    const [csvData, setCsvData] = useState([]);
    const [tableProp, setTableProp] = useState({
        perPage: 50,
        totalPages: 1,
        currentPage: 1,
        from: 0,
        to: 0,
        totalRecords: -1,
        searchValue: '',
        searchBy: '',
        orderBy: 'createdAt',
        orderDirection: 'desc',
    });

    React.useEffect(() => {
        document.title = 'SproutEdge Agro - Tags';
        getTableRecordByPage(1, 50, 'createdAt', 'desc', '');
    }, []);

    const hardRefreshTableData = () => {
        setTableProp({
            perPage: 50,
            totalPages: 1,
            currentPage: 1,
            from: 0,
            to: 0,
            totalRecords: 0,
            searchValue: '',
            searchBy: '',
            orderBy: 'createdAt',
            orderDirection: 'desc',
        });
        getTableRecordByPage(1, 50, 'createdAt', 'desc', '');
    }
    const refreshTableData = () => {
        getTableRecordByPage(1, tableProp.perPage, tableProp.orderBy, tableProp.orderDirection, tableProp.searchValue);
    }
    const getTableRecordByPage = (currentPage, perPage, orderBy, orderDirection, searchValue) => {
        axios
            .post(`${import.meta.env.VITE_API_URL}/api/adminApi/getTagsTableData`, {
                currentPage,
                perPage,
                orderBy,
                orderDirection,
                searchValue
            })
            .then((response) => {
                if (response.status === 200) {
                    const {totalRecords, tableData} = response.data;
                    const newPerPage = Number(perPage);
                    const newCurrentPage = Number(currentPage);
                    const from = (newCurrentPage * newPerPage - newPerPage) + 1;
                    const to = from + tableData.length - 1;
                    const totalPages = Math.ceil(totalRecords / newPerPage);
                    setTableData(tableData);
                    setTableProp({
                        ...tableProp,
                        perPage,
                        totalPages,
                        currentPage,
                        from,
                        to,
                        totalRecords,
                        searchValue,
                        searchBy: '',
                        orderBy,
                        orderDirection
                    });
                }
            })
            .catch((errors) => {
                handleError(errors)
                switch (errors.response.status) {
                    case 401:
                        navigate('/auth/sign-in', {replace: true});
                        break;
                    default:
                }
            });
    }
    const handlePageChange = (value) => {
        if(value > 0 && value <= tableProp.totalPages && value !== tableProp.currentPage) {
            getTableRecordByPage(value, tableProp.perPage, tableProp.orderBy, tableProp.orderDirection, tableProp.searchValue);
        }
    }
    const handlePerPageChange = (value) => {
        getTableRecordByPage(1, value, tableProp.orderBy, tableProp.orderDirection, tableProp.searchValue);
    }

    const handleOrderBy = (value) => {
        let orderDirection = 'asc';
        if (tableProp.orderBy === value) orderDirection = tableProp.orderDirection === 'asc' ? 'desc' : 'asc';
        getTableRecordByPage(1, tableProp.perPage, value, orderDirection, tableProp.searchValue);
    }

    const handleSearch = (event) => {
        if (event.key === 'Enter') {
            const searchValue = event.target.value;
            getTableRecordByPage(1, tableProp.perPage, tableProp.orderBy, tableProp.orderDirection, searchValue);
        }
    };
    

    const handleEdit = (obj) => {
        setSelectedRecord(obj);
        setIsEditOpen(true);
    }

    //* change status
    const changeStatus = (id, value) => {
        const url = `${import.meta.env.VITE_API_URL}/api/adminApi/changeStatusTags`;
        axios.post(url, {id: id, statusValue: value})
            .then(({status}) => {
                if (status === 200) {
                    switch (value) {
                        case 1:
                            refreshTableData();
                            toast.success('The record, which was previously inactive, has been made active and can now be used or accessed.', {position: toast.POSITION.TOP_CENTER,});
                            break;
                        case 2:
                            refreshTableData();
                            toast.success('The record, which was previously active, has been made inactive and cannot be used or accessed until it is activated again.', {position: toast.POSITION.TOP_CENTER,});
                            break;
                        default:
                    }
                }
            })
            .catch((errors) => {
                handleError(errors);
                switch (errors.response.status) {
                    case 401:
                        navigate('/auth/sign-in', {replace: true});
                        break;
                    case 403:
                        navigate('/admin/dashboard', {replace: true});
                        break;
                    default:
                }
            });
    };

    const prepareForDownload = () => {
        axios
            .post(`${import.meta.env.VITE_API_URL}/api/hrApi/getCsvTableDataForProduct`,)
            .then(async (response) => {
                if (response.status === 200) {
                    processCSVData(response.data.tableData);
                }
            })
            .catch((errors) => {
                handleError(errors)
                switch (errors.response.status) {
                    case 401:
                        navigate('/auth/sign-in', {replace: true});
                        break;
                    case 403:
                        navigate('/hr/dashboard', {replace: true});
                        break;
                    default:
                }
            });
    }

    const processCSVData = (tempData) => {
        const date = new Date();
        const tempDate = moment(date, 'DD MM YYYY, h:mm a');
        const formatedDate = moment(tempDate).format('Do MMM YYYY');
        let csvDataTemp = [];
        csvDataTemp.push(["", "Export Date", formatedDate, "", "", "", "", ""]);
        csvDataTemp.push(["Sr.No.","Product Name", "Gl Code", "Status", "Created At", "Updated At"]);
        for (const obj of tempData) {
            const { srno, name, glCode, status, createdAt, updatedAt } = obj;
            const formatedUpdatedAt = formatDate(updatedAt);
            const formatedCreatedAt = formatDate(createdAt);
            const tempStatus = status === 1 ? 'active' : 'inactive';
            csvDataTemp.push([srno, name, glCode, tempStatus, formatedCreatedAt, formatedUpdatedAt]);
        }
        setCsvData(csvDataTemp);
        
        setIsDownloadPrepare(true);
        
    }

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12 animate-fade-in transform">
            <Card className="bg-white dark:bg-gradient-to-br from-blue-gray-700 to-blue-gray-800">
                <CardHeader variant="gradient" color={sidenavColor} className="mb-4 p-3">
                    <div className="flex flex-col md:flex-row justify-between">
                        <Typography variant="h6" color="white">
                            Tags
                        </Typography>
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="bg-white rounded-md border-0">
                                <Input placeholder="Search" className="border-0 focus:border-0"
                                       enterKeyHint="search"
                                       onKeyUp={handleSearch}
                                       labelProps={{ style:{display: 'none'} }} icon={<i className="fas fa-search" />} />
                            </div>
                            <div className="flex flex-row gap-2">
                                    <Button
                                        onClick={ () =>
                                            setIsAddOpen(true)
                                        }
                                        className="inline-flex self-center" variant="outlined" color="white" size="sm">
                                        <i className="fas fa-plus self-center pr-1" />
                                        ADD
                                    </Button>                                    
                                    <>
                                        <Button
                                            onClick={event => {event.preventDefault();
                                                hardRefreshTableData()}}
                                            className="inline-flex self-center" variant="outlined" color="white" size="sm">
                                            <i className="fas fa-arrows-rotate self-center" />
                                        </Button>
                                        {/* <div className="flex flex-row gap-2">
                                            {isDownloadPrepare ? (
                                                <button className="px-2 py-1 text-white rounded shadow-blue-gray-500 justify-center">
                                                    <CSVLink data={csvData}><i className="fas fa-download" /></CSVLink>
                                                </button>
                                            ) : (
                                                <Button
                                                    onClick={event => {event.preventDefault();
                                                        prepareForDownload()}}
                                                    className="inline-flex self-center" variant="outlined" color="white" size="sm">
                                                    <i className="fas fa-cloud-arrow-down" />
                                                </Button>
                                            )}
                                        </div> */}
                                    </>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="overflow-x-scroll px-0 pt-0 pb-2 bg-white dark:bg-gradient-to-br from-blue-gray-700 to-blue-gray-800 text-blue-gray-600 dark:text-white">
                    <div className="overflow-x-scroll">
                        <table className="w-full min-w-[640px] table-auto">
                            <thead>
                            <TableHeaderCell key="srno" columnName="createdAt" text="Sr.No." orderBy={tableProp.orderBy} handleOrderBy={handleOrderBy} isOrderByAvailable={true} orderDirection={tableProp.orderDirection} />
                            <TableHeaderCell key="name" columnName="name" text="Name" orderBy={tableProp.orderBy} handleOrderBy={handleOrderBy} isOrderByAvailable={true} orderDirection={tableProp.orderDirection} />
                            {/* <TableHeaderCell key="position" columnName="position" text="Position" orderBy={tableProp.orderBy} handleOrderBy={handleOrderBy} isOrderByAvailable={true} orderDirection={tableProp.orderDirection} /> */}
                            <TableHeaderCell key="status" columnName="status" text="Status" orderBy={tableProp.orderBy} handleOrderBy={handleOrderBy} isOrderByAvailable={true} orderDirection={tableProp.orderDirection}/>
                            <TableHeaderCell key="createdAt" columnName="createdAt" text="Created_At" orderBy={tableProp.orderBy} handleOrderBy={handleOrderBy} isOrderByAvailable={true} orderDirection={tableProp.orderDirection}/>
                            <TableHeaderCell key="updatedAt" columnName="updatedAt" text="Updated_At" orderBy={tableProp.orderBy} handleOrderBy={handleOrderBy} isOrderByAvailable={true} orderDirection={tableProp.orderDirection}/>
                            </thead>
                            <tbody>
                            {tableProp.totalRecords === -1 && (
                                <tr>
                                    <td colSpan="7">
                                        <div className="p-4 w-full">
                                            <div className="animate-pulse space-y-4">
                                                <div className="flex-1 space-y-2 py-1">
                                                    <div className="h-4 bg-gray-300 rounded w-4/6"></div>
                                                    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                                                    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                                                    <div className="h-4 bg-gray-300 rounded w-6/6"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {tableData && tableData.length === 0 ? (
                                <>
                                    <tr>
                                       <td colSpan="11">
                                            <p className="text-center p-2 text-red-500 text-sm ">
                                            No Data Available
                                            </p>
                                       </td>
                                    </tr>
                                </>
                            ): tableData.map(
                                (rowObj, key) => (
                                    <tr key={rowObj.id}>
                                        <td className="py-2 px-2 border-b border-blue-gray-50 items-center">
                                            <div className="flex flex-row gap-3">
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {rowObj.srno}.
                                                </Typography>
                                                <>
                                                    <Tooltip content="edit">
                                                        <Typography
                                                            as="button"
                                                            className="text-base font-semibold text-blue-600"
                                                            onClick={() => handleEdit(rowObj)}
                                                        >
                                                            <i className="fas fa-pen-to-square"></i>
                                                        </Typography>
                                                    </Tooltip>
                                                    <TableStatusButton changeStatus={changeStatus} rowObj={rowObj} />
                                                </>
                                            </div>
                                        </td>
                                        <TableCell text={rowObj?.name || '--'} />
                                        {/* <TableCell text={rowObj?.position || '--'} /> */}
                                        <td className="py-1 px-2 border-b border-blue-gray-50">
                                            <Chip
                                                variant="gradient"
                                                color={rowObj.status === 2 ? "red" : "green"}
                                                value={rowObj.status === 2 ? "inactive" : "active"}
                                                className="py-0.5 px-2 text-[11px] font-medium"
                                            />
                                        </td>
                                        <TableCell text={<ShowDateTime timestamp={rowObj.createdAt} />} />
                                        <TableCell text={<ShowDateTime timestamp={rowObj.updatedAt} />} />
                                    </tr>
                                )
                            )}
                            </tbody>
                        </table>

                    </div>
                    <TablePagination currentPage={tableProp.currentPage}
                                     totalPages={tableProp.totalPages}
                                     from={tableProp.from}
                                     to={tableProp.to}
                                     totalRecords={tableProp.totalRecords}
                                     perPage={tableProp.perPage}
                                     handlePerPageChange={handlePerPageChange}
                                     handlePageChange={handlePageChange}
                    />
                </CardBody>
            </Card>
            <Suspense>
                <Add isAddOpen={isAddOpen} setIsAddOpen={setIsAddOpen} refreshTableData={refreshTableData} />
                <Edit isEditOpen={isEditOpen} setIsEditOpen={setIsEditOpen} refreshTableData={refreshTableData} obj={selectedRecord} setObj={setSelectedRecord}  />
            </Suspense>
        </div>
    )

}