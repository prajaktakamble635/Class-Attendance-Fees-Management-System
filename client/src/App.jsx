import { Routes, Route, Navigate } from "react-router-dom";
import React from "react";
const Auth = React.lazy(() => import('@/layouts/auth'));
const Admin = React.lazy(() => import('@/layouts/admin'));
const Staff = React.lazy(() => import('@/layouts/staff'));
const Counsellor = React.lazy(() => import('@/layouts/counsellor'));
const Hod = React.lazy(() => import('@/layouts/hod'));
const Pages = React.lazy(() => import('@/layouts/pages'));
const Parent = React.lazy(() => import('@/layouts/parent'));

function App() {
  return (
    <Routes>
      <Route path="/superAdmin/*" element={<Admin />} />
      <Route path="/batchCoord/*" element={<Staff />} />
      <Route path="/counsellor/*" element={<Counsellor />} />
      <Route path="/hod/*" element={<Hod />} />
      <Route path="/parent/*" element={<Parent />} />
      <Route path="/pages/*" element={<Pages />} />
      <Route path="/auth/*" element={<Auth />} />
      <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
    </Routes>
  );
}

export default App;
