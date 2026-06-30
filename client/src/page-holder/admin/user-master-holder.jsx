import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Chip,
  Button,
  Input,
  Tooltip,
  Avatar,
} from "@material-tailwind/react";
import React, { Suspense, useState } from "react";
import { useMaterialTailwindController } from "@/context/index.jsx";
import axios from "axios";
import moment from "moment";
import CSVLink from "react-csv/src/components/Link.jsx";
import { useNavigate } from "react-router-dom";
import { handleError } from "@/hooks/errorHandling";
import { formatDate } from "@/hooks/formatDate";
import {
  ShowDateTime,
  TableHeaderCell,
  TableCell,
  TableStatusButton,
  TablePagination,
} from "@/widgets/components";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const Edit = React.lazy(() => import("../../page-sections/userMaster/edit"));
const View = React.lazy(() => import("../../page-sections/userMaster/view"));

export function UserMasterHolder() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState({});
  const [tableData, setTableData] = useState([]);
  const [isDownloadPrepare, setIsDownloadPrepare] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [tableProp, setTableProp] = useState({
    perPage: 50,
    totalPages: 1,
    currentPage: 1,
    from: 0,
    to: 0,
    totalRecords: -1,
    searchValue: "",
    searchBy: "",
    orderBy: "createdAt",
    orderDirection: "desc",
  });

  React.useEffect(() => {
    document.title = "Sproutedge Agro User Master";
    getTableRecordByPage(1, 50, "createdAt", "desc", "");
  }, []);

  const hardRefreshTableData = () => {
    setTableProp({
      perPage: 50,
      totalPages: 1,
      currentPage: 1,
      from: 0,
      to: 0,
      totalRecords: 0,
      searchValue: "",
      searchBy: "",
      orderBy: "createdAt",
      orderDirection: "desc",
    });
    getTableRecordByPage(1, 50, "createdAt", "desc", "");
  };
  const refreshTableData = () => {
    getTableRecordByPage(
      1,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue
    );
  };
  const getTableRecordByPage = (
    currentPage,
    perPage,
    orderBy,
    orderDirection,
    searchValue
  ) => {
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/adminApi/getTableUserMaster`, {
        currentPage,
        perPage,
        orderBy,
        orderDirection,
        searchValue,
      })
      .then((response) => {
        if (response.status === 200) {
          const { totalRecords, tableData } = response.data;
          const newPerPage = Number(perPage);
          const newCurrentPage = Number(currentPage);
          const from = newCurrentPage * newPerPage - newPerPage + 1;
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
            searchBy: "",
            orderBy,
            orderDirection,
          });
        }
      })
      .catch((errors) => {
        handleError(errors);
        switch (errors.response.status) {
          case 401:
            navigate("/auth/sign-in", { replace: true });
            break;
          default:
        }
      });
  };
  const handlePageChange = (value) => {
    if (
      value > 0 &&
      value <= tableProp.totalPages &&
      value !== tableProp.currentPage
    ) {
      getTableRecordByPage(
        value,
        tableProp.perPage,
        tableProp.orderBy,
        tableProp.orderDirection,
        tableProp.searchValue
      );
    }
  };
  const handlePerPageChange = (value) => {
    getTableRecordByPage(
      1,
      value,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue
    );
  };

  const handleOrderBy = (value) => {
    let orderDirection = "asc";
    if (tableProp.orderBy === value)
      orderDirection = tableProp.orderDirection === "asc" ? "desc" : "asc";
    getTableRecordByPage(
      1,
      tableProp.perPage,
      value,
      orderDirection,
      tableProp.searchValue
    );
  };

  const handleSearch = (event) => {
    if (event.key === "Enter") {
      const searchValue = event.target.value;
      getTableRecordByPage(
        1,
        tableProp.perPage,
        tableProp.orderBy,
        tableProp.orderDirection,
        searchValue
      );
    }
  };

  //* Edit record
  const handleEdit = (obj) => {
    setSelectedRecord(obj);
    setIsEditOpen(true);
  };

  //* change status
  const changeStatus = (id, value) => {
    const url = `${import.meta.env.VITE_API_URL}/api/adminApi/changeStatusUser`;
    axios
      .post(url, { id: id, statusValue: value })
      .then(({ status }) => {
        if (status === 200) {
          switch (value) {
            case 1:
              refreshTableData();
              toast.success(
                "The record, which was previously inactive, has been made active and can now be used or accessed.",
                { position: toast.POSITION.TOP_CENTER }
              );
              break;
            case 2:
              refreshTableData();
              toast.success(
                "The record, which was previously active, has been made inactive and cannot be used or accessed until it is activated again.",
                { position: toast.POSITION.TOP_CENTER }
              );
              break;
            default:
          }
        }
      })
      .catch((errors) => {
        handleError(errors);
        switch (errors.response.status) {
          case 401:
            navigate("/auth/sign-in", { replace: true });
            break;
          case 403:
            navigate("/admin/dashboard", { replace: true });
            break;
          default:
        }
      });
  };

  const downloadDocument = (obj) => {
    setSelectedRecord(obj);
    setIsViewOpen(true);
  };

  const prepareForDownload = () => {
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/adminApi/getCSVTableUser`)
      .then(async (response) => {
        if (response.status === 200) {
          processCSVData(response.data.tableData);
        }
      })
      .catch((errors) => {
        handleError(errors);
        switch (errors.response.status) {
          case 401:
            navigate("/auth/sign-in", { replace: true });
            break;
          case 403:
            navigate("/admin/dashboard", { replace: true });
            break;
          default:
        }
      });
  };

  const processCSVData = (tempData) => {
    const date = new Date();
    const tempDate = moment(date, "DD MM YYYY, h:mm a");
    const formatedDate = moment(tempDate).format("Do MMM YYYY");
    let csvDataTemp = [];
    csvDataTemp.push(["", "Export Date", formatedDate, "", "", "", "", ""]);
    csvDataTemp.push([
      "Sr.No.",
      "User Name",
      "First Name",
      "Middle Name",
      "Last Name",
      "Mobile",
      "Email",
      "Status",
      "Created At",
      "Updated At",
    ]);
    for (const obj of tempData) {
      const {
        srno,
        userName,
        firstName,
        middleName,
        lastName,
        mobile,
        email,
        status,
        createdAt,
        updatedAt,
      } = obj;
      const formatedUpdatedAt = formatDate(updatedAt);
      const formatedCreatedAt = formatDate(createdAt);
      const tempStatus = status === 1 ? "active" : "inactive";
      csvDataTemp.push([
        srno,
        userName,
        firstName,
        middleName,
        lastName,
        mobile,
        email,
        tempStatus,
        formatedCreatedAt,
        formatedUpdatedAt,
      ]);
    }
    setCsvData(csvDataTemp);
    setIsDownloadPrepare(true);
  };

  const roleMap = {
    1: "Admin",
    2: "Procurement",
    3: "Logistics",
    4: "Sales",
    5: "Staff",
  };

  return (
    <div className="animate-fade-in mb-8 mt-12 flex transform flex-col gap-12">
      <Card className="bg-white from-blue-gray-700 to-blue-gray-800 dark:bg-gradient-to-br">
        <CardHeader
          variant="gradient"
          color={sidenavColor}
          className="mb-4 p-3"
        >
          <div className="flex flex-col justify-between md:flex-row">
            <Typography variant="h6" color="white">
              User Master
            </Typography>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="rounded-md border-0 bg-white">
                <Input
                  placeholder="Search"
                  className="border-0 focus:border-0"
                  enterKeyHint="search"
                  onKeyUp={handleSearch}
                  labelProps={{ style: { display: "none" } }}
                  icon={<i className="fas fa-search" />}
                />
              </div>
              <div className="flex flex-row gap-2">
                <Button
                  onClick={() => navigate("/admin/add-user-master")}
                  className="inline-flex self-center"
                  variant="outlined"
                  color="white"
                  size="sm"
                >
                  <i className="fas fa-plus self-center pr-1" />
                  ADD
                </Button>
                <>
                  <Button
                    onClick={(event) => {
                      event.preventDefault();
                      hardRefreshTableData();
                    }}
                    className="inline-flex self-center"
                    variant="outlined"
                    color="white"
                    size="sm"
                  >
                    <i className="fas fa-arrows-rotate self-center" />
                  </Button>
                  {/* <div className="flex flex-row gap-2">
                    {isDownloadPrepare ? (
                      <button className="justify-center rounded px-2 py-1 text-white shadow-blue-gray-500">
                        <CSVLink data={csvData}>
                          <i className="fas fa-download" />
                        </CSVLink>
                      </button>
                    ) : (
                      <Button
                        onClick={(event) => {
                          event.preventDefault();
                          prepareForDownload();
                        }}
                        className="inline-flex self-center"
                        variant="outlined"
                        color="white"
                        size="sm"
                      >
                        <i className="fas fa-cloud-arrow-down" />
                      </Button>
                    )}
                  </div> */}
                </>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-scroll bg-white from-blue-gray-700 to-blue-gray-800 px-0 pb-2 pt-0 text-blue-gray-600 dark:bg-gradient-to-br dark:text-white">
          <div className="overflow-x-scroll">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <TableHeaderCell
                  key="srno"
                  columnName="createdAt"
                  text="Sr.No."
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="name"
                  columnName="name"
                  text="Name"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="mobile"
                  columnName="mobile"
                  text="Mobile"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="email"
                  columnName="email"
                  text="Email"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="role"
                  columnName="role"
                  text="Role"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                {/* <TableHeaderCell
                  key="joiningDate"
                  columnName="joiningDate"
                  text="Joining_Date"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="logo"
                  columnName="logo"
                  text="Logo"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                /> */}
                <TableHeaderCell
                  key="status"
                  columnName="status"
                  text="Status"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="createdAt"
                  columnName="createdAt"
                  text="Created_At"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
                <TableHeaderCell
                  key="updatedAt"
                  columnName="updatedAt"
                  text="Updated_At"
                  orderBy={tableProp.orderBy}
                  handleOrderBy={handleOrderBy}
                  isOrderByAvailable={true}
                  orderDirection={tableProp.orderDirection}
                />
              </thead>
              <tbody>
                {tableProp.totalRecords === -1 && (
                  <tr>
                    <td colSpan="7">
                      <div className="w-full p-4">
                        <div className="animate-pulse space-y-4">
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 w-4/6 rounded bg-gray-300"></div>
                            <div className="h-4 w-5/6 rounded bg-gray-300"></div>
                            <div className="h-4 w-5/6 rounded bg-gray-300"></div>
                            <div className="w-6/6 h-4 rounded bg-gray-300"></div>
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
                        <p className="p-2 text-center text-sm text-red-500 ">
                          No Data Available
                        </p>
                      </td>
                    </tr>
                  </>
                ) : (
                  tableData.map((rowObj, key) => (
                    <tr key={rowObj.id}>
                      <td className="items-center border-b border-blue-gray-50 px-2 py-2">
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
                            <TableStatusButton
                              changeStatus={changeStatus}
                              rowObj={rowObj}
                            />
                          </>
                        </div>
                      </td>
                      <TableCell text={rowObj?.name || "--"} />
                      <TableCell text={rowObj?.mobile || "--"} />
                      <TableCell text={rowObj?.email || "--"} />
                      <TableCell text={roleMap[rowObj?.role] || "--"} />
                      {/* <TableCell
                        text={
                          rowObj?.joiningDate
                            ? dayjs(rowObj?.joiningDate).format("DD/MM/YYYY")
                            : "--"
                        }
                      />
                      <td className="whitespace-nowrap border-b border-blue-gray-50 px-2 py-1">
                        <div className="flex items-center">
                          {rowObj.logo ? (
                            <Avatar
                              size="lg"
                              src={`${
                                import.meta.env.VITE_API_URL
                              }/api/userApi/downloadDocument?name=${
                                rowObj.logo
                              }`}
                              variant="rounded"
                              crossOrigin="use-credentials"
                              className="h-10 w-10"
                            />
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </td> */}
                      <td className="border-b border-blue-gray-50 px-2 py-1">
                        <Chip
                          variant="gradient"
                          color={rowObj.status === 2 ? "red" : "green"}
                          value={rowObj.status === 2 ? "inactive" : "active"}
                          className="px-2 py-0.5 text-[11px] font-medium"
                        />
                      </td>
                      <TableCell
                        text={<ShowDateTime timestamp={rowObj.createdAt} />}
                      />
                      <TableCell
                        text={<ShowDateTime timestamp={rowObj.updatedAt} />}
                      />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={tableProp.currentPage}
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
      <Suspense fallback={<div></div>}>
        <View
          isViewOpen={isViewOpen}
          setIsViewOpen={setIsViewOpen}
          refreshTableData={refreshTableData}
          selectedRecord={selectedRecord}
        />
        <Edit
          isEditOpen={isEditOpen}
          setIsEditOpen={setIsEditOpen}
          refreshTableData={refreshTableData}
          selectedRecord={selectedRecord}
        />
      </Suspense>
    </div>
  );
}

export default UserMasterHolder;
