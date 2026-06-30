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
import AsyncSelect from "react-select/async"
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export default function AdminAddExamHolder() {

    const navigate = useNavigate();
    const [controller, dispatch] = useMaterialTailwindController();
    const { sidenavColor } = controller;
    const [setData, setSetData] = useState([]);
    const [conditionData, setConditionData] = useState([]);
    const [conditionValue, setConditionValue] = useState(null);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [calendarRange, setCalendarRange] = useState([]);
    const [calendarIndex, setCalendarIndex] = useState(null);
    const [calendarDate, setCalendarDate] = useState(null)
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [subjectData, setSubjectData] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subjectForm, setSubjectForm] = useState({
        subject: null,
        maxMarks: null,
        examStartTime: null,
        examEndTime: null
    });
    const [formData, setFormData] = useState({
        name: 'GTS',
        set: null
    })
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split("-");
        return `${day}-${month}-${year}`;
    };

    // Convert from dd-mm-yyyy to yyyy-mm-dd for saving in <input type="date">
    const parseDate = (dateStr) => {
        if (!dateStr) return "";
        const [day, month, year] = dateStr.split("-");
        return `${year}-${month}-${day}`;
    };

    React.useEffect(() => {
        document.title = "Gurukul Academy Test Series";
    }, []);

    useEffect(() => {
        Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllBoardSubjectConditionData`),
            axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllSetData`)
        ]).then(([res, setList]) => {
            setConditionData(res.data.conditionData);
            setSetData(setList.data.setData)
        })
    }, []);

    // useEffect(()=>{
    //     if(formData.set && conditionValue){
    //         let examTitle = `${conditionValue?.label} - ${formData?.set?.label}`;
    //         setFormData((prev) => ({
    //             ...prev,
    //             name: examTitle
    //         }))
    //     }
    // },[formData.set, conditionValue])

    const loadConditions = async (inputValue) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getBoardSubjectConditionDataForSelect?word=${inputValue}`);
            return res.data.conditionData
        } catch (err) {
            return []
        }
    };

    const fetchSubjects = async (id) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllSubjectBoardConditionWise?id=${id}`);
            setSubjectData(res.data.subjectData)
        } catch (err) {
            console.log('Error', err)
        }
    }

    const handleTextChange = (field, value) => {
        if (field == 'fromDate') {
            setFromDate(value)
        } else if (field == 'toDate') {
            setToDate(value)
        } else if (field == 'maxMarks') {
            setSubjectForm((prev) => ({ ...prev, maxMarks: value }))
        } else if (field === 'examStartTime') {
            setSubjectForm((prev) => ({ ...prev, examStartTime: value }))
        } else if (field === 'examEndTime') {
            setSubjectForm((prev) => ({ ...prev, examEndTime: value }))
        } else { null }
    };

    const handleAsyncSelect = (field, newValue) => {
        if (field === 'conditions') {
            if (newValue) {
                setConditionValue(newValue)
                fetchSubjects(newValue?.value)
            } else {
                setConditionValue(null)
                setSubjectData([])
            }
        } else if (field === 'subject') {
            let newLabel = newValue?.label?.trim();
            setSubjectForm((prev) => ({
                ...prev,
                subject: newValue,
                maxMarks: newValue?.maxMarks
            }))
        } else {
            null
        }
    }

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
        setFromDate("");
        setToDate("");
        setCalendarRange([])
    };

    const handleOpenAddSubjectDialog = (index) => {
        if (index === null || index === undefined) {
            toast.warn("Invalid");
            return;
        }
        const dateObj = calendarRange[index];
        setCalendarIndex(index);
        setCalendarDate(dateObj?.date)
        setIsAddOpen(true)
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
        setCalendarDate(null)
        setIsAddOpen(false)
    };

    const handleAddSubject = () => {
        if (calendarIndex === null || calendarIndex === undefined) {
            toast.warn("Invalid");
            return;
        }
        if (!subjectForm?.subject) {
            return toast.warn("Please select subject")
        }
        if (!subjectForm?.maxMarks) {
            return toast.warn("Please select maximum marks")
        }
        if (!subjectForm?.examStartTime) {
            return toast.warn("Please select exam start time")
        }
        if (!subjectForm?.examEndTime) {
            return toast.warn("Please select exam end time")
        }
        const subjectExistsGlobally = calendarRange.some(item =>
            item.subjects.some(sub =>
                sub?.subject.label?.toLowerCase() === subjectForm?.subject?.label?.toLowerCase()
            )
        );
        if (subjectExistsGlobally) {
            toast.warn(`${subjectForm?.subject?.label} is already scheduled on another date`);
            return;
        }
        setCalendarRange(prev =>
            prev.map(item =>
                item.date == calendarDate
                    ? {
                        ...item,
                        subjects: [...item.subjects, { subject: subjectForm?.subject, maxMarks: subjectForm?.maxMarks, examStartTime: subjectForm?.examStartTime, examEndTime: subjectForm?.examEndTime }]
                    }
                    : item
            )
        );
        closeSubjectDialog()
    };

    const handleRemoveSubject = (calIndex, subIndex) => {
        setCalendarRange(prev =>
            prev.map((item, i) => {
                if (i !== calIndex) return item;

                const updatedSubjects = item.subjects.filter((_, j) =>
                    j !== subIndex
                )

                return { ...item, subjects: updatedSubjects }
            })
        )
    }

    const submitData = async () => {
        if (!formData.set) {
            return toast.warn("Please exam set")
        } else if (!conditionValue) {
            return toast.warn("Please select Board / Standard")
        } else if (calendarRange.length === 0) {
            return toast.warn("Exam timetable not schedule yet. Please select date rage and add time table.")
        } else {
            setIsSubmitting(true)
            const examTimeTableData = calendarRange.flatMap(item =>
                item.subjects.map(sub => ({
                    date: item.date,
                    subjectId: sub?.subject?.value,
                    maxMarks: sub?.maxMarks,
                    examStartTime: sub?.examStartTime ? dayjs(sub?.examStartTime).format("HH:mm:ss") : null,
                    examEndTime: sub?.examEndTime ? dayjs(sub?.examEndTime).format("HH:mm:ss") : null
                }))
            );
            const data = {
                name: formData?.name,
                boardId: conditionValue?.boardId,
                standardId: conditionValue?.standardId,
                setId: formData?.set?.value,
                dateFrom: fromDate,
                dateTo: toDate,
                examTimeTableData: examTimeTableData,
                conditionId: conditionValue?.value
            };
            try {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/addExamTimeTable`, data);
                closeDialog()
                toast.success("Exam Scheduled Successfully")
            } catch (err) {
                setIsSubmitting(false)
                const errMsg = err?.response?.data?.message || "Internal Server Error: Failed add exam schedule"
                toast.error(errMsg)
            } finally {
                setIsSubmitting(false)
            }
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
        setIsSubmitting(false)
    };

    const handleFromDateChange = (date) => {
        setFromDate(date);
        if (toDate && date > toDate) {
            setToDate(null); // reset if invalid
        }
    };

    // Convert to dd-mm-yyyy for backend or display
    const getFormattedDate = (date) => (date ? format(date, "dd-MM-yyyy") : "");

    // Load subjects dynamically while typing
    const loadSubjects = async (inputValue) => {
        if (!conditionValue) {
            toast.warn("Please select Board/Standard first");
            return [];
        }

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/superAdminApi/searchSubjectsByCondition`,
                {
                    params: {
                        id: conditionValue?.value,
                        word: inputValue,
                    },
                }
            );

            // Convert API response into AsyncSelect options
            return res?.data?.subjectData || []
        } catch (err) {
            console.error("Error loading subjects:", err);
            return [];
        }
    };

    return (
        <>
            <Card className="animate-fade-in transform min-h-screen">
                <CardHeader color={sidenavColor} className="mb-4 mt-5 p-3">
                    <div className="flex flex-col justify-between md:flex-row">
                        <Typography variant="h6" color="white">
                            {`Add Exam Time Table`}
                        </Typography>
                        <Button
                            variant="outlined"
                            color="white"
                            size="sm"
                            className="hover:bg-white hover:text-black"
                            onClick={() => navigate("/superAdmin/exam-list")}
                        >
                            <i className="fas fa-add me-2"></i>
                            View Exams
                        </Button>
                    </div>
                </CardHeader>
                <CardBody className="px-1 pb-2 pt-1 md:px-2 lg:px-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                        <div className="col-span-12 md:col-span-6 p-2">
                            <Input
                                required
                                // disabled
                                readOnly
                                label="Exam Title "
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
                                            showMonthDropdown
                                            showYearDropdown
                                            scrollableYearDropdown
                                            yearDropdownItemNumber={100}
                                            popperPlacement="bottom-start"
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
                                            disabled={!fromDate}
                                            showMonthDropdown
                                            showYearDropdown
                                            scrollableYearDropdown
                                            yearDropdownItemNumber={100}
                                            popperPlacement="bottom-start"
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
                                                    <>
                                                        <div className="w-full flex items-center">
                                                            <Tooltip content="remove">
                                                                <Typography as="button" onClick={() => handleRemoveSubject(index, i)}>
                                                                    <i className="fas fa-trash text-xs me-2 text-red-500"></i>
                                                                </Typography>
                                                            </Tooltip>
                                                            <p className="text-xs me-1">{s.subject?.label}</p>
                                                            <p className="text-xs me-1">{s.maxMarks} marks</p>
                                                        </div>
                                                        <p className="text-xs my-1"><span className="font-semibold me-1">Exam Time:</span> {s.examStartTime ? dayjs(s.examStartTime).format("hh:mm A") : ''} - {s.examEndTime ? dayjs(s.examEndTime).format("hh:mm A") : ''}</p>
                                                    </>
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
                    <SubmitButton isSubmitting={isSubmitting} disabled={isSubmitting} onClick={submitData} />
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