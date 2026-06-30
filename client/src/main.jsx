import 'leaflet/dist/leaflet.css';
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";
import { MaterialTailwindControllerProvider } from "@/context";
import 'react-toastify/dist/ReactToastify.css';
import "../public/css/tailwind.css";
import { ToastContainer } from 'react-toastify';
import NetworkStatusWarning from './widgets/components/NetworkStatusWarning';
import { UserProvider } from "./context/user";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <MaterialTailwindControllerProvider>
            <UserProvider>
              <NetworkStatusWarning />
              <App />
              <ToastContainer position="top-center"/>
            </UserProvider>
        </MaterialTailwindControllerProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
