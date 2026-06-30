import React, { Suspense } from "react";

const WebsiteStatsHolder = React.lazy(() =>
  import("../../page-holder/admin/admin-website-stats-holder")
);

export function WebsiteStatsMaster() {
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
      <WebsiteStatsHolder />
    </Suspense>
  );
}

export default WebsiteStatsMaster;
