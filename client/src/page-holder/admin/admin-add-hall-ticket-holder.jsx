import React, { Suspense, useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  Checkbox,
  Input,
} from "@material-tailwind/react";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import { useMaterialTailwindController } from "@/context/index.jsx";
import {
  TableCell,
  TableHeaderCell,
  TablePagination,
} from "@/widgets/components";
import OtpDialog from "@/page-sections/otp-dialog";
import { useUser } from "@/context/user";

export default function AdminAddHallTicketHolder() {
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;
  const { user } = useContext(useUser)

  const [conditionData, setConditionData] = useState([]);
  const [conditionValue, setConditionValue] = useState(null);
  const [examSessionOptions, setExamSessionOptions] = useState([]);
  const [examSessionValue, setExamSessionValue] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false)

  const [tableProp, setTableProp] = useState({
    perPage: 10,
    totalPages: 1,
    currentPage: 1,
    from: 0,
    to: 0,
    totalRecords: 0,
    orderBy: "rollNo",
    orderDirection: "ASC",
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  useEffect(() => {
    document.title = "Hall Ticket Generator";
    fetchConditions();
  }, []);

  const fetchConditions = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllBoardSubjectConditionData`
      );
      setConditionData(res.data.conditionData || []);
    } catch {
      toast.error("Failed to load board/standard data");
    }
  };

  const loadConditions = async (inputValue) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getBoardSubjectConditionDataForSelect?word=${inputValue}`
      );
      return res.data.conditionData || [];
    } catch {
      return [];
    }
  };

  const fetchExamSessions = async (conditionId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getExamSessionsByCondition`,
        { params: { conditionId } }
      );
      setExamSessionOptions(res.data.sessionData || []);
    } catch {
      setExamSessionOptions([]);
    }
  };

  // ✅ Fetch Students
  const fetchStudents = async () => {
    if (!conditionValue) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentsForHallTicket`,
        {
          params: {
            conditionId: conditionValue.value,
            examSessionId: examSessionValue?.value || "",
            page: tableProp.currentPage,
            perPage: perPage,
            orderBy: tableProp.orderBy,
            orderDirection: tableProp.orderDirection,
            search,
          },
        }
      );

      const { students, totalRecords, totalPages, from, to } = res.data;

      setStudents(students || []);
      // setSelectedStudents([]);
      setTableProp((prev) => ({
        ...prev,
        totalRecords,
        totalPages,
        from,
        to,
      }));
    } catch (err) {
      setStudents([]);
      // toast.error("No students found for selected filters");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (conditionValue) fetchStudents();
  }, [
    conditionValue,
    examSessionValue,
    tableProp.currentPage,
    tableProp.orderBy,
    tableProp.orderDirection,
    tableProp.perPage,
    perPage

  ]);


  useEffect(() => {
    const timeout = setTimeout(() => {
      if (conditionValue) fetchStudents();
    }, 500);
    return () => clearTimeout(timeout);
  }, [search, perPage]);

  const handleConditionSelect = (val) => {
    setConditionValue(val);
    setExamSessionValue(null);
    setStudents([]);
    if (val) fetchExamSessions(val.value);
  };

  const handleSelectAll = (checked) => {
    if (checked) setSelectedStudents(students.map((s) => s.id));
    else setSelectedStudents([]);
  };

  const handleStudentSelect = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter((sid) => sid !== id)
        : [...prev, id]
    );
  };
const handleGenerateHallTicket = async (selectedOnly = false) => {
  if (!conditionValue)
    return toast.warn("Please select Board and Exam");

  setIsGenerating(true);

  try {
    let payload = {
      examSessionsTblId: examSessionValue?.value || null,
      boardSubjectConditionsId: conditionValue?.value || null,
    };

    // 🔥 Print Selected
    if (selectedOnly) {
      if (selectedStudents.length === 0) {
        toast.warn("No students selected");
        return;
      }
      payload.studentIds = selectedStudents;
    } else {
      // 🔥 Print All — IMPORTANT
      payload.studentIds = "all"; // 👈 sending "all"
    }

    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/superAdminApi/generateHallTicket`,
      payload,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "hall-tickets.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast.success("Hall tickets downloaded successfully!");
  } catch (err) {
    console.error(err);
    toast.error("Failed to generate hall tickets");
  } finally {
    setIsGenerating(false);
  }
};



  const handleOrderBy = (columnName) => {
    setTableProp((prev) => ({
      ...prev,
      orderBy: columnName,
      orderDirection: prev.orderDirection === "ASC" ? "DESC" : "ASC",
    }));
  };

  const handlePageChange = (newPage) => {
    setTableProp((prev) => ({ ...prev, currentPage: newPage }));
  };

  return (
    <div>
      <Card className="animate-fade-in transform shadow-lg">
        <CardHeader color={sidenavColor} className="mb-4 mt-5 p-3">
          <Typography variant="h6" color="white">
            Hall Ticket Management
          </Typography>
        </CardHeader>

        <CardBody className="px-2 py-4 md:px-6 min-h-[300px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Typography className="font-semibold mb-2">
                Select Board / Standard
              </Typography>
              <AsyncSelect
                isClearable
                cacheOptions
                defaultOptions={conditionData}
                loadOptions={loadConditions}
                placeholder="Search Board / Standard..."
                value={conditionValue}
                onChange={handleConditionSelect}
              />
            </div>

            <div>
              <Typography className="font-semibold mb-2">Search Student</Typography>
              <Input
                label="Search by Name or Roll No"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          {/* Table */}
          {students.length > 0 ? (
            <>
              <div className="rounded-lg border overflow-hidden shadow-sm mt-5">
                <div className="bg-white px-4 py-3 border-b flex items-center justify-between ">
                  <div>
                    <Typography variant="h6" className="text-gray-800">
                      Students List
                    </Typography>

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

                <div className="overflow-x-auto bg-white mt-6 rounded-lg shadow">
                  <table className="min-w-full divide-y">
                    <thead className="text-white " style={{ backgroundColor: sidenavColor }}>
                      <tr className="text-sm text-white uppercase font-semibold">
                        <th className="px-4 py-3 text-center">
                          <Checkbox
                            checked={selectedStudents.length === students.length && students.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                          />
                        </th>
                        <th className="px-4 py-3 text-left">Sr No</th>
                        <th className="px-4 py-3 text-left cursor-pointer" onClick={() => handleOrderBy("rollNo")}>
                          <div className="flex items-center">
                            <span>Roll No</span>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left">Student Name</th>
                        <th className="px-4 py-3 text-left">Gender</th>
                        <th className="px-4 py-3 text-left">DOB</th>
                        <th className="px-4 py-3 text-left">Board / Standard / Medium</th>
                        <th className="px-4 py-3 text-left">Set</th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y">
                      {students.length === 0 && !loading ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-sm text-red-500">
                            No students found.
                          </td>
                        </tr>
                      ) : (
                        students.map((s, idx) => (
                          <tr key={s.id} className="hover:bg-sky-50">
                            <td className="px-4 py-3 text-center">
                              <Checkbox
                                checked={selectedStudents.includes(s.id)}
                                onChange={() => handleStudentSelect(s.id)}
                              />
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-700">
                              {(tableProp.from || 0) + idx}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{s.rollNo || "--"}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {[s.firstName, s.fatherName, s.surname].filter(Boolean).join(" ") || "--"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {s.gender === "M" ? "Male" : s.gender === "F" ? "Female" : "--"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {s.dob
                                ? new Date(s.dob)
                                  .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
                                  .replace(/\//g, "-")
                                : "--"}
                            </td>

                            <td className="px-4 py-3 text-sm text-gray-700">
                              {[s.className, s.boardName, s.mediumName].filter(Boolean).join("   ") || "--"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{s.setName || "--"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Pagination (like Fees module) */}
                <div className="bg-white px-4 py-3 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      color="blue"
                      variant="outlined"
                      onClick={() => handlePageChange(1)}
                      disabled={tableProp.currentPage === 1}
                    >
                      {"<<"}
                    </Button>
                    <Button
                      size="sm"
                      color="blue"
                      variant="outlined"
                      onClick={() => handlePageChange(tableProp.currentPage - 1)}
                      disabled={tableProp.currentPage === 1}
                    >
                      Prev
                    </Button>

                    <div className="px-3">
                      <span className="text-sm text-gray-700">
                        Page <strong>{tableProp.currentPage}</strong> of {tableProp.totalPages}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      color="blue"
                      variant="outlined"
                      onClick={() => handlePageChange(tableProp.currentPage + 1)}
                      disabled={tableProp.currentPage === tableProp.totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      size="sm"
                      color="blue"
                      variant="outlined"
                      onClick={() => handlePageChange(tableProp.totalPages)}
                      disabled={tableProp.currentPage === tableProp.totalPages}
                    >
                      {">>"}
                    </Button>
                  </div>

                  <div className="text-sm text-gray-600">
                    {tableProp.totalRecords} records
                  </div>
                </div>


                {/* Pagination */}
              </div>
            </>
          ) : (
            !loading && (
              <Typography className="text-center mt-10 text-gray-500">
                No students found. Please select a board and exam.
              </Typography>
            )
          )}

        </CardBody>

        {students.length > 0 && (
          <CardFooter className="flex justify-center gap-4">
            <Button color="green" onClick={() => handleGenerateHallTicket(false)} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Print All"}
            </Button>
            <Button
              color="amber"
              onClick={() => {
                  handleGenerateHallTicket(true)
              }}
              disabled={isGenerating || selectedStudents.length === 0}
            >
              {isGenerating ? "Generating..." : "Print Selected"}
            </Button>
          </CardFooter>
        )}
      </Card>
      <Suspense fallback={<div></div>} >
        <OtpDialog
          open={isOtpOpen}
          handleClose={() => setIsOtpOpen(false)}
          name={"Student Hall Ticket"}
          prepareForDownload={handleGenerateHallTicket}
        />
      </Suspense>
    </div>
  );
}
