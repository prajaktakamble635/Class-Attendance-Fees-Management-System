import { useMaterialTailwindController } from "@/context/index.jsx";
import { handleError } from "@/hooks/errorHandling";
import { ShowDateTime } from "@/widgets/components";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Typography
} from "@material-tailwind/react";
import axios from "axios";
import { Banknote, Edit } from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ViewCurrencyHolder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [currency, setCurrency] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetchCurrencyData();
  }, [id]);

  const fetchCurrencyData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/currencyApi/getCurrencyById?id=${id}`
      );
      setCurrency(response.data);
      setIsLoading(false);
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401)
        navigate("/auth/sign-in", { replace: true });
      else if (error.response?.status === 404)
        navigate("/admin/currencies", { replace: true });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 1:
        return "green";
      case 2:
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 1:
        return "Active";
      case 2:
        return "Inactive";
      default:
        return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <i className="fas fa-spinner fa-spin text-6xl text-blue-500" />
      </div>
    );
  }

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
              Currency Details
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                color="white"
                size="sm"
                onClick={() => navigate(`/admin/edit-currency/${id}`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outlined"
                color="white"
                size="sm"
                onClick={() => navigate("/admin/currencies")}
                className="flex items-center gap-2"
              >
                <i className="fas fa-arrow-left" />
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="px-6">
          {currency && (
            <div className="space-y-6">
              {/* Currency Information */}
              <div className="rounded-lg bg-blue-gray-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-info-circle mr-2" />
                  Currency Information
                </Typography>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Currency Code
                    </Typography>
                    <Typography className="font-bold text-blue-gray-900">
                      {currency.code}
                    </Typography>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Currency Name
                    </Typography>
                    <Typography className="font-bold text-blue-gray-900">
                      {currency.name}
                    </Typography>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Symbol
                    </Typography>
                    <Typography className="text-3xl font-bold text-blue-gray-900">
                      {currency.symbol}
                    </Typography>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Exchange Rate
                    </Typography>
                    <Typography className="font-bold text-blue-gray-900">
                      {parseFloat(currency.exchangeRate).toFixed(6)}
                    </Typography>
                    <Typography variant="small" className="mt-1 text-gray-600">
                      Rate to base currency
                    </Typography>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Status
                    </Typography>
                    <Chip
                      variant="gradient"
                      color={getStatusColor(currency.status)}
                      value={getStatusText(currency.status)}
                      className="w-fit"
                    />
                  </div>
                </div>
              </div>

              {/* Example Conversion */}
              <div className="rounded-lg bg-green-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-calculator mr-2" />
                  Example Conversion
                </Typography>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      1 Base Currency Equals
                    </Typography>
                    <Typography className="text-2xl font-bold text-blue-gray-900">
                      {currency.symbol}{" "}
                      {parseFloat(currency.exchangeRate).toFixed(2)}
                    </Typography>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      1 {currency.code} Equals
                    </Typography>
                    <Typography className="text-2xl font-bold text-blue-gray-900">
                      {(1 / parseFloat(currency.exchangeRate)).toFixed(6)} Base
                      Currency
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="rounded-lg bg-orange-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-clock mr-2" />
                  Timestamps
                </Typography>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Created At
                    </Typography>
                    <ShowDateTime timestamp={currency.createdAt} />
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Updated At
                    </Typography>
                    <ShowDateTime timestamp={currency.updatedAt} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4 border-t pt-6">
            <Button
              variant="outlined"
              size="lg"
              onClick={() => navigate("/admin/currencies")}
            >
              <i className="fas fa-arrow-left mr-2" />
              Back to List
            </Button>
            <Button
              variant="gradient"
              color={sidenavColor}
              size="lg"
              onClick={() => navigate(`/admin/edit-currency/${id}`)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Currency
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
