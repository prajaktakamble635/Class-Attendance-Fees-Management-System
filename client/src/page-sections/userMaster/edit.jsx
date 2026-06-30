import React, { Fragment, useRef, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogHeader,
  DialogFooter,
  DialogBody,
  Input,
  Avatar,
  Select,
  Option,
} from "@material-tailwind/react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CancelButton, UpdateButton } from "@/widgets/components/index.js";
import { validateFormData } from "@/hooks/validation.js";
import { handleError } from "@/hooks/errorHandling.js";
import {
  checkDocumentMimeType,
  checkFileSize,
  maxSelectFile,
} from "@/hooks/fileValidationUtils.js";

export default function Edit(props) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [progressOpen, setProgressOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    mobile: "",
    email: "",
    role: 5,
    joiningDate: new Date().toISOString().split("T")[0],
    image: "",
    password: "",
  });

  React.useEffect(() => {
    if (props.isEditOpen) {
      setFormData({
        id: props.selectedRecord.id,
        name: props.selectedRecord.name,
        mobile: props.selectedRecord.mobile,
        email: props.selectedRecord.email,
        // image: props.selectedRecord.logo,
        // joiningDate: props.selectedRecord.joiningDate,
        role: props.selectedRecord.role,
      });
    }
  }, [props.isEditOpen]);

  const closeDialog = () => {
    handleClose();
    props.setIsEditOpen(false);
  };

  const handleTextChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleClose = () => {
    setFormData({
      id: 0,
      name: "",
      mobile: "",
      email: "",
      role: "",
      // joiningDate: new Date().toISOString().split("T")[0],
      // image: "",
      password: "",
    });
  };

  const onDocumentUpload = (event) => {
    const files = event.target.files;
    if (
      maxSelectFile(files) &&
      checkDocumentMimeType(files) &&
      checkFileSize(files)
    ) {
      if (event.target.value) {
        const data = new FormData();
        Array.from(files).forEach((file) => {
          data.append("file", file);
        });
        setProgressOpen(true);
        axios
          .post(
            `${import.meta.env.VITE_API_URL}/api/userApi/uploadDocuments`,
            data,
            {
              onUploadProgress: (progressEvent) => {
                const percentage = Number(
                  (progressEvent.loaded / progressEvent.total) * 100
                ).toFixed();
                setUploadPercentage(percentage);
              },
            }
          )
          .then((res) => {
            setProgressOpen(false);
            setFormData({
              ...formData,
              [event.target.name]: res.data.fname,
            });
          })
          .catch((error) => {
            setProgressOpen(false);
            setUploadPercentage(0);
            handleError(error);
            switch (error.response.status) {
              case 401:
                navigate("/auth/sign-in", { replace: true });
                break;
              case 403:
                navigate("/admin/dashboard", { replace: true });
                break;
              default:
            }
          });
      }
    } else event.target.value = null;
  };

  const removeUploadedFile = () => {
    setFormData({
      ...formData,
      image: "",
    });
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const submitData = async () => {
    const validationRules = [
      { field: "name", message: "Please enter name." },
      { field: "mobile", message: "Please enter mobile number." },
      { field: "role", message: "Please enter role." },
    //   { field: "password", message: "Please enter password." },
    ];
    let hasError = validateFormData(formData, validationRules);

    if (formData.mobile) {
      const mobileRegex = /^\d{10}$/; // exactly 10 digits
      if (!mobileRegex.test(formData.mobile)) {
        toast.error("Mobile number must be exactly 10 digits.", {
          position: toast.POSITION.TOP_CENTER,
        });
        hasError = true;
      }
    }

    if (formData.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        toast.error("Invalid email format.", {
          position: toast.POSITION.TOP_CENTER,
        });
        hasError = true;
      }
    }

    if (!hasError) {
      const { name, password, role, mobile, email, image, joiningDate } =
        formData;
      const data = {
        id: formData.id,
        name,
        password,
        role,
        mobile,
        email,
        // image,
        // joiningDate,
      };
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/adminApi/updateUser`,
          data
        );
        const statusMessages = {
          200: "User account updated successfully !",
          201: "User account updated successfully !",
          202: "Your request has been received and is being processed. Please wait for the results.",
          204: "The server couldn't find any information to show or work with.",
          default: "Please try reloading the page.",
        };
        const message =
          statusMessages[response.status] || statusMessages.default;
        toast.success(message, { position: toast.POSITION.TOP_CENTER });
        props.refreshTableData();
        closeDialog();
      } catch (error) {
        handleError(error);
        switch (error.response.status) {
          case 401:
            navigate("/auth/sign-in", { replace: true });
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
        size={"xxl"}
        className="z-40 overflow-scroll"
        open={props.isEditOpen}
        handler={closeDialog}
      >
        <DialogHeader className="bg-gray-100 text-center">
          Update User
          <button
            className="absolute right-2 top-2 cursor-pointer p-2"
            onClick={closeDialog}
            title="Close"
          >
            <span className="text-2xl text-red-500">X</span>
          </button>
        </DialogHeader>
        <DialogBody divider className="px-1 pb-2 pt-4 md:px-2 lg:px-4">
          <div className="grid w-full grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-3">
            <Input
              required
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleTextChange}
            />
            <Input
              required
              type="number"
              label="Mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleTextChange}
            />
            <Input
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleTextChange}
            />
            <Select
              required
              label="Role *"
              name="role"
              value={formData.role}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  role: value,
                });
              }}
            >
              <Option value={1}>Admin</Option>
              <Option value={2}>Procurement Team</Option>
              <Option value={3}>Logistics</Option>
              <Option value={4}>Sales/CRM</Option>
              <Option value={5}>Staff</Option>
            </Select>
            {/* <Input
              type="date"
              label="Joining Date"
              name="joiningDate"
              value={formData.joiningDate}
              onChange={handleTextChange}
            /> */}
            <Input
            //   required
              type="password"
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleTextChange}
            />
            {/* <div className="lg:col-span-2">
              <label className="block pl-1 text-sm font-semibold text-gray-700">
                Logo
              </label>
              <div
                className="mb-2 border-2 border-dashed border-gray-300"
                onClick={() =>
                  document.getElementById("uploadDocument").click()
                }
              >
                <div className="mx-auto mb-2 w-full cursor-pointer rounded-md text-center">
                  <label className="m-1 flex cursor-pointer flex-col items-center justify-center space-y-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="h-6 w-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                      />
                    </svg>
                    <span className="text-gray-900">Choose file to upload</span>
                  </label>
                  <span className="hidden">
                    <Input
                      ref={fileInputRef}
                      label="Image"
                      type="file"
                      id="uploadDocument"
                      name="image"
                      accept="image/*"
                      capture="camera"
                      onChange={onDocumentUpload}
                    />
                  </span>
                </div>
                {formData.image && (
                  <div className="flex flex-wrap justify-center justify-items-center">
                    <div className="flex justify-between bg-gray-300 p-1 text-center sm:w-[325px] lg:w-[375px]">
                      {formData.image.endsWith(".pdf") ? (
                        <div className="flex">
                          <div className="mx-2 my-auto">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="1.5em"
                              height="1.5em"
                              viewBox="0 0 32 32"
                            >
                              <path
                                fill="#909090"
                                d="m24.1 2.072l5.564 5.8v22.056H8.879V30h20.856V7.945L24.1 2.072"
                              ></path>
                              <path
                                fill="#f4f4f4"
                                d="M24.031 2H8.808v27.928h20.856V7.873L24.03 2"
                              ></path>
                              <path
                                fill="#7a7b7c"
                                d="M8.655 3.5h-6.39v6.827h20.1V3.5H8.655"
                              ></path>
                              <path
                                fill="#dd2025"
                                d="M22.472 10.211H2.395V3.379h20.077v6.832"
                              ></path>
                              <path
                                fill="#464648"
                                d="M9.052 4.534H7.745v4.8h1.028V7.715L9 7.728a2.042 2.042 0 0 0 .647-.117a1.427 1.427 0 0 0 .493-.291a1.224 1.224 0 0 0 .335-.454a2.13 2.13 0 0 0 .105-.908a2.237 2.237 0 0 0-.114-.644a1.173 1.173 0 0 0-.687-.65a2.149 2.149 0 0 0-.409-.104a2.232 2.232 0 0 0-.319-.026m-.189 2.294h-.089v-1.48h.193a.57.57 0 0 1 .459.181a.92.92 0 0 1 .183.558c0 .246 0 .469-.222.626a.942.942 0 0 1-.524.114m3.671-2.306c-.111 0-.219.008-.295.011L12 4.538h-.78v4.8h.918a2.677 2.677 0 0 0 1.028-.175a1.71 1.71 0 0 0 .68-.491a1.939 1.939 0 0 0 .373-.749a3.728 3.728 0 0 0 .114-.949a4.416 4.416 0 0 0-.087-1.127a1.777 1.777 0 0 0-.4-.733a1.63 1.63 0 0 0-.535-.4a2.413 2.413 0 0 0-.549-.178a1.282 1.282 0 0 0-.228-.017m-.182 3.937h-.1V5.392h.013a1.062 1.062 0 0 1 .6.107a1.2 1.2 0 0 1 .324.4a1.3 1.3 0 0 1 .142.526c.009.22 0 .4 0 .549a2.926 2.926 0 0 1-.033.513a1.756 1.756 0 0 1-.169.5a1.13 1.13 0 0 1-.363.36a.673.673 0 0 1-.416.106m5.08-3.915H15v4.8h1.028V7.434h1.3v-.892h-1.3V5.43h1.4v-.892"
                              ></path>
                              <path
                                fill="#dd2025"
                                d="M21.781 20.255s3.188-.578 3.188.511s-1.975.646-3.188-.511Zm-2.357.083a7.543 7.543 0 0 0-1.473.489l.4-.9c.4-.9.815-2.127.815-2.127a14.216 14.216 0 0 0 1.658 2.252a13.033 13.033 0 0 0-1.4.288Zm-1.262-6.5c0-.949.307-1.208.546-1.208s.508.115.517.939a10.787 10.787 0 0 1-.517 2.434a4.426 4.426 0 0 1-.547-2.162Zm-4.649 10.516c-.978-.585 2.051-2.386 2.6-2.444c-.003.001-1.576 3.056-2.6 2.444ZM25.9 20.895c-.01-.1-.1-1.207-2.07-1.16a14.228 14.228 0 0 0-2.453.173a12.542 12.542 0 0 1-2.012-2.655a11.76 11.76 0 0 0 .623-3.1c-.029-1.2-.316-1.888-1.236-1.878s-1.054.815-.933 2.013a9.309 9.309 0 0 0 .665 2.338s-.425 1.323-.987 2.639s-.946 2.006-.946 2.006a9.622 9.622 0 0 0-2.725 1.4c-.824.767-1.159 1.356-.725 1.945c.374.508 1.683.623 2.853-.91a22.549 22.549 0 0 0 1.7-2.492s1.784-.489 2.339-.623s1.226-.24 1.226-.24s1.629 1.639 3.2 1.581s1.495-.939 1.485-1.035"
                              ></path>
                              <path
                                fill="#909090"
                                d="M23.954 2.077V7.95h5.633l-5.633-5.873Z"
                              ></path>
                              <path
                                fill="#f4f4f4"
                                d="M24.031 2v5.873h5.633L24.031 2Z"
                              ></path>
                              <path
                                fill="#fff"
                                d="M8.975 4.457H7.668v4.8H8.7V7.639l.228.013a2.042 2.042 0 0 0 .647-.117a1.428 1.428 0 0 0 .493-.291a1.224 1.224 0 0 0 .332-.454a2.13 2.13 0 0 0 .105-.908a2.237 2.237 0 0 0-.114-.644a1.173 1.173 0 0 0-.687-.65a2.149 2.149 0 0 0-.411-.105a2.232 2.232 0 0 0-.319-.026m-.189 2.294h-.089v-1.48h.194a.57.57 0 0 1 .459.181a.92.92 0 0 1 .183.558c0 .246 0 .469-.222.626a.942.942 0 0 1-.524.114m3.67-2.306c-.111 0-.219.008-.295.011l-.235.006h-.78v4.8h.918a2.677 2.677 0 0 0 1.028-.175a1.71 1.71 0 0 0 .68-.491a1.939 1.939 0 0 0 .373-.749a3.728 3.728 0 0 0 .114-.949a4.416 4.416 0 0 0-.087-1.127a1.777 1.777 0 0 0-.4-.733a1.63 1.63 0 0 0-.535-.4a2.413 2.413 0 0 0-.549-.178a1.282 1.282 0 0 0-.228-.017m-.182 3.937h-.1V5.315h.013a1.062 1.062 0 0 1 .6.107a1.2 1.2 0 0 1 .324.4a1.3 1.3 0 0 1 .142.526c.009.22 0 .4 0 .549a2.926 2.926 0 0 1-.033.513a1.756 1.756 0 0 1-.169.5a1.13 1.13 0 0 1-.363.36a.673.673 0 0 1-.416.106m5.077-3.915h-2.43v4.8h1.028V7.357h1.3v-.892h-1.3V5.353h1.4v-.892"
                              ></path>
                            </svg>
                          </div>
                          <div>{formData.image}</div>
                        </div>
                      ) : (
                        <div className="flex">
                          <Avatar
                            size="lg"
                            src={`${
                              import.meta.env.VITE_API_URL
                            }/api/userApi/downloadDocument?name=${
                              formData.image
                            }`}
                            variant="rounded"
                            crossOrigin={"use-credentials"}
                          />
                          <div className="pl-2">{formData.image}</div>
                        </div>
                      )}
                      <svg
                        onClick={(event) => {
                          event.stopPropagation();
                          removeUploadedFile();
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="red"
                        className="h-[24px] w-[24px] cursor-pointer"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div> */}
          </div>
        </DialogBody>
        <DialogFooter className="bg-gray-100">
          <CancelButton onClick={closeDialog} />
          <UpdateButton onClick={submitData} />
        </DialogFooter>
      </Dialog>
    </Fragment>
  );
}
