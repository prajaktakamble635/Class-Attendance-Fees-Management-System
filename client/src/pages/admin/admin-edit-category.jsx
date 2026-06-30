import React, { Suspense } from "react";
import { useParams } from "react-router-dom";

const EditCategoryHolder = React.lazy(() =>
  import("../../page-holder/admin/admin-edit-category-holder")
);

export function EditCategoryMaster() {
  const { id } = useParams();

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
      <EditCategoryHolder id={id} />
    </Suspense>
  );
}

export default EditCategoryMaster;
