import { CancelButton, SubmitButton } from "@/widgets/components";
import { Dialog, DialogBody, DialogFooter, DialogHeader, Input, Option, Select } from "@material-tailwind/react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";


const Add = (props) => {

    const {
        open, handleClose, refreshTableData
    } = props;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        userRole: "",
        confirmPass: '',
        isEmailValid: true,
        isPassShow: false,
        isConfirmPassShow: false
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
        } else if (!formData.password) {
            return toast.warn("Please enter password")
        } else if (!formData.confirmPass) {
            return toast.warn("Please confirm password")
        } else if (formData.password.toString()?.trim() !== formData?.confirmPass?.toString()?.trim()) {
            return toast.warn("Passwords not matched")
        } else {
            const data = {
                name: formData?.name || '',
                mobile: formData?.mobile,
                email: formData?.email,
                password: formData?.password,
                userRole: formData?.userRole
            };
            try {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/createEmployee`, data);
                toast.success("New Employee Created");
                closeDialog()
            } catch (err) {
                const errMsg = err?.response?.data?.message || "Internal Server Error: Please try again later or contact system administrator"
                toast.error(errMsg)
            }
        }
    };

    const closeDialog = () => {
        setFormData({
            name: '',
            email: '',
            mobile: '',
            userRole: "",
            password: '',
            confirmPass: '',
            isEmailValid: true,
            isPassShow: false,
            isConfirmPassShow: false
        });
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
                    <div className="relative">
                        <Input
                            label="Password"
                            type={formData.isPassShow ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => handleTextChange("password", e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setFormData((prev) => ({ ...prev, isPassShow: !prev.isPassShow }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                            {formData.isPassShow ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="relative mt-4">
                        <Input
                            label="Confirm Password"
                            type={formData.isConfirmPassShow ? 'text' : 'password'}
                            value={formData.confirmPass}
                            onChange={(e) => handleTextChange("confirmPass", e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setFormData((prev) => ({
                                    ...prev,
                                    isConfirmPassShow: !prev.isConfirmPassShow,
                                }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                            {formData.isConfirmPassShow ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
            </DialogBody>
            <DialogFooter className="bg-gray-100 sticky bottom-0 z-10">
                <CancelButton onClick={handleClose} />
                <SubmitButton disabled={isSubmitting} onClick={handleSubmit} />
            </DialogFooter>
        </Dialog>
    )

};

export default Add;