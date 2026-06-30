import {
  BranchAddLeadMaster,
  BranchCustomerMaster,
  BranchDashboard,
  BranchEditLeadMaster,
  BranchLeadMaster,
  Recovery,
  Profile,
  Product,
  Level1SubProduct,
  Level2SubProduct,
  AddRecovery,
  EditRecovery,
  RecoveryTracking,
  StaffMaster,
  BranchEvaluateRecovery,
  LocationTrackingMaster,
  StaffLoginReport,
  LeadReportMaster,
  SalesReportMaster,
  StaffReportMaster,
  BranchRecoveryReport,
  LocationReportMaster,
  BranchReportMaster,
  FollowUpLeadsMaster,
  BranchDisputeLeadMaster,
  BranchFollowupRecovery,
  LeadClosedDeleteReportMaster,
  CasaReportMaster
} from "@/pages/branch";

export const branchRoutes = [
  {
    layout: "branch",
    pages: [
      {
        name: "dashboard",
        path: "/dashboard",
        element: <BranchDashboard />,
      },
      {
        name: "recovery",
        path: "/recovery",
        element: <Recovery />,
      },
      {
        name: "customers",
        path: "/customer",
        element: <BranchCustomerMaster />,
      },
      {
        name: "leads",
        path: "/leads",
        element: <BranchLeadMaster />,
      },
      {
        name: "dispute leads",
        path: "/dispute-leads",
        element: <BranchDisputeLeadMaster />,
      },
      {
        name: "add leads",
        path: "/add-leads",
        element: <BranchAddLeadMaster />,
      },
      {
        name: "edit leads",
        path: '/edit-leads/:id',
        element: <BranchEditLeadMaster />,
      },
      {
        name: "profile",
        path: "/profile",
        element: <Profile />,
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
        name: "add-recovery",
        path: "/recovery/add-recovery",
        element: <AddRecovery />,
      },
      {
        name: "followup-recovery",
        path: "/recovery/followup-recovery",
        element: <BranchFollowupRecovery />,
      },
      {
        name: "edit-recovery",
        path: "/recovery/edit-recovery/:id",
        element: <EditRecovery />,
      },
      {
        name: "recovery-tracking",
        path: "/recovery/recovery-tracking/:id",
        element: <RecoveryTracking />,
      },
      {
        name: "branch evaluate recovery",
        path: "/recovery/branch-evaluate-recovery",
        element: <BranchEvaluateRecovery />,
      },
      {
        name: "staff master",
        path: "/staff",
        element: <StaffMaster />,
      },
      {
        name: "location-tracking",
        path: "/location-tracking",
        element: <LocationTrackingMaster />,
      },
      {
        name: "staff-login-report",
        path: "/staff-login-report",
        element: <StaffLoginReport />,
      }, {
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
        name: "branch recovery report",
        path: "/recovery-report",
        element: <BranchRecoveryReport />,
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
        name: "follow-up-leads",
        path: "/follow-up-leads",
        element: <FollowUpLeadsMaster />,
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

export default branchRoutes;
