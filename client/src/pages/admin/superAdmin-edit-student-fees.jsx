import React, { Suspense } from "react";

// Lazy load the EditStudentFeesHolder component
const EditStudentFeesHolder = React.lazy(() => import('../../page-holder/admin/superAdmin-edit-student-fees-holder.jsx'));

export function EditStudentFeesMaster() {
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
        <EditStudentFeesHolder />
      </Suspense>
    );
}

export default EditStudentFeesMaster;
