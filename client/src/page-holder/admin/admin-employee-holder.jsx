import { useMaterialTailwindController } from "@/context/index.jsx";
import { handleError } from "@/hooks/errorHandling";
import View from "@/page-sections/admin/admission/view";
import Add from "@/page-sections/admin/employee/add";
import Edit from "@/page-sections/admin/employee/edit";
import EditPassword from "@/page-sections/admin/employee/editPass";
import {
  CancelButton,
  ShowDateTime,
  SubmitButton,
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
  DialogFooter,
  DialogHeader,
  Input,
  Tooltip,
  Typography
} from "@material-tailwind/react";
import { useNullablePickerContext } from "@mui/x-date-pickers/internals";
import axios from "axios";
import dayjs from "dayjs";
import React, { Suspense, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Link, useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";

export default function AdminEmployeeHolder() {

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
    categoryId: "",
    subCategoryId: "",
    status: "",
    orderBy: "createdAt",
    orderDirection: "DESC",
  });
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPassUpdated, setIsPassUpdate] = useState(false);
  const [editObj, setEditObj] = useState(useNullablePickerContext);
  const [passObj, setPassObj] = useState(null)
  const [isWarn, setIsWarn] = useState(false);
  const [deleteObj, setDeleteObj] = useState(null)


  React.useEffect(() => {
    document.title = "Student List";
    getTableRecordByPage(1, 50, "createdAt", "DESC", "", "", "", "", true, [], [], null, null, [], 'all');
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
      orderBy: "createdAt",
      orderDirection: "DESC",
    });
    getTableRecordByPage(1, 50, "createdAt", "DESC", "",);
  };

  const refreshTableData = (isLoading = true) => {
    getTableRecordByPage(
      tableProp.currentPage,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      isLoading
    );
  };

  const getTableRecordByPage = async (
    currentPage,
    perPage,
    orderBy,
    orderDirection,
    searchValue,
    isLoading = true
  ) => {
    try {
      if (isLoading) {
        setLoading(true); // start loading
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getTableEmployee`,
        {
          currentPage,
          perPage,
          orderBy,
          orderDirection,
          searchValue,
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
      setLoading(false); // stop loading regardless of success/failure
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

  const changeStatus = async (id, status) => {
    const data = {
      id,
      statusValue: status
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/changeEmployeeStatus`, data);
      refreshTableData(false);
    } catch (err) {
      toast.error("Internal Server Error: Failed to change student status", { theme: theme == 'light' ? 'dark' : 'light' })
    }
  };

  const handleDelete = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/deleteEmployee?id=${deleteObj?.id}`);
      refreshTableData(false)
      toast.success("Employee deleted")
      handleCancelDelete()
    } catch (err) {
      toast.error("Internal Server Error: Please try again later or contact system administrator")
    }
  }

  const handleEdit = (obj) => {
    setEditObj(obj)
    setIsEditOpen(true)
  };

  const handleUpdatePass = (obj) => {
    setPassObj(obj)
    setIsPassUpdate(true)
  }

  const handleWarn = (obj) => {
    setDeleteObj(obj);
    setIsWarn(true)
  };

  const handleCancelDelete = () => {
    setDeleteObj(null);
    setIsWarn(false)
  }

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
                Employee List
              </Typography>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="rounded-md border-0 bg-white">
                  <Input
                    placeholder="Search by name, role..."
                    className="border-0 focus:border-0"
                    enterKeyHint="search"
                    onChange={handleSearch}
                    labelProps={{ style: { display: "none" } }}
                    icon={<i className="fas fa-search" />}
                  />
                </div>
                <div className="flex flex-row gap-2">
                  <Button
                    variant="outlined"
                    color="white"
                    size="sm"
                    className="hover:bg-white hover:text-black"
                    onClick={() => setIsAddOpen(true)}
                  >
                    <i className="fas fa-add me-2"></i>
                    Add Emplpoyee
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
                    // isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="name"
                    columnName="name"
                    text="Employee_Name"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    // isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="email"
                    columnName="email"
                    text="Email"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    // isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="mobile"
                    columnName="mobile"
                    text="Mobile"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    // isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="userRole"
                    columnName="userRole"
                    text="User_Role"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    // isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="lastLogin"
                    columnName="lastLogin"
                    text="Last_Login_At"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    // isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="status"
                    columnName="status"
                    text="Status"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    // isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="createdAt"
                    columnName="createdAt"
                    text="Created_At"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    // isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="12">
                      <p className="p-2 text-center text-sm text-blue-500 ">
                        Fetching Students...
                      </p>
                    </td>
                  </tr>
                ) : tableData && tableData.length === 0 ? (
                  <tr>
                    <td colSpan="12">
                      <p className="p-2 text-center text-sm text-red-500 ">
                        No Data Available
                      </p>
                    </td>
                  </tr>
                ) : tableData.map((rowObj, index) => (
                  <tr key={rowObj.id}>
                    <td className="items-center border-b border-blue-gray-50 px-2 py-2">
                      <div className="flex flex-row gap-3">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {index + 1}.
                        </Typography>
                        <Tooltip content="Edit Employee">
                          <Typography as='button' className="text-blue-500" onClick={() => handleEdit(rowObj)}>
                            <i className="fas fa-edit"></i>
                          </Typography>
                        </Tooltip>
                        <Tooltip content="update Password">
                          <Typography as='button' className="text-orange-800" onClick={() => handleUpdatePass(rowObj)}>
                            <i className="fas fa-lock"></i>
                          </Typography>
                        </Tooltip>
                        <TableStatusButton
                          changeStatus={changeStatus}
                          rowObj={rowObj}
                        />
                        <Tooltip content="Delete">
                          <Typography as='button' className="text-red-800" onClick={() => handleWarn(rowObj)}>
                            <i className="fas fa-trash"></i>
                          </Typography>
                        </Tooltip>
                      </div>
                    </td>
                    <TableCell text={rowObj?.name || "--"} />
                    <TableCell text={rowObj?.email || "--"} />
                    <TableCell text={rowObj?.mobile || "--"} />
                    <TableCell text={rowObj?.userRole == 1 ? 'Super Admin' : rowObj.userRole == 2 ? 'Batch Coordinator' : rowObj?.userRole == 3 ? 'Counsellor' : rowObj?.userRole == 4 ? 'HOD' : 'Unknown'} />
                    <TableCell text={rowObj?.lastLogin ? dayjs(rowObj?.lastLogin).format("DD MMM, YYYY hh:mm a") : "--"} />
                    <td className="border-b border-blue-gray-50 px-2 py-1">
                      <Chip
                        variant="gradient"
                        color={
                          rowObj.status === 1 ? "green" : "red"
                        }
                        value={rowObj.status === 1 ? "Active" : "Inactive"}
                        className="px-2 py-0.5 text-[11px] font-medium"
                      />
                    </td>
                    <TableCell
                      text={<ShowDateTime timestamp={rowObj.createdAt} />}
                    />
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
      <Suspense>
        <Add
          open={isAddOpen}
          handleClose={() => setIsAddOpen(false)}
          refreshTableData={refreshTableData}
        />
        <Edit
          open={isEditOpen}
          handleClose={() => setIsEditOpen(false)}
          refreshTableData={refreshTableData}
          obj={editObj}
          setObj={setEditObj}
        />
        <EditPassword
          open={isPassUpdated}
          handleClose={() => setIsPassUpdate(false)}
          refreshTableData={refreshTableData}
          obj={passObj}
          setObj={setPassObj}
        />
      </Suspense>


      {/* -----------deletion-dialog-------------------- */}
      <Dialog
        className="z-40"
        handler={handleCancelDelete}
        open={isWarn}
        size={"md"}
      >
        <DialogHeader className="justify-center bg-gray-100 text-center text-xl font-semibold">
          Warning
        </DialogHeader>
        <DialogBody
          divider
          className="max-h-[75vh] overflow-y-auto px-6 bg-gray-50"
        >
          <div className="w-full">
            <Typography className="text-center">Are your sure you want to delete this employee record? Once deleted, employee cannot be recovered.</Typography>
          </div>
        </DialogBody>
        <DialogFooter className="bg-gray-100 sticky bottom-0 z-10">
          <CancelButton onClick={handleCancelDelete} />
          <SubmitButton onClick={handleDelete} title="Yes, Proceed" />
        </DialogFooter>
      </Dialog>
    </div>
  )

}