import React, { Suspense } from "react";
import { useParams } from "react-router-dom";

const ViewSubCategoryHolder = React.lazy(() =>
  import("../../page-holder/admin/admin-view-subcategory-holder")
);

export function ViewSubCategoryMaster() {
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
      <ViewSubCategoryHolder id={id} />
    </Suspense>
  );
}

export default ViewSubCategoryMaster;
