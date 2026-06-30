import { useMaterialTailwindController } from "@/context/index.jsx";
import { useUser } from "@/context/user";
import { handleError } from "@/hooks/errorHandling";
import View from "@/page-sections/admin/admission/view";
import OtpDialog from "@/page-sections/otp-dialog";
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
import axios from "axios";
import dayjs from "dayjs";
import moment from "moment";
import React, { Suspense, useContext, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Link, useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

export default function AdminStudentListHolder() {

  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const [tableData, setTableData] = useState([]);
  const [tableProp, setTableProp] = useState({
    perPage: 150,
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
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [boardData, setBoardData] = useState([]);
  const [boardValue, setBoardValue] = useState([]);
  const [standardData, setStandardData] = useState([]);
  const [standardValue, setStandardValue] = useState([]);
  const [setData, setSetData] = useState([]);
  const [setValue, setSetValue] = useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [isWarn, setIsWarn] = useState(false);
  const [studId, setStudId] = useState(null);
  const [isPreparing, setIsPreparing] = useState(false)
  const [allChecked, setAllChecked] = useState(false);
  const [multiWarn, setMultiWarn] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false)
  const { user } = useContext(useUser)
  const [subjectData, setSubjectData] = useState([]);
  const [subjectValue, setSubjectValue] = useState([]);

  React.useEffect(() => {
    document.title = "Student List";
    getTableRecordByPage(1, 50, "createdAt", "DESC", "", "", "", "", true, [], [], null, null, [], 'all', []);
  }, []);

  useEffect(() => {
    Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/commonApi/boardSubjectConditions`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllStandards`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllSetData`)
    ]).then(([boardRes, standardRes, setRes]) => {
      let conditionData = boardRes.data.data.map((item, index) => ({
        label: item.name,
        value: item.id
      }))
      setBoardData(conditionData)
      setStandardData(standardRes.data.standardData)
      setSetData(setRes.data.setData)
    })
  }, []);

  useEffect(() => {
    if(boardValue?.length){
      fetchSubjects()
    }
  },[boardValue])

  const fetchSubjects = async() => {
    const boardIds = boardValue.map((i) => i.value)
    try{
      const res  = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllSubjectsForCondition`, {
        conditionId: boardIds
      });
      setSubjectData(res.data.subjectData)
    }catch(err){
      toast.error("Failed to load subjects")
    }
  };

  const loadSubjects = async(InputValue) => {
    if(!boardValue.length > 0) return
    try{
      const boardIds = boardValue.map((i) => i.value)
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getSubjectForConditionBySearch`, {
        word: InputValue,
        conditionId: boardIds
      })
      return res.data.subjectData
    }catch(err){
      return []
    }
  }

  const hardRefreshTableData = () => {
    setBoardValue([])
    setSetValue([])
    setStandardValue([])
    setDateFilter(null)
    setFromDate(null)
    setToDate(null)
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
    getTableRecordByPage(1, 50, "createdAt", "DESC", "", "", "", "", true, [], [], null, null, [], 'all', []);
  };

  const refreshTableData = () => {
    let board = boardValue.map((i) => i.value)
    let standard = standardValue.map((s) => s.value);
    let set = setValue.map((s) => s.value);
    let subject = subjectValue.map((s) => s.value)
    getTableRecordByPage(
      tableProp.currentPage,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      tableProp.categoryId,
      tableProp.subCategoryId,
      tableProp.status,
      false,
      board,
      standard,
      fromDate,
      toDate,
      set,
      dateFilter,
      subject
    );
  };

  const getTableRecordByPage = async (
    currentPage,
    perPage,
    orderBy,
    orderDirection,
    searchValue,
    categoryId,
    subCategoryId,
    status,
    isLoader = true,
    board = [],
    standard = [],
    fromDate = null,
    toDate = null,
    sets = [],
    dateFilter = 'all',
    subject = []
  ) => {
    try {
      if (isLoader) setLoading(true); // start loading

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getTableStudents`,
        {
          currentPage,
          perPage,
          orderBy,
          orderDirection,
          searchValue,
          categoryId: categoryId || undefined,
          subCategoryId: subCategoryId || undefined,
          status: status || undefined,
          board,
          standard,
          fromDate,
          toDate,
          sets,
          dateFilter,
          subjects: subject
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
          categoryId,
          subCategoryId,
          status,
          orderBy,
          orderDirection,
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
    setAllChecked(false)
    
    let board = boardValue.map((i) => i.value)
    let set = setValue.map((i) => i.value)
    let subject = subjectValue.map((i) => i.value)
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
        tableProp.status,
        true,
        board,
        [],
        fromDate,
        toDate,
        set,
        dateFilter,
        subject
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
      tableProp.status,
      true,
      [],
      [],
      null,
      null,
      [],
      'all',
      []
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
      tableProp.status,
      true,
      [],
      [],
      null,
      null,
      [],
      'all',
      []
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
        tableProp.categoryId,
        tableProp.subCategoryId,
        tableProp.status,
        true,
        [],
        [],
        null,
        null,
        [],
        'all',
        []
      );
    } else {
      getTableRecordByPage(
        1,
        tableProp.perPage,
        tableProp.orderBy,
        tableProp.orderDirection,
        "",
        tableProp.categoryId,
        tableProp.subCategoryId,
        tableProp.status,
        true,
        [],
        [],
        null,
        []
      );
    }
  };

  const changeStatus = async (id, status) => {
    const data = {
      id,
      statusValue: status
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/changeStudentStatus`, data);
      refreshTableData();
    } catch (err) {
      toast.error("Internal Server Error: Failed to change student status", { theme: theme == 'light' ? 'dark' : 'light' })
    }
  };

  const handleView = (obj) => {
    setStudentData(obj)
    setIsViewOpen(true)
  };

  const applyFilters = () => {
    if (!boardValue.length && !standardValue.length && !setValue.length && (!fromDate && !toDate) && !dateFilter) {
      toast.warn("Please select at least one filter to apply", { theme: theme == 'light' ? 'dark' : 'light' });
      return;
    }

    if (dateFilter === 'custom' && (!fromDate && !toDate)) {
      toast.warn("Please select date range", { theme: theme == 'light' ? 'dark' : 'light' });
      return;
    }
    let board = boardValue.map((b) => b.value);
    let standard = standardValue.map((s) => s.value);
    let set = setValue.map((s) => s.value);
    let subject = subjectValue.map((s) => s.value)
    getTableRecordByPage(
      1,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      tableProp.categoryId,
      tableProp.subCategoryId,
      tableProp.status,
      true,
      board,
      standard,
      fromDate,
      toDate,
      set,
      dateFilter,
      subject
    );
  };

  const clearFilters = () => {
    setBoardValue([]);
    setStandardValue([]);
    setSetValue([]);
    setSubjectValue([])
    setFromDate(null);
    setToDate(null)
    setDateFilter(null)
    getTableRecordByPage(
      1,
      tableProp.perPage,
      tableProp.orderBy,
      tableProp.orderDirection,
      tableProp.searchValue,
      tableProp.categoryId,
      tableProp.subCategoryId,
      tableProp.status,
      true,
      [],
      [],
      null,
      null,
      [],
      'all',
      []
    );
  };

  const deleteStudent = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/deleteStudent?id=${studId}`);
      closeWarn();
      toast.success("Student deleted successfully", { theme: theme == 'light' ? 'dark' : 'light' })
    } catch (err) {
      toast.error("Failed to delete student. Please try again or contact system administrator.", { theme: theme == 'dark' ? 'light' : 'dark' })
    }
  };

  const handleOpenWarn = (id) => {
    setStudId(id);
    setIsWarn(true)
  };

  const closeWarn = () => {
    setStudId(null);
    refreshTableData();
    setIsWarn(false)
  };

  const handleCheck = (id, value) => {
    const mappedData = tableData.map((item, index) => 
      item.id === id ? {...item, checked: value} : item
    );
    setTableData(mappedData)
  };

  const prepareForDownload = async() => {
    setIsPreparing(true);
    const condition = boardValue.map((i) => i.value);
    const sets = setValue.map((i) => i.value)
    const subjects = subjectValue.map((i) => i.value)
    try{
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentDataForExport`, {
          condition,
          sets,
          fromDate,
          toDate,
          dateFilter,
          subjects
        })
        processCSVData(res.data.tableData)
    }catch(err){
      toast.error("Internal Server Error: failed to to prepare excel data")
    }
  };

  const exportSelected = async() => {
    const filteredData = tableData.filter((t) => t.checked === true)
    const filteredIds = filteredData.map((i) => i.id)
    if(filteredIds.length === 0) return toast.warn("Select atleast one record to delete")
    const data = {students: filteredIds};
    try{
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/exportSelectedStudents`, data);
      processCSVData(res.data.tableData)
    }catch(err){
      toast.error("Internal Server Error: Failed to export student data")
    }
  }

  const processCSVData = (tempData) => {
    const date = new Date();
    const exportDate = moment(date).format("Do MMM YYYY")

    let csvDataTemp = [];

    csvDataTemp.push(["", "", "Student List"]);
    csvDataTemp.push([]);

    csvDataTemp.push(["", "Export Date", exportDate])
    csvDataTemp.push([]);

    if(boardValue.length > 0){
      const board = boardValue.map((i) => i.label).join(", ");
      csvDataTemp.push(["", "Board/Standard/Medium", board]);
      csvDataTemp.push([]);
    }

    if(setValue.length > 0){
      let sets = setValue.map((i) => `${i.label}`).join(", ")
      csvDataTemp.push(["", "Sets", sets])
      csvDataTemp.push([])
    }

    if(dateFilter){
      if(dateFilter==='custom' && fromDate && toDate){
        csvDataTemp.push(["", "Date Range", fromDate, toDate])
        csvDataTemp.push([])
      }else{
        csvDataTemp.push(["", "Date Range", dateFilter])
        csvDataTemp.push([])
      }
    };

    csvDataTemp.push([
      "Sr. No",
      "Roll No.",
      "Student Name",
      "Board/Standard/Medium",
      "Student Mobile",
      "Mother Mobile",
      "Father Mobile",
    ])

    tempData.forEach((student, index) => {
      const row = [
        index + 1,
        student?.rollNo || '--',
        student?.name || '--',
        student?.board || '--',
        student?.studentMobile || '--',
        student?.motherMobile || '--',
        student?.fatherMobile || '--',
      ]
      csvDataTemp.push(row)
    })

    downloadExcelFile(csvDataTemp)
  };

  const downloadExcelFile = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: true });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Step 1: Write as binary string
    const binaryString = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'binary',
    });

    // Step 2: Convert binary string to base64
    function binaryToBase64(str) {
      let binary = '';
      for (let i = 0; i < str.length; i++) {
        binary += String.fromCharCode(str.charCodeAt(i) & 0xFF);
      }
      return btoa(binary);
    }

    const base64Excel = binaryToBase64(binaryString);

    const fileName = `student-list-${moment().format("YYYY-MM-DD-HH-mm-ss")}.xlsx`;

    // Step 3: Send to Android OR fallback to browser download
    if (window.AndroidBridge && typeof window.AndroidBridge.downloadFile === 'function') {
      try {
        window.AndroidBridge.downloadFile(base64Excel, fileName);
      } catch (e) {
        console.error("Error calling AndroidBridge.downloadFile:", e);
      }
    } else {
      // Fallback for browser
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleMultiCheck = (value) => {
    setAllChecked(value);
    const mappedData = tableData.map((item) =>({
        ...item, checked: value
      })
    )
    setTableData(mappedData)
  };

  const handleDeleteSelected = async() => {
    const filteredData = tableData.filter((t) => t.checked === true)
    const filteredIds = filteredData.map((i) => i.id)
    if(filteredIds.length === 0) return toast.warn("Select atleast one record to delete")
    setIsDeleting(false)
    try{
      await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/deleteStudentsInBulk`, {ids: filteredIds})
      refreshTableData()
      toast.success("Deletion completed")
      setAllChecked(false)
      setIsDeleting(false)
      setMultiWarn(false)
    }catch(err){
      toast.error("Internal Server Error: Failed to deleted selected students")
      setIsDeleting(false)
    }finally{
      setIsDeleting(false)
    }
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
                Student List
              </Typography>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="rounded-md border-0 bg-white">
                  <Input
                    placeholder="Search by name, rollno..."
                    className="border-0 focus:border-0"
                    enterKeyHint="search"
                    onChange={handleSearch}
                    labelProps={{ style: { display: "none" } }}
                    icon={<i className="fas fa-search" />}
                  />
                </div>
                <div className="flex flex-row gap-2">
                  <Button
                    onClick={() => navigate("/hod/admission-import")}
                    className="inline-flex self-center"
                    variant="outlined"
                    color="white"
                    size="sm"
                  >
                    <i className="fas fa-download self-center pr-1" />
                    Import
                  </Button>
                  <Button
                    onClick={() => {
                      prepareForDownload()
                    }}
                    className="inline-flex self-center"
                    variant="outlined"
                    color="white"
                    size="sm"
                  >
                    <i className="fas fa-file self-center pr-1" />
                    Export
                  </Button>
                  <Button
                    onClick={() => navigate("/hod/add-admission")}
                    className="inline-flex self-center"
                    variant="outlined"
                    color="white"
                    size="sm"
                  >
                    <i className="fas fa-arrow-left self-center pr-1" />
                    Back
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
          <div className="w-full mt-2 mb-4 p-2 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <Typography className="font-semibold mb-2">
                Select Board, Standard, Medium <span className="text-red-500">*</span>
              </Typography>
              <AsyncSelect
                isMulti
                isClearable
                cacheOptions
                defaultOptions={boardData}
                placeholder="Search Board/Standard/Medium..."
                value={boardValue}
                onChange={(newValue) => {
                  setSubjectValue([])
                  setSubjectData([])
                  setBoardValue(newValue)
                }}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <Typography className="font-semibold mb-2">
                Select Sets <span className="text-red-500">*</span>
              </Typography>
              <AsyncSelect
                isMulti
                isClearable
                cacheOptions
                defaultOptions={setData}
                placeholder="Search Sets..."
                value={setValue}
                onChange={(newValue) => setSetValue(newValue)}
              />
            </div>
            <div className="flex flex-col justify-end">
              <Typography className="text-center md:text-start font-semibold mb-2">Admission Date Range</Typography>
              <AsyncSelect
                isClearable
                cacheOptions
                defaultOptions={[
                  { value: "all", label: "All" },
                  { value: "today", label: "Today" },
                  { value: "yesterday", label: "Yesterday" },
                  { value: "last_week", label: "Last Week" },
                  { value: "last_month", label: "Last Month" },
                  { value: "custom", label: "Custom" },
                ]}
                value={
                  dateFilter
                    ? {
                      value: dateFilter,
                      label: dateFilter
                        .replace("_", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase()),
                    }
                    : null
                }
                onChange={(selected) => {
                  const value = selected ? selected.value : "all";
                  setDateFilter(value);
                }}
                className="mb-1"
              />
              {dateFilter === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="w-full flex flex-col">
                    <label htmlFor="dob" className="text-sm mb-0.5 ms-1 font-medium text-gray-700">
                      From Date
                    </label>
                    <DatePicker
                      label="From Date"
                      selected={fromDate}
                      onChange={(date) => {
                        if (!date) return;
                        const localDate = date.toLocaleDateString('en-CA');
                        setFromDate(localDate);
                      }}
                      showMonthDropdown
                      showYearDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={100}
                      minDate={dayjs("1950-01-01").toDate()}
                      popperPlacement="bottom-start"
                      popperModifiers={[
                        {
                          name: "preventOverflow",
                          options: {
                            boundary: "viewport",
                          },
                        },
                      ]}
                      dateFormat="dd-MM-yy"
                      placeholderText="dd-mm-yy"
                      className="w-full border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-full flex flex-col">
                    <label htmlFor="dob" className="text-sm mb-0.5 ms-1 font-medium text-gray-700">
                      To Date
                    </label>
                    <DatePicker
                      label="To Date"
                      selected={toDate}
                      onChange={(date) => {
                        if (!date) return;
                        const localDate = date.toLocaleDateString('en-CA');
                        setToDate(localDate);
                      }}
                      showMonthDropdown
                      showYearDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={100}
                      minDate={dayjs("1950-01-01").toDate()}
                      popperPlacement="bottom-start"
                      popperModifiers={[
                        {
                          name: "preventOverflow",
                          options: {
                            boundary: "viewport",
                          },
                        },
                      ]}
                      dateFormat="dd-MM-yy"
                      placeholderText="dd-mm-yy"
                      className="w-full border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="col-span-2 md:col-span-1">
              <Typography className="font-semibold mb-2">
                Select Subjects 
              </Typography>
              <AsyncSelect
                isMulti
                isClearable
                cacheOptions
                defaultOptions={subjectData}
                loadOptions={loadSubjects}
                placeholder="Search Subjects..."
                value={subjectValue}
                onChange={(newValue) => {
                  setSubjectValue(newValue)
                }}
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
                    key="actions"
                    columnName="actions"
                    text="Actions"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                    isCheckBox={true}
                    checked={allChecked}
                    onChange={handleMultiCheck}
                    isIcon={tableData.some(i => i.checked === true)}
                    icon={'fas fa-trash'}
                    iconHandler={()=>setMultiWarn(true)}
                    isExport={tableData.some(i => i.checked === true)}
                    exportIcon={'fas fa-download'}
                    exportHandler={() => exportSelected()}
                  />
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
                    key="rollNo"
                    columnName="rollNo"
                    text="Roll_No"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="fullName"
                    columnName="firstName"
                    text="Full_Name"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
                    orderDirection={tableProp.orderDirection}
                  />
                  <TableHeaderCell
                    key="conditionName"
                    columnName="conditionName"
                    text="Board/Standard/Medium"
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
                    key="admissionDate"
                    columnName="admissionDate"
                    text="Admission_Date"
                    orderBy={tableProp.orderBy}
                    handleOrderBy={handleOrderBy}
                    isOrderByAvailable={true}
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
                        <Tooltip content="view details" className="p-1 text-xs">
                          <input type="checkbox" className="cursor-pointer" checked={rowObj?.checked} onChange={()=>handleCheck(rowObj.id, rowObj?.checked ? false : true)} />
                        </Tooltip>
                        <Tooltip content="view details" className="p-1 text-xs">
                          <button
                            onClick={() => handleView(rowObj)}
                          >
                            <i className="fas fa-eye text-base font-semibold text-green-600"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="edit" className="p-1 text-xs">
                          <Link to={`/hod/edit-student/${rowObj.id}`}>
                            <i className="fas fa-pen-to-square text-base font-semibold text-blue-600"></i>
                          </Link>
                        </Tooltip>
                        <TableStatusButton
                          changeStatus={changeStatus}
                          rowObj={rowObj}
                        />
                        <Tooltip content="delete">
                          <Typography as="button" className="text-red-500" onClick={() => handleOpenWarn(rowObj.id)}>
                            <i className="fas fa-trash"></i>
                          </Typography>
                        </Tooltip>
                      </div>
                    </td>
                    <td className="items-center border-b border-blue-gray-50 px-2 py-2">
                      <div className="flex flex-row gap-3">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {index + 1}.
                        </Typography>
                      </div>
                    </td>
                    <td onClick={() => navigate(`/hod/edit-student/${rowObj.id}`)} className="items-center hover:cursor-pointer border-b border-blue-gray-50 px-2 py-2">
                      <div className="flex flex-row gap-3">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {rowObj?.rollNo || ""}
                        </Typography>
                      </div>
                    </td>
                    <td onClick={() => navigate(`/hod/edit-student/${rowObj.id}`)} className="items-center hover:cursor-pointer border-b border-blue-gray-50 px-2 py-2">
                      <div className="flex flex-row gap-3">
                        <Typography className="text-xs font-semibold text-blue-gray-600">
                          {rowObj?.fullName || ""}
                        </Typography>
                      </div>
                    </td>
                    <TableCell text={rowObj?.conditionName || "--"} />
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
                    <TableCell text={rowObj?.admissionDate || "--"} />
                    {/* <TableCell
                                            text={<ShowDateTime timestamp={rowObj.createdAt} />}
                                        />
                                        <TableCell
                                          text={<ShowDateTime timestamp={rowObj.updatedAt} />}
                                        /> */}
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
      <Suspense fallback={<div></div>}>
        <View
          open={isViewOpen}
          handleClose={() => setIsViewOpen(false)}
          studentData={studentData}
          setStudentData={setStudentData}
        />
        <OtpDialog
          open={isOtpOpen}
          handleClose={() => setIsOtpOpen(false)}
          name={"Student List"}
          prepareForDownload={prepareForDownload}
        />
      </Suspense>

      {/* -----------deletion-dialog-------------------- */}
      <Dialog
        className="z-40"
        handler={closeWarn}
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
            <Typography className="text-center">Are your sure you want to delete this student record? Once deleted, student cannot be recovered.</Typography>
          </div>
        </DialogBody>
        <DialogFooter className="bg-gray-100 sticky bottom-0 z-10">
          <CancelButton onClick={closeWarn} />
          <SubmitButton onClick={deleteStudent} title="Yes, Proceed" />
        </DialogFooter>
      </Dialog>

      <Dialog
        className="z-40"
        handler={()=>setMultiWarn(false)}
        open={multiWarn}
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
            <Typography className="text-center">Are your sure you want to delete these selected student record? Once deleted, student cannot be recovered.</Typography>
            <Typography className="text-center font-bold text-blue-600 my-1">Selected Students:{tableData.filter(i => i.checked).length} </Typography>
          </div>
        </DialogBody>
        <DialogFooter className="bg-gray-100 sticky bottom-0 z-10">
          <CancelButton onClick={()=>setMultiWarn(false)} />
          <SubmitButton disabled={isDeleting} onClick={handleDeleteSelected} title={isDeleting ? 'Please Wait.....' : 'Yes, Proceed'} />
        </DialogFooter>
      </Dialog>
    </div>
  )

}