import {
  Dashboard,
  Profile,
  UserMaster,
  AddUserMaster,
  BranchMaster,
  StaffMaster,
  CustomerMaster,
  LeadMaster,
  AddLeadMaster,
  EditLeadMaster,
  FollowUpLeadsMaster,
  UserReportMaster,
  RecoveryReportMaster,
  LocationReportMaster,
  BranchReportMaster,
  Product,
  Level1SubProduct,
  Level2SubProduct,
  ReportMaster,
  LocationTrackingMaster,
  HrRecovery,
  StaffLoginReport,
  AddHrRecovery,
  HrEvaluateRecovery,
  LeadReportMaster,
  SalesReportMaster,
  StaffReportMaster,
  StaffNotLoginReport,
  LeadClosedDeleteReportMaster,
  CasaReportMaster
} from "@/pages/hrStaff";


export const hrStaffRoutes = [
  {
    layout: "hrStaff",
    pages: [
      {
        name: "dashboard",
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        name: "add user master",
        path: "/add-user-master",
        element: <AddUserMaster />,
      },
      {
        name: "profile",
        path: "/profile",
        element: <Profile />,
      },
      {
        name: "user master",
        path: "/user-master",
        element: <UserMaster />,
      },
      {
        name: "branch master",
        path: "/branch",
        element: <BranchMaster />,
      },
      {
        name: "staff master",
        path: "/staff",
        element: <StaffMaster />,
      },
      {
        name: "customer",
        path: "/customer",
        element: <CustomerMaster />,
      },
      {
        name: "leads",
        path: "/leads",
        element: <LeadMaster />,
      },
      {
        name: "add leads",
        path: "/add-leads",
        element: <AddLeadMaster />,
      },
      {
        name: "edit leads",
        path: '/edit-leads/:id',
        element: <EditLeadMaster />,
      },
      {
        name: "follow-up-leads",
        path: "/follow-up-leads",
        element: <FollowUpLeadsMaster />,
      },
      {
        name: "user report",
        path: "/user-report",
        element: <UserReportMaster />,
      },
      {
        name: "recovery report",
        path: "/recovery-report",
        element: <RecoveryReportMaster />,
      },
      {
        name: "location report",
        path: "/location-report",
        element: <LocationReportMaster />,
      },
      {
        name: "branch report",
        path: "/branch-report",
        element: <BranchReportMaster />,
      },
      {
        name: "product",
        path: "/product/product",
        element: <Product />,
      },
      {
        name: "level-1-sub-product",
        path: "/product/sub-product-1",
        element: <Level1SubProduct />,
      },
      {
        name: "level-2-sub-product",
        path: "/product/sub-product-2",
        element: <Level2SubProduct />,
      },
      {
        name: "report master",
        path: "/report",
        element: <ReportMaster />,
      },
      {
        name: "location-tracking",
        path: "/location-tracking",
        element: <LocationTrackingMaster />,
      },
      {
        name: "recovery",
        path: "/recovery",
        element: <HrRecovery />,
      },
      {
        name: "staff-login-report",
        path: "/staff-login-report",
        element: <StaffLoginReport />,
      },
      {
        name: "add hr recovery",
        path: "/recovery/add-hr-recovery",
        element: <AddHrRecovery />,
      },
      {
        name: "hr evaluate recovery",
        path: "/recovery/hr-evaluate-recovery",
        element: <HrEvaluateRecovery />,
      },
      {
        name: "lead report master",
        path: "/lead-report",
        element: <LeadReportMaster />,
      },
      {
        name: "sales report master",
        path: "/sales-report",
        element: <SalesReportMaster />,
      },
      {
        name: "staff report master",
        path: "/staff-report",
        element: <StaffReportMaster />,
      },
      {
        name: "staff Not login",
        path: "/not-login-staff-report",
        element: < StaffNotLoginReport />,
      },
      {
        name: "Lead Closed Delete report",
        path: "/lead-closed-delete-report",
        element: <LeadClosedDeleteReportMaster />,
      },
      {
        name: "casa report master",
        path: "/casa-report",
        element: <CasaReportMaster />,
      },

    ],
  }
];

export default hrStaffRoutes;
