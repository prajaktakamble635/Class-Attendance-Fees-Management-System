import { handleError } from "@/hooks/errorHandling";
import { TableCell, TableHeaderCell, TablePagination } from "@/widgets/components";
import { Button, Card, Typography } from "@material-tailwind/react";
import axios from "axios";
import { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import moment from "moment";
import * as XLSX from "xlsx";


export default function OverallPerformance(props){

    const {
        conditionData,
        fetchExamSessions,
        examSessionOptions,
    } = props;

    const [conditionValue, setConditionValue] = useState(null);
    const [examSessionValue, setExamSessionValue] = useState(null);
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

    const handleConditionSelect = async(newValue) => {
        setConditionValue(newValue);
        setExamSessionValue(null);
        if (newValue) await fetchExamSessions(newValue.value);
    };

    const handleFetchAllStudents = async(currentPage = 1, perPage = 50) => {
        if(!conditionValue){
            return toast.warn("Please select Board / Standard");
        }
        if(!examSessionValue){
            return toast.warn('Please select Exam Session')
        };
        try{
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentOverallPerformance`, {
                currentPage, perPage, setId: examSessionValue?.setIdFk, conditionId: conditionValue?.value,
            })
            const {tableRecords, tableData} = res.data;
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
              totalRecords:tableRecords,
            });
        }catch(err){
            toast.error("Internal Server Error: Failed to fetch report")
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
      axios
        .post(
          `${import.meta.env.VITE_API_URL
          }/api/superAdminApi/getStudentOverallPerformance`,
          { currentPage: 1, perPage: 1000, setId: examSessionValue?.setIdFk, conditionId:conditionValue?.value },
        )
        .then(async (response) => {
          if (response.status === 200) {
            processCSVData(response.data.tableData);
          }
        })
        .catch((errors) => {
         console.error("Error preparing download:", errors);
          switch (errors.response.status) {
            case 401:
              navigate("/auth/sign-in", { replace: true });
              break;
            case 403:
              navigate("/superAdmin/dashboard", { replace: true });
              break;
            default:
          }
        });
    };

    const processCSVData = (tempData) => {
      const date = new Date();
      const exportDate = moment(date).format("Do MMM YYYY");
    
      let csvDataTemp = [];

       // 💡 Title Row
        csvDataTemp.push(["", "", "Students Overall Performance"]);
        csvDataTemp.push([]);
    
      csvDataTemp.push(["", "Export Date", exportDate]);

      csvDataTemp.push([]);

      csvDataTemp.push([
        "",
        "Board:",
        conditionValue?.board || "",    // replace with your actual variable
        "Standard:",
        conditionValue?.standard || "", // replace with your actual variable
        "Medium:",
        conditionValue?.medium || "",   // replace with your actual variable
        "Set:",
        examSessionValue?.label || ""       // replace with your actual variable
      ]);

      csvDataTemp.push([]);

      csvDataTemp.push(["","Exam Date Range:", examSessionValue?.examDateRange || ""]); // replace with your actual variable
    
      csvDataTemp.push([]);
      // Subject headers
      const subjectHeaders = subjectMap.map((_, index) => `Subject_${index + 1}`);

        // Main header row
        csvDataTemp.push([
          "Sr.No.",
          "Roll No",
          "Student Name",
          ...subjectHeaders,
          "Total Percentage",
        ]);

        // Add data rows
        tempData.forEach((student, index) => {
          const row = [
            index + 1,
            student.rollNo || "",
            student.fullName || "",
          ];
      
          // Loop through subjects in order
          subjectMap.forEach((sub) => {
            const value = student[sub.label];
            row.push(value === "NA" ? "NA" : value);
          });
      
          // Add total percentage at the end
          row.push(student.totalPercentage || "");
      
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

      const fileName = `overall-performance-(${conditionValue?.label})-${moment().format("YYYY-MM-DD-HH-mm-ss")}.xlsx`;

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

    return(
        <Card className="w-full h-auto min-h-screen px-2 py-4 md:px-6">
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
            </div>
            <div className="flex flex-col md:flex-row justify-center mt-8">
                <Button
                    color="blue"
                    size="md"
                    onClick={()=>handleFetchAllStudents(1, 50)}
                    disabled={isFetching}
                    className="me-2 mb-4 md:mb-0"
                >
                    {isFetching ? "Fetching" : "Fetch Report"}
                </Button>
            </div>
            <hr className="my-4 border border-blue-400" />
            {tableData.length > 0 && (
                <>
                    <div className="w-full my-4 flex items-center justify-center md:justify-end">
                        <Button
                            size="sm"
                            onClick={()=>prepareForDownload()}
                            className="me-2"
                        >
                            Export Excel
                        </Button>
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
                                    <TableHeaderCell
                                      key="totalPercentage"
                                      columnName="totalPercentage"
                                      text="Total_Percentage"
                                      orderBy={tableProp.orderBy}
                                      handleOrderBy={handleOrderBy}
                                      isOrderByAvailable={true}
                                      orderDirection={tableProp.orderDirection}
                                    />
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
                                ): tableData.map((rowObj, index) => (   
                                    <tr key={rowObj.id}>
                                        <td className="items-center border-b border-blue-gray-50 px-2 py-2">
                                          <div className="w-full flex items-center justify-start">
                                            {index + 1}.
                                            {index === 0 && (
                                               <i className="fas fa-medal text-yellow-700 ms-2"></i>
                                            )}
                                            {index === 1 && (
                                               <i className="fas fa-medal text-gray-400 ms-2"></i>
                                            )}
                                            {index === 2 && (
                                               <i className="fas fa-medal text-brown-700 ms-2"></i>
                                            )}
                                          </div>
                                        </td>
                                        <TableCell text={rowObj?.rollNo || "--"} />
                                        <TableCell text={rowObj?.fullName || "--"} />
                                        {subjectMap && subjectMap.length > 0 ? (
                                            subjectMap.map((s) => (
                                                <TableCell 
                                                     key={s.label}
                                                     text={rowObj[s.label] === "NA" ? "NA" : (rowObj[s.label] || "--")}
                                                   />
                                            ))
                                        ) : null}
                                         <TableCell text={rowObj?.totalPercentage || "--"} />
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
            )}
        </Card>
    )
}