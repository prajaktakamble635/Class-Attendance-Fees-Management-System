import React, { Fragment, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Input,
  Card,
  CardHeader,
  CardFooter,
  Typography,
  CardBody,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Avatar,
  Select,
  Option,
  Chip,
  Button,
  Tooltip,
} from "@material-tailwind/react";
import { handleError } from "@/hooks/errorHandling";
import { validateFormData } from "@/hooks/validation";
import { SubmitButton, CancelButton } from "@/widgets/components";
import { useNavigate } from "react-router-dom";
import { useMaterialTailwindController } from "@/context/index.jsx";
import { toast } from "react-toastify";
import {
  checkDocumentMimeType,
  checkFileSize,
  maxSelectFile,
} from "@/hooks/fileValidationUtils.js";
import AsyncSelect from "react-select/async"
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import moment from "moment";
import theme from "@material-tailwind/react/theme";

export default function AdmissionImportHolder() {

  const navigate = useNavigate();
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor } = controller;
  const [file, setFile] = useState(null);
  const [error, setError] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [createdRecords, setCreatedRecords] = useState(null);
  const [existingRecords, setExistingRecords] = useState(null);
  const [invalidRecords, setInvalidRecords] = useState([]);
  const [viewInvalid, setViewInvalid] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [subObj, setSubObj] = useState(null);
  const [subjectCodesData, setSubjectCodesData] = useState({});
  const [viewSubCodes, setViewSubCodes] = useState(false)
  const [boardConditionsMap, setBoardConditionsMap] = useState({})

  React.useEffect(() => {
    document.title = "Gurukul Academy Test Series";
  }, []);

  useEffect(() => {
    Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getSubjectCodesByCondition`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/commonApi/boardSubjectConditions`)
    ]).then(async ([res1, res2]) => {
      setSubjectCodesData(res1.data.conditionWiseSubjectCodes)

      // Create a map of board conditions by their option code (A, B, C, D, E)
      if (res2.data.success) {
        const conditionsMap = {};
        const conditionsData = res2.data.data;

        // Fetch subjects for each condition
        for (const condition of conditionsData) {
          const name = condition.name;
          let optionCode = '';
          if (name.includes('10th SSC English Medium')) optionCode = 'A';
          else if (name.includes('10th SSC Semi English Medium') || name.includes('10th SSC Semi-English Medium')) optionCode = 'B';
          else if (name.includes('10th CBSE')) optionCode = 'C';
          else if (name.includes('10th ICSE')) optionCode = 'D';
          else if (name.includes('12th HSC')) optionCode = 'E';

          if (optionCode) {
            try {
              const subjectsRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/commonApi/subjectsByCondition`,
                { params: { boardSubjectConditionsId: condition.id } }
              );

              conditionsMap[optionCode] = {
                ...condition,
                subjects: subjectsRes.data.success ? subjectsRes.data.data : []
              };
            } catch (err) {
              console.error(`Error fetching subjects for ${name}:`, err);
              conditionsMap[optionCode] = {
                ...condition,
                subjects: []
              };
            }
          }
        }
        setBoardConditionsMap(conditionsMap);
      }
    })
  }, [])

  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const convertExcelDate = (value) => {
    let date;

    if (value instanceof Date) {
      date = value;
    } else if (!isNaN(value)) {
      date = new Date(Math.round((value - 25569) * 86400 * 1000));
    } else if (typeof value === 'string') {
      const ddMmYyyyPattern = /^\d{2}-\d{2}-\d{4}$/;
      const yyyyMmDdPattern = /^\d{4}-\d{2}-\d{2}$/;

      if (ddMmYyyyPattern.test(value)) {
        const [day, month, year] = value.split('-');
        date = new Date(`${year}-${month}-${day}`);
      } else if (yyyyMmDdPattern.test(value)) {
        date = new Date(value);
      } else {
        return null;
      }
    } else {
      return null;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    if (formattedDate === '1899-12-30') {
      return null;
    }

    return formattedDate;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setUploading(true);
      setFile(selectedFile);
      readExcelFile(selectedFile)
    }
    setError([]);
  };

  const conditionMap = (value = '') => {
    let str = value.trim();
    let option = "";
    if (str === '10th SSC English Medium') {
      option = 'A'
    } else if (str === '10th SSC Semi English Medium') {
      option = 'B'
    } else if (str === '10th CBSE') {
      option = 'C'
    } else if (str === '10th ICSE') {
      option = 'D'
    } else if (str === '12th HSC') {
      option = 'E'
    };

    return option
  }

  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const dataWithoutHeader = jsonData.slice(1);

        const mappedData = dataWithoutHeader
          .filter((row) => row[0] !== undefined && row[1] !== undefined)
          .map((row, index) => {
            const parseExcelDate = (excelDate) => {
              if (typeof excelDate === "number") {
                const jsDate = XLSX.SSF.parse_date_code(excelDate);
                if (!jsDate) return null;
                return moment(new Date(jsDate.y, jsDate.m - 1, jsDate.d)).format("YYYY-MM-DD");
              } else if (typeof excelDate === "string") {
                const m = moment(excelDate, ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "DD-MM-YYYY", "D-M-YYYY"], true);
                return m.isValid() ? m.format("YYYY-MM-DD") : null;
              }
              return null;
            };

            // Extract subject codes from columns after SET 3, trim and convert to uppercase
            const selectedCodes = row.slice(22)
              .filter(code => code)
              .map(code => String(code).trim().toUpperCase());

            return {
              conditionOption: row[0] ? conditionMap(row[0]) : null,
              firstName: row[1] ?? null,
              motherName: row[2] ?? null,
              fatherName: row[3] ?? null,
              surname: row[4] ?? null,
              gender: row[5] ?? null,
              address: row[6] ?? null,
              dob: row[7] ? parseExcelDate(row[7]) : null,
              schoolName: row[8] ?? null,
              email: row[9] ?? null,
              fatherOccupation: row[10] ?? null,
              motherOccupation: row[11] ?? null,
              studentMobile: row[12] ?? null,
              studentWhatsapp: row[13] ?? null,
              fatherMobile: row[14] ?? null,
              fatherWhatsapp: row[15] ?? null,
              motherMobile: row[16] ?? null,
              motherWhatsapp: row[17] ?? null,
              admissionDate: row[18] ? parseExcelDate(row[18]) : null,
              set1: row[19]?.toString()?.toUpperCase() == "YES" ? 1 : 0,
              set2: row[20]?.toString()?.toUpperCase() == "YES" ? 1 : 0,
              set3: row[21]?.toString()?.toUpperCase() == "YES" ? 1 : 0,
              sets: { set1: row[19]?.toString()?.toUpperCase() == "YES" ? 1 : 0, set2: row[20]?.toString()?.toUpperCase() == "YES" ? 1 : 0, set3: row[21]?.toString()?.toUpperCase() == "YES" ? 1 : 0 },
              selectedCodes,
            };
          });

        setTableData(mappedData);
      } catch (error) {
        console.log("err", error)
      } finally {
        setLoading(false); // stop loader
      }
    }
    reader.readAsBinaryString(file);
  };

  const handleDelete = () => {
    setFile(null);
    setTableData([]);
    setError([]);
    setExistingRecords(null)
    setCreatedRecords(null)
    setInvalidRecords([]);
    setTotalRecords(0)
  };

  const handleDownloadExcel = () => {
    const link = document.createElement("a");
    link.href = "/sample-admission.xlsx";
    link.download = "sample-admission.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Validate subject selection for a single admission record
  const validateSubjectSelection = (record, rowIndex) => {
    const errors = [];
    const conditionOption = record.conditionOption;
    const selectedCodes = record.selectedCodes || [];

    // Check if board condition exists
    if (!conditionOption) {
      errors.push("Board/Standard/Medium is required");
      return errors;
    }

    const boardCondition = boardConditionsMap[conditionOption];
    if (!boardCondition) {
      errors.push(`Invalid board condition: ${conditionOption}`);
      return errors;
    }

    const subjects = boardCondition.subjects || [];
    const rules = boardCondition.conditionMeta?.rules || [];

    // Check if subjects were provided
    if (!selectedCodes || selectedCodes.length === 0) {
      errors.push("At least one subject code is required");
      return errors;
    }

    // Validate that all entered codes exist for this board
    const validSubjectCodes = subjects.map(s => s.code);
    const invalidCodes = selectedCodes.filter(code => !validSubjectCodes.includes(code));
    if (invalidCodes.length > 0) {
      errors.push(`Invalid subject code(s) for this board: ${invalidCodes.join(', ')}`);
    }

    // Get only valid selected subjects
    const selectedSubjects = subjects.filter(s => selectedCodes.includes(s.code));

    // Check for compulsory subjects
    const compulsorySubjects = subjects.filter(s => s.isCompulsory === 1);
    const missingCompulsory = compulsorySubjects.filter(cs =>
      !selectedCodes.includes(cs.code)
    );
    if (missingCompulsory.length > 0) {
      errors.push(`Missing compulsory subject(s): ${missingCompulsory.map(s => s.name + ' (' + s.code + ')').join(', ')}`);
    }

    // Check min/max subjects
    const minSubjects = boardCondition.minSubjectsSelectable;
    const maxSubjects = boardCondition.maxSubjectsSelectable;

    if (selectedCodes.length < minSubjects) {
      errors.push(`Minimum ${minSubjects} subjects required. Currently selected: ${selectedCodes.length}`);
    }

    if (selectedCodes.length > maxSubjects) {
      errors.push(`Maximum ${maxSubjects} subjects allowed. Currently selected: ${selectedCodes.length}`);
    }

    // Check fixed selection type
    if (boardCondition.selectionType === 'fixed' && selectedCodes.length !== minSubjects) {
      errors.push(`Must select exactly ${minSubjects} subjects. Currently selected: ${selectedCodes.length}`);
    }

    // Validate rules
    rules.forEach(rule => {
      switch (rule.type) {
        case 'mutually_exclusive_pair':
          rule.pairs?.forEach(pair => {
            const [code1, code2] = pair;
            if (selectedCodes.includes(code1) && selectedCodes.includes(code2)) {
              const sub1 = subjects.find(s => s.code === code1);
              const sub2 = subjects.find(s => s.code === code2);
              errors.push(`${sub1?.name || code1} and ${sub2?.name || code2} cannot be selected together`);
            }
          });
          break;

        case 'exclude_if_selected':
          Object.entries(rule.if_selected || {}).forEach(([triggerCode, excludedCodes]) => {
            if (selectedCodes.includes(triggerCode)) {
              const violatedCodes = excludedCodes.filter(code => selectedCodes.includes(code));
              if (violatedCodes.length > 0) {
                const triggerSub = subjects.find(s => s.code === triggerCode);
                const excludedSubs = violatedCodes
                  .map(code => subjects.find(s => s.code === code)?.name || code)
                  .join(', ');
                errors.push(`${triggerSub?.name || triggerCode} cannot be selected with: ${excludedSubs}`);
              }
            }
          });
          break;

        case 'conditional_totals':
          rule.conditions?.forEach(condition => {
            let triggerSubs = [];
            let shouldCheckTotal = false;

            if (condition.when_selected_all && Array.isArray(condition.when_selected_all)) {
              triggerSubs = condition.when_selected_all;
              shouldCheckTotal = triggerSubs.every(code => selectedCodes.includes(code));
            } else if (condition.when_selected && Array.isArray(condition.when_selected)) {
              triggerSubs = condition.when_selected;
              shouldCheckTotal = triggerSubs.some(code => selectedCodes.includes(code));
            }

            if (shouldCheckTotal && triggerSubs.length > 0) {
              const totalSelected = selectedCodes.length;

              if (condition.required_total !== undefined) {
                if (totalSelected !== condition.required_total) {
                  const triggerSubNames = triggerSubs
                    .map(code => subjects.find(s => s.code === code)?.name || code)
                    .join(', ');
                  errors.push(`With ${triggerSubNames} selected, you must select exactly ${condition.required_total} subjects total. Currently selected: ${totalSelected}`);
                }
              } else {
                const minAllowed = condition.min_total || 0;
                const maxAllowed = condition.max_total || Infinity;

                if (totalSelected < minAllowed) {
                  errors.push(`With current selection, minimum ${minAllowed} subjects total required. Currently selected: ${totalSelected}`);
                }
                if (totalSelected > maxAllowed) {
                  errors.push(`With current selection, maximum ${maxAllowed} subjects total allowed. Currently selected: ${totalSelected}`);
                }
              }
            }
          });
          break;

        case 'required_any_of':
          rule.groups?.forEach(group => {
            const hasAnyFromGroup = group.subject_codes?.some(code => selectedCodes.includes(code));
            if (!hasAnyFromGroup && group.note) {
              errors.push(group.note);
            }
          });
          break;

        case 'conditional_exclude_when_selected_all':
          rule.cases?.forEach(caseItem => {
            const { when_selected_all, exclude } = caseItem;

            const allSelected = when_selected_all?.every(code => selectedCodes.includes(code));

            if (allSelected && exclude?.length > 0) {
              const violatedCodes = exclude.filter(code => selectedCodes.includes(code));

              if (violatedCodes.length > 0) {
                const triggerSubNames = when_selected_all
                  .map(code => subjects.find(s => s.code === code)?.name || code)
                  .join(', ');
                const excludedSubNames = violatedCodes
                  .map(code => subjects.find(s => s.code === code)?.name || code)
                  .join(', ');
                errors.push(`When ${triggerSubNames} are both selected, you cannot select: ${excludedSubNames}`);
              }
            }
          });
          break;
      }
    });

    return errors;
  };

  const handleSubmit = async () => {
    if (tableData.length === 0) return toast.warn("Empty excel data. Please enter atleast one record.", { theme: theme === 'dark' ? 'light' : 'dark' });

    // Validate subjects for each record
    setLoading(true);
    const subjectValidationErrors = [];

    tableData.forEach((record, index) => {
      const rowNumber = index + 2; // +2 because: +1 for array index, +1 for Excel header row
      const validationErrors = validateSubjectSelection(record, rowNumber);

      if (validationErrors.length > 0) {
        subjectValidationErrors.push({
          row: rowNumber,
          studentName: `${record.firstName || ''} ${record.surname || ''}`.trim() || 'Unknown',
          messages: validationErrors
        });
      }
    });


    // If there are subject validation errors, show them and stop
    if (subjectValidationErrors.length > 0) {
      setError(subjectValidationErrors);
      setErrorOpen(true);
      toast.error(`Found ${subjectValidationErrors.length} record(s) with subject selection errors. Please fix them and re-upload.`, {
        theme: theme === 'light' ? 'dark' : 'light',
        autoClose: 5000
      });
      return;
    }

    // If validation passes, proceed with submission
    const data = {
      admissions: tableData
    };
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/importAdmissions`, data);
      setTotalRecords(res.data.totalRecords);
      setCreatedRecords(res.data.recordCreated);
      setError(res.data.errors);
      setInvalidRecords(res.data.invalidRecords);
      setExistingRecords(res.data.existingRecordsCount)
      const resMsg = res?.data?.message
      toast.success(resMsg, { theme: theme === 'light' ? 'dark' : 'light' })
      setLoading(false);
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Internal Server Error: Failed to import admissions"
      toast.error(errMsg, { theme: theme === 'light' ? 'dark' : 'light' })
    } finally {
      setLoading(false);

    }
  };

  const handleViewSubCodes = (sub) => {
    setSubObj(sub)
    setIsSubOpen(true)
  };

  return (
    <>
      <Card className="animate-fade-in transform">
        <CardHeader color={sidenavColor} className="mb-4 mt-5 p-3">
          <div className="flex flex-col justify-between md:flex-row">
            <Typography variant="h6" color="white">
              {`Import Admissions`}
            </Typography>
            <Button
              variant="outlined"
              color="white"
              size="sm"
              className="hover:bg-white hover:text-black"
              onClick={() => navigate("/counsellor/student-list")}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back
            </Button>
          </div>
        </CardHeader>
        <CardBody className="px-1 pb-2 pt-1 md:px-2 lg:px-4">
          <div className="border-slate-200 md:px-2 mb-4">
            <button
              onClick={() => toggleAccordion(1)}
              className="w-full flex justify-between items-center p-3 text-slate-800 bg-blue-600 rounded-t-lg"
            >
              <h2 class="text-2xl font-bold text-white">Instructions</h2>
              <span className="text-white transition-transform duration-300">
                <i className={`fas ${openAccordion === 1 ? "fa-minus" : "fa-plus"}`}></i>
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordion === 1 ? "max-h-auto md:max-h-[550px]" : "max-h-0"
                }`}
            >
              <div class=" bg-blue-100 rounded-b-lg p-6 border border-gray-200">
                {/* <h2 class="text-2xl font-bold text-gray-800 mb-2">Instructions</h2> */}
                <p class="text-sm text-gray-600 mb-4">
                  Please read the instructions below carefully and enter data in the sample Excel for admission import.
                </p>

                <ul class="list-disc pl-5 space-y-2 text-gray-700">
                  <li>Download the provided sample excel and use the exact format.</li>
                  <li>Make sure all mandatory fields are filled before uploading (<span className="text-red-500">Headers marked in red text</span>).
                    <br />
                    <p className="text-sm"><span className="font-semibold me-2">Mandatory Fields:</span>
                      Board, First Name, Mother's Name, Father's Name, Surname, Gender, DOB, Father's Mobile Number
                    </p>
                  </li>
                  <li>For <span className="font-semibold">Board/Standard/Medium</span> use one of below options: (Use option from drop-down)
                    <br />
                    <p className="text-sm mb-0.5"><span className="font-semibold">A</span> - 10th SSC English Medium.</p>
                    <p className="text-sm mb-0.5"><span className="font-semibold">B</span> - 10th SSC Semi-English Medium.</p>
                    <p className="text-sm mb-0.5"><span className="font-semibold">C</span> - 10th CBSE.</p>
                    <p className="text-sm mb-0.5"><span className="font-semibold">D</span> - 10th ICSE.</p>
                    <p className="text-sm mb-0.5"><span className="font-semibold">E</span> - 12th HSC.</p>
                  </li>
                  <li>For <span className="font-semibold">Gender</span> use:- <strong>M</strong> - Male, <strong>F</strong> - Female, <strong>O</strong> - Other. (Use option from drop-down)</li>
                  <li>Specify <strong>Yes</strong> or <strong>No</strong> to indicate SET selection for each student. (Use option from drop-down)</li>
                  <li>Mobile / Whatsapp Numbers must be exactly 10 digits without (+91)</li>
                  <li>Dates must be in <span class="font-semibold">DD-MM-YYYY</span> format.</li>
                  <li>Enter subject codes for each record in separate columns immediately after the <strong>SET 3</strong> column (Refer sample excel). <Typography as="button" onClick={() => setViewSubCodes(true)} className="font-semibold hover:text-blue-500">Click here to view subject codes</Typography>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      <li className="text-red-600"><strong>Important:</strong> Subject codes must be valid for the selected Board/Standard/Medium</li>
                      <li className="text-red-600">All compulsory subjects must be included</li>
                      <li className="text-red-600">Subject selection must follow board-specific rules (min/max subjects, mutual exclusions, etc.)</li>
                      <li className="text-red-600">The system will validate all subject selections before import</li>
                    </ul>
                  </li>
                </ul>
                <p className="my-2"><strong className="text-red-500">Note: </strong> After uploading the excel click on <strong><em>Validate and Submit</em></strong>. The system will validate subject selections and display any errors. A summary of records imported, existing records, errors, and invalid records will be displayed.</p>
              </div>
            </div>
          </div>

          <hr className="mb-4" />

          <div className="w-full p-4 h-auto flex flex-col items-center justify-center">
            <div className="flex w-full flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed border-gray-300 p-4 sm:w-1/4">
              {!file ? (
                <>
                  {loading ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="loader border-4 border-gray-300 border-t-blue-600 rounded-full w-10 h-10 animate-spin"></div>
                      <span className="ml-2 text-gray-700 text-sm">Uploading and processing file...</span>
                    </div>
                  ) : (
                    <>
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center text-gray-600 cursor-pointer"
                      >
                        <i className="mb-2 text-4xl fas fa-upload" />
                        <span className="text-sm">Click to Upload Excel File</span>
                      </label>
                      <input
                        type="file"
                        id="file-upload"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </>
                  )}

                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-800">{file.name}</span>
                    <button
                      onClick={handleDelete}
                      className="text-red-500 hover:text-red-700"
                    >
                      <i className="text-xl fas fa-trash" />
                    </button>
                  </div>
                </>
              )}
            </div>
            <Typography as='button' onClick={handleDownloadExcel} className="mt-4 flex items-center p-2 rounded-md bg-blue-500 text-gray-100 hover:font-semibold">
              <i className="me-2 fas fa-download"></i>
              Click here to download sample excel file
            </Typography>
            {tableData && tableData.length > 0 && (
              <div className="mt-2">
                <div className="mt-4 flex justify-start space-x-2">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-submit rounded-lg bg-blue-600 px-4 py-1 font-bold text-white"
                  >
                    {loading ? "Processing..." : "Validate and Submit"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full flex justify-center my-4">
            <table className="w-auto border border-gray-300 text-sm shadow-md rounded-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Total Records</th>
                  <th className="px-4 py-2 border">Imported Records</th>
                  <th className="px-4 py-2 border">Existing Records</th>
                  <th className="px-4 py-2 border">Errors</th>
                  <th className="px-4 py-2 border">Invalid Records</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border text-center">{totalRecords}</td>
                  <td className="px-4 py-2 border text-center text-blue-600 font-semibold">
                    {createdRecords}
                  </td>
                  <td className="px-4 py-2 border text-center text-yellow-900 font-semibold">
                    {existingRecords}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {error.length > 0 ? (
                      <Button
                        onClick={() => setErrorOpen(true)}
                        size="sm"
                        color="red"
                      >
                        {error.length} Errors
                      </Button>
                    ) : (
                      <span className="text-green-600 font-semibold">No Errors</span>
                    )}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {invalidRecords.length > 0 ? (
                      <Button
                        onClick={() => setViewInvalid(true)}
                        size="sm"
                        color="red"
                      >
                        {invalidRecords.length} Invalid Records
                      </Button>
                    ) : (
                      <span className="text-green-600 font-semibold">--</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <hr className="my-4" />

          {tableData.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Uploaded Data (Total {tableData.length} records)</h3>
              <div className="overflow-x-scroll">
                <table className="mt-2 w-full table-auto border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border">Sr.No</th>
                      <th className="px-4 py-2 border">Board/Standard/Medium</th>
                      <th className="px-4 py-2 border">First_Name</th>
                      <th className="px-4 py-2 border">Mother_Name</th>
                      <th className="px-4 py-2 border">Father_Name</th>
                      <th className="px-4 py-2 border">Surname</th>
                      <th className="px-4 py-2 border">Gender</th>
                      <th className="px-4 py-2 border">Address</th>
                      <th className="px-4 py-2 border">Date_Of_Birth</th>
                      <th className="px-4 py-2 border">School_Name</th>
                      <th className="px-4 py-2 border">Email</th>
                      <th className="px-4 py-2 border">Father_Occupation</th>
                      <th className="px-4 py-2 border">Mother_Occupation</th>
                      <th className="px-4 py-2 border">Student_Mobile</th>
                      <th className="px-4 py-2 border">Student_Whatsapp</th>
                      <th className="px-4 py-2 border">Father_Mobile</th>
                      <th className="px-4 py-2 border">Father_Whatsapp</th>
                      <th className="px-4 py-2 border">Mother_Mobile</th>
                      <th className="px-4 py-2 border">Mother_Whatsapp</th>
                      <th className="px-4 py-2 border">Admission_Date</th>
                      <th className="px-4 py-2 border">Set_1</th>
                      <th className="px-4 py-2 border">Set_2</th>
                      <th className="px-4 py-2 border">Set_3</th>
                      <th className="px-4 py-2 border">Subjects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, index) => (
                      <tr key={index + 1}>
                        <td className="border px-2 py-2 text-left text-xs text-gray-800">
                          {index + 1}
                        </td>
                        <td className="border px-4 py-2 text-xs text-gray-800">
                          {row.conditionOption === 'A' ? "10th SSC English Medium" :
                            row.conditionOption === 'B' ? "10th SSC Semi-English Medium" :
                              row.conditionOption === 'C' ? "10th CBSE" :
                                row.conditionOption === 'D' ? "10th ICSE" :
                                  row.conditionOption === 'E' ? "12th HSC" : "Unknown"
                          }
                        </td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.firstName}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.motherName}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.fatherName}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.surname}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.gender}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.address}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.dob}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.schoolName}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.email}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.fatherOccupation}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.motherOccupation}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.studentMobile}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.studentWhatsapp}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.fatherMobile}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.fatherWhatsapp}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.motherMobile}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.motherWhatsapp}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.admissionDate}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.set1 == 1 ? " YES" : "NO"}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.set2 == 1 ? " YES" : "NO"}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">{row.set3 == 1 ? " YES" : "NO"}</td>
                        <td className="border px-4 py-2 text-xs text-gray-800">
                          <Typography as="button" onClick={() => handleViewSubCodes(row)}>
                            <i className="fas fa-eye"></i>
                          </Typography>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Errors-Dialog------------------ */}
      <Dialog
        className="z-40"
        open={errorOpen}
        size={"lg"}
        dismiss={{ outsidePress: false, escapeKey: false }}
      >
        <DialogHeader className="justify-center bg-red-100 text-center text-red-700 font-semibold">
          Subject Selection Error(s) Found
        </DialogHeader>

        <DialogBody divider>
          {error && error.length > 0 ? (
            <div className="max-h-[500px] overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Found {error.length} record(s) with subject selection issues. Please correct these errors in your Excel file and re-upload.
              </p>
              <ul className="space-y-4">
                {error.map((err, index) => (
                  <li key={index} className="border-l-4 border-red-500 bg-red-50 p-3 rounded">
                    <div className="font-semibold text-red-700 mb-2">
                      Row {err.row}: {err.studentName || 'Unknown Student'}
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {err.messages?.map((msg, idx) => (
                        <li key={idx} className="text-sm text-gray-800">
                          {msg}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 text-center">No errors found.</p>
          )}
        </DialogBody>


        <div className="flex justify-end p-4">
          <button
            onClick={() => setErrorOpen(false)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Close
          </button>
        </div>
      </Dialog>

      {/* Subject-Codes-View------------------ */}
      <Dialog
        className="z-40"
        open={isSubOpen}
        size={"md"}
        dismiss={{ outsidePress: false, escapeKey: false }}
      >
        <DialogHeader className="justify-center bg-red-100 text-center text-red-700 font-semibold">
          Subject Codes for {subObj?.firstName}
        </DialogHeader>

        <DialogBody divider>
          <div className="flex flex-wrap gap-2">
            {subObj?.selectedCodes && subObj?.selectedCodes.length > 0 ? (
              subObj?.selectedCodes.map((code, index) => (
                <Chip
                  key={index}
                  value={code}
                  className="bg-blue-100 text-blue-800 border border-blue-300"
                />
              ))
            ) : (
              <p className="text-gray-500 text-sm">No subject codes available.</p>
            )}
          </div>
        </DialogBody>

        <div className="flex justify-end p-4">
          <button
            onClick={() => { setSubObj(null), setIsSubOpen(false) }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Close
          </button>
        </div>
      </Dialog>


      {/* InvalidRecords----------------------- */}
      <Dialog
        className="z-40"
        open={viewInvalid}
        size={"lg"}
        dismiss={{ outsidePress: false, escapeKey: false }}
      >
        <DialogHeader className="justify-center bg-red-100 text-center text-red-700 font-semibold">
          Invalid Records - {invalidRecords?.length}
        </DialogHeader>
        <DialogBody divider>
          <Typography>We found errors in below records. Please correct the invalid data by following the given guidelines and re-upload the file for processing.</Typography>
          <div className="overflow-x-scroll">
            <table className="mt-2 w-full table-auto border-collapse">
              <thead>
                <tr>
                  <th className="px-2 py-1 border text-sm">Sr.No</th>
                  <th className="px-4 py-2 border text-sm">Board/Standard/Medium</th>
                  <th className="px-4 py-2 border text-sm">First_Name</th>
                  <th className="px-4 py-2 border text-sm">Mother_Name</th>
                  <th className="px-4 py-2 border text-sm">Father_Name</th>
                  <th className="px-4 py-2 border text-sm">Surname</th>
                  <th className="px-4 py-2 border text-sm">Gender</th>
                  <th className="px-4 py-2 border text-sm">Date_Of_Birth</th>
                  <th className="px-4 py-2 border text-sm">Email</th>
                  <th className="px-4 py-2 border text-sm">Student_Mobile</th>
                  <th className="px-4 py-2 border text-sm">Student_Whatsapp</th>
                  <th className="px-4 py-2 border text-sm">Father_Mobile</th>
                  <th className="px-4 py-2 border text-sm">Father_Whatsapp</th>
                  <th className="px-4 py-2 border text-sm">Mother_Mobile</th>
                  <th className="px-4 py-2 border text-sm">Mother_Whatsapp</th>
                  <th className="px-4 py-2 border text-sm">Set_1</th>
                  <th className="px-4 py-2 border text-sm">Set_2</th>
                  <th className="px-4 py-2 border text-sm">Set_3</th>
                </tr>
              </thead>
              <tbody>
                {invalidRecords.map((row, index) => (
                  <tr key={index + 1}>
                    <td className="border px-2 py-1 text-left text-xs text-gray-800">
                      {index + 1}
                    </td>
                    <td className="border px-2 py-1 text-xs text-gray-800">
                      {row.conditionOption === 'A' ? "10th SSC English Medium" :
                        row.conditionOption === 'B' ? "10th SSC Semi-English Medium" :
                          row.conditionOption === 'C' ? "10th CBSE" :
                            row.conditionOption === 'D' ? "10th ICSE" :
                              row.conditionOption === 'E' ? "12th HSC" : "Unknown"
                      }
                    </td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.firstName}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.motherName}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.fatherName}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.surname}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.gender}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.dob}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.email}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.studentMobile}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.studentWhatsapp}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.fatherMobile}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.fatherWhatsapp}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.motherMobile}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.motherWhatsapp}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.set1 == 1 ? " YES" : "NO"}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.set2 == 1 ? " YES" : "NO"}</td>
                    <td className="border px-2 py-1 text-xs text-gray-800">{row.set3 == 1 ? " YES" : "NO"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogBody>
        <div className="flex justify-end p-4">
          <button
            onClick={() => setViewInvalid(false)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Close
          </button>
        </div>
      </Dialog>

      {/* Subject-Codes-View-Condition-Wise------------------ */}
      <Dialog
        className="z-40"
        open={viewSubCodes}
        size={"xxl"}
        dismiss={{ outsidePress: false, escapeKey: false }}
      >
        <DialogHeader className="justify-center bg-red-100 text-center text-red-700 font-semibold">
          Board condition wise subject codes
        </DialogHeader>

        <DialogBody divider>
          <div className="w-full h-full px-4">
            <Typography className="font-semibold mb-2">A - 10th SSC English Medium</Typography>
            <div className="flex flex-wrap gap-2">
              {subjectCodesData?.tenthSCC && subjectCodesData?.tenthSCC?.length > 0 ? (
                subjectCodesData?.tenthSCC.map((code, index) => (
                  <div
                    key={index}
                    onClick={() => navigator.clipboard.writeText(code?.code)}
                    title="Click to copy"
                    className="cursor-pointer select-text bg-blue-100 font-semibold text-blue-800 border border-blue-300 rounded-full px-3 py-1 text-sm hover:bg-blue-200 transition"
                  >
                    {code?.code}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No subject codes available.</p>
              )}
            </div>

            <hr className="my-2" />

            <Typography className="font-semibold mb-2">B - 10th SSC Semi English Medium</Typography>
            <div className="flex flex-wrap gap-2">
              {subjectCodesData?.tenthSSCSemi && subjectCodesData?.tenthSSCSemi.length > 0 ? (
                subjectCodesData?.tenthSSCSemi.map((code, index) => (
                  <div
                    key={index}
                    onClick={() => navigator.clipboard.writeText(code?.code)}
                    title="Click to copy"
                    className="cursor-pointer select-text bg-blue-100 font-semibold text-blue-800 border border-blue-300 rounded-full px-3 py-1 text-sm hover:bg-blue-200 transition"
                  >
                    {code?.code}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No subject codes available.</p>
              )}
            </div>

            <hr className="my-2" />

            <Typography className="font-semibold mb-2">C - 10th CBSE</Typography>
            <div className="flex flex-wrap gap-2">
              {subjectCodesData?.tenthCBSE && subjectCodesData?.tenthCBSE.length > 0 ? (
                subjectCodesData?.tenthCBSE.map((code, index) => (
                  <div
                    key={index}
                    onClick={() => navigator.clipboard.writeText(code?.code)}
                    title="Click to copy"
                    className="cursor-pointer select-text bg-blue-100 font-semibold text-blue-800 border border-blue-300 rounded-full px-3 py-1 text-sm hover:bg-blue-200 transition"
                  >
                    {code?.code}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No subject codes available.</p>
              )}
            </div>

            <hr className="my-2" />

            <Typography className="font-semibold mb-2">D - 10th ICSE</Typography>
            <div className="flex flex-wrap gap-2">
              {subjectCodesData?.tenthICSE && subjectCodesData?.tenthICSE.length > 0 ? (
                subjectCodesData?.tenthICSE.map((code, index) => (
                  <div
                    key={index}
                    onClick={() => navigator.clipboard.writeText(code?.code)}
                    title="Click to copy"
                    className="cursor-pointer select-text bg-blue-100 font-semibold text-blue-800 border border-blue-300 rounded-full px-3 py-1 text-sm hover:bg-blue-200 transition"
                  >
                    {code?.code}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No subject codes available.</p>
              )}
            </div>

            <hr className="my-2" />

            <Typography className="font-semibold mb-2">E - 12th HSC</Typography>
            <div className="flex flex-wrap gap-2">
              {subjectCodesData?.twelthHSC && subjectCodesData?.twelthHSC.length > 0 ? (
                subjectCodesData?.twelthHSC.map((code, index) => (
                  <div
                    key={index}
                    onClick={() => navigator.clipboard.writeText(code?.code)}
                    title="Click to copy"
                    className="cursor-pointer select-text bg-blue-100 font-semibold text-blue-800 border border-blue-300 rounded-full px-3 py-1 text-sm hover:bg-blue-200 transition"
                  >
                    {code?.code}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No subject codes available.</p>
              )}
            </div>
          </div>
        </DialogBody>

        <div className="flex justify-end p-4">
          <button
            onClick={() => { setViewSubCodes(false) }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
          >
            Close
          </button>
        </div>
      </Dialog>
    </>
  )

}