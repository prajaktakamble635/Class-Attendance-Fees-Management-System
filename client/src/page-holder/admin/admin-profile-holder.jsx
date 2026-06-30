import {
    Card,
    CardBody,
    Avatar,
    Typography,
    Button,
    Input
} from "@material-tailwind/react";
import React, { Suspense, useState, useEffect } from "react";
import axios from "axios";
import { handleError } from "@/hooks/errorHandling.js";
import dayjs from "dayjs";
import { toast } from "react-toastify";

const Update = React.lazy(() => import("../../page-sections/profile/update"));

export function ProfileHolder() {
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [profileDetails, setProfileDetails] = useState({
        id: '',
        name: '',
        mobile: '',
        userRole: '',
        branchType: '',
        staffRole: '',
        joiningDate: '',
        lastYearTarget: '',
        freshTarget: '',
        achievedTarget: '',
        status: '',
        isTwoFactorEnabled: 2,
        twoFASecret: null,
        qrDataUrl: null,
        otp: null,
        isExistingSecret: 1,
        isAuthenticated: 2

    });
    const [refreshData, setRefreshData] = useState(false);
    const [disable, setDisable] = useState(false);

    useEffect(() => {
        document.title = "Gurukul Academy | My Profile";
        fetchProfileDetails();
    }, [refreshData]);

    const fetchProfileDetails = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/superAdminApi/getMyProfile`);
            if (response.status === 200) {
                const { isTwoFactorEnabled, isAuthenticated, ...rest } = response.data;
                if (disable) {
                    setProfileDetails(response.data)
                    return
                };
                setProfileDetails((prev) => {
                    if (isAuthenticated == 1 && isTwoFactorEnabled == 1) {
                        return {
                            ...prev,
                            ...rest,
                            isAuthenticated,
                            isTwoFactorEnabled,
                        };
                    } else {
                        return {
                            ...prev,
                            ...rest,
                            isAuthenticated,
                            isTwoFactorEnabled: prev.isTwoFactorEnabled,
                        }
                    }
                })
            }
        } catch (error) {
            handleError(error);
        }
    };

    const handleEnable2FA = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/enableTwoFactorVerification`);
            setProfileDetails({ ...profileDetails, isTwoFactorEnabled: 1 })
            setRefreshData(!refreshData);
        } catch (err) {
            const errMsg = err.response?.data?.message || "Internal Server Error";
            toast.error(errMsg, { position: "top-center" });
        }
    };

    const handleDisable2FA = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/disableTwoFactorVerification`);
            setDisable(true)
            setRefreshData(!refreshData);
        } catch (err) {
            const errMsg = err.response?.data?.message || "Internal Server Error";
            toast.error(errMsg, { position: "top-center" });
        }
    };

    const handleChangeOtp = (e) => {
        setProfileDetails({ ...profileDetails, otp: e.target.value });
    };

    const handleVerifyOtp = async () => {
        if (!profileDetails.otp || profileDetails.otp.trim() === '') {
            toast.error("Please enter OTP", { position: "top-center" });
            return;
        }
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/superAdminApi/verify2FA`, { token: profileDetails.otp });
            toast.success("2FA verification successful!", { position: "top-center" });
            setProfileDetails({ ...profileDetails, otp: '' });
            setRefreshData(!refreshData);
        } catch (err) {
            const errMsg = err.response?.data?.message || "Internal Server Error";
            toast.error(errMsg, { position: "top-center" });
        }
    };

    return (
        <div className="animate-fade-in transform px-2 sm:px-4">
            {/* Profile Card */}
            <Card className="mx-auto mt-16 mb-6 max-w-6xl w-full">
                <CardBody className="p-4">
                    <div className="mb-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Avatar and Basic Info */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full">

                            <div className="w-full">
                                <Typography variant="h5" color="blue-gray" className="mb-2">
                                    {profileDetails.name}
                                </Typography>

                                {/* Basic Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm text-blue-gray-600">
                                    <div><strong>Mobile:</strong> +91 {profileDetails.mobile}</div>
                                    <div><strong>Staff Code:</strong> #{profileDetails.id?.toString()?.padStart(4, "0")}</div>

                                    <div><strong>Role:</strong> {profileDetails.userRole == 1 ? 'Super Admin' : profileDetails?.userRole == 2 ? "Batch Coordinator" : profileDetails?.userRole == 3 ? "Counsellor" : profileDetails?.userRole == 4 ? "HOD" : 'Unknown'}</div>
                                    <div><strong>Last Login:</strong> {profileDetails.lastLogin ? dayjs(profileDetails?.lastLogin).format("DD MMM, YYYY hh:mm:ss A") : ''}</div>

                                </div>


                                {/* Update Password Button */}
                                <Button
                                    onClick={() => setIsUpdateOpen(true)}
                                    variant="text"
                                    color="blue"
                                    size="sm"
                                    className="mt-4"
                                >
                                    Update Password
                                </Button>
                            </div>
                        </div>
                    </div>
                    <hr className="bg-blue-500 text-blue-500 mb-4" />
                    {profileDetails.isTwoFactorEnabled == 2 ? (
                        <>
                            <Button variant="gradient" onClick={handleEnable2FA}>Enable 2-Factor Verification</Button>
                        </>
                    ) : profileDetails.isTwoFactorEnabled == 1 && profileDetails.isExistingSecret == 2 ? (
                        <>
                            <div className="w-full p-2">
                                <Button disabled={profileDetails.isAuthenticated == 2} variant="gradient" onClick={handleDisable2FA}>Disable 2-Factor Verification</Button>
                                <Typography variant="h6" className="my-2 text-center text-sm text-red-500">*To complete authentication, please scan the QR code using the Google Authenticator app (or any compatible authenticator app). After scanning, the app will generate a One-Time Password (OTP). Enter the OTP below to verify your identity and enable two-factor authentication.</Typography>
                                <Typography variant="h6" className="my-2 text-center text-sm text-red-500">* NOTE: One-time authentication is required for successfully enabling 2-factor authentication.</Typography>
                                <div className="w-full flex flex-col my-2 items-center justify-center">
                                    {profileDetails.qrDataUrl ? (
                                        <>
                                            <img src={profileDetails.qrDataUrl} alt="2FA QR Code" className="w-48 h-48 mb-2" />
                                            <div className="w-full md:w-1/3">
                                                <Input
                                                    label="Enter OTP"
                                                    name="otp"
                                                    type="text"
                                                    required
                                                    value={profileDetails.otp || ''}
                                                    onChange={handleChangeOtp}
                                                />
                                            </div>
                                            <div className="w-full md:w-1/3">
                                                <Button variant="gradient" fullWidth size="small" className="mt-2" onClick={handleVerifyOtp}>Verify OTP</Button>
                                            </div>
                                        </>
                                    ) : (
                                        <Typography variant="small" className="text-sm text-red-600">
                                            QR Code not available.
                                        </Typography>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : profileDetails.isTwoFactorEnabled == 1 && profileDetails.isExistingSecret == 1 ? (
                        <div className="w-full p-2">
                            <Button variant="gradient" onClick={handleDisable2FA}>Disable 2-Factor Verification</Button>
                            <Typography variant="h5" className="mb-4 text-center my-2 text-green-500">2-Factor Authentication (2FA) is now active</Typography>
                            <Typography className="text-sm my-2 text-center font-semibold">Two-Factor Authentication has been successfully enabled on your account. From your next login, you will be required to enter a One-Time Password (OTP) generated by your authenticator app. Once verified, you will be securely logged in to your profile.</Typography>
                        </div>
                    ) : null}
                </CardBody>
            </Card>

            {/* Update Password Dialog */}
            <Suspense fallback={<div className="text-center">Loading...</div>}>
                <Update isUpdateOpen={isUpdateOpen} setIsUpdateOpen={setIsUpdateOpen} />
            </Suspense>
        </div>
    );
}

export default ProfileHolder;
