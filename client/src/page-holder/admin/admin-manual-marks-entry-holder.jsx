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

export default function AdminManualMarksEntry() {
    
    const navigate = useNavigate();
    const [controller] = useMaterialTailwindController();
    const { sidenavColor } = controller;

    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [examSessions, setExamSessions] = useState([]);
    const [selectedExamSession, setSelectedExamSession] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [marksEntries, setMarksEntries] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllStudentsData`),
        ])
        .then(([studentsRes]) => {
            setStudents(studentsRes.data.studentData || []);
        })
        .catch((err) => {
            console.error(err);
            toast.error("Failed to fetch initial data.");
        });
    },[]);

    const loadStudents = async (inputValue, callback) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentForSelect`, {
                params: { query: inputValue },
            });
            callback(res.data.studentData);
        } catch (err) {
            console.error(err);
            callback([]);
        }
    };

    const fetchExamSessions = async (conditionId, studentId) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getExamSessionsForStudent`, {
                params: { conditionId, studentId },
            });
            setExamSessions(res.data.examSessions || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch exam sessions.");
        }
    };

    const fetchSubjects = async () => {
      const data = {
        studentId: selectedStudent?.value,
        examSessionId: selectedExamSession?.value
      }
        try {
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getSubjectsForStudent`, data);
          const subjData = res.data.subjects || [];
          setSubjects(subjData);
      
          // Initialize marks entries
          setMarksEntries(
            subjData.map((s) => ({
              subjectId: s.value,
              label: s.label,
              maxMarks: s.maxMarks,
              marks: s.marks || "", // empty input initially
            }))
          );
        } catch (err) {
          console.error(err);
          toast.error("Failed to fetch subjects.");
        }
    };      

    const handleSelectStudent = (selectedOption) => {
        if(selectedOption){
            setSelectedStudent(selectedOption);
            fetchExamSessions(selectedOption.conditionId, selectedOption.value);
        }else{
            setSelectedStudent(null);
            setExamSessions([]);
            setSubjects([]);
            setSelectedExamSession(null);
            setSelectedSubject(null);
            setMarksEntries([]);
        }
    };

    const handleSubmitMarks = async () => {
        if (!selectedStudent || !selectedExamSession || marksEntries.length === 0) {
          return toast.error("Please select student, exam session, and enter marks.");
        }

        if (
          marksEntries.some((m) =>
            (m.marks === "" || isNaN(Number(m.marks))) &&
            m.marks !== "A"
          )
        ) {
          return toast.error("Please enter valid marks for all subjects.");
        }
      
        const payload = {
          studentId: selectedStudent.value,
          examSessionId: selectedExamSession.value,
          subjectData: marksEntries.map((m) => ({
            subjectId: m.subjectId,
            isAbsent: m.marks === 'A' ? true: false,
            marks: Number(m.marks || 0),
            outOfMarks: m.maxMarks,
          })),
        };
      
        try {
          setIsSubmitting(true);
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/superAdminApi/manuallyAddStudentMark`,
            payload
          );
          toast.success(res.data.message || "Marks submitted successfully!");
          navigate("/superAdmin/marks-entry");
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.message || "Failed to submit marks.");
        } finally {
          setIsSubmitting(false);
        }
    };

    return (
        <>
            <Card className="animate-fade-in transform min-h-screen">
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
                          onClick={() => navigate('/superAdmin/marks-entry')}
                        >
                            Back
                        </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="px-2 py-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Typography className="font-semibold mb-2">
                                Select Student <span className="text-red-500">*</span>
                            </Typography>
                            <AsyncSelect
                                isClearable
                                cacheOptions
                                defaultOptions={students || []}
                                loadOptions={loadStudents}
                                placeholder="Search Students..."
                                value={selectedStudent}
                                onChange={handleSelectStudent}
                            />
                        </div>
                        <div >
                            <Typography className="font-semibold mb-2">
                                Select Exam Session <span className="text-red-500">*</span>
                            </Typography>
                            <AsyncSelect
                                isClearable
                                cacheOptions
                                defaultOptions={examSessions}
                                placeholder="Select Exam Session..."
                                value={selectedExamSession}
                                onChange={(value) => setSelectedExamSession(value)}
                            />
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                            <Button
                              onClick={() => fetchSubjects()}
                            >
                              Fetch Subjects
                            </Button>
                        </div>
                    </div>

                    <hr className="my-4 border border-blue-600" />

                    {marksEntries.length > 0 && (
                      <div className="mt-6">
                        <Typography className="font-semibold text-lg mb-3">
                          Enter Marks for Each Subject
                        </Typography>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {marksEntries.map((entry, index) => (
                            <div
                              key={entry.subjectId}
                              className="border border-gray-300 rounded-lg p-3 shadow-sm bg-white"
                            >
                              <Typography className="font-medium text-gray-700 mb-2">
                                {entry.label}
                              </Typography>
                        
                              <div className="flex items-center gap-3">
                                <Input
                                  type="text"
                                  label="Marks"
                                  value={entry.marks}
                                  onChange={(e) => {
                                    let val = e.target.value;
                                  
                                    // Allow empty (clear input)
                                    if (val === "") {
                                      setMarksEntries((prev) =>
                                        prev.map((item, i) =>
                                          i === index ? { ...item, marks: "" } : item
                                        )
                                      );
                                      return;
                                    }
                                  
                                    // Allow A / a
                                    if (val.toLowerCase() === "a") {
                                      setMarksEntries((prev) =>
                                        prev.map((item, i) =>
                                          i === index ? { ...item, marks: "A" } : item
                                        )
                                      );
                                      return;
                                    }
                                  
                                    // Allow digits with single decimal point
                                    if (!/^\d*\.?\d*$/.test(val)) return;
                                  
                                    // Allow typing "." or "12." without breaking
                                    if (val === "." || val.endsWith(".")) {
                                      setMarksEntries((prev) =>
                                        prev.map((item, i) =>
                                          i === index ? { ...item, marks: val } : item
                                        )
                                      );
                                      return;
                                    }
                                  
                                    let numValue = val;
                                    if (isNaN(numValue)) return;
                                  
                                    // Prevent negative
                                    if (numValue < 0) numValue = 0;
                                  
                                    // Max marks check
                                    const max = Number(entry.maxMarks);
                                    if (numValue > max) {
                                      toast.warning(`Entered marks exceed maximum marks for ${entry.label}`);
                                      numValue = max;
                                    }
                                  
                                    // Store as Number → 25.0 becomes 25, 12.5 stays 12.5
                                    setMarksEntries((prev) =>
                                      prev.map((item, i) =>
                                        i === index ? { ...item, marks: numValue } : item
                                      )
                                    );
                                  }}
                                  className="flex-1"
                                />


                                <Typography className="text-sm text-gray-600">
                                  / {entry.maxMarks}
                                </Typography>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    
                    <div className="w-full flex justify-center md:justify-end mt-4">
                    {marksEntries.length > 0 && (
                        <>
                            <hr className="my-4 border border-blue-600"  />
                            <div className="mt-6 flex justify-end">
                              <Button
                                color={sidenavColor}
                                onClick={handleSubmitMarks}
                                disabled={isSubmitting}
                                >
                                {isSubmitting ? "Submitting..." : "Submit Marks"}
                              </Button>
                            </div>
                            </>
                    )}

                    </div>

                </CardBody>
            </Card>
        </>
    )

}