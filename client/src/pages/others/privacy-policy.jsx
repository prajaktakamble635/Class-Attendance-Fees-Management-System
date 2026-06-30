import axios from "axios";
import React from "react";
import { PrivacyPolicyContent, TermsConditions, DataDeletionPolicy } from "./Policies";

axios.defaults.withCredentials = true;

export function PrivacyPolicy() {
  return (
    <>
      <div className="absolute inset-0 z-0 h-full w-full bg-gray-300" />
      <div className="container mx-auto p-4 relative z-10">
        <PrivacyPolicyContent />
        <TermsConditions />
        <DataDeletionPolicy />
      </div>
    </>
  );
}

export default PrivacyPolicy;
