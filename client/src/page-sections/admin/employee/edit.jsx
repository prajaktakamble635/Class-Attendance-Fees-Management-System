import { CancelButton, SubmitButton, UpdateButton } from "@/widgets/components";
import { Dialog, DialogBody, DialogFooter, DialogHeader, Input, Option, Select } from "@material-tailwind/react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";


const Edit = (props) => {

    const {
        open, handleClose, refreshTableData, obj, setObj
    } = props;

    useEffect(() => {
        if (obj) {
            setFormData({
                id: obj?.id,
                name: obj?.name,
                mobile: obj?.mobile,
                email: obj?.email,
                userRole: obj?.userRole,
                isEmailValid: true
            })
        }
    }, [obj])

    const [formData, setFormData] = useState({
        id: null,
        name: '',
        email: '',
        mobile: '',
        userRole: "",
        isEmailValid: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!formData.name) {
            return toast.warn('Please enter employee name')
        } else if (!formData.mobile) {
            return toast.warn("Please enter employee mobile number")
        } else if (formData.mobile && formData?.mobile?.toString()?.trim()?.length !== 10) {
            return toast.warn("Please enter valid mobile number")
        } else if (formData.email && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(formData.email)) {
            return toast.warn("Please enter valid email address")
        } else if (!formData?.userRole) {
            return toast.warn("Please select user role")
        } else {
            const data = {
                id: formData?.id,
                name: formData?.name || '',
                mobile: formData?.mobile,
                email: formData?.email,
                userRole: formData?.userRole
            };
            try {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/updateEmployee`, data);
                toast.success("Employee Info Updated");
                closeDialog()
            } catch (err) {
                const errMsg = err?.response?.data?.message || "Internal Server Error: Please try again later or contact system administrator"
                toast.error(errMsg)
            }
        }
    };

    const closeDialog = () => {
        setFormData({
            id: null,
            name: '',
            email: '',
            mobile: '',
            userRole: "",
            isEmailValid: true,
        });
        setObj(null)
        refreshTableData()
        handleClose()
    };

    const handleTextChange = (field, value) => {
        if (field === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            setFormData((prev) => ({ ...prev, email: value, isEmailValid: emailRegex.test(formData.email) }))
            return
        }
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <Dialog
            className="z-40"
            handler={closeDialog}
            open={open}
            size={"sm"}
        >
            <DialogHeader className="justify-center bg-gray-100 text-center text-xl font-semibold">
                Add New Employee
            </DialogHeader>
            <DialogBody
                divider
                className="max-h-[75vh] overflow-y-auto px-6 bg-gray-50"
            >
                <div className="w-full grid grid-cols-1 gap-4">
                    <Input
                        required
                        label="Employee Name"
                        value={formData.name}
                        onChange={(e) => handleTextChange("name", e.target.value)}
                    />
                    <Input
                        required
                        label="Mobile"
                        type="number"
                        inputMode="number"
                        pattern="[0-9]*"
                        maxLength={10}
                        value={formData.mobile}
                        onChange={(e) => {
                            let value = e.target.value;
                            if (value < 0) {
                                return
                            };
                            handleTextChange("mobile", value)
                        }}
                        error={
                            formData.mobile?.toString()?.trim()?.length > 10
                        }
                    />
                    <div>
                        <Input
                            label="Employee Email"
                            value={formData.email}
                            onChange={(e) => handleTextChange("email", e.target.value)}
                            error={
                                !formData.isEmailValid && formData.email?.length > 0
                            }
                        />
                        {!formData.isEmailValid && formData.email?.length > 0 && (
                            <p className="mt-1 text-sm text-red-500">
                                Please enter a valid email address
                            </p>
                        )}
                    </div>
                    <Select
                        required
                        label="Role *"
                        name="role"
                        value={formData.userRole}
                        onChange={(value) => {
                            setFormData({
                                ...formData,
                                userRole: value,
                            });
                        }}
                    >
                        <Option value={1}>Super Admin</Option>
                        <Option value={2}>Batch Coordinator</Option>
                        <Option value={3}>Counsellor</Option>
                        <Option value={4}>HOD</Option>
                    </Select>
                </div>
            </DialogBody>
            <DialogFooter className="bg-gray-100 sticky bottom-0 z-10">
                <CancelButton onClick={handleClose} />
                <UpdateButton disabled={isSubmitting} onClick={handleSubmit} />
            </DialogFooter>
        </Dialog>
    )

};

export default Edit;