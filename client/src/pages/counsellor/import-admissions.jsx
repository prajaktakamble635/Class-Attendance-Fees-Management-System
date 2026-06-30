
import React, { Suspense } from "react";

const CounsellorImportAdmissionsHolder = React.lazy(() => import('../../page-holder/counsellor/import-admissions-holder.jsx'));

export function CounsellorImportAdmissions() {
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
            <CounsellorImportAdmissionsHolder />
        </Suspense>
    );
}

export default CounsellorImportAdmissions;
