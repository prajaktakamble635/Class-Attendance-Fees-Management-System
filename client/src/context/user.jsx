import axios from "axios";
import React, { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useMaterialTailwindController } from ".";

export const useUser = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [refresh, setRefresh] = useState();
    const [controller] = useMaterialTailwindController();
    const { theme } = controller;

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/api/commonApi/getUserInfo`)
            .then((res) => {
                setUser(res.data)
            }).catch((err) => {
                // toast.error("Internal Server Error: Failed to fetch userRole", {theme: theme})
            })
    }, [refresh]);

    return (
        <useUser.Provider value={{ user, refresh, setRefresh }}>
            {children}
        </useUser.Provider>
    )

}