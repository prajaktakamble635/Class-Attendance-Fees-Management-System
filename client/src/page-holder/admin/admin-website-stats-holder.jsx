import { useMaterialTailwindController } from "@/context/index.jsx";
import { handleError } from "@/hooks/errorHandling";
import {
  ShowDateTime,
  TableCell,
  TableHeaderCell,
  TablePagination,
  TableStatusButton,
} from "@/widgets/components";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Select,
  Option,
  Tooltip,
  Typography
} from "@material-tailwind/react";
import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function WebsiteStatsHolder() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const [tableData, setTableData] = useState([]);
  const [tableProp, setTableProp] = useState({
    perPage: 50,
    totalPages: 1,
    currentPage: 1,
    from: 0,
    to: 0,
    totalRecords: -1,
    searchValue: "",
    status: "",
    statType: "",
    orderBy: "id",
    orderDirection: "DESC",
  });

  React.useEffect(() => {
    document.title = "SproutEdge Agro - Website Stats";
    getTableRecordByPage(1, 50, "id", "DESC", "", "", "");
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
      status: "",
      statType: "",
      orderBy: "id",
      orderDirection: "DESC",
    });
    getTableRecordByPage(1, 50, "id", "DESC", "", "", "");
  };

  const refreshTableData = () => {
    getTableRecordByPage(
      tableProp.currentPage,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      tableProp.status,
      tableProp.statType
    );
  };

  const getTableRecordByPage = (
    currentPage,
    perPage,
    orderBy,
    orderDirection,
    searchValue,
    status,
    statType
  ) => {
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/websiteStatsApi/getAllWebsiteStats`, {
        currentPage,
        perPage,
        orderBy,
        orderDirection,
        searchValue,
        status: status || undefined,
        statType: statType || undefined,
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
            perPage,
            totalPages,
            currentPage,
            from,
            to,
            totalRecords,
            searchValue,
            status,
            statType,
            orderBy,
            orderDirection,
          });
        }
      })
      .catch((errors) => {
        handleError(errors);
        switch (errors.response?.status) {
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
        tableProp.searchValue,
        tableProp.status,
        tableProp.statType
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
      tableProp.status,
      tableProp.statType
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
      tableProp.status,
      tableProp.statType
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
        searchValue,
        tableProp.status,
        tableProp.statType
      );
    }
  };

  const handleStatusFilter = (value) => {
    getTableRecordByPage(
      1,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      value,
      tableProp.statType
    );
  };

  const handleStatTypeFilter = (value) => {
    getTableRecordByPage(
      1,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      tableProp.status,
      value
    );
  };

  const changeStatus = (id, value) => {
    const url = `${
      import.meta.env.VITE_API_URL
    }/api/websiteStatsApi/changeWebsiteStatStatus`;
    axios
      .post(url, { id: id, statusValue: value })
      .then(({ status }) => {
        if (status === 200) {
          switch (value) {
            case 1:
              refreshTableData();
              toast.success("Website Stat activated successfully.", {
                position: toast.POSITION.TOP_CENTER,
                theme,
              });
              break;
            case 2:
              refreshTableData();
              toast.success("Website Stat deactivated successfully.", {
                position: toast.POSITION.TOP_CENTER,
                theme,
              });
              break;
            default:
          }
        }
      })
      .catch((errors) => {
        handleError(errors);
        switch (errors.response?.status) {
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
                Website Stats
              </Typography>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="rounded-md border-0 bg-white">
                  <Input
                    placeholder="Search by title..."
                    className="border-0 focus:border-0"
                    enterKeyHint="search"
                    onKeyUp={handleSearch}
                    labelProps={{ style: { display: "none" } }}
                    icon={<i className="fas fa-search" />}
                  />
                </div>
                <div className="flex flex-row gap-2">
                  <Button
                    onClick={() => navigate("/admin/add-website-stats")}
                    className="inline-flex self-center"
                    variant="outlined"
                    color="white"
                    size="sm"
                  >
                    <i className="fas fa-plus self-center pr-1" />
                    ADD
                  </Button>
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
            {/* <div className="flex flex-col gap-2 md:flex-row">
              <div className="w-full md:w-48">
                <Select
                  label="Filter by Status"
                  value={tableProp.status}
                  onChange={(val) => handleStatusFilter(val)}
                  className="bg-white"
                >
                  <Option value="">All Status</Option>
                  <Option value="1">Active</Option>
                  <Option value="2">Inactive</Option>
                </Select>
              </div>
              <div className="w-full md:w-64">
                <Select
                  label="Filter by Stat Type"
                  value={tableProp.statType}
                  onChange={(val) => handleStatTypeFilter(val)}
                  className="bg-white"
                >
                  <Option value="">All Types</Option>
                  <Option value="Global Fresh Connect">Global Fresh Connect</Option>
                  <Option value="Bharat Fresh Hub">Bharat Fresh Hub</Option>
                  <Option value="Daily Basket">Daily Basket</Option>
                </Select>
              </div>
            </div> */}
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
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="statType"
                    columnName="statType"
                    text="Stat Type"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="statsTitle"
                    columnName="statsTitle"
                    text="Stats Title"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="number"
                    columnName="number"
                    text="Stats Number"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
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
                    text="Created At"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                </tr>
              </thead>
              <tbody>
                {tableProp.totalRecords === -1 && (
                  <tr>
                    <td colSpan="5">
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
                  <tr>
                    <td colSpan="5">
                      <p className="p-2 text-center text-sm text-red-500 ">
                        No Data Available
                      </p>
                    </td>
                  </tr>
                ) : (
                  tableData.map((rowObj, key) => (
                    <tr key={rowObj.id}>
                      <td className="items-center border-b border-blue-gray-50 px-2 py-2">
                        <div className="flex flex-row gap-3">
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {rowObj.srno}.
                          </Typography>
                          <Tooltip content="view" className="p-1 text-xs">
                            <Link to={`/admin/view-website-stats/${rowObj.id}`}>
                              <i className="fas fa-eye text-base font-semibold text-green-600"></i>
                            </Link>
                          </Tooltip>
                          <Tooltip content="edit" className="p-1 text-xs">
                            <Link to={`/admin/edit-website-stats/${rowObj.id}`}>
                              <i className="fas fa-pen-to-square text-base font-semibold text-blue-600"></i>
                            </Link>
                          </Tooltip>
                          <TableStatusButton
                            changeStatus={changeStatus}
                            rowObj={rowObj}
                          />
                        </div>
                      </td>
                      <TableCell text={rowObj?.statType || "--"} />
                      <TableCell
                        text={
                          rowObj?.statsTitle?.length > 60
                            ? rowObj.statTitle.substring(0, 60) + "..."
                            : rowObj?.statTitle || "--"
                        }
                      />
                      <TableCell text={rowObj?.number || "--"} />
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
    </div>
  );
}
