import {
  AddAdmissionMaster,
  AddBannerMaster,
  AddCategoryMaster,
  AddCurrencyMaster,
  AddFAQMaster,
  AddPartnerMaster,
  AddProductMaster,
  AddSubCategoryMaster,
  AddUserMaster,
  AddWarehouseMaster,
  AddWebsiteStatsMaster,
  BannerMaster,
  CategoryMaster,
  CurrencyMaster,
  Dashboard,
  EditBannerMaster,
  EditCategoryMaster,
  EditCurrencyMaster,
  EditFAQMaster,
  EditPartnerMaster,
  EditProductMaster,
  EditSeoMaster,
  EditSubCategoryMaster,
  EditWarehouseMaster,
  EditWebsiteStatsMaster,
  FAQMaster,
  PartnersMaster,
  ProductMaster,
  Profile,
  SeoMaster,
  SubCategoryMaster,
  TagsMaster,
  UserMaster,
  ViewCurrencyMaster,
  ViewFAQMaster,
  ViewPartnerMaster,
  ViewSeoMaster,
  ViewSubCategoryMaster,
  ViewWarehouseMaster,
  ViewWebsiteStatsMaster,
  WarehouseMaster,
  WebsiteStatsMaster,


  AdminStudentList,
  AdminEditAdmission,
  AdmissionImport,

  AddStudentFeesMaster,
  AdminAddExam,
  AdminExamList,
  ViewStudentFeesMaster,
  EditStudentFeesMaster,
  AdminEditExam,
  AdminAddAttendance,
  AdminAddHallTicket,
  AdminMarksEntry,
  AdminAddReportCard,
  AdminManualMarksEntry,
  AdminReports,
  EmployeeMaster,
  DailyAttendance,
} from "@/pages/admin";

export const adminRoutes = [
  {
    layout: "superAdmin",
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
        name: "add admission",
        path: "/add-admission",
        element: <AddAdmissionMaster />,
      },
      {
        name: "tags master",
        path: "/tags",
        element: <TagsMaster />,
      },
      {
        name: "products",
        path: "/products",
        element: <ProductMaster />,
      },
      {
        name: "add product",
        path: "/add-product",
        element: <AddProductMaster />,
      },
      {
        name: "edit product",
        path: "/edit-product/:id",
        element: <EditProductMaster />,
      },
      {
        name: "banners",
        path: "/banners",
        element: <BannerMaster />,
      },
      {
        name: "add banner",
        path: "/add-banner",
        element: <AddBannerMaster />,
      },
      {
        name: "edit banner",
        path: "/edit-banner/:id",
        element: <EditBannerMaster />,
      },
      {
        name: "categories",
        path: "/categories",
        element: <CategoryMaster />,
      },
      {
        name: "add category",
        path: "/add-category",
        element: <AddCategoryMaster />,
      },
      {
        name: "edit category",
        path: "/edit-category/:id",
        element: <EditCategoryMaster />,
      },
      {
        name: "subcategories",
        path: "/subcategories",
        element: <SubCategoryMaster />,
      },
      {
        name: "add subcategory",
        path: "/add-subcategory",
        element: <AddSubCategoryMaster />,
      },
      {
        name: "edit subcategory",
        path: "/edit-subcategory/:id",
        element: <EditSubCategoryMaster />,
      },
      {
        name: "view subcategory",
        path: "/view-subcategory/:id",
        element: <ViewSubCategoryMaster />,
      },
      {
        name: "website stats",
        path: "/website-stats",
        element: <WebsiteStatsMaster />,
      },
      {
        name: "add website stats",
        path: "/add-website-stats",
        element: <AddWebsiteStatsMaster />,
      },
      {
        name: "edit website stats",
        path: "/edit-website-stats/:id",
        element: <EditWebsiteStatsMaster />,
      },
      {
        name: "view website stats",
        path: "/view-website-stats/:id",
        element: <ViewWebsiteStatsMaster />,
      },
      {
        name: "partners",
        path: "/partners",
        element: <PartnersMaster />,
      },
      {
        name: "add partner",
        path: "/add-partner",
        element: <AddPartnerMaster />,
      },
      {
        name: "edit partner",
        path: "/edit-partner/:id",
        element: <EditPartnerMaster />,
      },
      {
        name: "view partner",
        path: "/view-partner/:id",
        element: <ViewPartnerMaster />,
      },
      {
        name: "faqs",
        path: "/faqs",
        element: <FAQMaster />,
      },
      {
        name: "add faq",
        path: "/add-faq",
        element: <AddFAQMaster />,
      },
      {
        name: "edit faq",
        path: "/edit-faq/:id",
        element: <EditFAQMaster />,
      },
      {
        name: "view faq",
        path: "/view-faq/:id",
        element: <ViewFAQMaster />,
      },
      {
        name: "warehouses",
        path: "/warehouses",
        element: <WarehouseMaster />,
      },
      {
        name: "add warehouse",
        path: "/add-warehouse",
        element: <AddWarehouseMaster />,
      },
      {
        name: "edit warehouse",
        path: "/edit-warehouse/:id",
        element: <EditWarehouseMaster />,
      },
      {
        name: "view warehouse",
        path: "/view-warehouse/:id",
        element: <ViewWarehouseMaster />,
      },
      {
        name: "currencies",
        path: "/currencies",
        element: <CurrencyMaster />,
      },
      {
        name: "add currency",
        path: "/add-currency",
        element: <AddCurrencyMaster />,
      },
      {
        name: "edit currency",
        path: "/edit-currency/:id",
        element: <EditCurrencyMaster />,
      },
      {
        name: "view currency",
        path: "/view-currency/:id",
        element: <ViewCurrencyMaster />,
      },
      {
        name: "seo",
        path: "/seo",
        element: <SeoMaster />,
      },
      {
        name: "edit seo",
        path: "/edit-seo/:id",
        element: <EditSeoMaster />,
      },
      {
        name: "view seo",
        path: "/view-seo/:id",
        element: <ViewSeoMaster />,
      },




      //Gurukul-academy
      {
        name: "add exam",
        path: "/exam",
        element: <AdminAddExam />
      },
      {
        name: "admin exam list",
        path: "/exam-list",
        element: <AdminExamList />
      },
      {
        name: "edit exam ",
        path: "/edit-exam/:id",
        element: <AdminEditExam />
      },
      {
        name: "admin student list",
        path: "/student-list",
        element: <AdminStudentList />
      },
      {
        name: "admin edit student",
        path: "/edit-student/:id",
        element: <AdminEditAdmission />
      },
      {
        name: 'admission import',
        path: "/admission-import",
        element: <AdmissionImport />
      },
      {
        name: 'marks entry',
        path: "/marks-entry",
        element: <AdminMarksEntry />
      },
      {
        name: 'manual marks entry',
        path: "/marks-entry/manual-entry",
        element: <AdminManualMarksEntry />
      },
      {
        name: 'reports',
        path: "/reports",
        element: <AdminReports />
      },
      {
        name: 'employee',
        path: "/employee",
        element: <EmployeeMaster />
      },
      {
        name: 'daily attendance',
        path: "/daily-attendance",
        element: <DailyAttendance />
      },

      // ---------------------------

      {
        name: "Add Student Fees ",
        path: "/fees",
        element: <AddStudentFeesMaster />,
      },

      {
        name: "View Student Fees ",
        path: "/view-all-student-fees",
        element: <ViewStudentFeesMaster />,
      },
      {
        name: "Edit Student Fees ",
        path: "/edit-student-fees/:id",
        element: <EditStudentFeesMaster />,
      },
      {
        name: "Attendance ",
        path: "/attendance-sheet",
        element: <AdminAddAttendance />,
      },
      {
        name: "Hall Ticket ",
        path: "/hall-ticket",
        element: <AdminAddHallTicket />,
      },
      {
        name: "Report Card ",
        path: "/report-card",
        element: <AdminAddReportCard />,
      }

    ],
  },
];

export default adminRoutes;
