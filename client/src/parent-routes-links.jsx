import React from 'react';
import { Squares2X2Icon, UserIcon } from "@heroicons/react/24/solid";

const ParentDashboard = React.lazy(() => import("@/pages/parent/dashboard.jsx"));
const ParentProfile = React.lazy(() => import("@/pages/parent/ParentProfile.jsx"));
const ParentAttendance = React.lazy(() => import("@/pages/parent/attendance.jsx"));

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const ParentRoutesLinks = [
  {
    layout: "parent",
    pages: [
      {
        icon: <Squares2X2Icon {...icon} />,
        name: "dashboard",
        path: "/dashboard",
        element: <ParentDashboard />,
        show: true
      },
      {
        icon: <UserIcon {...icon} />,
        name: "daily attendance",
        path: "/attendance",
        element: <ParentAttendance />,
        show: true
      },
      {
        icon: <UserIcon {...icon} />,
        name: "profile",
        path: "/profile",
        element: <ParentProfile />,
        show: true
      }
    ]
  }
];

export default ParentRoutesLinks;
