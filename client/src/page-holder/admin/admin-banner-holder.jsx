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
  Dialog,
  DialogBody,
  DialogHeader,
  Input,
  Tooltip,
  Typography
} from "@material-tailwind/react";
import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function BannerHolder() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const [tableData, setTableData] = useState([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [loadingBanner, setLoadingBanner] = useState(false);
  const [tableProp, setTableProp] = useState({
    perPage: 50,
    totalPages: 1,
    currentPage: 1,
    from: 0,
    to: 0,
    totalRecords: -1,
    searchValue: "",
    bannerFor: "",
    status: "",
    orderBy: "createdAt",
    orderDirection: "DESC",
  });

  React.useEffect(() => {
    document.title = "SproutEdge Agro - Banners";
    getTableRecordByPage(1, 50, "createdAt", "DESC", "", "", "");
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
      bannerFor: "",
      status: "",
      orderBy: "createdAt",
      orderDirection: "DESC",
    });
    getTableRecordByPage(1, 50, "createdAt", "DESC", "", "", "");
  };

  const refreshTableData = () => {
    getTableRecordByPage(
      tableProp.currentPage,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      tableProp.bannerFor,
      tableProp.status
    );
  };

  const getTableRecordByPage = (
    currentPage,
    perPage,
    orderBy,
    orderDirection,
    searchValue,
    bannerFor,
    status
  ) => {
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/bannerApi/getAllBanners`, {
        currentPage,
        perPage,
        orderBy,
        orderDirection,
        searchValue,
        bannerFor: bannerFor || undefined,
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
            bannerFor,
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
        tableProp.bannerFor,
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
      tableProp.bannerFor,
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
      tableProp.bannerFor,
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
        tableProp.bannerFor,
        tableProp.status
      );
    }
  };

  const changeStatus = (id, value) => {
    const url = `${
      import.meta.env.VITE_API_URL
    }/api/bannerApi/changeBannerStatus`;
    axios
      .post(url, { id: id, statusValue: value })
      .then(({ status }) => {
        if (status === 200) {
          switch (value) {
            case 1:
              refreshTableData();
              toast.success("Banner activated successfully.", {
                position: toast.POSITION.TOP_CENTER,
                theme,
              });
              break;
            case 2:
              refreshTableData();
              toast.success("Banner deactivated successfully.", {
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

  const handleViewBanner = async (id) => {
    setLoadingBanner(true);
    setViewModalOpen(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/bannerApi/getBannerById?id=${id}`
      );
      if (response.status === 200) {
        setSelectedBanner(response.data);
      }
    } catch (errors) {
      handleError(errors);
      setViewModalOpen(false);
    } finally {
      setLoadingBanner(false);
    }
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedBanner(null);
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) {
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/bannerApi/deleteBanner`,
        { id }
      );
      if (response.status === 200) {
        toast.success("Banner deleted successfully.", {
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
                Banners
              </Typography>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="rounded-md border-0 bg-white">
                  <Input
                    placeholder="Search by name, banner for..."
                    className="border-0 focus:border-0"
                    enterKeyHint="search"
                    onKeyUp={handleSearch}
                    labelProps={{ style: { display: "none" } }}
                    icon={<i className="fas fa-search" />}
                  />
                </div>
                <div className="flex flex-row gap-2">
                  <Button
                    onClick={() => navigate("/admin/add-banner")}
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
                    text="Image"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={false}
                    orderDirection={tableProp.orderDirection}
                  /> */}
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
                    key="position"
                    columnName="position"
                    text="Position"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="bannerFor"
                    columnName="bannerFor"
                    text="Banner For"
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
                  <tr>
                    <td colSpan="7">
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
                            <button onClick={() => handleViewBanner(rowObj.id)}>
                              <i className="fas fa-eye text-base font-semibold text-green-600"></i>
                            </button>
                          </Tooltip>
                          <Tooltip content="edit" className="p-1 text-xs">
                            <Link to={`/admin/edit-banner/${rowObj.id}`}>
                              <i className="fas fa-pen-to-square text-base font-semibold text-blue-600"></i>
                            </Link>
                          </Tooltip>
                          {/* <Tooltip content="delete" className="p-1 text-xs">
                            <button
                              onClick={() => handleDeleteBanner(rowObj.id)}
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
                        {rowObj.imageMd ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}${
                              rowObj.imageMd
                            }`}
                            alt={rowObj.name}
                            className="h-16 w-24 rounded object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              e.target.src = "/placeholder-banner.png";
                            }}
                          />
                        ) : (
                          <div className="flex h-16 w-24 items-center justify-center rounded bg-gray-200">
                            <i className="fas fa-image text-gray-400"></i>
                          </div>
                        )}
                      </td> */}
                      <TableCell text={rowObj?.name || "--"} />
                      <TableCell text={rowObj?.position || "--"} />
                      <td className="border-b border-blue-gray-50 px-2 py-1">
                        <Chip
                          variant="gradient"
                          color={
                            rowObj.bannerFor === "Global Fresh Connect"
                              ? "purple"
                              : rowObj.bannerFor === "Bharat Fresh Hub"
                              ? "blue"
                              : "green"
                          }
                          value={rowObj.bannerFor || "--"}
                          className="px-2 py-0.5 text-[11px] font-medium"
                        />
                      </td>
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

      {/* Banner View Modal */}
      <Dialog
        open={viewModalOpen}
        handler={handleCloseViewModal}
        size="lg"
        className="bg-white dark:bg-gray-800"
      >
        <DialogHeader className="justify-between border-b border-gray-200 dark:border-gray-700">
          <Typography
            variant="h5"
            color="blue-gray"
            className="dark:text-white"
          >
            Banner Details
          </Typography>
          <button
            onClick={handleCloseViewModal}
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i className="fas fa-times text-xl text-gray-600 dark:text-gray-300"></i>
          </button>
        </DialogHeader>
        <DialogBody className="max-h-[70vh] overflow-y-auto">
          {loadingBanner ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          ) : selectedBanner ? (
            <div className="space-y-6">
              {/* Images Section */}
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <Typography
                  variant="h6"
                  className="mb-3 text-gray-800 dark:text-white"
                >
                  <i className="fas fa-images mr-2"></i>Banner Images
                </Typography>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {selectedBanner.imageSm && (
                    <div>
                      <Typography className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Small
                      </Typography>
                      <img
                        src={`${import.meta.env.VITE_API_URL}${
                          selectedBanner.imageSm
                        }`}
                        alt="Small banner"
                        className="h-32 w-full rounded-lg object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}
                  {selectedBanner.imageMd && (
                    <div>
                      <Typography className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Medium
                      </Typography>
                      <img
                        src={`${import.meta.env.VITE_API_URL}${
                          selectedBanner.imageMd
                        }`}
                        alt="Medium banner"
                        className="h-32 w-full rounded-lg object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}
                  {selectedBanner.imageLg && (
                    <div>
                      <Typography className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Large
                      </Typography>
                      <img
                        src={`${import.meta.env.VITE_API_URL}${
                          selectedBanner.imageLg
                        }`}
                        alt="Large banner"
                        className="h-32 w-full rounded-lg object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <Typography
                  variant="h6"
                  className="mb-3 text-gray-800 dark:text-white"
                >
                  <i className="fas fa-info-circle mr-2"></i>Basic Information
                </Typography>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Banner Name
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white">
                      {selectedBanner.name || "--"}
                    </Typography>
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Position
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white">
                      {selectedBanner.position || "--"}
                    </Typography>
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Banner For
                    </Typography>
                    <Chip
                      variant="gradient"
                      color={
                        selectedBanner.bannerFor === "Global Fresh Connect"
                          ? "purple"
                          : selectedBanner.bannerFor === "Bharat Fresh Hub"
                          ? "blue"
                          : "green"
                      }
                      value={selectedBanner.bannerFor || "--"}
                      className="mt-1 w-fit px-2 py-0.5 text-[11px] font-medium"
                    />
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Status
                    </Typography>
                    <Chip
                      variant="gradient"
                      color={selectedBanner.status === 2 ? "red" : "green"}
                      value={
                        selectedBanner.status === 2 ? "Inactive" : "Active"
                      }
                      className="mt-1 w-fit px-2 py-0.5 text-[11px] font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <Typography
                  variant="h6"
                  className="mb-3 text-gray-800 dark:text-white"
                >
                  <i className="fas fa-clock mr-2"></i>Timestamps
                </Typography>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Created At
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white">
                      {selectedBanner.createdAt ? (
                        <ShowDateTime timestamp={selectedBanner.createdAt} />
                      ) : (
                        "--"
                      )}
                    </Typography>
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Updated At
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white">
                      {selectedBanner.updatedAt ? (
                        <ShowDateTime timestamp={selectedBanner.updatedAt} />
                      ) : (
                        "--"
                      )}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Typography className="text-gray-500 dark:text-gray-400">
                No banner data available
              </Typography>
            </div>
          )}
        </DialogBody>
      </Dialog>
    </div>
  );
}
