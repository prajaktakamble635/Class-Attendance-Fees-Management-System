import { CancelButton, SubmitButton, UpdateButton } from "@/widgets/components";
import { Dialog, DialogBody, DialogFooter, DialogHeader, Input, Option, Select, Typography } from "@material-tailwind/react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";


const EditPassword = (props) => {

    const {
        open, handleClose, refreshTableData, obj, setObj
    } = props;

    useEffect(() => {
        if (obj) {
            setFormData({
                id: obj?.id,
                password: '',
                confirmPass: '',
                isPassShow: false,
                isConfirmPassShow: false
            })
        }
    }, [obj])

    const [formData, setFormData] = useState({
        id: null,
        password: '',
        confirmPass: '',
        isPassShow: false,
        isConfirmPassShow: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!formData.password) {
            return toast.warn("Please enter password")
        } else if (!formData.confirmPass) {
            return toast.warn("Please confirm password")
        } else if (formData.password.toString()?.trim() !== formData?.confirmPass?.toString()?.trim()) {
            return toast.warn("Passwords not matched")
        } else {
            const data = {
                id: formData?.id,
                password: formData?.password
            };
            try {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/updateEmployeePassword`, data);
                toast.success("Employee Password Updated");
                closeDialog()
            } catch (err) {
                toast.error("Internal Server Error: Please try again later or contact system administrator")
            }
        }
    };

    const closeDialog = () => {
        setFormData({
            id: null,
            password: '',
            confirmPass: '',
            isPassShow: false,
            isConfirmPassShow: false
        });
        setObj(null)
        refreshTableData()
        handleClose()
    };

    const handleTextChange = (field, value) => {
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
                Update Employee Password
            </DialogHeader>
            <DialogBody
                divider
                className="max-h-[75vh] overflow-y-auto px-6 bg-gray-50"
            >
                <div className="w-full grid grid-cols-1 gap-4">
                    <Typography><span className="text-blue-500 font-semibold me-1">Employee Name:</span> {obj?.name || '--'} ({obj?.userRole == 1 ? 'Super Admin' : obj?.userRole == 2 ? 'Batch Coordinator' : obj?.userRole == 3 ? 'Counsellor' : obj?.userRole == 4 ? 'HOD' : 'Unkown'})</Typography>
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
                <UpdateButton disabled={isSubmitting} onClick={handleSubmit} />
            </DialogFooter>
        </Dialog>
    )

};

export default EditPassword;