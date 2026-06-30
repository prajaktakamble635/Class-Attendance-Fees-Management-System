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
import { useNavigate, useParams } from "react-router-dom";

export default function EditStudentFees() {
    const [controller] = useMaterialTailwindController();
    const { sidenavColor, theme } = controller;
    const { id } = useParams(); // Get feeId from route
    const navigate = useNavigate();
    const [editingPaymentId, setEditingPaymentId] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [previousPayments, setPreviousPayments] = useState([]);
    const [formData, setFormData] = useState({
        amountPaid: "",
        paymentDate: "",
        transactionReference: "",
        paymentMethod: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const paymentMethods = [
        { value: "cash", label: "Cash" },
        { value: "online", label: "Online" },
        { value: "cheque", label: "Cheque" },
        { value: "upi", label: "UPI" },
        { value: "card", label: "Card" },
    ];

    useEffect(() => {

        document.title = "Gurukul Class - Edit Student Fee";

        fetchFeeData();
    }, [id]);


    const fetchFeeData = async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentFeeById/${id}`
            );
            if (res.data.success) {
                const { fee, data } = res.data;

                // The backend returns an array of students in data[0]
                const student = data[0];

                // Set selected student properly
                setSelectedStudent({
                    value: student.id,
                    label: student.name,
                    details: student,
                });

                // Set previous payments
                fetchPreviousPayments(student.id);

                // Prefill form
                setFormData({
                    amountPaid: fee.amountPaid,
                    paymentDate: fee.paymentDate ? fee.paymentDate.split("T")[0] : "",
                    transactionReference: fee.transactionReference || "",
                    paymentMethod: fee.paymentMethod,
                });
            }
        } catch (err) {
            handleError(err);
        }
    };

    const fetchPreviousPayments = async (studentId) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentFeesDetails/${studentId}`);
            if (res.data.success) {
                setPreviousPayments(res.data.feesHistory || []);
            }
        } catch (err) {
            handleError(err);
        }
    };

    const handleStudentSelect = async (selectedOption) => {
        setSelectedStudent(selectedOption);
        if (!selectedOption) return;
        fetchPreviousPayments(selectedOption.value);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

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
            alert(editingPaymentId);
            if (editingPaymentId) {
                // Update existing payment
                const res = await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/superAdminApi/updateStudentFee/${editingPaymentId}`,
                    {
                        studentId: id,
                        amountPaid: parseFloat(formData.amountPaid),
                        paymentDate: formData.paymentDate || null,
                        transactionReference: formData.transactionReference || null,
                        paymentMethod: formData.paymentMethod,
                    }
                );

                if (res.status === 200 || res.data.success) {
                    toast.success("Payment updated successfully!", { theme });
                    setEditingPaymentId(null); // clear editing state
                    setFormData({
                        amountPaid: "",
                        paymentDate: "",
                        transactionReference: "",
                        paymentMethod: "",
                    });
                    fetchPreviousPayments(selectedStudent.value); // refresh table
                }
            } else {
                // Update main fee record (for initial load)
                const res = await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/superAdminApi/updateStudentFee/${id}`,
                    {
                        studentId: selectedStudent.value,
                        amountPaid: parseFloat(formData.amountPaid),
                        paymentDate: formData.paymentDate || null,
                        transactionReference: formData.transactionReference || null,
                        paymentMethod: formData.paymentMethod,
                    }
                );

                if (res.status === 200 || res.data.success) {
                    toast.success("Fee updated successfully!", { theme });
                    navigate("/superAdmin/view-all-student-fees");
                }
            }
        } catch (err) {
            handleError(err);
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="animate-fade-in mb-8 mt-12 flex flex-col gap-12">
            <Card className="bg-white dark:bg-blue-gray-800">
                <CardHeader variant="gradient" color={sidenavColor} className="mb-4 p-3">
                    <div className="flex flex-col gap-3">
                               <div className="flex flex-col justify-between md:flex-row">
                                 <Typography variant="h6" color="white">
                                   Edit Student Fees
                                 </Typography>
                                 <div className="flex flex-col gap-2 md:flex-row">
                                   <div className="rounded-md border-0 bg-white">
                                     {/* <Input
                                       placeholder="Search by student name, roll no..."
                                       className="border-0 focus:border-0"
                                       enterKeyHint="search"
                                       onKeyUp={handleSearch}
                                       labelProps={{ style: { display: "none" } }}
                                       icon={<i className="fas fa-search" />}
                                     /> */}
                                   </div>
                                   <div className="flex flex-row gap-2">
                                     {/* <Button
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
                                     </Button> */}
                                     <Button
                                       variant="outlined"
                                       color="white"
                                       size="sm"
                                       onClick={() => navigate("/superAdmin/view-all-student-fees")}
                                       className="flex items-center gap-2"
                                     >
                                       <i className="fas fa-arrow-left" />
                                       Back 
                                     </Button>
                                   </div>
                                 </div>
                               </div>
                             </div>

                </CardHeader>
                <CardBody>

                    {selectedStudent && (
                        <div className="mb-6 p-6 bg-white rounded-2xl shadow-lg border border-gray-200 font-sans">
                            <Typography variant="h5" className="mb-6 font-bold text-gray-900 border-b pb-3 text-lg md:text-xl">
                                Student Details
                            </Typography>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.entries({
                                    Name: selectedStudent.details.name,
                                    "Roll No": selectedStudent.details.rollNo,
                                    "Father Name": selectedStudent.details.fatherName,
                                    "Mother Name": selectedStudent.details.motherName,
                                    DOB: selectedStudent.details.dob,
                                    Gender: selectedStudent.details.gender,
                                    Address: selectedStudent.details.address,
                                    "School Name": selectedStudent.details.schoolName,
                                    "Fees Paid": `₹${selectedStudent.details.feesPaid}`,
                                    "Fees Remaining": `₹${selectedStudent.details.feesRemaining}`,
                                    "Father Mobile": selectedStudent.details.fatherMobile,
                                    "Mother Mobile": selectedStudent.details.motherMobile,
                                    "Student Mobile": selectedStudent.details.studentMobile,
                                    Email: selectedStudent.details.email,
                                    Standard: selectedStudent.details.standard,
                                    Medium: selectedStudent.details.medium,
                                    Board: selectedStudent.details.board,
                                }).map(([label, value]) => (
                                    <div key={label}>
                                        <Typography variant="medium" className="text-gray-700 mb-1">
                                            {label}: <span className="font-bold text-gray-900">{value}</span>
                                        </Typography>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3 - Previous Payments */}
                    {selectedStudent && (
                        <>
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
                                                    <th className="px-4 py-2 border">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {previousPayments.map((fee, index) => (
                                                    <tr
                                                        key={index}
                                                        className={`text-center transition hover:bg-blue-gray-50 ${index % 2 === 0 ? "bg-blue-gray-50/50" : ""
                                                            } ${editingPaymentId === fee.id ? "bg-yellow-100" : ""}`} // highlight editing row
                                                    >
                                                        <td className="px-4 py-2 border">{new Date(fee.paymentDate).toLocaleDateString()}</td>
                                                        <td className="px-4 py-2 border font-semibold text-green-700">₹{fee.amountPaid}</td>
                                                        <td className="px-4 py-2 border">{fee.paymentMethod}</td>
                                                        <td className="px-4 py-2 border">{fee.transactionReference || "-"}</td>
                                                        <td className="px-4 py-2 border">
                                                            <Button
                                                                size="sm"
                                                                variant="text"
                                                                onClick={() => {
                                                                    // Set form data to this payment
                                                                    setFormData({
                                                                        amountPaid: fee.amountPaid,
                                                                        paymentDate: fee.paymentDate ? fee.paymentDate.split("T")[0] : "",
                                                                        transactionReference: fee.transactionReference || "",
                                                                        paymentMethod: fee.paymentMethod,
                                                                    });
                                                                    setEditingPaymentId(fee.id); // mark as editing
                                                                }}
                                                            >
                                                                <i className="fas fa-pen text-blue-600"></i>
                                                            </Button>
                                                        </td>
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


                            {/* Payment Form */}
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
                                            className="font-bold text-blue-gray-900 bg-white rounded-lg shadow-sm"
                                        />
                                    </div>

                                    <div>
                                        <Typography variant="medium" className="font-semibold text-blue-gray-700 mb-1">
                                            Payment Date
                                        </Typography>
                                        <Input
                                            type="date"
                                            name="paymentDate"
                                            value={formData.paymentDate}
                                            onChange={handleInputChange}
                                            className="font-bold text-blue-gray-900 bg-white rounded-lg shadow-sm"
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
                                            className="font-bold text-blue-gray-900 bg-white rounded-lg shadow-sm"
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
                                            {isSubmitting ? "Updating..." : "Update Payment"}
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
