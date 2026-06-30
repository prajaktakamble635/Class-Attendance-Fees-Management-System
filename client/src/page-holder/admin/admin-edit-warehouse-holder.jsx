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
import { Warehouse } from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactSelect from "react-select";
import { toast } from "react-toastify";

export default function EditWarehouseHolder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    contactPerson: "",
    mobile: "",
    email: "",
    status: 1,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const statusOptions = [
    { value: 1, label: "Active" },
    { value: 2, label: "Inactive" },
  ];

  React.useEffect(() => {
    fetchWarehouseData();
  }, [id]);

  const fetchWarehouseData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/warehouseApi/getWarehouseById?id=${id}`
      );
      setFormData({
        name: response.data.name || "",
        code: response.data.code || "",
        address: response.data.address || "",
        contactPerson: response.data.contactPerson || "",
        mobile: response.data.mobile || "",
        email: response.data.email || "",
        status: response.data.status || 1,
      });
      setIsLoading(false);
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401)
        navigate("/auth/sign-in", { replace: true });
      else if (error.response?.status === 404)
        navigate("/admin/warehouses", { replace: true });
    }
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
      { field: "name", required: true, message: "Please enter warehouse name." },
      { field: "code", required: true, message: "Please enter warehouse code." },
    ];

    const hasError = validateFormData(formData, validationRules, theme);
    if (hasError) return;

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/warehouseApi/updateWarehouse`,
        {
          id: parseInt(id),
          ...formData,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        toast.success("Warehouse updated successfully!", {
          position: "top-center",
          theme,
        });
        navigate("/admin/warehouses");
      }
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401)
        navigate("/auth/sign-in", { replace: true });
    } finally {
      setIsSubmitting(false);
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
              Edit Warehouse
            </Typography>
            <Button
              variant="outlined"
              color="white"
              size="sm"
              onClick={() => navigate("/admin/warehouses")}
              className="flex items-center gap-2"
            >
              <i className="fas fa-arrow-left" />
              Back to Warehouses
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
                  Basic Information
                </Typography>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Input
                      label="Warehouse Code *"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      size="lg"
                      icon={<i className="fas fa-barcode" />}
                    />
                  </div>
                  <div>
                    <Input
                      label="Warehouse Name *"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      size="lg"
                      icon={<Warehouse className="h-5 w-5" />}
                    />
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

              {/* Contact Information */}
              <div className="rounded-lg bg-purple-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-address-book mr-2" />
                  Contact Information
                </Typography>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Input
                      label="Contact Person"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      size="lg"
                      icon={<i className="fas fa-user" />}
                    />
                  </div>
                  <div>
                    <Input
                      label="Mobile"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      size="lg"
                      icon={<i className="fas fa-phone" />}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      size="lg"
                      icon={<i className="fas fa-envelope" />}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="rounded-lg bg-green-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-map-marker-alt mr-2" />
                  Address
                </Typography>
                <Textarea
                  label="Full Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={4}
                  size="lg"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 border-t pt-6">
              <Button
                variant="outlined"
                size="lg"
                onClick={() => navigate("/admin/warehouses")}
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
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save" />
                    Update Warehouse
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
