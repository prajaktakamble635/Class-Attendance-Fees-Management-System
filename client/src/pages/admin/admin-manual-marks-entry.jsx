import React, { Suspense } from "react";

const AdminManualMarksEntryHolder = React.lazy(() =>
  import("../../page-holder/admin/admin-manual-marks-entry-holder.jsx")
);

export function AdminManualMarksEntry() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen flex-col items-center justify-center">
          <img
            src="/logo-tran.png"
            className="h-18 mb-8 w-48 animate-bounce object-contain"
            alt="logo"
          />
          <div className="loading-text">Loading, please wait...</div>
        </div>
      }
    >
      <AdminManualMarksEntryHolder />
    </Suspense>
  );
}

export default AdminManualMarksEntry;
