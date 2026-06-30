import { useMaterialTailwindController } from "@/context";
import { handleError } from "@/hooks/errorHandling";
import {
  TableCell,
  TableHeaderCell,
  TablePagination,
  ShowDateTime,
} from "@/widgets/components";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Tooltip,
  Typography,
} from "@material-tailwind/react";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ViewExamDetails from "@/page-sections/admin/exams/view-exam-details";
import dayjs from "dayjs";
import AsyncSelect from "react-select/async";

export default function AdminExamListHolder() {
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
    orderBy: "id",
    orderDirection: "DESC",
  });

  const [conditionData, setConditionData] = useState([]);
  const [conditionValue, setConditionValue] = useState([]);

  const [setsData, setSetsData] = useState([]);
  const [setsValue, setSetsValue] = useState([]);

  // Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);

  useEffect(() => {
    document.title = "Exam List Management";
    getTableRecordByPage(1, 50, "id", "DESC", "", [], []);
  }, []);

  useEffect(() => {
    Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllBoardSubjectConditionData`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllSetData`)
    ]).then(([conditionList, setList]) => {
      setConditionData(conditionList.data.conditionData)
      setSetsData(setList.data.setData)
    })
  },[])

  const handleDeleteExam = async (examId) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;

    try {
      const { data } = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/deleteExamTimeTable/${examId}`
      );

      toast.success(data.message || "Exam deleted successfully");
      refreshTableData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to delete exam");
    }
  };

  const hardRefreshTableData = () => {
    setTableProp({
      perPage: 50,
      totalPages: 1,
      currentPage: 1,
      from: 0,
      to: 0,
      totalRecords: -1,
      searchValue: "",
      orderBy: "id",
      orderDirection: "DESC",
    });
    getTableRecordByPage(1, 50, "id", "DESC", "", [], []);
  };

  const refreshTableData = () => {
    let board = conditionValue.map((i) => i.value)
    let set = setsValue.map((s) => s.value);
    getTableRecordByPage(
      tableProp.currentPage,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      board,
      set
    );
  };

  const getTableRecordByPage = async (
    currentPage,
    perPage,
    orderBy,
    orderDirection,
    searchValue,
    board,
    set
  ) => {
    try {
      const { data, status } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getTableExams`,
        { currentPage, perPage, orderBy, orderDirection, searchValue, board, set }
      );

      if (status === 200) {
        const { tableRecords, tableData } = data;
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
          orderDirection,
        });
      }
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401)
        navigate("/auth/sign-in", { replace: true });
    }
  };

  const handleSearch = (event) => {
    if (event.target.value) {
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
    let orderDirection = "ASC";
    if (tableProp.orderBy === value)
      orderDirection = tableProp.orderDirection === "ASC" ? "DESC" : "ASC";

    getTableRecordByPage(
      1,
      tableProp.perPage,
      value,
      orderDirection,
      tableProp.searchValue
    );
  };

  const applyFilters = () => {
      if (!conditionValue.length && !setsValue.length) {
        toast.warn("Please select at least one filter to apply", { theme: theme == 'light' ? 'dark' : 'light' });
        return;
      }

      let board = conditionValue.map((b) => b.value);
      let set = setsValue.map((s) => s.value);
      getTableRecordByPage(
        1,
        tableProp.perPage,
        tableProp.orderBy,
        tableProp.orderDirection,
        tableProp.searchValue,
        board,
        set
      );
    };
  
    const clearFilters = () => {
      setConditionValue([])
      setSetsValue([])
      getTableRecordByPage(
        1,
        tableProp.perPage,
        tableProp.orderBy,
        tableProp.orderDirection,
        tableProp.searchValue,
        [],
        []
      );
    };

  return (
    <div className="animate-fade-in mb-8 mt-12 flex flex-col gap-12">
      <Card className="bg-white dark:bg-gradient-to-br from-blue-gray-700 to-blue-gray-800">
        <CardHeader variant="gradient" color={sidenavColor} className="mb-4 p-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col justify-between md:flex-row">
              <Typography variant="h6" color="white">
                Exam Time Table List
              </Typography>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="rounded-md border-0 bg-white">
                  {/* <Input
                    placeholder="Search by exam name, board..."
                    className="border-0 focus:border-0"
                    enterKeyHint="search"
                    onChange={handleSearch}
                    labelProps={{ style: { display: "none" } }}
                    icon={<i className="fas fa-search" />}
                  /> */}
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
                  <Button
                    variant="outlined"
                    color="white"
                    size="sm"
                    onClick={() => navigate("/superAdmin/exam")}
                    className="flex items-center gap-2"
                  >
                    <i className="fas fa-arrow-left" />
                    Back
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody className="overflow-x-scroll bg-white dark:bg-gradient-to-br from-blue-gray-700 to-blue-gray-800 px-0 pb-2 pt-0 text-blue-gray-600 dark:text-white">
          
          <div className="w-full mt-2 mb-4 p-2 md:px-6  grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <Typography className="font-semibold mb-2">
                Select Board, Standard, Medium <span className="text-red-500">*</span>
              </Typography>
              <AsyncSelect
                isMulti
                isClearable
                cacheOptions
                defaultOptions={conditionData}
                placeholder="Search Board/Standard/Medium..."
                value={conditionValue}
                onChange={(newValue) => setConditionValue(newValue)}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <Typography className="font-semibold mb-2">
                Select Set <span className="text-red-500">*</span>
              </Typography>
              <AsyncSelect
                isMulti
                isClearable
                cacheOptions
                defaultOptions={setsData}
                placeholder="Search Set..."
                value={setsValue}
                onChange={(newValue) => setSetsValue(newValue)}
              />
            </div>
            <div className="col-span-2 flex justify-center md:justify-end">
              <Button
                onClick={applyFilters}
                className="flex items-center"
                variant="gradient"
                color="blue"
                size="sm"
              >
                <i className="fas fa-filter self-center pr-1" />
                Apply Filters
              </Button>
              <Button
                onClick={clearFilters}
                className="flex ml-2"
                variant="outlined"
                color="red"
                size="sm"
              >
                <i className="fas fa-trash self-center pr-1" />
                Clear Filters
              </Button>
            </div>
          </div>
          
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
                    key="examName"
                    columnName="name"
                    text="Exam Name"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="boardCon"
                    columnName="board"
                    text="Board/Standard/Medium"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  {/* <TableHeaderCell
                    key="standard"
                    columnName="standard"
                    text="Standard"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  /> */}
                  <TableHeaderCell
                    key="set"
                    columnName="set"
                    text="Set"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="dateFrom"
                    columnName="dateFrom"
                    text="Start Date"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="dateTo"
                    columnName="dateTo"
                    text="End Date"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="studentCount"
                    columnName="studentCount"
                    text="Total_No_Student"
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
                    <td colSpan="9" className="p-4 text-center">
                      <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                    </td>
                  </tr>
                )}

                {tableData.length === 0 && tableProp.totalRecords !== -1 ? (
                  <tr>
                    <td colSpan="9">
                      <p className="p-2 text-center text-sm text-red-500 ">
                        No Data Available
                      </p>
                    </td>
                  </tr>
                ) : (
                  tableData.map((row, index) => {
                    return (
                      <tr key={row.id}>
                        <td className="border-b border-blue-gray-50 px-2 py-2">
                          <div className="flex flex-row items-center gap-3">
                            <Typography className="text-xs font-semibold text-blue-gray-600">
                              {index + 1}.
                            </Typography>
                            <Tooltip content="View Details" className="p-1 text-xs">
                              <Typography
                                as='button'
                                onClick={() => {
                                  setSelectedExamId(row.id);
                                  setIsPreviewOpen(true);
                                }}
                                variant="text"
                              >
                                <i className="fas fa-eye text-green-600"></i>
                              </Typography>
                            </Tooltip>
                            <Tooltip content="Edit" className="p-1 text-xs">
                              <Link to={`/superAdmin/edit-exam/${row.id}`}>
                                <i className="fas fa-pen-to-square text-blue-600"></i>
                              </Link>
                            </Tooltip>
                            <Tooltip content="Delete" className="p-1 text-xs">
                              <Typography
                                as='button'
                                variant="text"
                                onClick={() => handleDeleteExam(row.id)}
                              >
                                <i className="fas fa-trash text-red-600"></i>
                              </Typography>
                            </Tooltip>
                          </div>
                        </td>
                        <TableCell text={row.name || "--"} />
                        <TableCell text={row.boardCondition || "--"} />
                        {/* <TableCell text={row.standard || "--"} /> */}
                        <TableCell text={row.set || "--"} />
                        <TableCell
                          text={new Date(row.dateFrom)
                            .toLocaleDateString("en-GB")
                            .replace(/\//g, "-")}
                        />
                        <TableCell
                          text={new Date(row.dateTo)
                            .toLocaleDateString("en-GB")
                            .replace(/\//g, "-")}
                        />
                        <TableCell
                          text={row?.studentCount || '--'}
                        />
                      </tr>
                    )

                  })
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

      {/* Modal */}
      {isPreviewOpen && (
        <ViewExamDetails
          open={isPreviewOpen}
          handleClose={() => setIsPreviewOpen(false)}
          examId={selectedExamId}
        />
      )}
    </div>
  );
}
