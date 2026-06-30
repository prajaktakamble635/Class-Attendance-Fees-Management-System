import {
    AdminAddHallTicket,
    AdminAddAttendance,
    HodMarksEntry,
    HodManualMarksEntry,
    AdminReports,
    AdminAddReportCard,
    Profile,
    ViewStudentFeesMaster,
    HodEditAdmissions,
    HodImportAdmissions,
    HodStudentList
} from "@/pages/hod";
import { AddAdmissionMaster } from "@/pages/admin";


export const hodRoutes = [
    {
        layout: "hod",
        pages: [
            {
                name: "profile",
                path: "/profile",
                element: <Profile />,
            },
            {
                name: "add admission",
                path: "/add-admission",
                element: <AddAdmissionMaster />,
            },
            {
                name: "admission import",
                path: "/admission-import",
                element: <HodImportAdmissions />,
            },
            {
                name: "edit student",
                path: "/edit-student/:id",
                element: <HodEditAdmissions />,
            },
            {
                name: "student list",
                path: "/student-list",
                element: <HodStudentList />,
            },
            {
                name: "view fees",
                path: "/view-all-student-fees",
                element: <ViewStudentFeesMaster />,
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
                element: <HodMarksEntry />,
            },

            {
                name: "manual marks-entry",
                path: "/marks-entry/manual-entry",
                element: <HodManualMarksEntry />,
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

export default hodRoutes;
