import { useMaterialTailwindController } from "@/context/index.jsx";
import { SubmitButton, TableCell, TableHeaderCell, TablePagination } from "@/widgets/components";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  Typography,
} from "@material-tailwind/react";
import axios from "axios";
import { Suspense, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import moment from "moment";
import * as XLSX from "xlsx";
import CSVLink from "react-csv/src/components/Link.jsx";
import ImportMarks from "@/page-sections/admin/marks/import-marks";

export default function AdminMarksEntryHolder() {

  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor } = controller;

  const [conditionData, setConditionData] = useState([]);
  const [conditionValue, setConditionValue] = useState(null);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [subjectValue, setSubjectValue] = useState(null);
  const [examSessionOptions, setExamSessionOptions] = useState([]);
  const [examSessionValue, setExamSessionValue] = useState(null);
  const [studentValue, setStudentValue] = useState([]);
  const [subjectArr, setSubjectArr] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [subjectMap, setSubjectMap] = useState([]);
  const [isPreparing, setIsPreparing] = useState(false);
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
  const [importMarks, setImportMarks] = useState(false);
  const [maxMarks, setMaxMarks] = useState([]);
  const [inserted, setInserted] = useState(null);
  const [updated, setUpdated] = useState(null);
  const [errors, setErrors] = useState([]);
  const [cellErrors, setCellErrors] = useState({});
  const [subjectsMap, setSubjectsMap] = useState({}); // label -> {id, outOfMarks}
  const [studentsMap, setStudentsMap] = useState({});
  const [subjectData, setSubjectData] = useState([])
  const [stuData, setStuData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Marks Entry';
    fetchConditions();
  }, []);

  useEffect(() => {
    if (conditionValue && examSessionValue) {
      fetchReferenceData(conditionValue?.value)
    }
  }, [conditionValue, examSessionValue])

  const fetchConditions = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllBoardSubjectConditionData`
      );
      setConditionData(res.data.conditionData || []);
    } catch (err) {
      console.error("Error fetching conditions:", err);
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

  const loadStudents = async (inputValue) => {
    if (!conditionValue || !examSessionValue) return []
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentsByConditionForSelect?conditionId=${conditionValue?.value}&setId=${examSessionValue?.setIdFk}&word=${inputValue}`)
      return res.data.studentData
    } catch (err) {
      return [];
    }
  }

  const fetchSubjects = async (id) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllSubjectBoardConditionWise?id=${id}`
      );
      setSubjectOptions(res.data.subjectData || []);
      // setExamSessionOptions([]); // Reset sessions
    } catch (err) {
      console.error("Error loading subjects:", err);
      setSubjectOptions([]);
    }
  };

  const fetchExamSessions = async (conditionId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getExamSessionsByCondition`,
        { params: { conditionId } }
      );
      setExamSessionOptions(res.data.sessionData || []);
    } catch (err) {
      console.error("Error loading exam sessions:", err);
      setExamSessionOptions([]);
    }
  };

  const fetchReferenceData = async (condId) => {
    try {
      const [subjectsRes, studentsRes, studentSubjectsRes] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_API_URL
          }/api/superAdminApi/subjectsByCondition`,
          { params: { examSessionId: examSessionValue?.value } }
        ),
        axios.get(
          `${import.meta.env.VITE_API_URL
          }/api/superAdminApi/studentsByCondition`,
          { params: { conditionId: condId, setId: examSessionValue?.setIdFk } }
        ),
        axios.get(
          `${import.meta.env.VITE_API_URL
          }/api/superAdminApi/getStudentSubjectsByCondition`,
          { params: { conditionId: condId, setId: examSessionValue?.setIdFk } }
        ),
      ]);

      // subjects
      const subs = subjectsRes.data.result || [];

      const sMap = {};
      subs.forEach((s) => {
        sMap[s.label] = {
          id: s.id,
          outOfMarks: s.outOfMarks === null ? null : Number(s.outOfMarks),
        };
      });
      setSubjectsMap(sMap);
      setSubjectData(subjectsRes.data.subjectData || []);

      // students: id, rollNo, name
      const st = studentsRes.data.result || [];
      const stMap = {};
      st.forEach((s) => {
        stMap[String(s.rollNo).trim()] = {
          id: s.id,
          name: s.name || "",
          enrolledSubjectIds: [],
        };
      });

      // studentSubjectsRes: [{rollNo, subjectIds: []}]
      (studentSubjectsRes.data || []).forEach((item) => {
        const roll = String(item.rollNo).trim();
        if (!stMap[roll]) {
          // Student mapping may not include this student — ignore or still create
          stMap[roll] = {
            id: null,
            name: "",
            enrolledSubjectIds: item.subjectIds,
          };
        } else {
          stMap[roll].enrolledSubjectIds = item.subjectIds || [];
        }
      });

      setStudentsMap(stMap);
      setStuData(studentsRes.data.studentData || []);
    } catch (err) {
      console.error(err);
      setErrors([
        {
          message: "Failed to load reference data (subjects/students).",
          row: "",
          rollNo: "",
          subject: "",
        },
      ]);
    }
  };

  const handleConditionSelect = async (newValue) => {
    setConditionValue(newValue);
    setSubjectValue(null);
    setExamSessionValue(null);
    if (newValue) await fetchExamSessions(newValue.value);
    fetchSubjects(newValue.value);
    fetchSubjectMaxMarks(newValue.value)
  };

  const handleFetchAllStudents = async (currentPage = 1, perPage = 50) => {
    if (!conditionValue) {
      return toast.warn("Please select Board / Standard")
    }

    if (!examSessionValue) {
      return toast.warn('Please select Exam Session')
    };
    let studentIdsData = studentValue && studentValue.length > 0 ? studentValue.map(item => item.value) : [];
    let subjectIdsData = subjectArr && subjectArr.length > 0 ? subjectArr.map(item => item.value) : [];
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentsForMarksEntry`, {
        currentPage, perPage, setId: examSessionValue?.setIdFk, examSessionId: examSessionValue?.value, conditionId: conditionValue?.value, studentIdData: studentIdsData || [], subjectIdData: subjectIdsData || [],
      });
      const { tableRecords, tableData } = res.data;
      const newPerPage = Number(perPage);
      const newCurrentPage = Number(currentPage);
      const from = newCurrentPage * newPerPage - newPerPage + 1;
      const to = from + tableData.length - 1;
      const totalPages = Math.ceil(tableRecords / newPerPage);
      setSubjectMap(res.data.subjectMap)
      setTableData(tableData);
      setTableProp({
        perPage,
        totalPages,
        currentPage,
        from,
        to,
        totalRecords: tableRecords,
      });
    } catch (err) {
      toast.error("Internal Server Error: Failed to fetch students")
    }
  };

  const handlePageChange = (value) => {
    if (
      value > 0 &&
      value <= tableProp.totalPages &&
      value !== tableProp.currentPage
    ) {
      handleFetchAllStudents(
        value,
        tableProp.perPage,
      );
    }
  };

  const handlePerPageChange = (value) => {
    handleFetchAllStudents(
      1,
      value,
    );
  };

  const handleOrderBy = (value) => {
    let orderDirection = "ASC";
    if (tableProp.orderBy === value)
      orderDirection = tableProp.orderDirection === "ASC" ? "DESC" : "ASC";
    handleFetchAllStudents(
      1,
      tableProp.perPage,
      value,
      orderDirection,
    );
  };

  const prepareForDownload = () => {
    setIsPreparing(true);
    let studentIdsData = studentValue && studentValue.length > 0 ? studentValue.map(item => item.value) : [];
    let subjectIdsData = subjectArr && subjectArr.length > 0 ? subjectArr.map(item => item.value) : [];
    axios
      .post(
        `${import.meta.env.VITE_API_URL
        }/api/superAdminApi/getStudentsForMarksEntry`,
        { currentPage: 1, perPage: 1000, setId: examSessionValue?.setIdFk, examSessionId: examSessionValue?.value, conditionId: conditionValue?.value, studentIdData: studentIdsData || [], subjectIdData: subjectIdsData || [] }
      )
      .then(async (response) => {
        if (response.status === 200) {
          processCSVData(response.data.tableData);
        }
      })
      .catch((errors) => {
        handleError(errors);
        switch (errors.response.status) {
          case 401:
            navigate("/auth/sign-in", { replace: true });
            break;
          case 403:
            navigate("/hod/dashboard", { replace: true });
            break;
          default:
        }
      });
  };

  const processCSVData = (tempData) => {
    const date = new Date();
    const exportDate = moment(date).format("Do MMM YYYY");

    let csvDataTemp = [];

    // Header with export date
    //   csvDataTemp.push(["", "Export Date", exportDate]);

    // Subject headers
    const subjectHeaders = subjectMap.map(sub => sub.label);

    // Main header row
    csvDataTemp.push([
      "Sr.No.",
      "Roll No",
      "Student Name",
      ...subjectHeaders
    ]);

    // Add data rows
    tempData.forEach((student, index) => {
      const row = [
        index + 1,
        student.rollNo || "",
        student.fullName || "",
      ];

      // Loop through all subjects
      subjectHeaders.forEach(subject => {
        const subjData = student[subject];

        if (subjData === "NA") {
          row.push("NA");
        } else if (!subjData.isPresent) {
          row.push("A");
        } else {
          row.push(subjData.marks ?? "");
        }
      });


      csvDataTemp.push(row);
    });

    // Download file
    downloadExcelFile(csvDataTemp);
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

    const fileName = `student-marks-entry-${moment().format("YYYY-MM-DD-HH-mm-ss")}.xlsx`;

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

  const resetData = () => {
    setConditionValue(null)
    setExamSessionValue(null)
    setTableData([])
    setMaxMarks([])
  };

  const fetchSubjectMaxMarks = async (conditionId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getMaxMarksSubjectWise?conditionId=${conditionId}`);
      setMaxMarks(res.data.subectMaxMarks)
    } catch (err) {
      null
    }
  };

  const handleSubjectChange = (rowIndex, subjectKey, value) => {
    setTableData((prev) => {
      const updated = [...prev];
      const prevSubjectData = updated[rowIndex][subjectKey];

      updated[rowIndex] = {
        ...updated[rowIndex],
        [subjectKey]: {
          ...(typeof prevSubjectData === "object" ? prevSubjectData : {}),
          marks: value,
          isPresent: true,
        },
      };

      return updated;
    });
  };

  function subjectMaxMrks(subject) {
    const sub = maxMarks.find((item) => {
      const formattedLabel = item.label.toString().replace(/[\s-]/g, "_");
      return formattedLabel === subject;
    });

    return sub?.maxMarks || 0
  };

  const validateParsedRows = (parsed) => {
    const allErrors = [];
    const cErrors = {}; // rowIndex -> {header: msg}

    parsed.forEach((r, idx) => {
      const rowLabel = idx + 1; // human-ish

      const student = studentsMap[r.rollNo];
      if (!student || !student.id) {
        allErrors.push({
          row: rowLabel,
          rollNo: r.rollNo,
          subject: "",
          message: "Roll number not found for this condition",
        });
        cErrors[idx] = { ...(cErrors[idx] || {}), rollNo: "Roll No not found" };
      }

      for (const [header, val] of Object.entries(r)) {
        if (["rollNo", "fullName"].includes(header)) continue;

        const subj = subjectsMap[header];
        if (!subj) {
          allErrors.push({
            row: rowLabel,
            rollNo: r.rollNo,
            subject: header,
            message: `Subject header not found in DB for this condition ${header}`,
          });
          cErrors[idx] = {
            ...(cErrors[idx] || {}),
            [header]: "Subject header not found",
          };
          continue;
        }

        const studentHasSubject =
          student.enrolledSubjectIds?.includes(subj.id);

        // If student not enrolled in this subject → must be "NA"
        if (!studentHasSubject) {
          if (val !== "NA" && val !== null && val !== undefined && val !== "") {
            allErrors.push({
              row: rowLabel,
              rollNo: r.rollNo,
              subject: header,
              message: "Student is not enrolled in this subject (expected NA)",
            });
            cErrors[idx] = {
              ...(cErrors[idx] || {}),
              [header]: "Student not enrolled (should be NA)",
            };
          }
          continue;
        }

        // if(!val?.isPresent) continue;

        // Must have valid marks
        if (!val || val === "NA") {
          allErrors.push({
            row: rowLabel,
            rollNo: r.rollNo,
            subject: header,
            message: "Marks missing",
          });
          cErrors[idx] = {
            ...(cErrors[idx] || {}),
            [header]: "Marks missing",
          };
          continue;
        }

        if (val?.marks === 'A') continue;

        if (val?.marks === null || val?.marks === "" || val?.marks === undefined) {
          allErrors.push({
            row: rowLabel,
            rollNo: r.rollNo,
            subject: header,
            message: `Marks missing`,
          });

          cErrors[idx] = {
            ...(cErrors[idx] || {}),
            [header]: "Marks missing",
          };
          continue;
        }

        // Case 3: now validate numeric
        const marksNum = Number(val?.marks);

        if (isNaN(marksNum)) {
          allErrors.push({
            row: rowLabel,
            rollNo: r.rollNo,
            subject: header,
            message: `Marks not numeric: "${val?.marks}"`,
          });

          cErrors[idx] = {
            ...(cErrors[idx] || {}),
            [header]: "Marks not numeric",
          };

          continue;
        }

        // Range check
        const outOf = subj.outOfMarks ?? 100;
        if (marksNum < 0 || marksNum > outOf) {
          const msg =
            marksNum < 0
              ? "Marks cannot be negative"
              : `Marks exceed max (${outOf})`;
          allErrors.push({
            row: rowLabel,
            rollNo: r.rollNo,
            subject: header,
            message: msg,
          });
          cErrors[idx] = {
            ...(cErrors[idx] || {}),
            [header]: msg,
          };
        }
      }
    }); // rows

    setErrors(allErrors);
    setCellErrors(cErrors);
    return allErrors.length === 0;
  };

  const handleUpload = async () => {
    if (!tableData || tableData.length === 0) {
      setErrors([{ message: "No data to import" }]);
      return;
    }
    const ok = validateParsedRows(tableData);
    if (!ok) {
      // per requirements, block submission when errors exist
      return;
    }
    setLoading(true);
    try {

      const payloadRows = tableData.map((r) => {
        const student = studentsMap[r.rollNo];
        const studentId = student ? student.id : null;
        const subjectArray = [];

        for (const [label, val] of Object.entries(r)) {
          // Skip non-subject columns
          if (["rollNo", "fullName"].includes(label)) continue;

          const subj = subjectsMap[label];
          if (!subj) continue; // skip subjects not found in DB

          // Skip empty or NA values
          if (val === null || val === undefined || val === "NA" || val === "") continue;

          subjectArray.push({
            subjectId: subj.id,
            isPresent: val.marks ? (val?.marks.toString()?.toUpperCase() == 'A' ? false : true) : true,
            marks: Number(val?.marks || 0),
            outOfMarks: subj.outOfMarks ?? 100,
          });
        }

        return {
          studentId,
          rollNo: r.rollNo,
          subjects: subjectArray
        };
      });

      const body = {
        conditionId: conditionValue?.value,
        overwrite: true,
        rows: payloadRows,
        examSessionId: examSessionValue?.value,
      };
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL
        }/api/superAdminApi/importStudentMarksThroughTable`,
        body
      );
      if (res.status === 200) {
        toast.success("Marks imported for students");
        // handleClose();
      } else {
        setErrors([
          {
            message: "Server returned error during import",
            row: "",
            rollNo: "",
            subject: "",
          },
        ]);
      }
      setInserted(res.data.summary.inserted);
      setUpdated(res.data.summary.updated);
    } catch (err) {
      console.error(err);
      setErrors([
        {
          message: err?.response?.data?.message || "Server error during import",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setConditionValue(null);
    setExamSessionValue(null);
    setTableData([]);
    setErrors([]);
    setCellErrors({});
    setInserted(null);
    setUpdated(null);
    setStudentsMap({});
    setSubjectsMap({});
  };

  const handleCheckboxChange = (id, label, checked) => {

    setTableData((prevData) =>
      prevData.map((row, i) =>
        i === id ? {
          ...row,
          [label]: {
            ...(row[label] || {}),
            isPresent: checked,
          },
        } : row
      )
    );
  };

  console.log("tableData", tableData);
  console.log("studentMap", studentsMap)
  console.log("subjectMap", subjectsMap)

  return (
    <>
      <Card className="animate-fade-in transform">
        <CardHeader color={sidenavColor} className="mb-4 mt-5 p-3">
          <div className="flex flex-col justify-between md:flex-row">
            <Typography variant="h6" color="white">
              Marks Entry
            </Typography>
            <div>
              <Button
                variant="outlined"
                color="white"
                size="sm"
                onClick={() => navigate('/hod/marks-entry/manual-entry')}
              >
                Manual Entry
              </Button>
              <Button
                onClick={() => {
                  handleReset();
                }}
                className="inline-flex self-center mx-2"
                variant="outlined"
                color="white"
                size="sm"
              >
                <i className="fas fa-arrows-rotate self-center" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="px-2 py-4 md:px-6 min-h-[400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Typography className="font-semibold mb-2">
                Select Board / Standard <span className="text-red-500">*</span>
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
            <div >
              <Typography className="font-semibold mb-2">
                Select Exam Session <span className="text-red-500">*</span>
              </Typography>
              <AsyncSelect
                isClearable
                cacheOptions
                defaultOptions={examSessionOptions}
                placeholder="Select Exam Session..."
                value={examSessionValue}
                onChange={setExamSessionValue}
              />
            </div>
            <div>
              <Typography className="font-semibold mb-2">
                Select Students
              </Typography>
              <AsyncSelect
                isMulti
                isClearable
                cacheOptions
                defaultOptions={stuData || []}
                loadOptions={loadStudents}
                placeholder="Search Students..."
                value={studentValue}
                onChange={(value) => setStudentValue(value)}
              />
            </div>
            <div>
              <Typography className="font-semibold mb-2">
                Select Subjects
              </Typography>
              <AsyncSelect
                isMulti
                isClearable
                cacheOptions
                defaultOptions={subjectData}
                // loadOptions={loadConditions}
                placeholder="Search Subjects..."
                value={subjectArr}
                onChange={(value) => setSubjectArr(value)}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-center mt-8">
            <Button
              color="blue"
              size="md"
              onClick={() => handleFetchAllStudents(1, 50)}
              disabled={isFetching}
              className="me-2 mb-4 md:mb-0"
            >
              {isFetching ? "Fetching" : "Fetch Students"}
            </Button>
          </div>
          <hr className="my-4 border border-blue-400" />
          {tableData.length > 0 ? (
            <>
              <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 shadow-sm">
                <h2 className="mb-2 text-sm font-semibold text-yellow-800">
                  ⚠️ Instructions for uploading Marks
                </h2>
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                  <li>
                    Enter marks{" "}
                    <strong>only for subjects assigned to each student</strong>.
                  </li>
                  {/* <li>
                                  If a subject is <strong>not assigned</strong> to a student, enter{" "}
                                  <strong>"NA"</strong> in that cell.
                                </li> */}
                  <li>
                    To mark student as{" "}
                    <span className="font-semibold text-red-600">ABSENT</span> - enter "A" as  input.
                  </li>
                  <li>
                    Marks should be <strong>numeric</strong> and must{" "}
                    <strong>not exceed maximum marks</strong> for that subject.
                  </li>
                  <li>Negative marks or invalid symbols are not allowed.</li>
                </ul>
                {maxMarks && maxMarks.length > 0 && (
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-gray-800">
                      Maximum Marks per Subject:
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {maxMarks.map((subj, idx) => (
                        <span
                          key={idx}
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm"
                        >
                          {subj.label}: {subj.maxMarks}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="w-full my-4 flex items-center justify-center md:justify-end">
                <Button
                  size="sm"
                  onClick={() => prepareForDownload()}
                  className="me-2"
                >
                  Export Excel
                </Button>
                <Button
                  size="sm"
                  onClick={() => setImportMarks(true)}
                  variant="outlined"
                >
                  Import Marks
                </Button>
              </div>
              <div className="w-full my-2 p-2">
                {(inserted !== undefined && inserted !== null) ||
                  (updated !== undefined && updated !== null) ? (
                  <div className="mb-4 rounded-lg border border-gray-200 bg-blue-50 p-4">
                    <h3 className="mb-2 text-lg font-semibold text-gray-700">
                      Import Summary
                    </h3>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="font-semibold text-gray-600">Inserted:</span>{" "}
                        <span className="font-semibold text-green-600">
                          {inserted ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600">Updated:</span>{" "}
                        <span className="font-semibold text-blue-600">
                          {updated ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
                {errors.length > 0 && (
                  <div className="mb-4 max-h-screen overflow-y-auto rounded border border-red-100 bg-red-50 p-3">
                    <div className="mb-2 font-semibold text-red-700">
                      Validation Errors ({errors.length})
                    </div>
                    <ol className="list-inside list-decimal text-sm text-red-700">
                      {errors.map((err, i) => (
                        <li key={i}>
                          {err.row ? `Row ${err.row} — ` : ""}
                          {err.rollNo ? `Roll: ${err.rollNo} — ` : ""}
                          {err.subject ? `Subject: ${err.subject} — ` : ""}
                          {err.message || err}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
              <div className="overflow-x-scroll">
                <table className="w-full min-w-[640px] table-auto border-collapse">
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
                        extraClasses='sticky left-0 bg-white z-20'
                      />
                      <TableHeaderCell
                        key="rollNo"
                        columnName="rollNo"
                        text="Roll_No"
                        orderBy={tableProp.orderBy}
                        handleOrderBy={handleOrderBy}
                        isOrderByAvailable={true}
                        orderDirection={tableProp.orderDirection}
                        extraClasses='sticky left-[55px] bg-white z-20'
                      />
                      <TableHeaderCell
                        key="fullName"
                        columnName="firstName"
                        text="Full_Name"
                        orderBy={tableProp.orderBy}
                        handleOrderBy={handleOrderBy}
                        isOrderByAvailable={true}
                        orderDirection={tableProp.orderDirection}
                        extraClasses='sticky left-[120px] bg-white z-20 shadow-lg'
                      />
                      {subjectMap && subjectMap.length > 0 ? (
                        subjectMap.map((item) => (
                          <TableHeaderCell
                            key={item.value}
                            columnName={item.label}
                            text={item.label}
                            orderBy={tableProp.orderBy}
                            handleOrderBy={handleOrderBy}
                            isOrderByAvailable={true}
                            orderDirection={tableProp.orderDirection}
                          />
                        ))
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData && tableData.length === 0 ? (
                      <tr>
                        <td colSpan="3">
                          <p className="p-2 text-center text-sm text-red-500 ">
                            No Data Available
                          </p>
                        </td>
                      </tr>
                    ) : tableData.map((rowObj, index) => (
                      <tr key={rowObj.id}>
                        <td className="items-center border-b border-blue-gray-50 px-2 py-2 sticky left-0 bg-white z-10">{index + 1}</td>
                        <TableCell text={rowObj?.rollNo || "--"} extraClasses='sticky left-[55px] bg-white z-10' />
                        <TableCell text={rowObj?.fullName || "--"} extraClasses='sticky left-[120px] bg-white z-10' />
                        {subjectMap.map((s, i) => (
                          <TableCell
                            key={s.label}
                            text={
                              //   !rowObj[s.label]?.isPresent ? (
                              //   <div className="flex items-center justify-center">
                              //       <p className="me-2">ABSENT</p>
                              //       <input
                              //       type="checkbox"
                              //       className="hover:cursor-pointer"
                              //       checked={rowObj[s.label]?.isPresent}
                              //       onChange={(e) => handleCheckboxChange(index, s.label, e.target.checked)}
                              //     />
                              //   </div>
                              //  ) : 
                              rowObj[s.label] === "NA" ? <p className="flex items-center justify-center">
                                NA
                              </p> :
                                <div className="flex items-center justify-center">
                                  {/* <input
                                    type="text"
                                    className="w-16 me-2 p-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                    value={rowObj[s.label]?.marks ?? ""}
                                    onChange={(e) => {
                                      let value = e.target.value;

                                      // Allow empty
                                      if (value === "") {
                                        handleSubjectChange(index, s.label, null);
                                        return;
                                      }

                                      // Allow A / a
                                      if (value.toLowerCase() === "a") {
                                        handleSubjectChange(index, s.label, "A"); // store uppercase if you want
                                        return;
                                      }

                                      // Allow only digits otherwise
                                      if (!/^\d+$/.test(value)) {
                                        return; // ignore invalid characters
                                      }

                                      let numValue = Number(value);

                                      // No negative
                                      if (numValue < 0) return;

                                      // Max marks check
                                      const max = Number(subjectMaxMrks(s.label));
                                      if (numValue > max) {
                                        toast.warning(`Entered marks exceeds maximum marks for ${s.label}`);
                                        numValue = max;
                                      }

                                      handleSubjectChange(index, s.label, numValue);
                                    }}
                                  /> */}

                                  <input
                                    type="text"
                                    className="w-16 me-2 p-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400"
                                    value={rowObj[s.label]?.marks ?? ""}
                                    onChange={(e) => {
                                      let value = e.target.value;
                                    
                                      // Allow empty
                                      if (value === "") {
                                        handleSubjectChange(index, s.label, null);
                                        return;
                                      }
                                    
                                      // Allow A / a
                                      if (value.toLowerCase() === "a") {
                                        handleSubjectChange(index, s.label, "A");
                                        return;
                                      }
                                    
                                      // Allow numbers with optional decimal (e.g. 12, 12.5, 0.75)
                                      if (!/^\d*\.?\d*$/.test(value)) {
                                        return;
                                      }
                                    
                                      let numValue = value;
                                    
                                      // Avoid NaN while typing like "."
                                      if (isNaN(numValue)) return;
                                    
                                      // No negative values
                                      if (numValue < 0) return;
                                    
                                      // Max marks check
                                      const max = Number(subjectMaxMrks(s.label));
                                      if (numValue > max) {
                                        toast.warning(`Entered marks exceeds maximum marks for ${s.label}`);
                                        numValue = max;
                                      }
                                    
                                      handleSubjectChange(index, s.label, numValue);
                                    }}
                                  />

                                  {/* <input
                                                          type="checkbox"
                                                          className="hover:cursor-pointer"
                                                          checked={rowObj[s.label]?.isPresent}
                                                          onChange={(e) => handleCheckboxChange(index, s.label, e.target.checked)}
                                                        /> */}
                                </div>
                            }

                          />
                        ))}
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
            </>
          ) : null}
        </CardBody>
        <CardFooter>
          {tableData && tableData.length > 0 && (
            <div className="flex items-center justify-center">
              <SubmitButton onClick={handleUpload}></SubmitButton>
            </div>
          )}
        </CardFooter>
      </Card>
      <Suspense>
        <ImportMarks
          open={importMarks}
          handleClose={() => setImportMarks(false)}
          conditionId={conditionValue?.value}
          setId={examSessionValue?.setIdFk}
          examSessionId={examSessionValue?.value}
          resetData={resetData}
          maxMarks={maxMarks}
          setStudentValue={setStudentValue}
        />
      </Suspense>
    </>
  )

}