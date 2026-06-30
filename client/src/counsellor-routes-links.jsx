import {
    Profile,
    CounsellorStudentList,
    CounsellorEditAdmissions,
    CounsellorImportAdmissions,
    ViewStudentFeesMaster
} from "@/pages/counsellor";
import { AddAdmissionMaster } from "@/pages/admin";


export const hodRoutes = [
    {
        layout: "counsellor",
        pages: [
            {
                name: "profile",
                path: "/profile",
                element: <Profile />,
            },
            {
                name: "add admissions",
                path: "/add-admission",
                element: <AddAdmissionMaster />,
            },
            {
                name: "add admissions",
                path: "/student-list",
                element: <CounsellorStudentList />,
            },
            {
                name: "edit admissions",
                path: "/edit-student/:id",
                element: <CounsellorEditAdmissions />,
            },
            {
                name: "admission import",
                path: "/admission-import",
                element: <CounsellorImportAdmissions />,
            },
            {
                name: "admission import",
                path: "/view-all-student-fees",
                element: <ViewStudentFeesMaster />,
            },
        ],
    }
];

export default hodRoutes;
