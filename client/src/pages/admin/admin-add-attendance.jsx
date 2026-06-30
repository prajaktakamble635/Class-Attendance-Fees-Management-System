import React, { Suspense } from "react";

const AdminAddAttendanceHolder = React.lazy(() =>
    import("../../page-holder/admin/admin-add-attendance-holder.jsx")
);

export function AdminAddAttendance() {
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
              Loading, please wait...
            </div>
          </div>
        }
      >
        <AdminAddAttendanceHolder />
      </Suspense>
    );
}

export default AdminAddAttendance;
