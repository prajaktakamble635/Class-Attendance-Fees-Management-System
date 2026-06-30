import { useMaterialTailwindController } from "@/context";
import { handleError } from "@/hooks/errorHandling";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Input,
    Typography,
} from "@material-tailwind/react";
import ReactSelect from "react-select";
import axios from "axios";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// import { Typography } from "@material-tailwind/react";
import { format } from "date-fns";
export default function AddStudentFees() {
    const [controller] = useMaterialTailwindController();
    const { sidenavColor, theme } = controller;

    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [previousPayments, setPreviousPayments] = useState([]);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        amountPaid: "",
        paymentDate: "",
        transactionReference: "",
        paymentMethod: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        document.title = "Gurukul Class - Add Student Fees";
        fetchStudentsWithRemainingFees();
    }, []);

    // Fetch students with pending fees
    const fetchStudentsWithRemainingFees = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentsWithPendingFees`
            );
            if (response.data.success) {
                const formatted = response.data.data.map((s) => ({
                    value: s.id,
                    label: s.name, // Only show student name in select box
                    details: s,    // Keep full student details for below
                }));
                setStudents(formatted);
            }
        } catch (err) {
            handleError(err);
        }
    };

    // When student selected → fetch previous payments
    const handleStudentSelect = async (selectedOption) => {
        setSelectedStudent(selectedOption);
        if (!selectedOption) return;
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentFeesDetails/${selectedOption.value}`
            );
            if (response.data.success) {
                setPreviousPayments(response.data.feesHistory || []);
                const updatedStudent = response.data.students?.[0];
                if (updatedStudent) {
                    setSelectedStudent((prev) => ({
                        ...prev,
                        details: {
                            ...prev.details,
                            ...updatedStudent,
                        },
                    }));
                }

            }
        } catch (err) {
            handleError(err);
        }
    };

    // Input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Submit new payment
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedStudent) {
            toast.error("Please select a student first.", { theme });
            return;
        }
        if (!formData.amountPaid || !formData.paymentMethod) {
            toast.error("Please fill all required fields.", { theme });
            return;
        }

        setIsSubmitting(true);
        try {
            const { data, status } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/superAdminApi/addStudentFee`,
                {
                    studentId: selectedStudent.value,
                    amountPaid: parseFloat(formData.amountPaid),
                    paymentDate: formData.paymentDate || null,
                    transactionReference: formData.transactionReference || null,
                    paymentMethod: formData.paymentMethod,
                }
            );

            if (status === 201 || data.success) {
                toast.success("Payment added successfully!", { theme });





                setFormData({
                    amountPaid: "",
                    paymentDate: "",
                    transactionReference: "",
                    paymentMethod: "",
                });

                handleStudentSelect(selectedStudent); // refresh payments
            }

        } catch (err) {
            handleError(err);
        } finally {
            setIsSubmitting(false);
        }
    };


    const paymentMethods = [
        { value: "cash", label: "Cash" },
        { value: "online", label: "Online" },
        { value: "cheque", label: "Cheque" },
        { value: "upi", label: "UPI" },
        { value: "card", label: "Card" },
    ];

    return (
        <div className="animate-fade-in mb-8 mt-12 flex flex-col gap-12">
            <Card className="bg-white dark:bg-blue-gray-800">
                <CardHeader
                    variant="gradient"
                    color={sidenavColor}
                    className="mb-4 p-3"
                >
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col justify-between md:flex-row">
                            <Typography variant="h6" color="white">
                                Add Student Fees
                            </Typography>
                            <div className="flex flex-col gap-2 md:flex-row">

                                <div className="flex flex-row gap-2">
                                    <Button
                                        onClick={() => navigate("/superAdmin/view-all-student-fees")}
                                        className="inline-flex self-center"
                                        variant="outlined"
                                        color="white"
                                        size="sm"
                                    >

                                        View All Fees Transaction
                                    </Button>
                                    <Button
                                        onClick={(event) => {
                                            event.preventDefault();
                                            hardRefreshTableData();
                                        }}
                                        className="inline-flex self-center"
                                        variant="outlined"
                                        color="white"
                                        size="sm"
                                    >
                                        <i className="fas fa-arrows-rotate self-center" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </div>
                </CardHeader>

                <CardBody>
                    {/* Step 1 - Select Student */}
                    <div className="mb-6">
                        <Typography variant="medium" color="blue-gray" className="font-medium mb-2">
                            Select Student <span className="text-red-500">*</span>
                        </Typography>
                        <ReactSelect
                            options={students}
                            value={selectedStudent}
                            onChange={handleStudentSelect}
                            placeholder="Select a student"
                            className="react-select-container"
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* Step 2 - Show Student Details */}
                    {selectedStudent && (
                        <div className="mb-6 p-6 bg-white rounded-2xl shadow-lg border border-gray-200 font-sans">
                            <Typography
                                variant="h5"
                                className="mb-6 font-bold text-gray-900 border-b pb-3 text-lg md:text-xl"
                            >
                                Student Details
                            </Typography>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Name: <span className="font-bold text-gray-900">{selectedStudent.details.name}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Roll No: <span className="font-bold text-gray-900">{selectedStudent.details.rollNo}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Father Name: <span className="font-bold text-gray-900">{selectedStudent.details.fatherName}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Mother Name: <span className="font-bold text-gray-900">{selectedStudent.details.motherName}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        DOB: <span className="font-bold text-gray-900">{selectedStudent.details.dob}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Gender: <span className="font-bold text-gray-900">{selectedStudent.details.gender}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Address: <span className="font-bold text-gray-900">{selectedStudent.details.address}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        School Name: <span className="font-bold text-gray-900">{selectedStudent.details.schoolName}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Fees Paid: <span className="font-bold text-green-600">₹{selectedStudent.details.feesPaid}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Fees Remaining: <span className="font-bold text-red-600">₹{selectedStudent.details.feesRemaining}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Father Mobile: <span className="font-bold text-gray-900">{selectedStudent.details.fatherMobile}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Mother Mobile: <span className="font-bold text-gray-900">{selectedStudent.details.motherMobile}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Student Mobile: <span className="font-bold text-gray-900">{selectedStudent.details.studentMobile}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Email: <span className="font-bold text-gray-900">{selectedStudent.details.email}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Standard: <span className="font-bold text-gray-900">{selectedStudent.details.standard}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Medium: <span className="font-bold text-gray-900">{selectedStudent.details.medium}</span>
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="medium" className="text-gray-700 mb-1">
                                        Board: <span className="font-bold text-gray-900">{selectedStudent.details.board}</span>
                                    </Typography>
                                </div>
                            </div>
                        </div>
                    )}







                    {/* Step 3 - Previous Payments */}
                    {selectedStudent && (
                        <>
                            {/* Previous Payments Section */}
                            <div className="mb-6 p-4 bg-white rounded-xl shadow-lg border border-gray-200">
                                <Typography variant="h6" className="mb-4 font-bold text-blue-gray-800 border-b pb-2">
                                    Previous Payments
                                </Typography>

                                {previousPayments.length > 0 ? (
                                    <div className="overflow-x-auto rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-gray-900 uppercase text-xs">
                                                <tr className="text-center">
                                                    <th className="px-4 py-2 border">Date</th>
                                                    <th className="px-4 py-2 border">Amount</th>
                                                    <th className="px-4 py-2 border">Method</th>
                                                    <th className="px-4 py-2 border">Reference</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {previousPayments.map((fee, index) => (
                                                    <tr
                                                        key={index}
                                                        className={`text-center transition hover:bg-blue-gray-50 ${index % 2 === 0 ? "bg-blue-gray-50/50" : ""
                                                            }`}
                                                    >
                                                        <td className="px-4 py-2 border">
                                                            {fee.paymentDate
                                                                ? new Date(fee.paymentDate)
                                                                    .toLocaleDateString("en-GB")
                                                                    .replaceAll("/", "-")
                                                                : "-"}
                                                        </td>

                                                        <td className="px-4 py-2 border font-semibold text-green-700">
                                                            ₹{fee.amountPaid}
                                                        </td>
                                                        <td className="px-4 py-2 border">{fee.paymentMethod}</td>
                                                        <td className="px-4 py-2 border">{fee.transactionReference || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <Typography variant="medium" color="gray" className="italic">
                                        No previous payments found.
                                    </Typography>
                                )}
                            </div>

                            {/* Payment Form Section */}
                            <div className="mb-6 p-4 bg-white rounded-xl shadow-lg border border-gray-200">
                                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Typography variant="medium" className="font-semibold text-blue-gray-700 mb-1">
                                            Amount Paid <span className="text-red-500">*</span>
                                        </Typography>
                                        <Input
                                            type="number"
                                            name="amountPaid"
                                            value={formData.amountPaid}
                                            onChange={handleInputChange}
                                            placeholder="Enter amount"

                                            className="font-bold text-blue-gray-900 bg-white rounded-lg shadow-sm  "
                                        />
                                    </div>

                                    <div>
                                        <Typography
                                            variant="medium"
                                            className="font-semibold text-blue-gray-700 mb-1"
                                        >
                                            Payment Date
                                        </Typography>

                                        <DatePicker
                                            selected={
                                                formData.paymentDate
                                                    ? new Date(formData.paymentDate)
                                                    : new Date() // ✅ default to today's date
                                            }
                                            onChange={(date) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    paymentDate: date ? format(date, "yyyy-MM-dd") : "",
                                                }))
                                            }
                                            showMonthDropdown
                                            showYearDropdown
                                            scrollableYearDropdown
                                            yearDropdownItemNumber={100}
                                            maxDate={new Date()} // ✅ disable future dates
                                            dateFormat="dd-MM-yyyy"
                                            placeholderText="dd-mm-yyyy"
                                            className="w-full font-bold text-blue-gray-900 bg-white rounded-lg shadow-sm border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <Typography variant="medium" className="font-semibold text-blue-gray-700 mb-1">
                                            Transaction Reference
                                        </Typography>
                                        <Input
                                            type="text"
                                            name="transactionReference"
                                            value={formData.transactionReference}
                                            onChange={handleInputChange}
                                            placeholder="Enter reference number"
                                            className="font-bold text-blue-gray-900 bg-white rounded-lg shadow-sm "
                                        />
                                    </div>

                                    <div>
                                        <Typography variant="medium" className="font-semibold text-blue-gray-700 mb-1">
                                            Payment Method <span className="text-red-500">*</span>
                                        </Typography>
                                        <ReactSelect
                                            options={paymentMethods}
                                            value={paymentMethods.find((m) => m.value === formData.paymentMethod)}
                                            onChange={(selected) =>
                                                setFormData({ ...formData, paymentMethod: selected.value })
                                            }
                                            placeholder="Select method"
                                            className="rounded-lg text-sm shadow-sm"
                                        />
                                    </div>

                                    <div className="col-span-2 flex justify-end gap-2 mt-4">
                                        <Button
                                            type="submit"
                                            variant="gradient"
                                            color={sidenavColor}
                                            disabled={isSubmitting}
                                            className="px-6 py-2 font-bold shadow-md"
                                        >
                                            {isSubmitting ? "Saving..." : "Submit Payment"}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}



                </CardBody>
            </Card>
        </div>
    );
}
