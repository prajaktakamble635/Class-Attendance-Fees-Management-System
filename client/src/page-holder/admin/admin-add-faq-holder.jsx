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

export default function AddFAQHolder() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [formData, setFormData] = useState({
    faqType: "",
    question: "",
    answer: "",
    status: 1,
  });

  const [faqTypes, setFaqTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = [
    { value: 1, label: "Active" },
    { value: 2, label: "Inactive" },
  ];

  const suggestedFAQTypes = [
    "About Us",
    "Order Related",
    "Refund Related",
    "Account Related",
    "Payment Related",
    "Shipping Related",
    "Product Related",
    "General",
  ];

  useEffect(() => {
    document.title = "SproutEdge Agro - Add FAQ";
    getFAQTypes();
  }, []);

  const getFAQTypes = () => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/faqApi/getFAQTypes`)
      .then((response) => {
        if (response.status === 200) {
          const types = response.data.faqTypes || [];
          // Combine existing types with suggested ones (remove duplicates)
          const allTypes = [...new Set([...types, ...suggestedFAQTypes])];
          setFaqTypes(allTypes);
        }
      })
      .catch((errors) => {
        // If error, use suggested types
        setFaqTypes(suggestedFAQTypes);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationRules = [
      { field: "question", required: true, message: "Please enter question." },
      { field: "answer", required: true, message: "Please enter answer." },
    ];

    const hasError = validateFormData(formData, validationRules, theme);
    if (hasError) return;

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/faqApi/createFAQ`,
        {
          faqType: formData.faqType || undefined,
          question: formData.question,
          answer: formData.answer,
          status: formData.status,
        }
      );

      if (response.status === 201) {
        toast.success("FAQ created successfully.", {
          position: toast.POSITION.TOP_CENTER,
          theme,
        });
        navigate("/admin/faqs");
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

  const faqTypeOptions = faqTypes.map((type) => ({
    value: type,
    label: type,
  }));

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
              Add FAQ
            </Typography>
            <Button
              onClick={() => navigate("/admin/faqs")}
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
                  FAQ Type
                </Typography>
                <ReactSelect
                  options={faqTypeOptions}
                  value={faqTypeOptions.find(
                    (option) => option.value === formData.faqType
                  )}
                  onChange={(selectedOption) =>
                    setFormData({
                      ...formData,
                      faqType: selectedOption ? selectedOption.value : "",
                    })
                  }
                  placeholder="Select FAQ Type (Optional)"
                  isClearable
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
                Question <span className="text-red-500">*</span>
              </Typography>
              <Input
                size="lg"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                placeholder="Enter question (max 255 characters)"
                maxLength={255}
                className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                labelProps={{
                  className: "hidden",
                }}
                containerProps={{ className: "min-w-[100px]" }}
              />
              <Typography variant="small" className="text-gray-500">
                {formData.question.length}/255 characters
              </Typography>
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="small" color="blue-gray" className="font-medium">
                Answer <span className="text-red-500">*</span>
              </Typography>
              <Textarea
                size="lg"
                name="answer"
                value={formData.answer}
                onChange={handleInputChange}
                placeholder="Enter answer"
                rows={6}
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
                onClick={() => navigate("/admin/faqs")}
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
                {isSubmitting ? "Creating..." : "Create FAQ"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
