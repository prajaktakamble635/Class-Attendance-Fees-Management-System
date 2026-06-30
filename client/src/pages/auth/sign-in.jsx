import { useUser } from "@/context/user";
import { CancelButton, SubmitButton } from "@/widgets/components";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Input,
  Typography,
} from "@material-tailwind/react";
import axios from "axios";
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
axios.defaults.withCredentials = true;

export function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    mobile: "",
    otp: "",
    sendOtp: true,
    signIn: false,
    btnName: "Verify username",
    token: null,
  });
  const [isStaffDisabled, setIsStaffDisabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetOpen, setResetOpen] = useState(false);
  const [openTwoFA, setOpenTwoFA] = useState(false);
  const [staffMobile, setStaffMobile] = useState(null);

  const { user, refresh, setRefresh } = useContext(useUser);

  React.useEffect(() => {
    document.title = "Gurukul Academy Test Series | Login";
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/checkAdminToken`)
      .then((response) => {
        if (response.status === 200) {
          if (response.data.userRole === 5) {
            navigate("/parent/dashboard", { replace: true });
          } else {
            navigate("/superAdmin/add-admission", { replace: true });
          }
        } else {
          navigate("/auth/sign-in", { replace: true });
          setLoading(false);
        }
      })
      .catch((errors) => {
        navigate("/auth/sign-in", { replace: true });
        setLoading(false);
      });
  }, []);

  const submitData = async () => {
    try {
      if (formData.mobile && formData.sendOtp) {
        axios
          .post(
            `${import.meta.env.VITE_API_URL}/api/publicApi/verifyUsername`,
            {
              mobile: formData.mobile?.toString()?.trim(),
            }
          )
          .then((response) => {
            if (response.status === 200) {
              if (response.data.code === 200) {
                setFormData({
                  ...formData,
                  sendOtp: false,
                  signIn: true,
                  btnName: "Sign In",
                });
                setIsStaffDisabled(true);
                toast.success(response.data.message, {
                  position: toast.POSITION.TOP_CENTER,
                });
              } else {
                toast.error("Unknown user role. Please contact admin.", {
                  position: toast.POSITION.TOP_CENTER,
                });
                return;
              }
            } else {
              toast.error("Invalid Mobile Number.", {
                position: toast.POSITION.TOP_CENTER,
              });
            }
          })
          .catch((errors) => {
            // handleError(errors);
            toast.error("Invalid Mobile Number.", {
              position: toast.POSITION.TOP_CENTER,
            });
          });
      } else if (formData.signIn && formData.otp) {
        axios
          .post(
            `${import.meta.env.VITE_API_URL}/api/publicApi/verifyPassword`,
            {
              mobile: formData.mobile?.toString()?.trim(),
              password: formData.otp?.toString()?.trim(),
            }
          )
          .then((response) => {
            if (response.status === 200 && response.data.success) {
              const resMsg = response?.data?.message || "Login successful.";
              // toast.success(resMsg, {
              //   position: toast.POSITION.TOP_CENTER,
              // });
              setFormData({
                mobile: "",
                otp: "",
                token: null,
                sendOtp: false,
                signIn: false,
                btnName: "Login Successful",
              });
              setStaffMobile(response.data.mobile);
              const isTwoFactorEnabled = response.data.isTwoFactorEnabled;
              const isAuthenticated = response.data.isAuthenticated;
              if (isTwoFactorEnabled == 1 && isAuthenticated == 1) {
                setOpenTwoFA(true);
                return;
              }
              const userType = response.data.userRole;
              if (userType === 5) {
                navigate("/parent/dashboard", { replace: true });
                setRefresh(!refresh);
              } else if ([1, 2, 3, 4].includes(userType)) {
                navigate("/superAdmin/add-admission", { replace: true });
                setRefresh(!refresh);
              } else if (userType === "DIVISION") {
                navigate("/division/dashboard", { replace: true });
                setRefresh(!refresh);
              } else if (userType === "RHOD") {
                navigate("/rhod/dashboard", { replace: true });
                setRefresh(!refresh);
              } else if (userType === "BRANCH") {
                navigate("/branch/dashboard", { replace: true });
                setRefresh(!refresh);
              } else if (userType === "SRO") {
                navigate("/sro/dashboard", { replace: true });
                setRefresh(!refresh);
              } else if (userType === "AGENT") {
                navigate("/agent/dashboard", { replace: true });
                setRefresh(!refresh);
              } else if (userType === "ZROFFICER") {
                navigate("/zrofficer/dashboard", { replace: true });
                setRefresh(!refresh);
              } else if (userType === "DROFFICER") {
                navigate("/drofficer/dashboard", { replace: true });
                setRefresh(!refresh);
              } else if (userType === "HODSTAFF") {
                navigate("/hodStaff/dashboard", { replace: true });
                setRefresh(!refresh);
              } else if (userType === "ZSTAFF") {
                navigate("/zonalStaff/dashboard", { replace: true });
                setRefresh(!refresh);
              } else if (userType === "DSTAFF") {
                navigate("/divisionalStaff/dashboard", { replace: true });
                setRefresh(!refresh);
              } else if (userType === 5) {
                navigate("/parent/dashboard", { replace: true });
                setRefresh(!refresh);
              }
            } else {
              toast.error(response.data.message + "No UserRole", {
                position: toast.POSITION.TOP_CENTER,
              });
            }
          })
          .catch((errors) => {
            toast.error(
              "Invalid Staff Code Or Password. Please Enter Correct Staff Code Or Password.",
              {
                position: toast.POSITION.TOP_CENTER,
              }
            );
          });
      } else if (!formData.mobile) {
        toast.error("Please enter mobile number", {
          position: toast.POSITION.TOP_CENTER,
        });
      } else if (!formData.otp) {
        toast.error("Please enter password", {
          position: toast.POSITION.TOP_CENTER,
        });
      } else {
        toast.error("Please refresh and try again", {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    } catch (error) {
      toast.error("Invalid Staff Code. Please Enter Correct Staff Code", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleVerify2FA = async () => {
    if (!formData.token) {
      toast.error("Invalid 2FA Token", { position: toast.POSITION_TOP_CENTER });
      return;
    }
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/publicApi/verify2FA`,
        { token: formData.token, mobile: staffMobile }
      );
      if (res.status === 200 && res.data.success) {
        setStaffMobile(null);
        setFormData((prev) => ({ ...prev, mobile: "", token: null }));
        setOpenTwoFA(false);
        const resMsg = res?.data?.message || "2FA Verification Successful.";
        toast.success(resMsg, { position: toast.POSITION_TOP_CENTER });
        const userType = res.data.userRole;
        if (userType === 5) {
          navigate("/parent/dashboard", { replace: true });
          setRefresh(!refresh);
        } else if ([1, 2, 3, 4].includes(userType)) {
          navigate("/superAdmin/add-admission", { replace: true });
          setRefresh(!refresh);
        } else if (userType === "DIVISION") {
          navigate("/division/dashboard", { replace: true });
          setRefresh(!refresh);
        } else if (userType === "RHOD") {
          navigate("/rhod/dashboard", { replace: true });
          setRefresh(!refresh);
        } else if (userType === "BRANCH") {
          navigate("/branch/dashboard", { replace: true });
          setRefresh(!refresh);
        } else if (userType === "SRO") {
          navigate("/sro/dashboard", { replace: true });
          setRefresh(!refresh);
        } else if (userType === "AGENT") {
          navigate("/agent/dashboard", { replace: true });
          setRefresh(!refresh);
        } else if (userType === "ZROFFICER") {
          navigate("/zrofficer/dashboard", { replace: true });
          setRefresh(!refresh);
        } else if (userType === "DROFFICER") {
          navigate("/drofficer/dashboard", { replace: true });
          setRefresh(!refresh);
        } else if (userType === "HODSTAFF") {
          navigate("/hodStaff/dashboard", { replace: true });
          setRefresh(!refresh);
        } else if (userType === "ZSTAFF") {
          navigate("/zonalStaff/dashboard", { replace: true });
          setRefresh(!refresh);
        } else if (userType === "DSTAFF") {
          navigate("/divisionalStaff/dashboard", { replace: true });
          setRefresh(!refresh);
        } else if (userType === 5) {
          navigate("/parent/dashboard", { replace: true });
          setRefresh(!refresh);
        }
      } else {
        toast.error(res.data.message || "2FA Verification Failed", {
          position: toast.POSITION_TOP_CENTER,
        });
      }
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        "Internal Server Error: 2FA Verification Failed";
      toast.error(errMsg, { position: toast.POSITION_TOP_CENTER });
    }
  };

  const closeDialog = () => {
    setFormData({
      mobile: "",
      otp: "",
      sendOtp: true,
      signIn: false,
      btnName: "Verify username",
      token: null,
    });
    setIsStaffDisabled(false);
    setStaffMobile("");
    setOpenTwoFA(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <img
        src="/img/login-bg.webp"
        className="brightness-70 absolute inset-0 z-0 h-full w-full object-cover"
        alt="Login Background"
      />
      <div className="absolute inset-0 z-0 h-full w-full bg-black/50" />
      <div className="container relative z-10 mx-auto p-4 flex justify-center">
        <div className="animate-fade-in w-full max-w-[24rem]">
          <Card className="bg-black/60">
            <div className="flex justify-center -mt-12 mb-4">
              <img
                src="/logo.jpg"
                className="h-40 w-auto rounded-2xl bg-white p-2 shadow-lg object-contain"
                alt="logo"
              />
            </div>
            <CardBody className="flex flex-col gap-3 px-6 py-2 ">
              <Typography variant="h5" color="green" className="text-center">
                Sign-In
              </Typography>
              <Input
                required
                type="text"
                label="Enter Mobile number"
                name="mobile"
                disabled={isStaffDisabled}
                value={formData.mobile}
                onChange={handleChange}
                size="lg"
                icon={<i className="fas fa-user" />}
                className="text-white"
                onKeyPress={(event) => {
                  if (event.key === "Enter") {
                    submitData();
                  }
                }}
                autoFocus
              />
              {formData.signIn && (
                <Input
                  required
                  type="password"
                  label="Enter password"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  size="lg"
                  icon={<i className="fas fa-lock" />}
                  className="text-white"
                  onKeyPress={(event) => {
                    if (event.key === "Enter") {
                      submitData();
                    }
                  }}
                  autoFocus
                />
              )}
            </CardBody>
            <CardFooter className="pt-0">
              <Button variant="gradient" fullWidth onClick={submitData}>
                {formData.btnName}
              </Button>
            </CardFooter>
          </Card>
        </div>
        <Dialog
          className="z-40"
          handler={closeDialog}
          open={openTwoFA}
          size={"md"}
        >
          <DialogHeader className="justify-center bg-gray-100 text-center">
            Complete 2-Factor Authentication
          </DialogHeader>
          <DialogBody divider>
            <div className="grid w-full grid-cols-1 gap-3">
              <Typography variant="h6" className="text-center text-sm">
                Please enter the 6-digit code generated by your authenticator
                app to complete the login process.
              </Typography>
              <Typography
                variant="h6"
                className="text-center text-sm text-red-500"
              >
                *If you are unable to access your authenticator app, please
                contact the system administrator for assistance.
              </Typography>
              <Input
                required
                label="Enter OTP"
                name="token"
                value={formData.token}
                onChange={handleChange}
              />
            </div>
          </DialogBody>
          <DialogFooter className="bg-gray-100">
            <CancelButton onClick={closeDialog} />
            <SubmitButton onClick={handleVerify2FA} />
          </DialogFooter>
        </Dialog>
      </div>
    </div>
  );
}

export default SignIn;
