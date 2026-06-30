import { useMaterialTailwindController } from "@/context/index.jsx";
import { handleError } from "@/hooks/errorHandling";
import { validateFormData } from "@/hooks/validation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Typography
} from "@material-tailwind/react";
import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";
import { toast } from "react-toastify";

export default function AddWebsiteStatsHolder() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [formData, setFormData] = useState({
    statType: "",
    statTitle: "",
    number: "",
    shortDescription: "",
    status: 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = [
    { value: 1, label: "Active" },
    { value: 2, label: "Inactive" },
  ];

  const statTypeOptions = [
    { value: "Global Fresh Connect", label: "Global Fresh Connect" },
    { value: "Bharat Fresh Hub", label: "Bharat Fresh Hub" },
    { value: "Daily Basket", label: "Daily Basket" },
  ];

  useEffect(() => {
    document.title = "SproutEdge Agro - Add Website Stats";
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // For number field, only allow digits
    if (name === "number") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData({
        ...formData,
        [name]: numericValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationRules = [
      { field: "statType", required: true, message: "Please select stat type." },
      { field: "statTitle", required: true, message: "Please enter stats title." },
      { field: "number", required: true, message: "Please enter number." },
      { field: "shortDescription", required: true, message: "Please enter short description." },
    ];

    const hasError = validateFormData(formData, validationRules, theme);
    if (hasError) return;

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/websiteStatsApi/createWebsiteStats`,
        {
          statType: formData.statType,
          statTitle: formData.statTitle,
          number: formData.number,
          shortDescription: formData.shortDescription,
          status: formData.status,
        }
      );

      if (response.status === 201) {
        toast.success("Website Stats created successfully.", {
          position: toast.POSITION.TOP_CENTER,
          theme,
        });
        navigate("/admin/website-stats");
      }
    } catch (errors) {
      handleError(errors);
      switch (errors.response?.status) {
        case 401:
          navigate("/auth/sign-in", { replace: true });
          break;
        default:
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in mb-8 mt-12 flex transform flex-col gap-12">
      <Card className="bg-white from-blue-gray-700 to-blue-gray-800 dark:bg-gradient-to-br">
        <CardHeader
          variant="gradient"
          color={sidenavColor}
          className="mb-4 p-3"
        >
          <div className="flex items-center justify-between">
            <Typography variant="h6" color="white">
              Add Website Stats
            </Typography>
            <Button
              onClick={() => navigate("/admin/website-stats")}
              className="inline-flex self-center"
              variant="outlined"
              color="white"
              size="sm"
            >
              <i className="fas fa-arrow-left self-center pr-2" />
              BACK
            </Button>
          </div>
        </CardHeader>
        <CardBody className="bg-white from-blue-gray-700 to-blue-gray-800 dark:bg-gradient-to-br">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Typography variant="small" color="blue-gray" className="font-medium">
                  Select Stat Type <span className="text-red-500">*</span>
                </Typography>
                <ReactSelect
                  options={statTypeOptions}
                  value={statTypeOptions.find(
                    (option) => option.value === formData.statType
                  )}
                  onChange={(selectedOption) =>
                    setFormData({
                      ...formData,
                      statType: selectedOption ? selectedOption.value : "",
                    })
                  }
                  placeholder="Select Stat Type"
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Typography variant="small" color="blue-gray" className="font-medium">
                  Status <span className="text-red-500">*</span>
                </Typography>
                <ReactSelect
                  options={statusOptions}
                  value={statusOptions.find(
                    (option) => option.value === formData.status
                  )}
                  onChange={(selectedOption) =>
                    setFormData({
                      ...formData,
                      status: selectedOption.value,
                    })
                  }
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="small" color="blue-gray" className="font-medium">
                Stats Title <span className="text-red-500">*</span>
              </Typography>
              <Input
                size="lg"
                name="statTitle"
                value={formData.statTitle}
                onChange={handleInputChange}
                placeholder="Enter stats title (max 255 characters)"
                maxLength={255}
                className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                labelProps={{
                  className: "hidden",
                }}
                containerProps={{ className: "min-w-[100px]" }}
              />
              <Typography variant="small" className="text-gray-500">
                {formData.statTitle.length}/255 characters
              </Typography>
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="small" color="blue-gray" className="font-medium">
                Number <span className="text-red-500">*</span>
              </Typography>
              <Input
                size="lg"
                name="number"
                value={formData.number}
                onChange={handleInputChange}
                placeholder="Enter number (digits only)"
                className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                labelProps={{
                  className: "hidden",
                }}
                containerProps={{ className: "min-w-[100px]" }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="small" color="blue-gray" className="font-medium">
                Short Description <span className="text-red-500">*</span>
              </Typography>
              <Textarea
                size="lg"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                placeholder="Enter short description"
                rows={4}
                className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                labelProps={{
                  className: "hidden",
                }}
                containerProps={{ className: "min-w-[100px]" }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => navigate("/admin/website-stats")}
                variant="outlined"
                color="red"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                color={sidenavColor}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Website Stats"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
