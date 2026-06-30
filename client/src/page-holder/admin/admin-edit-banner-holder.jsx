import { useMaterialTailwindController } from "@/context/index.jsx";
import { handleError } from "@/hooks/errorHandling";
import { validateFormData } from "@/hooks/validation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  IconButton,
  Input,
  Typography
} from "@material-tailwind/react";
import axios from "axios";
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";
import { toast } from "react-toastify";

export default function EditBannerHolder({ id }) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [formData, setFormData] = useState({
    name: "",
    position: 1,
    bannerFor: "",
    status: 1,
  });

  const [images, setImages] = useState({
    imageSm: null,
    imageMd: null,
    imageLg: null,
  });

  const [imagePreviews, setImagePreviews] = useState({
    imageSm: null,
    imageMd: null,
    imageLg: null,
  });

  const [existingImages, setExistingImages] = useState({
    imageSm: null,
    imageMd: null,
    imageLg: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const bannerForOptions = [
    { value: "Global Fresh Connect", label: "Global Fresh Connect" },
    { value: "Bharat Fresh Hub", label: "Bharat Fresh Hub" },
    { value: "Daily Basket", label: "Daily Basket" },
  ];

  const statusOptions = [
    { value: 1, label: "Active" },
    { value: 2, label: "Inactive" },
  ];

  useEffect(() => {
    document.title = "SproutEdge Agro - Edit Banner";
    if (id) {
      fetchBannerData();
    }
  }, [id]);

  const fetchBannerData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/bannerApi/getBannerById?id=${id}`
      );
      if (response.status === 200) {
        const banner = response.data;
        setFormData({
          name: banner.name || "",
          position: banner.position || 1,
          bannerFor: banner.bannerFor || "",
          status: banner.status || 1,
        });
        setExistingImages({
          imageSm: banner.imageSm || null,
          imageMd: banner.imageMd || null,
          imageLg: banner.imageLg || null,
        });
      }
    } catch (error) {
      handleError(error);
      if (error.response?.status === 404) {
        toast.error("Banner not found", { theme });
        navigate("/admin/banners");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e, imageType) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file", { theme });
        return;
      }

      setImages({
        ...images,
        [imageType]: file,
      });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews({
          ...imagePreviews,
          [imageType]: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const removeImage = (imageType) => {
    setImages({
      ...images,
      [imageType]: null,
    });
    setImagePreviews({
      ...imagePreviews,
      [imageType]: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationRules = [
      { field: "name", required: true, message: "Please enter banner name." },
      { field: "bannerFor", required: true, message: "Please select banner category." },
    ];

    const hasError = validateFormData(formData, validationRules, theme);
    if (hasError) return;

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('id', id);
      submitData.append('name', formData.name);
      submitData.append('position', formData.position);
      submitData.append('bannerFor', formData.bannerFor);
      submitData.append('status', formData.status);

      if (images.imageSm) submitData.append('imageSm', images.imageSm);
      if (images.imageMd) submitData.append('imageMd', images.imageMd);
      if (images.imageLg) submitData.append('imageLg', images.imageLg);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/bannerApi/updateBanner`,
        submitData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 200) {
        toast.success("Banner updated successfully!", {
          position: "top-center",
          theme,
        });
        navigate("/admin/banners");
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
      <div className="flex flex-col items-center justify-center h-screen">
        <img
          src="/logo.jpg"
          className="w-48 h-18 object-contain mb-8 animate-bounce"
          alt="logo"
        />
        <div className="loading-text">
          Loading banner data...
        </div>
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
              <i className="fas fa-edit mr-3" />
              Edit Banner
            </Typography>
            <Button
              variant="outlined"
              color="white"
              size="sm"
              onClick={() => navigate("/admin/banners")}
              className="flex items-center gap-2"
            >
              <i className="fas fa-arrow-left" />
              Back to Banners
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
                  <div className="md:col-span-2">
                    <Input
                      label="Banner Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      size="lg"
                      icon={<i className="fas fa-tag" />}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-blue-gray-700">
                      Banner Category *
                    </label>
                    <ReactSelect
                      options={bannerForOptions}
                      value={bannerForOptions.find(
                        (opt) => opt.value === formData.bannerFor
                      )}
                      onChange={(selectedOption) =>
                        setFormData({
                          ...formData,
                          bannerFor: selectedOption?.value || "",
                        })
                      }
                      placeholder="Select Banner Category"
                      isClearable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
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
                  <Input
                    label="Position"
                    name="position"
                    type="number"
                    value={formData.position}
                    onChange={handleInputChange}
                    icon={<i className="fas fa-sort-numeric-down" />}
                  />
                </div>
              </div>

              {/* Image Uploads */}
              <div className="rounded-lg bg-purple-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <ImageIcon className="mr-2 inline h-5 w-5" />
                  Banner Images
                </Typography>
                <Typography variant="small" className="mb-4 text-gray-600">
                  Upload new images to replace existing ones. Leave empty to
                  keep current images.
                </Typography>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Small Image */}
                  <div>
                    <Typography
                      variant="small"
                      className="mb-2 font-semibold text-blue-gray-700"
                    >
                      Small Image
                    </Typography>
                    {imagePreviews.imageSm ? (
                      <div className="relative">
                        <img
                          src={imagePreviews.imageSm}
                          alt="Small preview"
                          className="h-48 w-full rounded-lg object-cover"
                        />
                        <IconButton
                          size="sm"
                          color="red"
                          className="absolute right-2 top-2"
                          onClick={() => removeImage("imageSm")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    ) : existingImages.imageSm ? (
                      <div className="relative">
                        <img
                          src={`${import.meta.env.VITE_API_URL}${
                            existingImages.imageSm
                          }`}
                          alt="Small existing"
                          className="h-48 w-full rounded-lg object-cover"
                          crossOrigin="anonymous"
                        />
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, "imageSm")}
                            className="hidden"
                            id="imageSm-upload-edit"
                          />
                          <label
                            htmlFor="imageSm-upload-edit"
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                          >
                            <Upload className="h-4 w-4" />
                            Replace Image
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border-2 border-dashed border-blue-gray-200 bg-white p-8 text-center transition-colors hover:bg-blue-gray-50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, "imageSm")}
                          className="hidden"
                          id="imageSm-upload"
                        />
                        <label
                          htmlFor="imageSm-upload"
                          className="cursor-pointer"
                        >
                          <Upload className="mx-auto mb-2 h-8 w-8 text-blue-gray-400" />
                          <Typography variant="small" className="text-gray-600">
                            Click to upload
                          </Typography>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Medium Image */}
                  <div>
                    <Typography
                      variant="small"
                      className="mb-2 font-semibold text-blue-gray-700"
                    >
                      Medium Image
                    </Typography>
                    {imagePreviews.imageMd ? (
                      <div className="relative">
                        <img
                          src={imagePreviews.imageMd}
                          alt="Medium preview"
                          className="h-48 w-full rounded-lg object-cover"
                        />
                        <IconButton
                          size="sm"
                          color="red"
                          className="absolute right-2 top-2"
                          onClick={() => removeImage("imageMd")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    ) : existingImages.imageMd ? (
                      <div className="relative">
                        <img
                          src={`${import.meta.env.VITE_API_URL}${
                            existingImages.imageMd
                          }`}
                          alt="Medium existing"
                          className="h-48 w-full rounded-lg object-cover"
                          crossOrigin="anonymous"
                        />
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, "imageMd")}
                            className="hidden"
                            id="imageMd-upload-edit"
                          />
                          <label
                            htmlFor="imageMd-upload-edit"
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                          >
                            <Upload className="h-4 w-4" />
                            Replace Image
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border-2 border-dashed border-blue-gray-200 bg-white p-8 text-center transition-colors hover:bg-blue-gray-50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, "imageMd")}
                          className="hidden"
                          id="imageMd-upload"
                        />
                        <label
                          htmlFor="imageMd-upload"
                          className="cursor-pointer"
                        >
                          <Upload className="mx-auto mb-2 h-8 w-8 text-blue-gray-400" />
                          <Typography variant="small" className="text-gray-600">
                            Click to upload
                          </Typography>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Large Image */}
                  <div>
                    <Typography
                      variant="small"
                      className="mb-2 font-semibold text-blue-gray-700"
                    >
                      Large Image
                    </Typography>
                    {imagePreviews.imageLg ? (
                      <div className="relative">
                        <img
                          src={imagePreviews.imageLg}
                          alt="Large preview"
                          className="h-48 w-full rounded-lg object-cover"
                        />
                        <IconButton
                          size="sm"
                          color="red"
                          className="absolute right-2 top-2"
                          onClick={() => removeImage("imageLg")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    ) : existingImages.imageLg ? (
                      <div className="relative">
                        <img
                          src={`${import.meta.env.VITE_API_URL}${
                            existingImages.imageLg
                          }`}
                          alt="Large existing"
                          className="h-48 w-full rounded-lg object-cover"
                          crossOrigin="anonymous"
                        />
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, "imageLg")}
                            className="hidden"
                            id="imageLg-upload-edit"
                          />
                          <label
                            htmlFor="imageLg-upload-edit"
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                          >
                            <Upload className="h-4 w-4" />
                            Replace Image
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border-2 border-dashed border-blue-gray-200 bg-white p-8 text-center transition-colors hover:bg-blue-gray-50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, "imageLg")}
                          className="hidden"
                          id="imageLg-upload"
                        />
                        <label
                          htmlFor="imageLg-upload"
                          className="cursor-pointer"
                        >
                          <Upload className="mx-auto mb-2 h-8 w-8 text-blue-gray-400" />
                          <Typography variant="small" className="text-gray-600">
                            Click to upload
                          </Typography>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 border-t pt-6">
              <Button
                variant="outlined"
                size="lg"
                onClick={() => navigate("/admin/banners")}
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
                    Update Banner
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
