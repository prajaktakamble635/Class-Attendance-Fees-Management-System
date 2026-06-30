import { useMaterialTailwindController } from "@/context/index.jsx";
import { handleError } from "@/hooks/errorHandling";
import {
  ShowDateTime,
  TableCell,
  TableHeaderCell,
  TablePagination,
} from "@/widgets/components";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Typography
} from "@material-tailwind/react";
import axios from "axios";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDailyAttendanceHolder() {

  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;
  const [tableData, setTableData] = useState([]);
  const [tableProp, setTableProp] = useState({
    perPage: 50,
    totalPages: 1,
    currentPage: 1,
    from: 0,
    to: 0,
    totalRecords: -1,
    searchValue: "",
    orderBy: "punchDatetime",
    orderDirection: "DESC",
  });
  const [loading, setLoading] = useState(false);

  const [filterDate, setFilterDate] = useState(dayjs().format("YYYY-MM-DD"));

  React.useEffect(() => {
    document.title = "Daily Attendance Logs";
    getTableRecordByPage(1, 50, "punchDatetime", "DESC", "", dayjs().format("YYYY-MM-DD"), true);
  }, []);

  const hardRefreshTableData = () => {
    setTableProp({
      ...tableProp,
      perPage: 50,
      currentPage: 1,
      searchValue: "",
      orderBy: "punchDatetime",
      orderDirection: "DESC",
    });
    setFilterDate(dayjs().format("YYYY-MM-DD"));
    getTableRecordByPage(1, 50, "punchDatetime", "DESC", "", dayjs().format("YYYY-MM-DD"), true);
  };

  const getTableRecordByPage = async (
    currentPage,
    perPage,
    orderBy,
    orderDirection,
    searchValue,
    dateValue = filterDate,
    isLoading = true
  ) => {
    try {
      if (isLoading) {
        setLoading(true);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getDailyAttendance`,
        {
          currentPage,
          perPage,
          orderBy,
          orderDirection,
          searchValue,
          filterDate: dateValue,
        }
      );

      if (response.status === 200 || response.status === 206) {
        const { tableRecords, tableData } = response.data;

        const newPerPage = Number(perPage);
        const newCurrentPage = Number(currentPage);
        const from = newCurrentPage * newPerPage - newPerPage + 1;
        const to = from + tableData.length - 1;
        const totalPages = Math.ceil(tableRecords / newPerPage);

        setTableData(tableData);
        setTableProp({
          perPage,
          totalPages,
          currentPage,
          from,
          to,
          totalRecords: tableRecords,
          searchValue,
          orderBy,
          orderDirection
        });
      }
    } catch (errors) {
      handleError(errors);
      switch (errors.response?.status) {
        case 401:
          navigate("/auth/sign-in", { replace: true });
          break;
        default:
          break;
      }
    } finally {
      setLoading(false);
    }
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
        tableProp.searchValue,
      );
    }
  };

  const handlePerPageChange = (value) => {
    getTableRecordByPage(
      1,
      value,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
    );
  };

  const handleOrderBy = (value) => {
    let orderDirection = "ASC";
    if (tableProp.orderBy === value)
      orderDirection = tableProp.orderDirection === "ASC" ? "DESC" : "ASC";
    getTableRecordByPage(
      1,
      tableProp.perPage,
      value,
      orderDirection,
      tableProp.searchValue,
    );
  };

  const handleSearch = (event) => {
    if (event.target.value) {
      const searchValue = event.target.value;
      getTableRecordByPage(
        1,
        tableProp.perPage,
        tableProp.orderBy,
        tableProp.orderDirection,
        searchValue,
      );
    } else {
      getTableRecordByPage(
        1,
        tableProp.perPage,
        tableProp.orderBy,
        tableProp.orderDirection,
        "",
      );
    }
  };

  return (
    <div className="animate-fade-in mb-8 mt-12 flex transform flex-col gap-12">
      <Card className="bg-white from-blue-gray-700 to-blue-gray-800 dark:bg-gradient-to-br">
        <CardHeader
          variant="gradient"
          color={sidenavColor}
          className="mb-4 p-3"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col justify-between md:flex-row">
              <Typography variant="h6" color="white">
                Daily Attendance Logs
              </Typography>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="rounded-md border-0 bg-white">
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      getTableRecordByPage(
                        1,
                        tableProp.perPage,
                        tableProp.orderBy,
                        tableProp.orderDirection,
                        tableProp.searchValue,
                        e.target.value
                      );
                    }}
                    className="border-0 focus:border-0"
                    labelProps={{ style: { display: "none" } }}
                  />
                </div>
                <div className="rounded-md border-0 bg-white">
                  <Input
                    placeholder="Search..."
                    className="border-0 focus:border-0"
                    enterKeyHint="search"
                    onChange={handleSearch}
                    labelProps={{ style: { display: "none" } }}
                    icon={<i className="fas fa-search" />}
                  />
                </div>
                <div className="flex flex-row gap-2">
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
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-scroll bg-white from-blue-gray-700 to-blue-gray-800 px-0 pb-2 pt-0 text-blue-gray-600 dark:bg-gradient-to-br dark:text-white">
          <div className="overflow-x-scroll">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  <TableHeaderCell
                    key="srno"
                    columnName="id"
                    text="Sr.No."
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="employeeId"
                    columnName="employeeId"
                    text="Student ID"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="studentName"
                    columnName="studentName"
                    text="Student Name"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="studentClass"
                    columnName="studentClass"
                    text="Class/Standard"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="punchIn"
                    columnName="punchIn"
                    text="Punch In Time"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="punchOut"
                    columnName="punchOut"
                    text="Punch Out Time"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="status"
                    columnName="status"
                    text="Status"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    orderDirection={tableProp.orderDirection}
                  />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7">
                      <p className="p-2 text-center text-sm text-blue-500 ">
                        Fetching Attendance Logs...
                      </p>
                    </td>
                  </tr>
                ) : tableData && tableData.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <p className="p-2 text-center text-sm text-red-500 ">
                        No Data Available
                      </p>
                    </td>
                  </tr>
                ) : tableData.map((rowObj, index) => (
                  <tr key={rowObj.id}>
                     <td className="items-center border-b border-blue-gray-50 px-2 py-2">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {tableProp.from + index}.
                        </Typography>
                    </td>
                    <TableCell text={rowObj?.employeeId || "--"} />
                    <TableCell text={rowObj?.studentName || "--"} />
                    <TableCell text={rowObj?.studentClass || "--"} />
                    <TableCell
                      text={rowObj?.punchIn ? <ShowDateTime timestamp={dayjs(rowObj.punchIn).subtract(5, 'hour').subtract(30, 'minute').toISOString()} /> : "--"}
                    />
                    <TableCell
                      text={rowObj?.punchOut ? <ShowDateTime timestamp={dayjs(rowObj.punchOut).subtract(5, 'hour').subtract(30, 'minute').toISOString()} /> : "--"}
                    />
                    <TableCell text={rowObj?.status || "--"} />
                  </tr>
                ))}
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
    </div>
  )
}
