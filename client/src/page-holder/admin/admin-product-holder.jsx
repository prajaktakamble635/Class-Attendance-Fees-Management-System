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

export default function ProductHolder() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const [tableData, setTableData] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [tableProp, setTableProp] = useState({
    perPage: 50,
    totalPages: 1,
    currentPage: 1,
    from: 0,
    to: 0,
    totalRecords: -1,
    searchValue: "",
    categoryId: "",
    subCategoryId: "",
    status: "",
    orderBy: "createdAt",
    orderDirection: "DESC",
  });

  React.useEffect(() => {
    document.title = "SproutEdge Agro - Products";
    getCategoryList();
    getTableRecordByPage(1, 50, "createdAt", "DESC", "", "", "", "");
  }, []);

  const getCategoryList = () => {
    axios
      .post(
        `${import.meta.env.VITE_API_URL}/api/productApi/getActiveCategoryList`
      )
      .then((response) => {
        if (response.status === 200) {
          setCategoryList(response.data.categories || []);
        }
      })
      .catch((errors) => {
        handleError(errors);
      });
  };

  const getSubCategoryList = (categoryId) => {
    if (!categoryId) {
      setSubCategoryList([]);
      return;
    }
    axios
      .post(
        `${
          import.meta.env.VITE_API_URL
        }/api/productApi/getActiveSubCategoryList`,
        {
          categoryId,
        }
      )
      .then((response) => {
        if (response.status === 200) {
          setSubCategoryList(response.data.subCategories || []);
        }
      })
      .catch((errors) => {
        handleError(errors);
      });
  };

  const hardRefreshTableData = () => {
    setTableProp({
      perPage: 50,
      totalPages: 1,
      currentPage: 1,
      from: 0,
      to: 0,
      totalRecords: 0,
      searchValue: "",
      categoryId: "",
      subCategoryId: "",
      status: "",
      orderBy: "createdAt",
      orderDirection: "DESC",
    });
    setSubCategoryList([]);
    getTableRecordByPage(1, 50, "createdAt", "DESC", "", "", "", "");
  };

  const refreshTableData = () => {
    getTableRecordByPage(
      tableProp.currentPage,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      tableProp.categoryId,
      tableProp.subCategoryId,
      tableProp.status
    );
  };

  const getTableRecordByPage = (
    currentPage,
    perPage,
    orderBy,
    orderDirection,
    searchValue,
    categoryId,
    subCategoryId,
    status
  ) => {
    axios
      .post(`${import.meta.env.VITE_API_URL}/api/productApi/getAllProducts`, {
        currentPage,
        perPage,
        orderBy,
        orderDirection,
        searchValue,
        categoryId: categoryId || undefined,
        subCategoryId: subCategoryId || undefined,
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
            categoryId,
            subCategoryId,
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
        tableProp.categoryId,
        tableProp.subCategoryId,
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
      tableProp.categoryId,
      tableProp.subCategoryId,
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
      tableProp.categoryId,
      tableProp.subCategoryId,
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
        tableProp.categoryId,
        tableProp.subCategoryId,
        tableProp.status
      );
    }
  };

  const handleCategoryFilter = (value) => {
    const categoryId = value || "";
    setSubCategoryList([]);
    if (categoryId) {
      getSubCategoryList(categoryId);
    }
    getTableRecordByPage(
      1,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      categoryId,
      "",
      tableProp.status
    );
  };

  const handleSubCategoryFilter = (value) => {
    const subCategoryId = value || "";
    getTableRecordByPage(
      1,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      tableProp.categoryId,
      subCategoryId,
      tableProp.status
    );
  };

  const handleStatusFilter = (value) => {
    const status = value || "";
    getTableRecordByPage(
      1,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      tableProp.categoryId,
      tableProp.subCategoryId,
      status
    );
  };

  const changeStatus = (id, value) => {
    const url = `${
      import.meta.env.VITE_API_URL
    }/api/productApi/changeProductStatus`;
    axios
      .post(url, { id: id, statusValue: value })
      .then(({ status }) => {
        if (status === 200) {
          switch (value) {
            case 1:
              refreshTableData();
              toast.success("Product activated successfully.", {
                position: toast.POSITION.TOP_CENTER,
                theme,
              });
              break;
            case 2:
              refreshTableData();
              toast.success("Product deactivated successfully.", {
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

  const handleViewProduct = async (id) => {
    setLoadingProduct(true);
    setViewModalOpen(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/productApi/getProductById?id=${id}`
      );
      if (response.status === 200) {
        setSelectedProduct(response.data);
      }
    } catch (errors) {
      handleError(errors);
      setViewModalOpen(false);
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedProduct(null);
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
                Products
              </Typography>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="rounded-md border-0 bg-white">
                  <Input
                    placeholder="Search by name, SKU..."
                    className="border-0 focus:border-0"
                    enterKeyHint="search"
                    onKeyUp={handleSearch}
                    labelProps={{ style: { display: "none" } }}
                    icon={<i className="fas fa-search" />}
                  />
                </div>
                <div className="flex flex-row gap-2">
                  <Button
                    onClick={() => navigate("/admin/add-product")}
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
            {/* <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Select
                label="Filter by Category"
                value={tableProp.categoryId}
                onChange={handleCategoryFilter}
                className="bg-white"
              >
                <Option value="">All Categories</Option>
                {categoryList.map((cat) => (
                  <Option key={cat.value} value={String(cat.value)}>
                    {cat.label}
                  </Option>
                ))}
              </Select>
              <Select
                label="Filter by Sub-Category"
                value={tableProp.subCategoryId}
                onChange={handleSubCategoryFilter}
                className="bg-white"
                disabled={!tableProp.categoryId}
              >
                <Option value="">All Sub-Categories</Option>
                {subCategoryList.map((subCat) => (
                  <Option key={subCat.value} value={String(subCat.value)}>
                    {subCat.label}
                  </Option>
                ))}
              </Select>
              <Select
                label="Filter by Status"
                value={tableProp.status}
                onChange={handleStatusFilter}
                className="bg-white"
              >
                <Option value="">All Status</Option>
                <Option value="1">Active</Option>
                <Option value="2">Inactive</Option>
              </Select>
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
                    key="sku"
                    columnName="sku"
                    text="SKU"
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
                    key="category"
                    columnName="categoryName"
                    text="Category"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="subCategory"
                    columnName="subCategoryName"
                    text="Sub-Category"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="featured"
                    columnName="isFeatured"
                    text="Featured"
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
                    <td colSpan="9">
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
                    <td colSpan="9">
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
                            <button
                              onClick={() => handleViewProduct(rowObj.id)}
                            >
                              <i className="fas fa-eye text-base font-semibold text-green-600"></i>
                            </button>
                          </Tooltip>
                          <Tooltip content="edit" className="p-1 text-xs">
                            <Link to={`/admin/edit-product/${rowObj.id}`}>
                              <i className="fas fa-pen-to-square text-base font-semibold text-blue-600"></i>
                            </Link>
                          </Tooltip>
                          <TableStatusButton
                            changeStatus={changeStatus}
                            rowObj={rowObj}
                          />
                        </div>
                      </td>
                      {/* <td className="border-b border-blue-gray-50 px-2 py-2">
                        {rowObj.primaryImage ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL}${
                              rowObj.primaryImage
                            }`}
                            alt={rowObj.name}
                            className="h-12 w-12 rounded object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              e.target.src = "/placeholder-product.png";
                            }}
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
                            <i className="fas fa-image text-gray-400"></i>
                          </div>
                        )}
                      </td> */}
                      <TableCell text={rowObj?.sku || "--"} />
                      <TableCell text={rowObj?.name || "--"} />
                      <TableCell text={rowObj?.categoryName || "--"} />
                      <TableCell text={rowObj?.subCategoryName || "--"} />
                      <td className="border-b border-blue-gray-50 px-2 py-1">
                        <Chip
                          variant="gradient"
                          color={
                            rowObj.isFeatured === 1 ? "amber" : "blue-gray"
                          }
                          value={rowObj.isFeatured === 1 ? "Yes" : "No"}
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

      {/* Product View Modal */}
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
            Product Details
          </Typography>
          <button
            onClick={handleCloseViewModal}
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i className="fas fa-times text-xl text-gray-600 dark:text-gray-300"></i>
          </button>
        </DialogHeader>
        <DialogBody className="max-h-[70vh] overflow-y-auto">
          {loadingProduct ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          ) : selectedProduct ? (
            <div className="space-y-6">
              {/* Images Section */}
              {selectedProduct.tbl_product_image &&
                selectedProduct.tbl_product_image.length > 0 && (
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <Typography
                      variant="h6"
                      className="mb-3 text-gray-800 dark:text-white"
                    >
                      <i className="fas fa-images mr-2"></i>Images
                    </Typography>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {selectedProduct.tbl_product_image.map((img, idx) => (
                        <div key={img.id} className="relative">
                          <img
                            src={`${import.meta.env.VITE_API_URL}${
                              img.sizes?.medium?.path ||
                              img.sizes?.large?.path ||
                              ""
                            }`}
                            alt={img.altText || `Product ${idx + 1}`}
                            className="h-32 w-full rounded-lg object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              e.target.src = "/placeholder-product.png";
                            }}
                          />
                          {img.isPrimary === 1 && (
                            <Chip
                              value="Primary"
                              size="sm"
                              className="absolute left-2 top-2"
                              color="blue"
                            />
                          )}
                          {img.title && (
                            <Typography className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              {img.title}
                            </Typography>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                      Product Name
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white">
                      {selectedProduct.name || "--"}
                    </Typography>
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      SKU
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white">
                      {selectedProduct.sku || "--"}
                    </Typography>
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Slug
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white">
                      {selectedProduct.slug || "--"}
                    </Typography>
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      HSN
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white">
                      {selectedProduct.hsn || "--"}
                    </Typography>
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Category
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white">
                      {selectedProduct.tbl_category?.name || "--"}
                    </Typography>
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Sub-Category
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white">
                      {selectedProduct.tbl_sub_category?.name || "--"}
                    </Typography>
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Unit
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white">
                      {selectedProduct.unit || "--"}
                    </Typography>
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Weight
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white">
                      {selectedProduct.weight || "--"}
                    </Typography>
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Status
                    </Typography>
                    <Chip
                      variant="gradient"
                      color={selectedProduct.status === 2 ? "red" : "green"}
                      value={
                        selectedProduct.status === 2 ? "Inactive" : "Active"
                      }
                      className="mt-1 w-fit px-2 py-0.5 text-[11px] font-medium"
                    />
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Featured
                    </Typography>
                    <Chip
                      variant="gradient"
                      color={
                        selectedProduct.isFeatured === 1 ? "amber" : "blue-gray"
                      }
                      value={selectedProduct.isFeatured === 1 ? "Yes" : "No"}
                      className="mt-1 w-fit px-2 py-0.5 text-[11px] font-medium"
                    />
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      For Local
                    </Typography>
                    <Chip
                      variant="gradient"
                      color={selectedProduct.forLocal === 1 ? "green" : "red"}
                      value={selectedProduct.forLocal === 1 ? "Yes" : "No"}
                      className="mt-1 w-fit px-2 py-0.5 text-[11px] font-medium"
                    />
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      For Domestic
                    </Typography>
                    <Chip
                      variant="gradient"
                      color={
                        selectedProduct.forDomestic === 1 ? "green" : "red"
                      }
                      value={selectedProduct.forDomestic === 1 ? "Yes" : "No"}
                      className="mt-1 w-fit px-2 py-0.5 text-[11px] font-medium"
                    />
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      For International
                    </Typography>
                    <Chip
                      variant="gradient"
                      color={
                        selectedProduct.forInternational === 1 ? "green" : "red"
                      }
                      value={
                        selectedProduct.forInternational === 1 ? "Yes" : "No"
                      }
                      className="mt-1 w-fit px-2 py-0.5 text-[11px] font-medium"
                    />
                  </div>
                  <div>
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      GST Percent
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white">
                      {selectedProduct.gstPercent
                        ? `${selectedProduct.gstPercent}%`
                        : "--"}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              {(selectedProduct.shortDescription ||
                selectedProduct.description ||
                selectedProduct.excerpt) && (
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <Typography
                    variant="h6"
                    className="mb-3 text-gray-800 dark:text-white"
                  >
                    <i className="fas fa-align-left mr-2"></i>Descriptions
                  </Typography>
                  <div className="space-y-3">
                    {selectedProduct.shortDescription && (
                      <div>
                        <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          Short Description
                        </Typography>
                        <Typography className="text-sm text-gray-700 dark:text-gray-300">
                          {selectedProduct.shortDescription}
                        </Typography>
                      </div>
                    )}
                    {selectedProduct.description && (
                      <div>
                        <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          Description
                        </Typography>
                        <Typography className="text-sm text-gray-700 dark:text-gray-300">
                          {selectedProduct.description}
                        </Typography>
                      </div>
                    )}
                    {selectedProduct.excerpt && (
                      <div>
                        <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          Excerpt
                        </Typography>
                        <Typography className="text-sm text-gray-700 dark:text-gray-300">
                          {selectedProduct.excerpt}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing */}
              {selectedProduct.tbl_product_price &&
                selectedProduct.tbl_product_price.length > 0 && (
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <Typography
                      variant="h6"
                      className="mb-3 text-gray-800 dark:text-white"
                    >
                      <i className="fas fa-dollar-sign mr-2"></i>Pricing
                    </Typography>
                    {selectedProduct.tbl_product_price.map((price, idx) => (
                      <div
                        key={price.id}
                        className={`${
                          idx > 0
                            ? "mt-4 border-t border-gray-200 pt-4 dark:border-gray-700"
                            : ""
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <Chip
                            value={price.priceLabel || "Price"}
                            size="sm"
                            color="blue"
                            className="w-fit"
                          />
                          {price.tbl_currency && (
                            <Typography className="text-xs text-gray-600 dark:text-gray-400">
                              ({price.tbl_currency.code})
                            </Typography>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                          <div>
                            <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              MRP
                            </Typography>
                            <Typography className="text-sm font-semibold text-gray-800 dark:text-white">
                              {price.tbl_currency?.symbol || "₹"}
                              {price.mrp || "0.00"}
                            </Typography>
                          </div>
                          <div>
                            <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Selling Price
                            </Typography>
                            <Typography className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {price.tbl_currency?.symbol || "₹"}
                              {price.sellingPrice || "0.00"}
                            </Typography>
                          </div>
                          <div>
                            <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Offer Price
                            </Typography>
                            <Typography className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {price.offerPrice
                                ? `${price.tbl_currency?.symbol || "₹"}${
                                    price.offerPrice
                                  }`
                                : "--"}
                            </Typography>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Stock Information */}
              {selectedProduct.tbl_product_stock &&
                selectedProduct.tbl_product_stock.length > 0 && (
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <Typography
                      variant="h6"
                      className="mb-3 text-gray-800 dark:text-white"
                    >
                      <i className="fas fa-warehouse mr-2"></i>Stock Information
                    </Typography>
                    {selectedProduct.tbl_product_stock.map((stock, idx) => (
                      <div
                        key={stock.id}
                        className={`${
                          idx > 0
                            ? "mt-4 border-t border-gray-200 pt-4 dark:border-gray-700"
                            : ""
                        }`}
                      >
                        {stock.tbl_warehouse && (
                          <div className="mb-2">
                            <Chip
                              value={`${stock.tbl_warehouse.name} (${stock.tbl_warehouse.code})`}
                              size="sm"
                              color="green"
                              className="w-fit"
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                          <div>
                            <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Available Quantity
                            </Typography>
                            <Typography className="text-sm font-semibold text-gray-800 dark:text-white">
                              {stock.qtyAvailable || "0"}
                            </Typography>
                          </div>
                          <div>
                            <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Reserved Quantity
                            </Typography>
                            <Typography className="text-sm text-gray-800 dark:text-white">
                              {stock.qtyReserved || "0"}
                            </Typography>
                          </div>
                          <div>
                            <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Reorder Level
                            </Typography>
                            <Typography className="text-sm text-gray-800 dark:text-white">
                              {stock.reorderLevel || "0"}
                            </Typography>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Tags */}
              {selectedProduct.tbl_product_tags &&
                selectedProduct.tbl_product_tags.length > 0 && (
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <Typography
                      variant="h6"
                      className="mb-3 text-gray-800 dark:text-white"
                    >
                      <i className="fas fa-tags mr-2"></i>Tags
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.tbl_product_tags.map((tag) => (
                        <Chip
                          key={tag.id}
                          value={tag.tbl_tags?.name || `Tag #${tag.tagIdFk}`}
                          variant="outlined"
                          className="text-xs"
                        />
                      ))}
                    </div>
                  </div>
                )}

              {/* Highlights */}
              {selectedProduct.highlights &&
                selectedProduct.highlights.length > 0 && (
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <Typography
                      variant="h6"
                      className="mb-3 text-gray-800 dark:text-white"
                    >
                      <i className="fas fa-star mr-2"></i>Highlights
                    </Typography>
                    <ul className="ml-5 list-disc space-y-1">
                      {selectedProduct.highlights.map((highlight, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Attributes */}
              {selectedProduct.attributes &&
                Object.keys(selectedProduct.attributes).length > 0 && (
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <Typography
                      variant="h6"
                      className="mb-3 text-gray-800 dark:text-white"
                    >
                      <i className="fas fa-list mr-2"></i>Attributes
                    </Typography>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {Object.entries(selectedProduct.attributes).map(
                        ([key, value]) => (
                          <div key={key}>
                            <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              {key}
                            </Typography>
                            <Typography className="text-sm text-gray-800 dark:text-white">
                              {value}
                            </Typography>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Specifications */}
              {selectedProduct.specifications &&
                Object.keys(selectedProduct.specifications).length > 0 && (
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <Typography
                      variant="h6"
                      className="mb-3 text-gray-800 dark:text-white"
                    >
                      <i className="fas fa-clipboard-list mr-2"></i>
                      Specifications
                    </Typography>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {Object.entries(selectedProduct.specifications).map(
                        ([key, value]) => (
                          <div key={key}>
                            <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              {key}
                            </Typography>
                            <Typography className="text-sm text-gray-800 dark:text-white">
                              {value}
                            </Typography>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* FAQ */}
              {selectedProduct.faq && selectedProduct.faq.length > 0 && (
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <Typography
                    variant="h6"
                    className="mb-3 text-gray-800 dark:text-white"
                  >
                    <i className="fas fa-question-circle mr-2"></i>FAQ
                  </Typography>
                  <div className="space-y-3">
                    {selectedProduct.faq.map((item, idx) => (
                      <div
                        key={idx}
                        className={
                          idx > 0
                            ? "border-t border-gray-200 pt-3 dark:border-gray-700"
                            : ""
                        }
                      >
                        <Typography className="text-sm font-semibold text-gray-800 dark:text-white">
                          Q: {item.q}
                        </Typography>
                        <Typography className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          A: {item.a}
                        </Typography>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEO Information */}
              {(selectedProduct.metaTitle ||
                selectedProduct.metaDescription ||
                selectedProduct.metaKeywords) && (
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <Typography
                    variant="h6"
                    className="mb-3 text-gray-800 dark:text-white"
                  >
                    <i className="fas fa-search mr-2"></i>SEO Information
                  </Typography>
                  <div className="space-y-3">
                    {selectedProduct.metaTitle && (
                      <div>
                        <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          Meta Title
                        </Typography>
                        <Typography className="text-sm text-gray-800 dark:text-white">
                          {selectedProduct.metaTitle}
                        </Typography>
                      </div>
                    )}
                    {selectedProduct.metaDescription && (
                      <div>
                        <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          Meta Description
                        </Typography>
                        <Typography className="text-sm text-gray-800 dark:text-white">
                          {selectedProduct.metaDescription}
                        </Typography>
                      </div>
                    )}
                    {selectedProduct.metaKeywords && (
                      <div>
                        <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          Meta Keywords
                        </Typography>
                        <Typography className="text-sm text-gray-800 dark:text-white">
                          {selectedProduct.metaKeywords}
                        </Typography>
                      </div>
                    )}
                    {/* {selectedProduct.metaRobots && (
                      <div>
                        <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          Meta Robots
                        </Typography>
                        <Typography className="text-sm text-gray-800 dark:text-white">
                          {selectedProduct.metaRobots}
                        </Typography>
                      </div>
                    )} */}
                    {/* {selectedProduct.canonicalUrl && (
                      <div>
                        <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          Canonical URL
                        </Typography>
                        <Typography className="text-sm text-gray-800 dark:text-white">
                          {selectedProduct.canonicalUrl}
                        </Typography>
                      </div>
                    )} */}
                  </div>
                </div>
              )}

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
                      {selectedProduct.createdAt ? (
                        <ShowDateTime timestamp={selectedProduct.createdAt} />
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
                      {selectedProduct.updatedAt ? (
                        <ShowDateTime timestamp={selectedProduct.updatedAt} />
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
                No product data available
              </Typography>
            </div>
          )}
        </DialogBody>
      </Dialog>
    </div>
  );
}
