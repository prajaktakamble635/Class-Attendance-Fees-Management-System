import React, { Suspense } from "react";

const AdminStudentListHolder = React.lazy(() =>
  import("../../page-holder/admin/admin-student-list-holder.jsx")
);

export function AdminStudentList() {
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
      <AdminStudentListHolder />
    </Suspense>
  );
}

export default AdminStudentList;
