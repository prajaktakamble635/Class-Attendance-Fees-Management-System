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
import { SubmitButton, CancelButton, UpdateButton } from "@/widgets/components";
import { useNavigate, useParams } from "react-router-dom";
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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";


export default function AdminEditExamHolder() {
    const [controller, dispatch] = useMaterialTailwindController();
    const navigate = useNavigate();
    const { sidenavColor } = controller;
    const { id } = useParams(); // get exam id from URL
    const [setData, setSetData] = useState([]);
    const [conditionData, setConditionData] = useState([]);
    const [conditionValue, setConditionValue] = useState(null);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [calendarRange, setCalendarRange] = useState([]);
    const [calendarIndex, setCalendarIndex] = useState(null);
    const [calendarDate, setCalendarDate] = useState(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [subjectData, setSubjectData] = useState([]);
    const [subjectForm, setSubjectForm] = useState({
        subject: null, maxMarks: null, examStartTime: null,
        examEndTime: null
    });
    const [formData, setFormData] = useState({ name: "GTS", set: null });
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        document.title = "Edit Exam";

        // Fetch board/standard & sets
        Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllBoardSubjectConditionData`),
            axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllSetData`)
        ]).then(([res, setList]) => {
            setConditionData(res.data.conditionData || []);
            setSetData(setList.data.setData || []);
        });


        if (id) {
            axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getExamsDetailsById/${id}`)
                .then(res => {
                    const exam = res.data.exam;
                    const timetable = res.data.timetable || [];

                    setFormData({
                        name: exam.name,
                        set: { value: exam.setId, label: exam.set || exam.setName }
                    });

                    setConditionValue({
                        value: exam.boardSubjectConditionsId || null,
                        label: `${exam?.conditionName}`
                    });

                    const from = new Date(exam.dateFrom);
                    const to = new Date(exam.dateTo);
                    setFromDate(from);
                    setToDate(to);

                    // ✅ Generate all dates between fromDate & toDate
                    const allDates = [];
                    const current = new Date(from);
                    while (current <= to) {
                        const formatted = current.toISOString().split("T")[0];
                        allDates.push(formatted);
                        current.setDate(current.getDate() + 1);
                    }

                    // ✅ Group timetable entries by date
                    const grouped = timetable.reduce((acc, t) => {
                        const existing = acc[t.examDate] || [];
                        existing.push({
                            subject: { value: t.subjectIdFk, label: t.subjectName },
                            maxMarks: t.maxMarks,
                            examStartTime: t.examStartTime,
                            examEndTime: t.examEndTime
                        });
                        acc[t.examDate] = existing;
                        return acc;
                    }, {});

                    // ✅ Merge: create calendarRange for ALL dates
                    const calendar = allDates.map(date => ({
                        date,
                        subjects: grouped[date] || [],

                    }));

                    console.log("grounped", grouped)

                    setCalendarRange(calendar);
                })
                .catch(() => toast.error("Failed to load exam details"));
            fetchSubjects(id);
        }

    }, [id]);

    useEffect(() => {
        if (conditionValue) {
            fetchSubjects(conditionValue?.value)
        }
    }, [conditionValue])

    // useEffect(()=>{
    //     if(formData.set && conditionValue){
    //         let examTitle = `${conditionValue?.label} - ${formData?.set?.label}`;
    //         setFormData((prev) => ({
    //             ...prev,
    //             name: examTitle
    //         }))
    //     }
    // },[formData.set, conditionValue]);

    const loadConditions = async (inputValue) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getBoardSubjectConditionDataForSelect?word=${inputValue}`);
            return res.data.conditionData || [];
        } catch (err) {
            return [];
        }
    };

    const fetchSubjects = async (id) => {
        // alert(id)
        try {

            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllSubjectBoardConditionWise?id=${id}`);
            setSubjectData(res.data.subjectData || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAsyncSelect = (field, newValue) => {
        if (field === "conditions") {
            if (newValue) {
                // When board/standard changes
                setConditionValue(newValue);
                fetchSubjects(newValue?.value);

                // 🧹 Reset all dependent data
                setFromDate(null);
                setToDate(null);
                setCalendarRange([]);
                setIsAddOpen(false);
                setSubjectForm({ subject: null, maxMarks: null, examStartTime: null, examEndTime: null });
                toast.info("Board/Standard changed — timetable reset");
            } else {
                // If cleared
                setConditionValue(null);
                setSubjectData([]);
                setFromDate(null);
                setToDate(null);
                setCalendarRange([]);
                setIsAddOpen(false);
                setSubjectForm({ subject: null, maxMarks: null, examStartTime: null, examEndTime: null });
            }
        } else if (field === "subject") {
            setSubjectForm((prev) => ({
                ...prev, subject: newValue,
                maxMarks: newValue?.maxMarks || "",
            }));
        }
    };

    const handleTextChange = (field, value) => {
        if (field === 'maxMarks') setSubjectForm(prev => ({ ...prev, maxMarks: value }));
        else if (field === 'examStartTime') {
            setSubjectForm((prev) => ({ ...prev, examStartTime: value }))
        } else if (field === 'examEndTime') {
            setSubjectForm((prev) => ({ ...prev, examEndTime: value }))
        } else { null }
    };

    const generateExamCalendar = () => {
        if (!fromDate || !toDate) {
            return toast.warn('Please select date range')
        } else {
            const start = new Date(fromDate);
            const end = new Date(toDate);
            const temp = [];

            for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
                const dateString = format(d, "yyyy-MM-dd");
                temp.push({ date: dateString, subjects: [] });
            };

            setCalendarRange(temp)
        }
    };

    const resetSchedule = () => {
        setFromDate(null);
        setToDate(null);
        setCalendarRange([]);
    };

    const handleOpenAddSubjectDialog = (index) => {
        if (index == null) return toast.warn("Invalid");
        setCalendarIndex(index);
        setCalendarDate(calendarRange[index]?.date);
        setIsAddOpen(true);
    };

    const closeSubjectDialog = () => {
        setCalendarIndex(null);
        setSubjectForm((prev) => ({
            ...prev,
            subject: null,
            maxMarks: null,
            examStartTime: null,
            examEndTime: null
        }))
        setCalendarDate(null);
        setIsAddOpen(false);
    };

    const handleAddSubject = () => {
        if (!subjectForm?.subject || !subjectForm?.maxMarks) return toast.warn("Select subject & max marks");

        if (!subjectForm?.examStartTime) {
            return toast.warn("Please select exam start time")
        }
        if (!subjectForm?.examEndTime) {
            return toast.warn("Please select exam end time")
        }
        const subjectExistsGlobally = calendarRange.some(item =>
            item.subjects.some(sub => sub.subject.label.toLowerCase() === subjectForm.subject.label.toLowerCase())
        );
        if (subjectExistsGlobally) return toast.warn(`${subjectForm.subject.label} already scheduled`);



        setCalendarRange(prev =>
            prev.map((item, i) =>
                i === calendarIndex
                    ? { ...item, subjects: [...item.subjects, { subject: subjectForm.subject, maxMarks: subjectForm.maxMarks, examStartTime: subjectForm?.examStartTime, examEndTime: subjectForm?.examEndTime }] }
                    : item
            )
        );
        closeSubjectDialog();
    };

    const handleRemoveSubject = (calIndex, subIndex) => {
        setCalendarRange(prev =>
            prev.map((item, i) =>
                i !== calIndex ? item : { ...item, subjects: item.subjects.filter((_, j) => j !== subIndex) }
            )
        );
    };

    const submitData = async () => {
        if (!formData.set) return toast.warn("Please select exam set");
        if (!conditionValue) return toast.warn("Please select Board/Standard");
        if (!calendarRange.length) return toast.warn("Exam timetable not scheduled");

        const formatTime = (timeValue) => {
            if (!timeValue) return null;

            // If it's already a Day.js object
            if (dayjs.isDayjs(timeValue)) {
                return timeValue.format("HH:mm:ss");
            }

            // If it's a string like "12:00 PM", parse it
            const parsedTime = dayjs(timeValue, ["hh:mm A", "HH:mm:ss", "HH:mm"]);
            return parsedTime.isValid() ? parsedTime.format("HH:mm:ss") : null;
        };

        const examTimeTableData = calendarRange.flatMap(item =>
            item.subjects.map(sub => ({
                date: item.date,
                subjectId: sub.subject.value,
                maxMarks: sub.maxMarks,
                examStartTime: formatTime(sub?.examStartTime),
                examEndTime: formatTime(sub?.examEndTime)
            }))
        );

        const payload = {
            name: formData.name,
            boardId: conditionValue.boardId,
            standardId: conditionValue.standardId,
            setId: formData.set.value,
            dateFrom: format(fromDate, "yyyy-MM-dd"),
            dateTo: format(toDate, "yyyy-MM-dd"),
            examTimeTableData,
            conditionId: conditionValue?.value
        };

        setIsSubmitting(true)

        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/superAdminApi/updateExamTimeTable/${id}`,
                payload
            );
            toast.success("Exam updated successfully");
            setIsSubmitting(false)
            navigate("/superAdmin/exam-list");
        } catch (err) {
            setIsSubmitting(false)
            toast.error(err?.response?.data?.message || "Failed to update exam");
        } finally {
            setIsSubmitting(false)
        }
    };


    const closeDialog = () => {
        setCalendarRange([]);
        setConditionValue(null);
        setFromDate('')
        setToDate("");
        setFormData({
            set: null,
            name: 'GTS'
        });
        navigate('/superAdmin/exam-list')
    };

    const loadSubjects = async (inputValue) => {
        if (!conditionValue) return [];
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/searchSubjectsByCondition`, {
                params: { id: conditionValue.value, word: inputValue }
            });
            return res.data.subjectData || [];
        } catch {
            return [];
        }
    };

    const formatTime = (time) => {
        console.log('time', time)
        if (!time) return "—";

        // Handle Date or Day.js object
        if (dayjs.isDayjs(time) || time instanceof Date) {
            return dayjs(time).format("hh:mm A");
        }

        // Convert to string and trim
        const trimmed = String(time).trim();

        // If it's in 24-hour format HH:mm:ss
        if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
            return dayjs(trimmed, "HH:mm:ss").format("hh:mm A");
        }

        // If it's in 12-hour format with AM/PM
        if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(trimmed)) {
            console.log("trimmed", trimmed);
            return dayjs(`2020-01-01 ${trimmed}`, "YYYY-MM-DD hh:mm A").format("hh:mm A");
        }


        // Default fallback
        return "—";
    };

    return (
        <>
            <Card className="animate-fade-in transform">
                <CardHeader color={sidenavColor} className="mb-4 mt-5 p-3">
                    <div className="flex flex-col justify-between md:flex-row">
                        <Typography variant="h6" color="white">
                            {`Update Exam Time Table`}
                        </Typography>
                        <Button
                            variant="outlined"
                            color="white"
                            size="sm"
                            className="hover:bg-white hover:text-black"
                            onClick={() => navigate("/superAdmin/exam-list")}
                        >
                            <i className="fas fa-arrow-left me-2"></i>
                            Back
                        </Button>
                    </div>
                </CardHeader>
                <CardBody className="px-1 pb-2 pt-1 md:px-2 lg:px-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                        <div className="col-span-12 md:col-span-6 p-2">
                            <Input
                                required
                                readOnly
                                label="Exam Title"
                                value={formData?.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-6 p-2">
                            <AsyncSelect
                                cacheOptions
                                defaultOptions={setData}
                                placeholder="Select Set"
                                value={formData?.set}
                                onChange={(value) => setFormData((prev) => ({ ...prev, set: value }))}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-6 p-2">
                            <div className="border border-gray-200 rounded-lg w-full h-36  p-3">
                                <Typography className="text-start text-xl font-bold mb-4">Select Board/Standard</Typography>
                                <AsyncSelect
                                    isClearable
                                    cacheOptions
                                    placeholder="Search and Select Board / Standard..."
                                    defaultOptions={conditionData || []}
                                    loadOptions={loadConditions}
                                    onChange={(value) => handleAsyncSelect("conditions", value)}
                                    value={conditionValue}
                                />
                            </div>
                        </div>
                        <div className="col-span-12 md:col-span-6 p-2 mb" >
                            <div className="border border-gray-200 rounded-lg w-full min-h-36 h-auto p-3 flex flex-col items-center">
                                <Typography className="text-xl font-bold mb-3 text-center">Select Date Range</Typography>
                                <div className="flex flex-col md:flex-row mb-5">
                                    {/* From Date */}
                                    <div className="mx-2 mb-4 md:mb-0">
                                        <Typography className="font-semibold mb-1">From Date</Typography>
                                        <DatePicker
                                            selected={fromDate}
                                            onChange={(date) => {
                                                if (!date) return;
                                                const localDate = date.toLocaleDateString('en-CA');
                                                setFromDate(localDate);
                                                if (toDate && date > toDate) {
                                                    setToDate(null);
                                                }
                                            }}
                                            scrollableYearDropdown
                                            yearDropdownItemNumber={100}
                                            dateFormat="dd-MM-yy"
                                            placeholderText="dd-mm-yy"
                                            minDate={new Date()}
                                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* To Date */}
                                    <div className="mx-2">
                                        <Typography className="font-semibold mb-1">To Date</Typography>
                                        <DatePicker
                                            selected={toDate}
                                            onChange={(date) => {
                                                if (!date) return;
                                                const localDate = date.toLocaleDateString('en-CA');
                                                setToDate(localDate)
                                            }}
                                            minDate={fromDate || new Date()}
                                            scrollableYearDropdown
                                            yearDropdownItemNumber={100}
                                            disabled={!fromDate}
                                            dateFormat="dd-MM-yy"
                                            placeholderText="dd-mm-yy"
                                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="w-full flex flex-wrap items-center justify-center">
                                    <Button
                                        variant="outlined"
                                        color="red"
                                        onClick={resetSchedule}
                                        className="mx-2"
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={generateExamCalendar}
                                        className="mx-2"
                                    >
                                        Generate Calendar
                                    </Button>
                                </div>
                            </div>
                        </div>
                        {calendarRange && calendarRange.length > 0 ? (
                            <div className="col-span-12 p-2">
                                <div className="border border-gray-200 rounded-lg w-full min-h-36 h-auto p-3">
                                    <Typography className="text-xl font-bold mb-3 text-center">Exam Schedule Calendar</Typography>
                                    <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4">
                                        {calendarRange.map((item, index) => (
                                            <div className="col-span-12 md:col-span-4 border-2 border-gray-200 p-3 rounded-lg">
                                                <Typography className="font-semibold mb-2" >{item?.date ? dayjs(item.date).format("dddd, DD MMM YYYY") : 'Invalid Date'}</Typography>
                                                {item.subjects && item.subjects.length == 0 ? (
                                                    <p className="text-center">No Subjects Added Yet.</p>
                                                ) : item.subjects.map((s, i) => (
                                                    <div key={i + 1}>
                                                        <div className="w-full flex items-center">
                                                            <Tooltip content="remove">
                                                                <Typography as="button" onClick={() => handleRemoveSubject(index, i)}>
                                                                    <i className="fas fa-trash text-xs me-2 text-red-500"></i>
                                                                </Typography>
                                                            </Tooltip>
                                                            <p className="text-xs me-1">{s.subject?.label}</p>
                                                            <p className="text-xs me-1">{s.maxMarks} marks</p>
                                                        </div>
                                                        <p className="text-xs my-1">
                                                            <span className="font-semibold me-1">Exam Time:</span>
                                                            {`${formatTime(s?.examStartTime || '')} - ${formatTime(s?.examEndTime || '')}`}
                                                        </p>
                                                    </div>
                                                ))}
                                                <Button
                                                    variant="outlined"
                                                    size="sm"
                                                    fullWidth
                                                    className="mt-3"
                                                    onClick={() => handleOpenAddSubjectDialog(index)}
                                                >
                                                    <i className="fas fa-add me-2"></i>
                                                    Add Subjects
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </CardBody>
                <hr />
                <CardFooter className="gap-1 self-end">
                    <CancelButton onClick={closeDialog} />
                    <UpdateButton disabled={isSubmitting} isSubmitting={isSubmitting} onClick={submitData} />
                </CardFooter>
            </Card>

            {/* //-----add-subject-dialog------  */}
            <Dialog
                className="z-40"
                open={isAddOpen}
                size={"md"}
                dismiss={{ outsidePress: false, escapeKey: false }}
            >
                <DialogHeader className="justify-center bg-gray-100 text-center">
                    Add Subject (Exam Date - {dayjs(calendarDate).format("DD MMM, YYYY")})
                </DialogHeader>
                <DialogBody divider>
                    <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-1">
                        <div>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <TimePicker
                                    label="Select Start time *"
                                    ampm
                                    minutesStep={1}
                                    value={subjectForm?.examStartTime}
                                    onChange={(newValue) => handleTextChange("examStartTime", newValue)}
                                    slotProps={{
                                        popper: {
                                            modifiers: [
                                                {
                                                    name: 'zIndex', enabled: true, phase: 'write', fn: ({ state }) => {
                                                        state.styles.popper.zIndex = 9999;
                                                    }
                                                }
                                            ],
                                        },
                                        textField: {
                                            className:
                                                "w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500",
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </div>
                        <div>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <TimePicker
                                    label="Select End time *"
                                    ampm
                                    minutesStep={1}
                                    value={subjectForm?.examEndTime}
                                    onChange={(newValue) => handleTextChange("examEndTime", newValue)}
                                    slotProps={{
                                        popper: {
                                            modifiers: [
                                                {
                                                    name: 'zIndex', enabled: true, phase: 'write', fn: ({ state }) => {
                                                        state.styles.popper.zIndex = 9999;
                                                    }
                                                }
                                            ],
                                        },
                                        textField: {
                                            className:
                                                "w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500",
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </div>

                        <AsyncSelect
                            required
                            cacheOptions
                            defaultOptions={subjectData}
                            loadOptions={loadSubjects}
                            placeholder="Search and Select Subject..."
                            value={subjectForm?.subject}
                            onChange={(value) => handleAsyncSelect("subject", value)}
                        />
                        <Input
                            required
                            label="Maximum Marks"
                            value={subjectForm?.maxMarks}
                            onChange={(e) => handleTextChange("maxMarks", e.target.value)}
                        />
                    </div>
                </DialogBody>
                <DialogFooter className="bg-gray-100">
                    <CancelButton onClick={closeSubjectDialog} />
                    <SubmitButton onClick={handleAddSubject} />
                </DialogFooter>
            </Dialog>
        </>
    )
}
