import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
} from "@material-tailwind/react";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import { TableCell } from "@/widgets/components"; // keep using your TableCell
import { useMaterialTailwindController } from "@/context/index.jsx";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from "date-fns";
import dayjs from "dayjs";

export default function AdminAddStudentFeesHolder() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;

  // Existing states
  const [conditionData, setConditionData] = useState([]);
  const [conditionValues, setConditionValues] = useState([]);
  const [students, setStudents] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState({
    totalFees: 0,
    totalPaid: 0,
    totalRemaining: 0,
  });
  // New / enhanced states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [installmentErr, setInstallmentErr] = useState(false);
  const [instalErrMsg, setInstalErrMsg] = useState("");
  // Sorting
  const [orderBy, setOrderBy] = useState("id");
  const [orderDirection, setOrderDirection] = useState("DESC");
  const [instalErrColor, setInstalErrColor] = useState("");
  // keep ref for debounce timer
  const debounceRef = useRef(null);

  // mount
  useEffect(() => {
    document.title = "Student Fees Management";
    fetchConditions();
  }, []);

  // fetch when dependencies change
  useEffect(() => {
    // debounce search locally before requesting backend
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1); // reset page on search change
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  useEffect(() => {
    fetchStudents(conditionValues.length > 0 || dateFilter !== "all" || debouncedSearch ? true : false);
  }, [page, perPage, orderBy, orderDirection]);
  // -------------------------
  // Fetch helpers
  // -------------------------
  const fetchConditions = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllBoardSubjectConditionData`
      );
      let data = res.data.conditionData || [];
      data.sort((a, b) => {
        const numA = parseInt(a.label.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.label.match(/\d+/)?.[0] || 0);
        return numA - numB;
      });
      setConditionData(data);
    } catch (err) {
      toast.error("Failed to load board/standard data");
      console.error(err);
    }
  };
  // Update Due Date
  const handleDueDateChange = (id, date) => {
    setSelectedStudent(prev => {
      if (!prev) return prev;
      const updatedInstallments = prev.installments.map(inst =>
        inst.id === id ? { ...inst, dueDate: date } : { ...inst }
      );
      return { ...prev, installments: updatedInstallments };
    });
  };


  // Add new installment
  const handleAddInstallment = () => {
    setSelectedStudent((prev) => {
      if (!prev) return prev;

      const newInstallment = {
        id: Date.now(),
        amount: 0,
        paidAmount: 0,
        dueDate: "",
        paidStatus: 1,
      };
      const updatedInstallments = [...prev.installments, newInstallment];

      const { installmentErr, instalErrMsg, instalErrColor, remaining } =
        recalcInstallments(updatedInstallments, prev.bookingAmount, prev.totalFees, prev.discount);

      setInstallmentErr(installmentErr);
      setInstalErrMsg(instalErrMsg);
      setInstalErrColor(instalErrColor);

      return {
        ...prev,
        installments: updatedInstallments,
        feesRemaining: remaining,
      };
    });
  };

  const handleDeleteInstallment = (id) => {
    setSelectedStudent((prev) => {
      if (!prev) return prev;

      const updatedInstallments = prev.installments.filter((i) => i.id !== id);

      const { installmentErr, instalErrMsg, instalErrColor, remaining } =
        recalcInstallments(updatedInstallments, prev.bookingAmount, prev.totalFees, prev.discount);

      setInstallmentErr(installmentErr);
      setInstalErrMsg(instalErrMsg);
      setInstalErrColor(instalErrColor);

      return {
        ...prev,
        installments: updatedInstallments,
        feesRemaining: remaining,
      };
    });
  };


  const loadConditions = async (inputValue) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getBoardSubjectConditionDataForSelect?word=${inputValue}`
      );
      let data = res.data.conditionData || [];
      data.sort((a, b) => {
        const numA = parseInt(a.label.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.label.match(/\d+/)?.[0] || 0);
        return numA - numB;
      });
      return data;
    } catch {
      return [];
    }
  };

  // -------------------------
  // Main students fetch (pagination + sorting + search)
  // -------------------------
  // 🔹 Updated fetchStudents (controlled by isFiltered flag)
  const fetchStudents = async (isFiltered = false) => {
    try {
      setLoading(true);

      const params = isFiltered
        ? {
          conditionIds: conditionValues.map(c => c.value).join(","),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          dateFilter: dateFilter || "all",
          search: debouncedSearch || "",
          page,
          perPage,
          orderBy,
          orderDirection,
        }
        : {
          // when not filtered, fetch all
          page,
          perPage,
          orderBy,
          orderDirection,
        };

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentsWithPendingFees`,
        { params }
      );

      if (res.data) {
        const fetchedStudents = res.data.students || [];
        setStudents(fetchedStudents);
        setTotalPages(res.data.totalPages || 1);
        setTotalRecords(res.data.totalRecords || 0);

        if (res.data.globalTotals) {
          setSummary(res.data.globalTotals);
        } else {
          setSummary({ totalFees: 0, totalPaid: 0, totalRemaining: 0 });
        }
      } else {
        setStudents([]);
        setSummary({ totalFees: 0, totalPaid: 0, totalRemaining: 0 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch student list");
    } finally {
      setLoading(false);
    }
  };


  // -------------------------
  // Sorting handler
  // -------------------------
  const handleSort = (column) => {
    if (orderBy === column) {
      // toggle direction
      setOrderDirection((d) => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setOrderBy(column);
      setOrderDirection("ASC");
    }
    // when sort changes, reset page to 1
    setPage(1);
  };

  const sortIcon = (col) => {
    if (orderBy !== col) return <i className="fa-solid fa-arrows-up-down text-gray-400 ml-2" />;
    if (orderDirection === "ASC") return <i className="fa-solid fa-arrow-up text-blue-600 ml-2" />;
    return <i className="fa-solid fa-arrow-down text-blue-600 ml-2" />;
  };

  // -------------------------
  // Installments / dialog logic (unchanged)
  // -------------------------
  const openDialog = async (student) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentInstallments`,
        { params: { studentId: student.id } }
      );

      const data = res.data.student;
      const installments = data.installments || [];

      setSelectedStudent({
        ...student,
        name: data.name,
        totalFees: Number(data.totalFees) || 0,
        feesPaid: Number(data.paidFees) || 0,
        studentMobileNo: data.studentMobileNo || "",
        fatherMobileNo: data.fatherMobile || "",
        motherMobileNo: data.motherMobile || "",
        bookingAmount: Number(data.bookingAmount) || 0,
        installments: installments.map((i) => ({
          ...i,
          amount: Number(i.amount),
          paidAmount: Number(i.paidAmount),
          status: i.paidStatus === 2 ? "Paid" : "Pending",
          isEditable: false
        })),
      });

      setIsDialogOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load installment details");
    }
  };

  const fetchInstallments = async (id) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentInstallments`,
        { params: { studentId: id } }
      );

      const data = res.data.student;
      const installments = data.installments || [];

      setSelectedStudent({
        ...data, // spread existing student props (rollNo, paymentType, standard, board, etc.)
        totalFees: Number(data.totalFees) || 0,
        feesPaid: Number(data.paidFees) || 0,
        studentMobileNo: data.studentMobileNo || "",
        fatherMobileNo: data.fatherMobile || "",
        motherMobileNo: data.motherMobile || "",
        bookingAmount: Number(data.bookingAmount) || 0,
        installments: installments.map((i) => ({
          ...i,
          amount: Number(i.amount),
          paidAmount: Number(i.paidAmount),
          status: i.paidStatus === 2 ? "Paid" : "Pending",
          isEditable: false,
        })),
      });

    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh installment details");
    }
  };

  const handleEditInstallmentChange = (id) => {
    setSelectedStudent(prev => {
      if (!prev) return prev;
      const updatedInstallments = prev.installments.map(inst =>
        inst.id === id ? { ...inst, isEditable: true } : inst
      );
      return { ...prev, installments: updatedInstallments };
    });
  }
  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleInstallmentChange = (id, isChecked) => {
    setSelectedStudent((prev) => {
      if (!prev) return prev;

      const updatedInstallments = prev.installments.map((inst) => {
        if (inst.id === id) {
          const newPaidAmount = isChecked ? Number(inst.amount || 0) : 0;
          return { ...inst, paidAmount: newPaidAmount };
        }
        return inst;
      });

      return { ...prev, installments: updatedInstallments };
    });
  };

  const calculateTotals = (installments = []) => {
    const total = installments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const paid = installments.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
    const remaining = total - paid;
    return { total, paid, remaining };
  };

  const handleSaveChanges = async () => {
    if (!selectedStudent) return;

    // ---------------------------
    // 1️⃣ Validation
    // ---------------------------
    for (let i = 0; i < selectedStudent.installments.length; i++) {
      const inst = selectedStudent.installments[i];

      // a) Due date cannot be empty
      if (!inst.dueDate) {
        toast.error(`Due date cannot be empty for installment #${i + 1}`);
        return;
      }

      // b) Paid amount must match installment amount if entered
      const paid = Number(inst.paidAmount || 0);
      const amount = Number(inst.amount || 0);
      if (paid > 0 && paid !== amount) {
        toast.error(`Paid amount must match installment amount for installment #${i + 1}`);
        return;
      }
    }

    // ---------------------------
    // 2️⃣ Prepare payload for backend
    // ---------------------------
    const updatedData = {
      studentId: selectedStudent.id,
      installments: selectedStudent.installments.map((i) => ({
        id: i.id,
        amount: Number(i.amount || 0),
        paidAmount: Number(i.paidAmount || 0),
        dueDate: i.dueDate,
        paymentDate: i.paymentDate || null,
      })),
    };

    console.table(updatedData.installments);

    // ---------------------------
    // 3️⃣ API call
    // ---------------------------
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/updateStudentInstallments`,
        updatedData
      );

      if (res.data.success) {
        toast.success("✅ Fees updated successfully!");

        // ---------------------------
        // 4️⃣ Refresh data
        // ---------------------------
        await fetchStudents(); // refresh main table
        await fetchInstallments(selectedStudent.id); // refresh dialog data

        // Update students list state for totals
        const updatedStudent = res.data.updatedStudent;
        setStudents((prev) =>
          prev.map((s) =>
            s.id === selectedStudent.id
              ? {
                ...s,
                feesPaid: updatedStudent.feesPaid,
                feesRemaining: updatedStudent.feesRemaining,
              }
              : s
          )
        );
      } else {
        toast.error("❌ " + res.data.message);
      }
    } catch (err) {
      toast.error("❌ Something went wrong while updating fees.");
      console.error(err);
    }
  };



  const handleAmountChange = (id, value) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) return;

    setSelectedStudent((prev) => {
      if (!prev) return prev;

      const updatedInstallments = prev.installments.map((inst) => {
        if (inst.id === id) {
          let newPaidAmount = inst.paidStatus === 2 ? numValue : inst.paidAmount || 0; // if paid, match new amount
          return { ...inst, amount: numValue, paidAmount: newPaidAmount };
        }
        return inst;
      });

      // Recalculate totals and error flags
      const { installmentErr, instalErrMsg, instalErrColor, remaining } =
        recalcInstallments(updatedInstallments, prev.bookingAmount, prev.totalFees, prev.discount);

      setInstallmentErr(installmentErr);
      setInstalErrMsg(instalErrMsg);
      setInstalErrColor(instalErrColor);

      return {
        ...prev,
        installments: updatedInstallments,
        feesRemaining: remaining,
      };
    });
  };

  const handleRefresh = () => {
    setConditionValues([]);
    setStartDate("");
    setEndDate("");
    setDateFilter("all");
    setSearchTerm("");
    setPage(1);

    // slight delay ensures reset before refetch
    setTimeout(() => fetchStudents(false), 100);
  };

  const recalcInstallments = (installments, bookingAmount, totalFees, discount = 0) => {
    // Calculate total installments
    const totalInstallments = installments.reduce(
      (sum, i) => sum + (Number(i.amount) || 0),
      0
    );

    const totalCalculated = totalInstallments + Number(bookingAmount || 0);
    const finalTotalFees = Math.max(0, Number(totalFees || 0) - Number(discount || 0));

    let installmentErr = false;
    let instalErrMsg = "";
    let instalErrColor = "";

    if (totalCalculated < finalTotalFees) {
      installmentErr = true;
      instalErrMsg = `Installment Amount Less than Final Fees by ₹${(
        finalTotalFees - totalCalculated
      ).toLocaleString()}`;
      instalErrColor = "red";
    } else if (totalCalculated > finalTotalFees) {
      installmentErr = true;
      instalErrMsg = `Installment Amount More than Final Fees by ₹${(
        totalCalculated - finalTotalFees
      ).toLocaleString()}`;
      instalErrColor = "red";
    }

    // Remaining fees
    const totalPaid = installments.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
    const remaining = Math.max(0, finalTotalFees - totalPaid - Number(bookingAmount || 0));

    return {
      installmentErr,
      instalErrMsg,
      instalErrColor,
      remaining,
    };
  };

  // -------------------------
  // Pagination helpers
  // -------------------------
  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <Card>
      <CardHeader color={sidenavColor} className="mb-4 mt-5 p-3">
        <Typography variant="h6" color="white">
          Student Fees Management
        </Typography>
      </CardHeader>

      <CardBody>
        {/* Filters top */}
        {/* 🔹 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm text-center">
            <Typography variant="small" className="text-blue-800 font-semibold">
              Total Fees
            </Typography>
            <Typography variant="h6" className="text-blue-700 font-bold">
              ₹{summary.totalFees.toLocaleString()}
            </Typography>
          </div>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg shadow-sm text-center">
            <Typography variant="small" className="text-green-800 font-semibold">
              Total Paid
            </Typography>
            <Typography variant="h6" className="text-green-700 font-bold">
              ₹{summary.totalPaid.toLocaleString()}
            </Typography>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 rounded-lg shadow-sm text-center">
            <Typography variant="small" className="text-red-800 font-semibold">
              Total Remaining
            </Typography>
            <Typography variant="h6" className="text-red-700 font-bold">
              ₹{summary.totalRemaining.toLocaleString()}
            </Typography>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 🔹 Board / Standard Selection */}
          <div className="col-span-2 md:col-span-1 relative z-[9999]">
            <Typography className="font-semibold mb-2">
              Select Board, Standard, Medium <span className="text-red-500">*</span>
            </Typography>
            <AsyncSelect
              isMulti
              isClearable
              cacheOptions
              defaultOptions={conditionData}
              loadOptions={loadConditions}
              placeholder="Search Board / Standard..."
              value={conditionValues}
              onChange={setConditionValues}
            />
          </div>

          {/* 🔹 Date Filter */}
          <div className="relative z-[9999]">
            <Typography className="font-semibold mb-2 ">Date Filter</Typography>

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
                setPage(1);
                if (value !== "custom") {
                  setStartDate("");
                  setEndDate("");
                }
              }}
            />



          </div>

          {/* 🔹 Right-side Controls (Refresh + Search) */}
          <div className>
            <Typography className="font-semibold mb-2">Search BY Name/Roll No</Typography>

            <Input
              label="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              color="blue"
            />
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* 🔹 Board / Standard Selection */}
          <div>

          </div>

          {/* 🔹 Date Filter */}
          <div>

            <div className="flex flex-wrap gap-2 items-center">
              {dateFilter === "custom" && (
                <div className="flex items-center gap-3 mt-2 relative z-[9999]">
                  <div className="flex flex-col">

                    <label className="text-sm text-gray-700 dark:text-white">From Date</label>
                    <DatePicker
                      selected={startDate ? new Date(startDate) : null}
                      onChange={(date) => {
                        setStartDate(date.toISOString().split("T")[0]);
                        setPage(1);
                      }}
                      dateFormat="dd-MM-yyyy"
                      showMonthDropdown
                      showYearDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={100}
                      minDate={dayjs("1950-01-01").toDate()}
                      placeholderText="dd-mm-yyyy"
                      className="w-40 border border-gray-300 rounded-md p-2 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm text-gray-700 dark:text-white">To Date</label>
                    <DatePicker
                      selected={endDate ? new Date(endDate) : null}
                      onChange={(date) => {
                        setEndDate(date.toISOString().split("T")[0]);
                        setPage(1);
                      }}
                      showMonthDropdown
                      showYearDropdown
                      scrollableYearDropdown
                      yearDropdownItemNumber={100}
                      minDate={dayjs("1950-01-01").toDate()}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="dd-mm-yyyy"
                      className="w-40 border border-gray-300 rounded-md p-2 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* 🔹 Right-side Controls (Refresh + Search) */}
          <div className="flex flex-col justify-end gap-3 mt-2">
            <div className="flex gap-2 justify-end">
              <Button
                color="blue"
                onClick={() => {

                  setPage(1);
                  fetchStudents(true);
                }}
              >
                <i className="fas fa-filter self-center pr-1" />
                Apply Filter
              </Button>
              <Button color="blue" onClick={handleRefresh}>
                Refresh
              </Button>


            </div>






          </div>
        </div>

        {/* Table */}
        <div className="mt-16">
          <div className=" grid rounded-lg border overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b flex items-center justify-between">
              <div>
                <Typography variant="h6" className="text-gray-800">
                  Students List
                </Typography>
                <div className="text-sm text-gray-500 mt-1">
                  {loading ? "Loading..." : `${totalRecords} record(s) — Page ${page} of ${totalPages}`}
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <div className="text-sm text-gray-600">Rows:</div>
                <select
                  value={perPage}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                  className="border rounded-md px-2 py-1"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table body */}
            <div className="overflow-x-auto bg-white relative">
              <table className="min-w-full divide-y">
                <thead
                  className="text-white sticky top-0 z-20"
                  style={{ backgroundColor: "#f44336" }} // light red shade
                >
                  <tr className="text-sm text-white uppercase font-semibold">
                    <th className="px-4 py-3 text-center bg-[#f44336] sticky left-0 z-30">Action</th>
                    <th className="px-4 py-3 text-left bg-[#f44336] sticky left-[70px] z-30">Sr.No</th>

                    <th
                      className="px-4 py-3 text-left bg-[#f44336] sticky left-[140px] z-30 cursor-pointer select-none"
                      onClick={() => handleSort("rollNo")}
                    >
                      <div className="flex items-center">
                        <span>Roll No</span>
                        {sortIcon("rollNo")}
                      </div>
                    </th>

                    <th className="px-4 py-3 text-left cursor-pointer select-none">
                      <div className="flex items-center">
                        <span>Student Name</span>
                      </div>
                    </th>

                    <th
                      className="px-4 py-3 text-left cursor-pointer select-none"
                      onClick={() => handleSort("board")}
                    >
                      <div className="flex items-center">
                        <span>Board/Standard</span>
                      </div>
                    </th>

                    <th
                      className="px-4 py-3 text-left cursor-pointer select-none"
                      onClick={() => handleSort("mobile")}
                    >
                      <div className="flex items-center">
                        <span>Mobile No</span>
                      </div>
                    </th>

                    <th
                      className="px-4 py-3 text-right cursor-pointer select-none"
                      onClick={() => handleSort("total")}
                    >
                      <div className="flex items-center justify-end">
                        <span>Total(₹)</span>
                      </div>
                    </th>

                    <th
                      className="px-4 py-3 text-right cursor-pointer select-none"
                      onClick={() => handleSort("feesPaid")}
                    >
                      <div className="flex items-center justify-end">
                        <span>Paid(₹)</span>
                      </div>
                    </th>

                    <th
                      className="px-4 py-3 text-right cursor-pointer select-none"
                      onClick={() => handleSort("feesRemaining")}
                    >
                      <div className="flex items-center justify-end">
                        <span>Remaining(₹)</span>
                      </div>
                    </th>

                    <th className="px-4 py-3 text-right cursor-pointer select-none">
                      <div className="flex items-center justify-end">
                        <span>Payment Type</span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y">
                  {students.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={10} className="py-6 text-center text-sm text-red-500">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    students.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-sky-50">
                        {/* ✅ Sticky Action column */}
                        <td className="px-4 py-3 text-center bg-white sticky left-0 z-20">
                          <Button size="sm" color="green" onClick={() => openDialog(s)}>
                            Edit
                          </Button>
                        </td>

                        {/* ✅ Sticky Sr.No */}
                        <td className="px-4 py-3 text-sm text-gray-700 bg-white sticky left-[70px] z-20">
                          {(page - 1) * perPage + idx + 1}
                        </td>

                        {/* ✅ Sticky Roll No */}
                        <td
                          className="px-4 py-3 text-sm font-semibold cursor-pointer hover:underline whitespace-nowrap bg-white sticky left-[140px] z-20"
                          onClick={() => openDialog(s)}
                        >
                          {s.rollNo || "--"}
                        </td>

                        <td
                          className="px-4 py-3 text-sm font-semibold cursor-pointer hover:underline whitespace-nowrap"
                          onClick={() => openDialog(s)}
                        >
                          {(s.firstName || "") +
                            " " +
                            (s.fatherName || "") +
                            " " +
                            (s.surname || "") || "--"}
                        </td>

                        <TableCell
                          text={[s.standard || "", s.board || "", s.medium || ""]
                            .filter(Boolean)
                            .join("  ") || "--"}
                        />
                        <TableCell text={s.fatherMobile || "--"} />
                        <td className="px-4 py-3 text-right text-sm text-blue-700 font-semibold">
                          ₹{Math.max(0, (Number(s.totalFees) || 0) - (Number(s.discount) || 0)).toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right text-sm text-green-700 font-semibold">
                          ₹{Number(s.feesPaid || 0).toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-right text-sm text-red-600 font-semibold">
                          ₹{Number(s.feesRemaining || 0).toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-center text-sm font-medium">
                          {s.paymentType === 2 ? (
                            <span className="text-gray-600 font-semibold">Installment</span>
                          ) : (
                            <span className="text-gray-600 font-semibold">One-Time</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>


            {/* Footer Pagination */}
            <div className="bg-white px-4 py-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  color="blue"
                  variant="outlined"
                  onClick={() => goToPage(1)}
                  disabled={page === 1}
                >
                  {"<<"}
                </Button>
                <Button
                  size="sm"
                  color="blue"
                  variant="outlined"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                >
                  Prev
                </Button>

                <div className="px-3">
                  <span className="text-sm text-gray-700">
                    Page{" "}
                    <strong>
                      {page}
                    </strong>{" "}
                    of {totalPages}
                  </span>
                </div>

                <Button
                  size="sm"
                  color="blue"
                  variant="outlined"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>

                <Button
                  size="sm"
                  color="blue"
                  variant="outlined"
                  onClick={() => goToPage(totalPages)}
                  disabled={page === totalPages}
                >
                  {">>"}
                </Button>
              </div>

              <div className="text-sm text-gray-600">
                {totalRecords} records
              </div>
            </div>
          </div>
        </div>
      </CardBody>

      {/* Dialog (unchanged structure) */}
      <Dialog open={isDialogOpen} size="xl" dismissOnClickOutside={false}
        dismissOnEsc={false} >
        <DialogHeader className="text-lg font-semibold text-blue-700">
          💳 Edit Student Fees
        </DialogHeader>

        <DialogBody
          divider
          className="max-h-[70vh] overflow-y-auto px-4"
        >
          {selectedStudent && (
            <>
              {/* Student Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <Typography><strong>Name:</strong> {selectedStudent.name}</Typography>
                <Typography><strong>Roll No:</strong> {selectedStudent.rollNo}</Typography>
                <Typography>
                  <strong>Board/Standard:</strong>{" "}
                  {`${selectedStudent.standard || ""}   ${selectedStudent.board || ""}   ${selectedStudent.medium || ""}`}
                </Typography>
                <Typography><strong>Student Mobile No:</strong> {selectedStudent.studentMobileNo}</Typography>
                <Typography><strong>Father's Mobile No:</strong> {selectedStudent.fatherMobileNo}</Typography>
                <Typography><strong>Mother's Mobile No:</strong> {selectedStudent.motherMobileNo}</Typography>
                <Typography><strong>Payment Type:</strong> {selectedStudent.paymentType === 2 ? "Installment" : "One-Time"}</Typography>
                <Typography><strong>Discount:</strong> ₹{selectedStudent.discount || 0}</Typography>
              </div>
              <div className="flex justify-center mt-4  mb-4 text-lg font-semibold">
                {(() => {
                  const totals = calculateTotals(selectedStudent.installments);
                  const booking = Number(selectedStudent.bookingAmount || 0);
                  const courseFee = Number(selectedStudent.totalFees || 0);
                  const discount = Number(selectedStudent.discount || 0);
                  const totalFees = Math.max(0, courseFee - discount);
                  const totalPaid = totals.paid + booking;
                  const remaining = Math.max(totalFees - totalPaid, 0);

                  return (
                    <div className="flex flex-col items-center gap-2 w-full">
                      {/* Top Row: Course Fee & Discount */}
                      <div className="flex flex-wrap justify-center space-x-6 text-base">
                        <span className="text-gray-700">
                          Course Fee: ₹{courseFee.toLocaleString()}
                        </span>
                        <span className="text-orange-600">
                          Discount: ₹{discount.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Bottom Row: Total, Paid, Remaining */}
                      <div className="flex flex-wrap justify-center space-x-6 text-lg">
                        <span className="text-blue-700 font-bold">
                          Total Fees: ₹{totalFees.toLocaleString()}
                        </span>
                        <span className="text-green-700 font-bold">
                          Paid Fees: ₹{totalPaid.toLocaleString()}
                        </span>
                        <span className="text-red-700 font-bold">
                          Remaining Fees: ₹{remaining.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              {/* Error Message */}
              {installmentErr && (
                <div
                  className={`mb-3 px-4 py-2 rounded-lg font-medium ${instalErrColor === "red"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                  {instalErrMsg}
                </div>
              )}

              {/* Installment Table */}
              {selectedStudent?.paymentType === 2 && (
                <div className="overflow-x-auto border rounded-lg mt-4">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-blue-100 text-blue-800 uppercase text-xs font-semibold">
                      <tr>
                        <th className="p-3 border">#</th>
                        <th className="p-3 border">Installment (₹)</th>
                        <th className="p-3 border">Paid (₹)</th>
                        <th className="p-3 border">Payment Date</th> {/* New Column */}
                        <th className="p-3 border">Due Date</th>
                        <th className="p-3 border">Status</th>
                        <th className="p-3 border text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.installments.map((inst, idx) => (
                        <tr
                          key={inst.id || idx}
                          className={`hover:bg-blue-50 ${inst.paidStatus === 2 ? "bg-green-50" : inst.paidStatus === 1 ? "bg-yellow-50" : ""
                            }`}
                        >
                          <td className="p-2 border text-center">{idx + 1}</td>

                          {/* Amount */}
                          {/* Amount */}
                          <td className="p-2 border">
                            {(inst.paidStatus === 2 && !inst.isEditable) ? (
                              <div className="w-28 text-green-700 font-semibold bg-green-100 text-center py-2 rounded">
                                ₹{Number(inst.amount).toLocaleString()}
                              </div>
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                value={inst.amount || ""}
                                onChange={(e) => handleAmountChange(inst.id, e.target.value)}
                                className="w-28"
                              />
                            )}
                          </td>


                          {/* Paid Amount */}
                          {/* Paid Amount */}
                          <td className="p-2 border text-center">
                            {inst.paidStatus === 2 && inst.paidAmount > 0 && !inst.isEditable ? (
                              <div className="w-28 text-green-700 font-semibold bg-green-100 text-center py-2 rounded">
                                ₹{Number(inst.paidAmount).toLocaleString()}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={Number(inst.paidAmount || 0) === Number(inst.amount || 0)}
                                  onChange={(e) => {
                                    const newValue = e.target.checked ? Number(inst.amount || 0) : 0;
                                    handleInstallmentChange(inst.id, newValue);
                                  }}
                                />
                                {/* <span>₹{Number(inst.paidAmount || 0)}</span> */}
                              </div>
                            )}
                          </td>


                          {/* Payment Date */}
                          <td className="p-2 border text-center">
                            {inst.paidStatus === 2 && inst.paymentDate
                              ? new Date(inst.paymentDate).toLocaleDateString("en-GB") // dd/mm/yyyy
                              : "--"}
                          </td>

                          {/* Due Date */}
                          <td className="p-2 border">
                            {(inst.paidStatus === 2 && !inst.isEditable) ? (
                              <div className="w-36 text-center">{inst.dueDate || "--"}</div>
                            ) : (
                              <DatePicker
                                selected={inst.dueDate ? new Date(inst.dueDate) : null}
                                onChange={(date) => handleDueDateChange(inst.id, format(date, "yyyy-MM-dd"))}
                                dateFormat="dd-MM-yyyy"
                                showMonthDropdown
                                showYearDropdown
                                scrollableYearDropdown
                                yearDropdownItemNumber={100}
                                minDate={dayjs("1950-01-01").toDate()}
                                className="w-36 border rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-400 outline-none"
                                placeholderText="Select date"
                              />
                            )}
                          </td>


                          {/* Status */}
                          <td className={`p-2 border font-semibold ${inst.paidStatus === 2 ? "text-green-600" : "text-orange-600"}`}>
                            {inst.paidStatus === 2 ? "Paid" : "Pending"}
                          </td>

                          {/* Delete */}
                          <td className="p-2 border text-center">
                            {inst.paidStatus === 2 && (
                              <Button
                                color="blue"
                                size="sm"
                                onClick={() => {
                                  // make the installment editable
                                  handleEditInstallmentChange(inst.id); // or any logic to toggle edit mode
                                }}
                              >
                                Edit
                              </Button>
                            )}

                            {inst.paidStatus !== 2 && (
                              <Button
                                color="red"
                                size="sm"
                                onClick={() => handleDeleteInstallment(inst.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>

                  {/* Add Installment Button */}
                  {selectedStudent.feesRemaining > 0 && (
                    <div className="flex justify-end p-3 bg-gray-50 border-t">
                      <Button color="blue" size="sm" onClick={handleAddInstallment}>
                        ➕ Add Installment
                      </Button>
                    </div>
                  )}
                </div>
              )}


              {/* Totals Section */}

            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            color="green"
            onClick={handleSaveChanges}
            disabled={installmentErr} // 🔹 disable when error exists
            className={installmentErr ? "opacity-50 cursor-not-allowed" : ""}
          >
            Save Changes
          </Button>
          <Button color="red" variant="outlined" onClick={closeDialog}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>

    </Card>
  );
}
