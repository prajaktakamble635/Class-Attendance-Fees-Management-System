import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Avatar,
  Chip
} from "@material-tailwind/react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  ShieldCheckIcon,
  UsersIcon,
  AcademicCapIcon,
  IdentificationIcon
} from "@heroicons/react/24/solid";

export default function ParentProfile() {
  const [userInfo, setUserInfo] = useState(null);
  const [childrenData, setChildrenData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      // Fetch parent details
      const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/commonApi/getUserInfo`, {
        withCredentials: true
      });
      setUserInfo(userRes.data);

      // Fetch linked children
      const dashboardRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/parentApi/dashboard`, {
        withCredentials: true
      });
      setChildrenData(dashboardRes.data.students || []);

    } catch (err) {
      toast.error("Failed to fetch profile details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-20 text-gray-500 animate-pulse">Loading Profile Data...</div>;
  }

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Typography variant="h5" color="blue-gray">Failed to load profile data.</Typography>
      </div>
    );
  }

  return (
    <div className="mt-8 px-4 md:px-8 min-h-screen pb-10">
      <div className="mb-8">
        <Typography variant="h3" color="blue-gray" className="font-bold">My Profile</Typography>
        <Typography variant="small" color="gray" className="font-normal mt-1 max-w-2xl text-base">
          Manage your account details and view your enrolled children.
        </Typography>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Parent Details Card */}
        <Card className="lg:col-span-1 border border-blue-gray-100 shadow-sm relative overflow-hidden h-max">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <CardBody className="pt-20 px-8 pb-8 flex flex-col items-center relative z-10 text-center">
            <Avatar
              src={`https://ui-avatars.com/api/?name=${userInfo.name}&background=ffffff&color=3b82f6&size=128`}
              alt="profile"
              size="xxl"
              className="border-4 border-white shadow-lg bg-white mb-4 w-28 h-28"
            />
            <Typography variant="h4" color="blue-gray" className="font-bold mb-1">
              {userInfo.name}
            </Typography>
            <Chip 
              value={userInfo.status === 1 ? "Active Account" : "Inactive Account"} 
              color={userInfo.status === 1 ? "green" : "red"} 
              size="sm"
              className="mb-6 rounded-full"
            />

            <div className="w-full flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <PhoneIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <Typography variant="small" className="text-gray-500 text-[11px] uppercase tracking-wider font-bold">Mobile Number</Typography>
                  <Typography color="blue-gray" className="font-semibold">{userInfo.mobile || 'N/A'}</Typography>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                  <EnvelopeIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <Typography variant="small" className="text-gray-500 text-[11px] uppercase tracking-wider font-bold">Email Address</Typography>
                  <Typography color="blue-gray" className="font-semibold break-all">{userInfo.email || 'Not Provided'}</Typography>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <Typography variant="small" className="text-gray-500 text-[11px] uppercase tracking-wider font-bold">2FA Security</Typography>
                  <Typography color="blue-gray" className="font-semibold">
                    {userInfo.isTwoFactorEnabled === 1 ? 'Enabled' : 'Disabled'}
                  </Typography>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Linked Children Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border border-blue-gray-100 shadow-sm">
            <CardHeader floated={false} shadow={false} color="transparent" className="m-0 p-6 border-b border-blue-gray-50 bg-gray-50/50 flex items-center gap-3">
              <UsersIcon className="w-6 h-6 text-blue-500" />
              <Typography variant="h5" color="blue-gray" className="font-bold">My Children</Typography>
            </CardHeader>
            <CardBody className="p-6">
              {childrenData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {childrenData.map((child) => (
                    <div key={child.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transform origin-left scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <Avatar
                            src={child.profilePic || `https://ui-avatars.com/api/?name=${child.firstName}+${child.surname}&background=eff6ff&color=1e40af`}
                            alt="child"
                            size="md"
                            className="border border-gray-200 shadow-sm"
                          />
                          <div>
                            <Typography variant="h6" color="blue-gray" className="font-bold">
                              {child.firstName} {child.surname}
                            </Typography>
                            <Typography variant="small" className="text-gray-500 font-medium">
                              Roll No: {child.rollNo}
                            </Typography>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                          <Typography variant="small" color="blue-gray" className="font-medium">
                            {child.tbl_standards?.name} {child.tbl_boards?.name ? `(${child.tbl_boards.name})` : ''}
                          </Typography>
                        </div>
                        <div className="flex items-center gap-2">
                          <IdentificationIcon className="w-5 h-5 text-gray-400" />
                          <Typography variant="small" color="blue-gray" className="font-medium">
                            Medium: {child.tbl_mediums?.name || 'N/A'}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <UsersIcon className="w-16 h-16 mb-4 opacity-30" />
                  <Typography variant="h6">No children enrolled yet.</Typography>
                  <Typography variant="small">If you believe this is an error, please contact administration.</Typography>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
