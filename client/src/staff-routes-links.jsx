import {
  Dashboard,
  AdminAddHallTicket,
  AdminAddAttendance,
  StaffMarksEntry,
  StaffManualMarksEntry,
  AdminReports,
  AdminAddReportCard,
  Profile
} from "@/pages/staff";


export const staffRoutes = [
  {
    layout: "batchCoord",
    pages: [
      {
        name: "profile",
        path: "/profile",
        element: <Profile />,
      },
      {
        name: "hall-ticket",
        path: "/hall-ticket",
        element: <AdminAddHallTicket />,
      },
      {
        name: "attendance sheet",
        path: "/attendance-sheet",
        element: <AdminAddAttendance />,
      },
      {
        name: "hall-ticket",
        path: "/hall-ticket",
        element: <AdminAddHallTicket />,
      },

      {
        name: "marks-entry",
        path: "/marks-entry",
        element: <StaffMarksEntry />,
      },

      {
        name: "manual marks-entry",
        path: "/marks-entry/manual-entry",
        element: <StaffManualMarksEntry />,
      },

      {
        name: "report card",
        path: "/report-card",
        element: <AdminAddReportCard />,
      },

      {
        name: "reports",
        path: "/reports",
        element: <AdminReports />,
      },
    ],
  }
];

export default staffRoutes;
