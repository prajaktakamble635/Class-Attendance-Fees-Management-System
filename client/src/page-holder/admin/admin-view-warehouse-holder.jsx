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
import { Edit, Warehouse } from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ViewWarehouseHolder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [warehouse, setWarehouse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetchWarehouseData();
  }, [id]);

  const fetchWarehouseData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/warehouseApi/getWarehouseById?id=${id}`
      );
      setWarehouse(response.data);
      setIsLoading(false);
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401)
        navigate("/auth/sign-in", { replace: true });
      else if (error.response?.status === 404)
        navigate("/admin/warehouses", { replace: true });
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
              <Warehouse className="mr-3 inline h-6 w-6" />
              Warehouse Details
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                color="white"
                size="sm"
                onClick={() => navigate(`/admin/edit-warehouse/${id}`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outlined"
                color="white"
                size="sm"
                onClick={() => navigate("/admin/warehouses")}
                className="flex items-center gap-2"
              >
                <i className="fas fa-arrow-left" />
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="px-6">
          {warehouse && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="rounded-lg bg-blue-gray-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-info-circle mr-2" />
                  Basic Information
                </Typography>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Warehouse Code
                    </Typography>
                    <Typography className="font-bold text-blue-gray-900">
                      {warehouse.code}
                    </Typography>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Warehouse Name
                    </Typography>
                    <Typography className="font-bold text-blue-gray-900">
                      {warehouse.name}
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
                      color={getStatusColor(warehouse.status)}
                      value={getStatusText(warehouse.status)}
                      className="w-fit"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="rounded-lg bg-purple-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-address-book mr-2" />
                  Contact Information
                </Typography>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Contact Person
                    </Typography>
                    <Typography className="text-blue-gray-900">
                      {warehouse.contactPerson || "-"}
                    </Typography>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Mobile
                    </Typography>
                    <Typography className="text-blue-gray-900">
                      {warehouse.mobile || "-"}
                    </Typography>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm md:col-span-2">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Email
                    </Typography>
                    <Typography className="text-blue-gray-900">
                      {warehouse.email || "-"}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="rounded-lg bg-green-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-map-marker-alt mr-2" />
                  Address
                </Typography>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <Typography className="text-blue-gray-900">
                    {warehouse.address || "-"}
                  </Typography>
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
                    <ShowDateTime timestamp={warehouse.createdAt} />
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Updated At
                    </Typography>
                    <ShowDateTime timestamp={warehouse.updatedAt} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4 border-t pt-6">
            <Button
              variant="outlined"
              size="lg"
              onClick={() => navigate("/admin/warehouses")}
            >
              <i className="fas fa-arrow-left mr-2" />
              Back to List
            </Button>
            <Button
              variant="gradient"
              color={sidenavColor}
              size="lg"
              onClick={() => navigate(`/admin/edit-warehouse/${id}`)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Warehouse
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
