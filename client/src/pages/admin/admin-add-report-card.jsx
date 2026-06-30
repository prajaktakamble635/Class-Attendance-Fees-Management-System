import React, { Suspense } from "react";

// Lazy load the Report Card holder component
const AdminAddReportCardHolder = React.lazy(() =>
  import("../../page-holder/admin/admin-add-report-card-holder.jsx")
);

export function AdminAddReportCard() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen flex-col items-center justify-center">
          <img
            src="/logo-tran.png"
            className="h-18 mb-8 w-48 animate-bounce object-contain"
            alt="logo"
          />
          <div className="loading-text text-lg text-gray-600">
            Loading Report Card, please wait...
          </div>
        </div>
      }
    >
      <AdminAddReportCardHolder />
    </Suspense>
  );
}

export default AdminAddReportCard;
