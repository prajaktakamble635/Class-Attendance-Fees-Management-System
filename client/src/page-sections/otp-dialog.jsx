import React, { useContext, useState } from "react";
import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Button,
    Input,
    Typography,
} from "@material-tailwind/react";
import axios from "axios";
import { useUser } from "@/context/user";

const OtpDialog = (props) => {
    const { open, handleClose, name, prepareForDownload } = props;

    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isVerified, setIsVerified] = useState(false);
    const [reqId, setReqId] = useState(null)
    const { user } = useContext(useUser);
    const [isReq, setIsReq] = useState(false)

    // 🔹 Request OTP from backend
    const handleSendOtp = async () => {
        try {
            setLoading(true);
            setMessage("");

            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/commonApi/requestOtp`, {
                label: `Download Request - ${name} `,
                description: `${name} material download request by ${user?.name}.`,
            });

            if (data.success) {
                setOtpSent(true);
                setMessage("OTP sent to admin. Please wait for approval.");
                setReqId(data.requestId)
            } else {
                setMessage("Failed to send OTP.");
            }
        } catch (err) {
            console.error(err);
            setMessage("Server error while sending OTP.");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Verify OTP with backend
    const handleVerifyOtp = async () => {
        try {
            setLoading(true);
            setMessage("");

            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/commonApi/verifyOtp`, {
                requestId: reqId,
                otp,
            });

            if (data.success) {
                setIsVerified(true);
                setMessage("OTP verified successfully. You can download now!");
                await prepareForDownload()

            } else {
                setMessage(data.message || "Invalid OTP.");
            }
        } catch (err) {
            console.error(err);
            setMessage("Server error while verifying OTP.");
        } finally {
            setLoading(false);
        }
    };

    const closeDialog = () => {
        setReqId(null);
        setMessage("")
        setIsVerified(false)
        setOtp("")
        setOtp(false)
        handleClose()
    }

    return (
        <Dialog
            className="z-40"
            handler={closeDialog}
            open={open}
            size="md"
            dismiss={{ outsidePress: false }}
        >
            <DialogHeader className="justify-center bg-gray-100 text-center text-xl font-semibold">
                Authenticate Before Download
            </DialogHeader>

            <DialogBody
                divider
                className="max-h-[75vh] overflow-y-auto px-6 bg-gray-50 flex flex-col items-center"
            >
                <Typography className="text-gray-700 mb-4 text-center">
                    {otpSent
                        ? "Enter the 4-digit OTP sent to admin for approval."
                        : "Click below to request a download approval OTP."}
                </Typography>

                {otpSent && !isVerified && (
                    <Input
                        label="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={4}
                        type="text"
                        className="w-48 text-center mb-3"
                    />
                )}

                {message && (
                    <Typography
                        variant="small"
                        color={isVerified ? "green" : "red"}
                        className="text-center mt-2"
                    >
                        {message}
                    </Typography>
                )}
            </DialogBody>

            <DialogFooter className="flex justify-between px-6">
                {!otpSent ? (
                    <Button
                        color="blue"
                        onClick={handleSendOtp}
                        loading={loading}
                        disabled={loading}
                    >
                        {loading ? "Requesting OTP" : 'Request OTP'}
                    </Button>
                ) : !isVerified ? (
                    <Button
                        color="green"
                        onClick={handleVerifyOtp}
                        loading={loading}
                        disabled={loading}
                    >
                        Verify OTP
                    </Button>
                ) : null}
                <Button color="indigo" onClick={closeDialog}>
                        Cancel
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default OtpDialog;
