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
  Tooltip,
  Typography
} from "@material-tailwind/react";
import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function PartnersHolder() {
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
    orderBy: "id",
    orderDirection: "DESC",
  });

  React.useEffect(() => {
    document.title = "SproutEdge Agro - Partners";
    getTableRecordByPage(1, 50, "id", "DESC", "", "");
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
      orderBy: "id",
      orderDirection: "DESC",
    });
    getTableRecordByPage(1, 50, "id", "DESC", "", "");
  };

  const refreshTableData = () => {
    getTableRecordByPage(
      tableProp.currentPage,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      tableProp.status
    );
  };

  const getTableRecordByPage = (
    currentPage,
    perPage,
    orderBy,
    orderDirection,
    searchValue,
    status
  ) => {
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/partnersApi/getAllPartners`, {
        currentPage,
        perPage,
        orderBy,
        orderDirection,
        searchValue,
        status: status || undefined,
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
        tableProp.status
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
      tableProp.status
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
      tableProp.status
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
        tableProp.status
      );
    }
  };

  const changeStatus = (id, value) => {
    const url = `${
      import.meta.env.VITE_API_URL
    }/api/partnersApi/changePartnerStatus`;
    axios
      .post(url, { id: id, statusValue: value })
      .then(({ status }) => {
        if (status === 200) {
          switch (value) {
            case 1:
              refreshTableData();
              toast.success("Partner activated successfully.", {
                position: toast.POSITION.TOP_CENTER,
                theme,
              });
              break;
            case 2:
              refreshTableData();
              toast.success("Partner deactivated successfully.", {
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

  const handleDeletePartner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this partner?")) {
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/partnersApi/deletePartner`,
        { id }
      );
      if (response.status === 200) {
        toast.success("Partner deleted successfully.", {
          position: toast.POSITION.TOP_CENTER,
          theme,
        });
        refreshTableData();
      }
    } catch (errors) {
      handleError(errors);
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
                Partners
              </Typography>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="rounded-md border-0 bg-white">
                  <Input
                    placeholder="Search by name..."
                    className="border-0 focus:border-0"
                    enterKeyHint="search"
                    onKeyUp={handleSearch}
                    labelProps={{ style: { display: "none" } }}
                    icon={<i className="fas fa-search" />}
                  />
                </div>
                <div className="flex flex-row gap-2">
                  <Button
                    onClick={() => navigate("/admin/add-partner")}
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
                  {/* <TableHeaderCell
                    key="image"
                    columnName=""
                    text="Logo"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={false}
                    orderDirection={tableProp.orderDirection}
                  /> */}
                  <TableHeaderCell
                    key="name"
                    columnName="name"
                    text="Partner Name"
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
                            <Link to={`/admin/view-partner/${rowObj.id}`}>
                              <i className="fas fa-eye text-base font-semibold text-green-600"></i>
                            </Link>
                          </Tooltip>
                          <Tooltip content="edit" className="p-1 text-xs">
                            <Link to={`/admin/edit-partner/${rowObj.id}`}>
                              <i className="fas fa-pen-to-square text-base font-semibold text-blue-600"></i>
                            </Link>
                          </Tooltip>
                          {/* <Tooltip content="delete" className="p-1 text-xs">
                            <button
                              onClick={() => handleDeletePartner(rowObj.id)}
                            >
                              <i className="fas fa-trash text-base font-semibold text-red-600"></i>
                            </button>
                          </Tooltip> */}
                          <TableStatusButton
                            changeStatus={changeStatus}
                            rowObj={rowObj}
                          />
                        </div>
                      </td>
                      {/* <td className="border-b border-blue-gray-50 px-2 py-2">
                        {rowObj.frontImage ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}${
                              rowObj.frontImage
                            }`}
                            alt={rowObj.name}
                            className="h-16 w-16 rounded object-contain bg-white p-1"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              e.target.src = "/placeholder-image.png";
                            }}
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-200">
                            <i className="fas fa-image text-gray-400"></i>
                          </div>
                        )}
                      </td> */}
                      <TableCell text={rowObj?.name || "--"} />
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
