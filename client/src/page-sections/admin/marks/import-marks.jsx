// src/components/ImportMarks.jsx
import { CancelButton, SubmitButton } from "@/widgets/components/index.js";
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "@material-tailwind/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

/**
 Props:
  - open (bool)
  - handleClose (fn)
  - conditionId (number)
*/

export default function ImportMarks({
  open,
  handleClose,
  conditionId,
  setId,
  examSessionId,
  resetData,
  maxMarks,
  setStudentValue
}) {
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]); // parsed rows
  const [previewRows, setPreviewRows] = useState([]);
  const [subjectsMap, setSubjectsMap] = useState({}); // label -> {id, outOfMarks}
  const [studentsMap, setStudentsMap] = useState({}); // rollNo -> { id, enrolledSubjectIds: [] }
  const [errors, setErrors] = useState([]); // full errors list
  const [cellErrors, setCellErrors] = useState({}); // map rowIndex -> { header -> errorMsg } used for highlighting
  const [loading, setLoading] = useState(false);
  const PREVIEW_COUNT = 1000;
  const [inserted, setInserted] = useState(null);
  const [updated, setUpdated] = useState(null);

  useEffect(() => {
    if (!open) return;
    resetState();
    if (!conditionId) {
      setErrors([
        {
          message: "Select a condition/board before importing",
          row: "",
          rollNo: "",
          subject: "",
        },
      ]);
      return;
    }
    fetchReferenceData(conditionId, examSessionId, setId);
  }, [open, examSessionId, conditionId, setId]);

  const resetState = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setPreviewRows([]);
    setSubjectsMap({});
    setStudentsMap({});
    setErrors([]);
    setCellErrors({});
    setLoading(false);
    setStudentValue([])
  };

  // const fetchReferenceData = async (condId, examId) => {
  //   try {
  //     const [subjectsRes, studentsRes, studentSubjectsRes] = await Promise.all([
  //       axios.get(
  //         `${
  //           import.meta.env.VITE_API_URL
  //         }/api/superAdminApi/subjectsByCondition`,
  //         { params: { examSessionId: examId } }
  //       ),
  //       axios.get(
  //         `${
  //           import.meta.env.VITE_API_URL
  //         }/api/superAdminApi/studentsByCondition`,
  //         { params: { conditionId: condId, setId } }
  //       ),
  //       axios.get(
  //         `${
  //           import.meta.env.VITE_API_URL
  //         }/api/superAdminApi/getStudentSubjectsByCondition`,
  //         { params: { conditionId: condId, setId } }
  //       ),
  //     ]);

  //     // subjects
  //     const subs = subjectsRes.data.subjectData || [];
  //     const sMap = {};
  //     subs.forEach((s) => {
  //       sMap[s.label] = {
  //         id: s.id,
  //         outOfMarks: s.outOfMarks === null ? null : Number(s.outOfMarks),
  //       };
  //     });
  //     setSubjectsMap(sMap);

  //     // students: id, rollNo, name
  //     const st = studentsRes.data.result || [];
  //     const stMap = {};
  //     st.forEach((s) => {
  //       stMap[String(s.rollNo).trim()] = {
  //         id: s.id,
  //         name: s.name || "",
  //         enrolledSubjectIds: [],
  //       };
  //     });

  //     // studentSubjectsRes: [{rollNo, subjectIds: []}]
  //     (studentSubjectsRes.data || []).forEach((item) => {
  //       const roll = String(item.rollNo).trim();
  //       if (!stMap[roll]) {
  //         // Student mapping may not include this student — ignore or still create
  //         stMap[roll] = {
  //           id: null,
  //           name: "",
  //           enrolledSubjectIds: item.subjectIds,
  //         };
  //       } else {
  //         stMap[roll].enrolledSubjectIds = item.subjectIds || [];
  //       }
  //     });

  //     setStudentsMap(stMap);
  //   } catch (err) {
  //     console.error(err);
  //     setErrors([
  //       {
  //         message: "Failed to load reference data (subjects/students).",
  //         row: "",
  //         rollNo: "",
  //         subject: "",
  //       },
  //     ]);
  //   }
  // };

  const fetchReferenceData = async (condId, examId, setId) => {
    try {
      const [subjectsRes, studentsRes, studentSubjectsRes] = await Promise.all([
        axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/api/superAdminApi/subjectsByCondition`,
          { params: { examSessionId: examId } }
        ),
        axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/api/superAdminApi/studentsByCondition`,
          { params: { conditionId: condId, setId: setId } }
        ),
        axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/api/superAdminApi/getStudentSubjectsByCondition`,
          { params: { conditionId: condId, setId: setId } }
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
      // setSubjectData(subjectsRes.data.subjectData || []);

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
      // setStuData(studentsRes.data.studentData || []);
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
  

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setErrors([
        {
          message: "Please upload an .xlsx or .xls file",
          row: "",
          rollNo: "",
          subject: "",
        },
      ]);
      return;
    }
    setFile(f);
    readExcelFile(f);
  };

  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const workbook = XLSX.read(ev.target.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });

        if (!allRows || allRows.length < 2) {
          setErrors([{ message: "Excel has insufficient data" }]);
          return;
        }

        // Detect header row (row containing 'Roll')
        let headerRowIndex = 1;
        if (
          allRows[0].some(
            (c) => typeof c === "string" && c.toLowerCase().includes("roll")
          )
        )
          headerRowIndex = 0;
        else if (
          allRows[1].some(
            (c) => typeof c === "string" && c.toLowerCase().includes("roll")
          )
        )
          headerRowIndex = 1;
        else {
          const guess = allRows.findIndex(
            (r) =>
              Array.isArray(r) &&
              r.some(
                (c) => typeof c === "string" && c.toLowerCase().includes("roll")
              )
          );
          headerRowIndex = guess === -1 ? 1 : guess;
        }

        const headerRow = allRows[headerRowIndex].map((h) =>
          h === null || h === undefined ? "" : String(h).trim()
        );
        setHeaders(headerRow);

        const lower = headerRow.map((h) => (h ? String(h).toLowerCase() : ""));
        const rollIndex = lower.findIndex((h) => h.includes("roll"));
        const nameIndex = lower.findIndex(
          (h) => h.includes("student") || h.includes("name")
        );

        if (rollIndex === -1) {
          setErrors([
            { message: "Could not find 'Roll No' column in header." },
          ]);
          return;
        }
        if (nameIndex === -1) {
          setErrors([
            { message: "Could not find 'Student Name' column in header." },
          ]);
          return;
        }

        // subject columns are everything except roll & name & sr.no
        const subjectCols = headerRow
          .map((h, i) => ({ h, i }))
          .filter(
            ({ i, h }) =>
              i !== rollIndex &&
              i !== nameIndex &&
              !String(h).toLowerCase().includes("sr.no") &&
              !String(h).toLowerCase().includes("sr")
          )
          .map(({ h, i }) => ({ header: h, index: i }));

        const dataRows = allRows.slice(headerRowIndex + 1);

        const parsed = dataRows
          .map((r, idx) => {
            // skip empty rows
            const hasData =
              r &&
              r.some(
                (cell) => cell !== "" && cell !== null && cell !== undefined
              );
            if (!hasData) return null;

            const rollNoRaw = r[rollIndex];
            const rollNo =
              rollNoRaw !== undefined && rollNoRaw !== null
                ? String(rollNoRaw).trim()
                : "";
            const studentName =
              r[nameIndex] !== undefined && r[nameIndex] !== null
                ? String(r[nameIndex]).trim()
                : "";
            const subjects = {};
            subjectCols.forEach(({ header, index }) => {
              const cell = r[index];
              if (cell === null || cell === undefined || cell === "") {
                subjects[header] = null; // empty -> null, will be validated later
              } else if (String(cell).trim().toLowerCase() === "na") {
                subjects[header] = "NA"; // explicit NA
              } else {
                const num = Number(String(cell).replace(/,/g, ""));
                subjects[header] = isNaN(num) ? String(cell).trim() : num;
              }
            });
            return { srNo: idx + 1, rollNo, name: studentName, subjects };
          })
          .filter(Boolean);

        setRows(parsed);
        setPreviewRows(parsed.slice(0, PREVIEW_COUNT));
        // run validations
        validateParsedRows(parsed);
      } catch (err) {
        console.error(err);
        setErrors([{ message: "Failed to parse Excel file." }]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Validate parsed rows; collect all errors and mark per-cell errors
  const validateParsedRows = (parsed) => {
    const allErrors = [];
    const cErrors = {}; // rowIndex -> {header: msg}

    parsed.forEach((r, idx) => {
      const rowLabel = idx + 1; // human-ish
      if (!r.rollNo) {
        allErrors.push({
          row: rowLabel,
          rollNo: "",
          subject: "",
          message: "Missing roll number",
        });
        cErrors[idx] = {
          ...(cErrors[idx] || {}),
          rollNo: "Missing roll number",
        };
        return;
      }

      const student = studentsMap[r.rollNo];
      if (!student || !student.id) {
        allErrors.push({
          row: rowLabel,
          rollNo: r.rollNo,
          subject: "",
          message: "Roll number not found for this condition",
        });
        cErrors[idx] = { ...(cErrors[idx] || {}), rollNo: "Roll No not found" };
        // still continue to check subject headers (so user sees subject errors too)
      }

      // For each subject header
      for (const [header, val] of Object.entries(r.subjects || {})) {
        // check header exists in subjectsMap
        const subj = subjectsMap[header];
        if (!subj) {
          allErrors.push({
            row: rowLabel,
            rollNo: r.rollNo,
            subject: header,
            message: "Subject header not found in DB for this condition",
          });
          cErrors[idx] = {
            ...(cErrors[idx] || {}),
            [header]: "Subject header not found",
          };
          continue;
        }

        const studentHasSubject =
          student &&
          student.enrolledSubjectIds &&
          student.enrolledSubjectIds.includes(subj.id);

        // If student does NOT have subject -> must be NA (no error)
        if (!studentHasSubject) {
          // If value is present and not NA, it's probably user error but per requirement: only show NA if not selected
          // We'll tolerate any value but prefer to warn if user entered marks for subject they don't have.
          if (val !== null && val !== undefined && val !== "NA") {
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

        // Student has subject -> marks must be entered (non-null & not "NA")
        if (val === null || val === undefined || val === "NA" || val === "") {
          // ABSENT -> show "-" in red and an error entry
          allErrors.push({
            row: rowLabel,
            rollNo: r.rollNo,
            subject: header,
            message: "Marks missing, in-case ABSENT then enter 'A'.",
          });
          cErrors[idx] = {
            ...(cErrors[idx] || {}),
            [header]: "Marks missing (ABSENT)",
          };
          continue;
        }

        // Now must be numeric
        if(val?.toString()?.toUpperCase() == 'A') continue;
        const marksNum = Number(val);
        if (isNaN(marksNum)) {
          allErrors.push({
            row: rowLabel,
            rollNo: r.rollNo,
            subject: header,
            message: `Marks not numeric: "${val}"`,
          });
          cErrors[idx] = {
            ...(cErrors[idx] || {}),
            [header]: "Marks not numeric",
          };
          continue;
        }

        // Range check: 0 <= marks <= outOfMarks (if outOfMarks available)
        const outOf = subj.outOfMarks;
        if (outOf !== null && outOf !== undefined && !isNaN(Number(outOf))) {
          if (marksNum < 0) {
            allErrors.push({
              row: rowLabel,
              rollNo: r.rollNo,
              subject: header,
              message: "Marks cannot be negative",
            });
            cErrors[idx] = {
              ...(cErrors[idx] || {}),
              [header]: "Negative marks",
            };
          } else if (marksNum > Number(outOf)) {
            allErrors.push({
              row: rowLabel,
              rollNo: r.rollNo,
              subject: header,
              message: `Marks exceed max (${outOf})`,
            });
            cErrors[idx] = {
              ...(cErrors[idx] || {}),
              [header]: `Exceeds max ${outOf}`,
            };
          }
        }
      } // subject loop
    }); // rows

    setErrors(allErrors);
    setCellErrors(cErrors);
    return allErrors.length === 0;
  };

  // Upload to backend; frontend will send studentId + subjectId + marks
  const handleUpload = async () => {
    if (!rows || rows.length === 0) {
      setErrors([{ message: "No data to import" }]);
      return;
    }
    const ok = validateParsedRows(rows);
    if (!ok) {
      // per requirements, block submission when errors exist
      return;
    }

    setLoading(true);
    try {
      const payloadRows = rows.map((r) => {
        const student = studentsMap[r.rollNo];
        const studentId = student ? student.id : null;
        const subjectArray = [];
        for (const [label, val] of Object.entries(r.subjects || {})) {
          const subj = subjectsMap[label];
          if (!subj) continue;
          if (val === null || val === undefined || val === "NA" || val === "") continue; // skip NA/empty
          if(val && val?.toString()?.toUpperCase() == 'A'){
            subjectArray.push({
              subjectId: subj.id,
              isPresent: false,
              marks: null,
              outOfMarks: subj.outOfMarks,
            });
          }else{
            subjectArray.push({
              subjectId: subj.id,
              isPresent: true,
              marks: Number(val),
              outOfMarks: subj.outOfMarks,
            });
          }
        }
        return { studentId, rollNo: r.rollNo, subjects: subjectArray };
      });

      const body = {
        conditionId,
        overwrite: true,
        rows: payloadRows,
        examSessionId,
      };

      const res = await axios.post(
        `${
          import.meta.env.VITE_API_URL
        }/api/superAdminApi/importStudentMarksThroughExcel`,
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

  const handleDeleteFile = () => {
    setFile(null);
    setRows([]);
    setPreviewRows([]);
    setHeaders([]);
    setErrors([]);
    setCellErrors({});
  };

  // helper for rendering subject cell content and CSS class when error exists
  const renderSubjectCell = (rIdx, header, value) => {
    const rowCellErr = cellErrors[rIdx] || {};
    const errMsg = rowCellErr[header];
    // determine student enrolled:
    const roll = rows[rIdx].rollNo;
    const student = studentsMap[roll];
    const subj = subjectsMap[header];
    const studentHas =
      student &&
      subj &&
      student.enrolledSubjectIds &&
      student.enrolledSubjectIds.includes(subj.id);

    // Cases:
    // - not enrolled -> show 'NA' (no error)
    // - enrolled but value null/NA -> show '-' in red
    // - enrolled and value present -> show value (if error, highlight red)
    if (!subj) {
      return <td className="border p-1 text-sm text-red-600">{value ?? ""}</td>; // header missing
    }
    if (!studentHas) {
      return (
        <td className="border p-1 text-sm">
          {value === null ? "NA" : value === "NA" ? "NA" : value}
        </td>
      );
    }
    // student has subject
    if (
      value === null ||
      value === undefined ||
      value === "NA" ||
      value === ""
    ) {
      // ABSENT -> show "-" in red
      return (
        <td className="border p-1 text-sm font-semibold text-red-600">-</td>
      );
    }
    // show value; if error highlight with red bg
    if (errMsg) {
      return (
        <td className="border bg-red-100 p-1 text-sm font-medium text-red-700 capitalize">
          {String(value)}
        </td>
      );
    }
    return <td className="border p-1 text-sm capitalize">{String(value)}</td>;
  };

  const closeDialog = () => {
    resetData();
    setInserted(null);

    setUpdated(null);
    handleClose();
  };

  return (
    <Dialog
      className="z-999 bg-white"
      handler={closeDialog}
      open={open}
      size={isMobile ? "xxl" : "xxl"}
    >
      <DialogHeader className="justify-center bg-gray-100 text-center">
        Import Marks
      </DialogHeader>
      <DialogBody divider className="mx-4 bg-white">
        <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-yellow-800">
            ⚠️ Instructions for Importing Marks
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>
              Please <strong>download the Excel template</strong> and fill marks
              before uploading.
            </li>
            <li>
              Do{" "}
              <strong>
                not change Roll No, Student Name or Subject columns
              </strong>{" "}
              in Excel.
            </li>
            <li>
              Enter marks{" "}
              <strong>only for subjects assigned to each student</strong>.
            </li>
            <li>
              If a subject is <strong>not assigned</strong> to a student, enter{" "}
              <strong>"NA"</strong> in that cell.
            </li>
            <li>
              Enter <strong>"A"</strong> to mark student as <em className="text-red-500 font-semibold">ABSENT</em>
            </li>
            <li>
              Marks should be <strong>numeric</strong> and must{" "}
              <strong>not exceed maximum marks</strong> for that subject.
            </li>
            <li>Negative marks or invalid symbols are not allowed.</li>
            <li>
              Upload file must be in <strong>.xlsx or .xls</strong> format only.
            </li>
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
        <div className="flex w-full items-center justify-center p-4">
          <div className="mb-4 border-2 border-dashed p-4">
            <label className="mb-2 block text-lg font-medium">
              Select Excel file
            </label>
            <input
              accept=".xlsx,.xls"
              type="file"
              onChange={handleFileChange}
            />
            {file && (
              <div className="mt-2 flex items-center gap-4">
                <div>{file.name}</div>
                <button
                  className="text-red-500 hover:cursor-pointer"
                  onClick={handleDeleteFile}
                >
                  <FaTrashAlt />
                </button>
              </div>
            )}
          </div>
        </div>

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

        {/* Error summary list above table */}
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

        {/* Preview table */}
        {previewRows.length > 0 ? (
          <div>
            <div className="mb-2 font-medium">Preview</div>
            <div className="max-h-96 overflow-x-auto border">
              <table className="min-w-full table-auto text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        className="whitespace-nowrap border p-2 text-left text-xs"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, rIdx) => (
                    <tr key={rIdx}>
                      <td className="border p-1">{r.srNo}</td>
                      <td
                        className={`whitespace-nowrap border p-1 ${
                          cellErrors[rIdx] && cellErrors[rIdx].rollNo
                            ? "bg-red-100 font-medium text-red-700"
                            : ""
                        }`}
                      >
                        {r.rollNo}
                      </td>
                      <td className="whitespace-nowrap border p-1">{r.name}</td>
                      {Object.keys(r.subjects).map((sh, i) => (
                        <React.Fragment key={i}>
                          {renderSubjectCell(rIdx, sh, r.subjects[sh])}
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No preview available</div>
        )}
      </DialogBody>

      <DialogFooter className="flex gap-3 bg-gray-100">
        <CancelButton onClick={closeDialog} />
        <SubmitButton
          onClick={handleUpload}
          disabled={loading || rows.length === 0 || errors.length > 0}
        >
          {loading ? "Importing..." : "Import Marks"}
        </SubmitButton>
      </DialogFooter>
    </Dialog>
  );
}
