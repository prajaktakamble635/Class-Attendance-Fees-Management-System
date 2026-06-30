import { useMaterialTailwindController } from "@/context/index.jsx";
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Typography,
} from "@material-tailwind/react";
import axios from "axios";
import { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function AdminAddAttendanceHolder() {
    const navigate = useNavigate();
    const [controller] = useMaterialTailwindController();
    const { sidenavColor } = controller;

    const [conditionData, setConditionData] = useState([]);
    const [conditionValue, setConditionValue] = useState(null);
    const [subjectOptions, setSubjectOptions] = useState([]);
    const [subjectValue, setSubjectValue] = useState(null);
    const [examSessionOptions, setExamSessionOptions] = useState([]);
    const [examSessionValue, setExamSessionValue] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 🔹 Fetch conditions on load
    useEffect(() => {
        document.title = "Attendance Sheet Generator";
        fetchConditions();
    }, []);

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

    // ✅ Optimized condition select handler
    // ✅ When selecting board/standard
    const handleConditionSelect = async (newValue) => {
        setConditionValue(newValue);
        setSubjectValue(null);
        setExamSessionValue(null);
        setSubjectOptions([]);
        setExamSessionOptions([]);

        if (newValue && newValue.value) {
            setIsLoading(true);
            try {
                // Only fetch exam sessions
                const sessionsRes = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/superAdminApi/getExamSessionsByCondition`,
                    { params: { conditionId: newValue.value } }
                );
                setExamSessionOptions(sessionsRes.data.sessionData || []);
            } catch (err) {
                console.error("Error loading exam sessions:", err);
                toast.error("Failed to load exam sessions");
            } finally {
                setIsLoading(false);
            }
        }
    };

    // ✅ When selecting exam session (set)
    const handleExamSessionSelect = async (newValue) => {
        setExamSessionValue(newValue);
        setSubjectValue(null);
        setSubjectOptions([]);

        if (newValue && newValue.value) {
            setIsLoading(true);
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/superAdminApi/getSubjectsByExamSession`,
                    { params: { examSessionsTblId: newValue.value } }
                );
                setSubjectOptions(res.data.subjects || []);
            } catch (err) {
                console.error("Error loading subjects:", err);
                toast.error("Failed to load subjects for selected set");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSubjectSelect = (newValue) => {
        setSubjectValue(newValue);
    };

    const handleGenerateAttendance = async () => {
        if (!conditionValue)
            return toast.warn("Please select Board/Standard first");
        if (!examSessionValue) return toast.warn("Please select Exam Session");

        setIsGenerating(true);
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/superAdminApi/generateAttendanceSheet`,
                {
                    params: {
                        boardSubjectConditionsTblId: conditionValue?.value,
                        subjectId: subjectValue?.value,
                        examSessionsTblId: examSessionValue?.value,
                    },
                    responseType: "blob",
                }
            );

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                `${examSessionValue?.label}-attendance-sheet.pdf`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Attendance sheet downloaded successfully!");
        } catch (err) {
            console.error("Error generating attendance sheet:", err);
            toast.error("Failed to generate attendance sheet");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClearAll = () => {
        setConditionValue(null);
        setSubjectValue(null);
        setExamSessionValue(null);
        setSubjectOptions([]);
        setExamSessionOptions([]);
    };

    return (
        <Card className="animate-fade-in transform">
            <CardHeader color={sidenavColor} className="mb-4 mt-5 p-3">
                <div className="flex flex-col justify-between md:flex-row">
                    <Typography variant="h6" color="white">
                        Attendance Management
                    </Typography>
                    {/* Optional View Button */}
                    {/* <Button
            variant="outlined"
            color="white"
            size="sm"
            className="hover:bg-white hover:text-black"
            onClick={() => navigate("/superAdmin/attendance-list")}
          >
            <i className="fas fa-list me-2"></i>
            View Attendance Sheets
          </Button> */}
                </div>
            </CardHeader>

            <CardBody className="px-2 py-4 md:px-6 min-h-[300px]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Board/Standard */}
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

                    {/* Exam Session */}
                    <div>
                        <Typography className="font-semibold mb-2">Select Set</Typography>
                        <AsyncSelect
                            isClearable
                            cacheOptions
                            defaultOptions={examSessionOptions}
                            placeholder={isLoading ? "Loading exam sessions..." : "Select Exam Session..."}
                            isDisabled={isLoading}
                            value={examSessionValue}
                            onChange={handleExamSessionSelect}
                        />
                    </div>

   <div >
                        <Typography className="font-semibold mb-2">
                            Select Subject
                        </Typography>
                        <AsyncSelect
                            isClearable
                            cacheOptions
                            defaultOptions={subjectOptions}
                            placeholder={
                                isLoading ? "Loading subjects..." : "Select Subject..."
                            }
                            isDisabled={isLoading}
                            value={subjectValue}
                            onChange={handleSubjectSelect}
                        />
                    </div>
                    
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center mt-8 gap-4">
                    <Button
                        color="blue"
                        size="lg"
                        onClick={handleGenerateAttendance}
                        disabled={isGenerating || isLoading}
                    >
                        {isGenerating ? "Generating..." : "Generate Attendance Sheet"}
                    </Button>

                    <Button
                        color="red"
                        size="lg"
                        variant="outlined"
                        onClick={handleClearAll}
                    >
                        Clear All
                    </Button>
                </div>
            </CardBody>

            <CardFooter className="text-center">
                <Typography className="text-gray-500 text-sm">
                    Attendance Sheet will be generated as a downloadable PDF.
                </Typography>
            </CardFooter>
        </Card>
    );
}
