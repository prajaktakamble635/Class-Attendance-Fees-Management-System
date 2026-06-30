import { Routes, Route } from "react-router-dom";
import { Footer } from "@/widgets/layout";
import {PrivacyPolicy} from "@/pages/others/privacy-policy.jsx";
import {DeleteMyData} from "@/pages/others/delete-my-data.jsx";
import {ContactUs} from "@/pages/others/contact-us.jsx";
import React from "react";
export function Pages() {
  return (
    <div className="relative min-h-screen w-full">
      <div className="container relative z-40 mx-auto p-4">
      </div>
      <Routes>
        <Route exact path={'/privacy-policy'} element={<PrivacyPolicy />} />
        <Route exact path={'/delete-my-data'} element={<DeleteMyData />} />
        <Route exact path={'/contact-us'} element={<ContactUs />} />
      </Routes>
      <div className="container absolute bottom-8 left-2/4 z-10 mx-auto -translate-x-2/4 text-white">
        <Footer />
      </div>
    </div>
  );
}

Pages.displayName = "/src/layout/Pages.jsx";

export default Pages;
