import { useMaterialTailwindController } from "@/context/index.jsx";
import { handleError } from "@/hooks/errorHandling";
import { validateFormData } from "@/hooks/validation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Typography
} from "@material-tailwind/react";
import axios from "axios";
import { Banknote } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";
import { toast } from "react-toastify";

export default function AddCurrencyHolder() {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    symbol: "",
    exchangeRate: "1.000000",
    status: 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = [
    { value: 1, label: "Active" },
    { value: 2, label: "Inactive" },
  ];

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
      { field: "code", required: true, message: "Please enter currency code." },
      { field: "name", required: true, message: "Please enter currency name." },
      { field: "symbol", required: true, message: "Please enter currency symbol." },
      { field: "exchangeRate", required: true, message: "Please enter exchange rate." },
    ];

    const hasError = validateFormData(formData, validationRules, theme);
    if (hasError) return;

    // Validate exchange rate is a positive number
    const exchangeRate = parseFloat(formData.exchangeRate);
    if (isNaN(exchangeRate) || exchangeRate <= 0) {
      toast.error("Exchange rate must be a positive number.", {
        position: "top-center",
        theme,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/currencyApi/createCurrency`,
        {
          ...formData,
          exchangeRate: parseFloat(formData.exchangeRate),
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Currency created successfully!", {
          position: "top-center",
          theme,
        });
        navigate("/admin/currencies");
      }
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401)
        navigate("/auth/sign-in", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in mb-8 mt-12">
      <Card className="shadow-2xl">
        <CardHeader
          variant="gradient"
          color={sidenavColor}
          className="mb-8 p-6"
        >
          <div className="flex items-center justify-between">
            <Typography variant="h4" color="white" className="font-bold">
              <Banknote className="mr-3 inline h-6 w-6" />
              Add New Currency
            </Typography>
            <Button
              variant="outlined"
              color="white"
              size="sm"
              onClick={() => navigate("/admin/currencies")}
              className="flex items-center gap-2"
            >
              <i className="fas fa-arrow-left" />
              Back to Currencies
            </Button>
          </div>
        </CardHeader>
        <CardBody className="px-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="rounded-lg bg-blue-gray-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-info-circle mr-2" />
                  Currency Information
                </Typography>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Input
                      label="Currency Code * (e.g., USD, EUR, INR)"
                      name="code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      required
                      size="lg"
                      maxLength={8}
                      icon={<i className="fas fa-barcode" />}
                    />
                    <Typography variant="small" className="mt-1 text-gray-600">
                      Max 8 characters
                    </Typography>
                  </div>
                  <div>
                    <Input
                      label="Currency Name * (e.g., US Dollar, Euro)"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      size="lg"
                      icon={<Banknote className="h-5 w-5" />}
                    />
                  </div>
                  <div>
                    <Input
                      label="Symbol * (e.g., $, €, ₹)"
                      name="symbol"
                      value={formData.symbol}
                      onChange={handleInputChange}
                      required
                      size="lg"
                      maxLength={8}
                      icon={<i className="fas fa-dollar-sign" />}
                    />
                    <Typography variant="small" className="mt-1 text-gray-600">
                      Max 8 characters
                    </Typography>
                  </div>
                  <div>
                    <Input
                      label="Exchange Rate *"
                      name="exchangeRate"
                      type="number"
                      step="0.000001"
                      min="0"
                      value={formData.exchangeRate}
                      onChange={handleInputChange}
                      required
                      size="lg"
                      icon={<i className="fas fa-exchange-alt" />}
                    />
                    <Typography variant="small" className="mt-1 text-gray-600">
                      Exchange rate to base currency (6 decimal places)
                    </Typography>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-blue-gray-700">
                      Status
                    </label>
                    <ReactSelect
                      options={statusOptions}
                      value={statusOptions.find(
                        (opt) => opt.value === formData.status
                      )}
                      onChange={(selectedOption) =>
                        setFormData({
                          ...formData,
                          status: selectedOption?.value || 1,
                        })
                      }
                      placeholder="Select Status"
                      className="react-select-container"
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Common Currency Examples */}
              <div className="rounded-lg bg-amber-50 p-6">
                <Typography variant="h6" className="mb-3 text-blue-gray-700">
                  <i className="fas fa-lightbulb mr-2" />
                  Common Currency Examples
                </Typography>
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded bg-white p-3 shadow-sm">
                    <span className="font-bold">USD</span> - US Dollar ($)
                  </div>
                  <div className="rounded bg-white p-3 shadow-sm">
                    <span className="font-bold">EUR</span> - Euro (€)
                  </div>
                  <div className="rounded bg-white p-3 shadow-sm">
                    <span className="font-bold">INR</span> - Indian Rupee (₹)
                  </div>
                  <div className="rounded bg-white p-3 shadow-sm">
                    <span className="font-bold">GBP</span> - British Pound (£)
                  </div>
                  <div className="rounded bg-white p-3 shadow-sm">
                    <span className="font-bold">JPY</span> - Japanese Yen (¥)
                  </div>
                  <div className="rounded bg-white p-3 shadow-sm">
                    <span className="font-bold">AUD</span> - Australian Dollar (A$)
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 border-t pt-6">
              <Button
                variant="outlined"
                size="lg"
                onClick={() => navigate("/admin/currencies")}
                disabled={isSubmitting}
              >
                <i className="fas fa-times mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                color={sidenavColor}
                size="lg"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save" />
                    Create Currency
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
