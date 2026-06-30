import {
    Card,
    CardBody,
    Avatar,
    Typography,
    Button,
} from "@material-tailwind/react";
import React, { Suspense, useState, useEffect } from "react";
import axios from "axios";
import { handleError } from "@/hooks/errorHandling.js";

const Update = React.lazy(() => import("../page-sections/profile/update"));

export function ProfileHolder() {
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [profileDetails, setProfileDetails] = useState({
        id: '',
        name: '',
        mobile: '',
        staffCode: '',
        branchType: '',
        staffRole: '',
        joiningDate: '',
        lastYearTarget: '',
        freshTarget: '',
        achievedTarget: '',
        status: '',
        headBranch: null,
        hodBranch: null,
        zonalBranch: null,
        divisionalBranch: null,
        branch: null,
    });

    useEffect(() => {
        document.title = "Sproutedge Agro | My Profile";
        fetchProfileDetails();
    }, []);

    const fetchProfileDetails = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profileApi/getMyProfile`);
            if (response.status === 200) {
                setProfileDetails(response.data);
            }
        } catch (error) {
            handleError(error);
        }
    };

    const renderBranchInfo = (label, branch) => {
        if (!branch) return null;
        return (
            <Typography variant="small" className="text-sm text-blue-gray-600">
                <strong>{label}:</strong> {branch.name} ({branch.branchCode}) - {branch.branchType}
            </Typography>
        );
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
                                    <div><strong>Staff Code:</strong> {profileDetails.staffCode}</div>
                                    <div><strong>Branch Type:</strong> {profileDetails.branchType}</div>
                                    <div><strong>Role:</strong> {profileDetails.staffRole}</div>
                                    <div><strong>Joining Date:</strong> {profileDetails.joiningDate?.slice(0, 10)}</div>
                                    <div><strong>Status:</strong> {profileDetails.status}</div>
                                    <div><strong>Last Year Target:</strong> ₹{profileDetails.lastYearTarget}</div>
                                    <div><strong>Fresh Target:</strong> ₹{profileDetails.freshTarget}</div>
                                    <div><strong>Achieved Target:</strong> ₹{profileDetails.achievedTarget}</div>
                                </div>

                                {/* Branch Hierarchy */}
                                <div className="mt-4 space-y-1 text-sm">
                                    {renderBranchInfo("Head Branch", profileDetails.headBranch)}
                                    {renderBranchInfo("HOD Branch", profileDetails.hodBranch)}
                                    {renderBranchInfo("Zonal Branch", profileDetails.zonalBranch)}
                                    {renderBranchInfo("Divisional Branch", profileDetails.divisionalBranch)}
                                    {renderBranchInfo("Main Branch", profileDetails.branch)}
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
