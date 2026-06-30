import React, { Fragment, useState } from "react";
import { isMobile } from "react-device-detect";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  Select,
  Option,
} from "@material-tailwind/react";
import axios from "axios";
import { validateFormData } from "@/hooks/validation.js";
import { handleError } from "@/hooks/errorHandling.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CancelButton, SubmitButton } from "@/widgets/components/index.js";
import { useMaterialTailwindController } from "@/context/index.jsx";

export default function Add(props) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { theme } = controller;
  const [formData, setFormData] = useState({
    name: "",
  });

  const closeDialog = () => {
    setFormData({
        name: "",
    });
    props.setIsAddOpen(false);
  };

  const handleTextChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const submitData = async () => {
    const validationRules = [
      { field: "name", required: true, message: "Please enter tag." },
      // { field: "position", required: true, message: "Please enter product Gl Code." },
    ];
    const hasError = validateFormData(formData, validationRules, theme);
    if (!hasError) {
      const { name } = formData;
      const data = {
        name,
      };
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/adminApi/addTags`,
          data
        );
        const statusMessages = {
          200: "Tag added successfully.",
          201: "Tag added successfully.",
          202: "Your request has been received and is being processed. Please wait for the results.",
          204: "The server couldn't find any information to show or work with.",
          default: "Please try reloading the page.",
        };
        const message =
          statusMessages[response.status] || statusMessages.default;
        props.refreshTableData();
        toast.success(message, { position: "top-center", theme });
        closeDialog();
      } catch (error) {
        handleError(error, theme);
        switch (error.response.status) {
          case 401:
            window.location.replace(import.meta.env.VITE_LOGIN_URL);
            break;
          case 403:
            navigate("/admin/dashboard", { replace: true });
            break;
          default:
        }
      }
    }
  };

  return (
    <Fragment>
      <Dialog
        className="z-40"
        handler={closeDialog}
        open={props.isAddOpen}
        size={isMobile ? "xxl" : "md"}
      >
        <DialogHeader className="justify-center bg-gray-100 text-center">
          Add Tags
        </DialogHeader>
        <DialogBody divider>
          <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-1">
            <Input
              required
              label="Tags Name"
              name="name"
              value={formData.name}
              onChange={handleTextChange}
            />
            {/* <Input
              label="Position"
              name="position"
              value={formData.position}
              onChange={handleTextChange}
            /> */}
          </div>
        </DialogBody>
        <DialogFooter className="bg-gray-100">
          <CancelButton onClick={closeDialog} />
          <SubmitButton onClick={submitData} />
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
