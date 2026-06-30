import { useMaterialTailwindController } from "@/context/index.jsx";
import { handleError } from "@/hooks/errorHandling";
import { validateFormData } from "@/hooks/validation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  IconButton,
  Input,
  Textarea,
  Typography
} from "@material-tailwind/react";
import axios from "axios";
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";
import { toast } from "react-toastify";

export default function EditCategoryHolder({ id }) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    description: "",
    sortOrder: 1,
    forInternational: 0,
    forDomestic: 0,
    forLocal: 0,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    ogTitle: "",
    ogDescription: "",
    metaRobots: "index, follow",
    status: 1,
  });

  const [images, setImages] = useState({
    coverImage: null,
    listingImage: null,
  });

  const [imagePreviews, setImagePreviews] = useState({
    coverImage: null,
    listingImage: null,
  });

  const [existingImages, setExistingImages] = useState({
    coverImage: null,
    listingImage: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const statusOptions = [
    { value: 1, label: "Active" },
    { value: 2, label: "Inactive" },
  ];

  useEffect(() => {
    document.title = "SproutEdge Agro - Edit Category";
    if (id) {
      fetchCategoryData();
    }
  }, [id]);

  const fetchCategoryData = async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/categoryApi/getCategoryById?id=${id}`
      );
      if (response.status === 200) {
        const category = response.data;
        setFormData({
          name: category.name || "",
          shortDescription: category.shortDescription || "",
          description: category.description || "",
          sortOrder: category.sortOrder || 1,
          forInternational: category.forInternational || 0,
          forDomestic: category.forDomestic || 0,
          forLocal: category.forLocal || 0,
          seoTitle: category.seoTitle || "",
          seoDescription: category.seoDescription || "",
          seoKeywords: category.seoKeywords || "",
          ogTitle: category.ogTitle || "",
          ogDescription: category.ogDescription || "",
          status: category.status || 1,
        });
        setExistingImages({
          coverImage: category.coverImageUrl || null,
          listingImage: category.listingImageUrl || null,
        });
      }
    } catch (error) {
      handleError(error);
      if (error.response?.status === 404) {
        toast.error("Category not found", { theme });
        navigate("/admin/categories");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
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
      { field: "name", required: true, message: "Please enter category name." },
      { field: "shortDescription", required: true, message: "Please enter short description." },
    ];

    const hasError = validateFormData(formData, validationRules, theme);
    if (hasError) return;

    // Validate at least one market is selected
    if (!formData.forInternational && !formData.forDomestic && !formData.forLocal) {
      toast.error("Please select at least one market visibility option.", { theme });
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('id', id);
      submitData.append('name', formData.name);
      submitData.append('shortDescription', formData.shortDescription);
      submitData.append('description', formData.description);
      submitData.append('sortOrder', formData.sortOrder);
      submitData.append('forInternational', formData.forInternational);
      submitData.append('forDomestic', formData.forDomestic);
      submitData.append('forLocal', formData.forLocal);
      submitData.append('seoTitle', formData.seoTitle);
      submitData.append('seoDescription', formData.seoDescription);
      submitData.append('seoKeywords', formData.seoKeywords);
      submitData.append('status', formData.status);
      submitData.append("ogTitle", formData.ogTitle);
      submitData.append("ogDescription", formData.ogDescription);

      if (images.coverImage) submitData.append('coverImage', images.coverImage);
      if (images.listingImage) submitData.append('listingImage', images.listingImage);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/categoryApi/updateCategory`,
        submitData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 200) {
        toast.success("Category updated successfully!", {
          position: "top-center",
          theme,
        });
        navigate("/admin/categories");
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
          Loading category data...
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
              Edit Category
            </Typography>
            <Button
              variant="outlined"
              color="white"
              size="sm"
              onClick={() => navigate("/admin/categories")}
              className="flex items-center gap-2"
            >
              <i className="fas fa-arrow-left" />
              Back to Categories
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
                      label="Category Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      size="lg"
                      icon={<i className="fas fa-tag" />}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Textarea
                      label="Short Description"
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleInputChange}
                      required
                      rows={3}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Textarea
                      label="Description (Optional)"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={5}
                    />
                  </div>
                  <div>
                    <Input
                      label="Sort Order"
                      name="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={handleInputChange}
                      icon={<i className="fas fa-sort-numeric-down" />}
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

              {/* Market Visibility */}
              <div className="rounded-lg bg-green-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-globe mr-2" />
                  Market Visibility
                </Typography>
                <Typography variant="small" className="mb-4 text-gray-600">
                  Select in which markets this category should be visible. At
                  least one must be selected.
                </Typography>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2 rounded-lg border border-blue-gray-200 bg-white p-4">
                    <Checkbox
                      id="forInternational"
                      name="forInternational"
                      checked={formData.forInternational === 1}
                      onChange={handleInputChange}
                      color={sidenavColor}
                    />
                    <label
                      htmlFor="forInternational"
                      className="cursor-pointer text-sm font-medium text-blue-gray-700"
                    >
                      Global Fresh Connect
                    </label>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-blue-gray-200 bg-white p-4">
                    <Checkbox
                      id="forDomestic"
                      name="forDomestic"
                      checked={formData.forDomestic === 1}
                      onChange={handleInputChange}
                      color={sidenavColor}
                    />
                    <label
                      htmlFor="forDomestic"
                      className="cursor-pointer text-sm font-medium text-blue-gray-700"
                    >
                      Bharat Fresh Hub
                    </label>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-blue-gray-200 bg-white p-4">
                    <Checkbox
                      id="forLocal"
                      name="forLocal"
                      checked={formData.forLocal === 1}
                      onChange={handleInputChange}
                      color={sidenavColor}
                    />
                    <label
                      htmlFor="forLocal"
                      className="cursor-pointer text-sm font-medium text-blue-gray-700"
                    >
                      Daily Basket
                    </label>
                  </div>
                </div>
              </div>

              {/* Image Uploads */}
              <div className="rounded-lg bg-purple-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <ImageIcon className="mr-2 inline h-5 w-5" />
                  Category Images
                </Typography>
                <Typography variant="small" className="mb-4 text-gray-600">
                  Upload new images to replace existing ones. Leave empty to
                  keep current images.
                </Typography>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Cover Image */}
                  <div>
                    <Typography
                      variant="small"
                      className="mb-2 font-semibold text-blue-gray-700"
                    >
                      Cover Image
                    </Typography>
                    {imagePreviews.coverImage ? (
                      <div className="relative">
                        <img
                          src={imagePreviews.coverImage}
                          alt="Cover preview"
                          className="h-48 w-full rounded-lg object-cover"
                        />
                        <IconButton
                          size="sm"
                          color="red"
                          className="absolute right-2 top-2"
                          onClick={() => removeImage("coverImage")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    ) : existingImages.coverImage ? (
                      <div className="relative">
                        <img
                          src={`${import.meta.env.VITE_API_URL}${
                            existingImages.coverImage
                          }`}
                          alt="Cover existing"
                          className="h-48 w-full rounded-lg object-cover"
                          crossOrigin="anonymous"
                        />
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, "coverImage")}
                            className="hidden"
                            id="coverImage-upload-edit"
                          />
                          <label
                            htmlFor="coverImage-upload-edit"
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
                          onChange={(e) => handleImageChange(e, "coverImage")}
                          className="hidden"
                          id="coverImage-upload"
                        />
                        <label
                          htmlFor="coverImage-upload"
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

                  {/* Listing Image */}
                  <div>
                    <Typography
                      variant="small"
                      className="mb-2 font-semibold text-blue-gray-700"
                    >
                      Listing Image
                    </Typography>
                    {imagePreviews.listingImage ? (
                      <div className="relative">
                        <img
                          src={imagePreviews.listingImage}
                          alt="Listing preview"
                          className="h-48 w-full rounded-lg object-cover"
                        />
                        <IconButton
                          size="sm"
                          color="red"
                          className="absolute right-2 top-2"
                          onClick={() => removeImage("listingImage")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    ) : existingImages.listingImage ? (
                      <div className="relative">
                        <img
                          src={`${import.meta.env.VITE_API_URL}${
                            existingImages.listingImage
                          }`}
                          alt="Listing existing"
                          className="h-48 w-full rounded-lg object-cover"
                          crossOrigin="anonymous"
                        />
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageChange(e, "listingImage")
                            }
                            className="hidden"
                            id="listingImage-upload-edit"
                          />
                          <label
                            htmlFor="listingImage-upload-edit"
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
                          onChange={(e) => handleImageChange(e, "listingImage")}
                          className="hidden"
                          id="listingImage-upload"
                        />
                        <label
                          htmlFor="listingImage-upload"
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

              {/* SEO Information */}
              <div className="rounded-lg bg-amber-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-search mr-2" />
                  SEO Information (Optional)
                </Typography>
                <div className="space-y-6">
                  <Input
                    label="SEO Title"
                    name="seoTitle"
                    value={formData.seoTitle}
                    onChange={handleInputChange}
                    size="lg"
                    icon={<i className="fas fa-heading" />}
                  />
                  <Textarea
                    label="SEO Description"
                    name="seoDescription"
                    value={formData.seoDescription}
                    onChange={handleInputChange}
                    rows={3}
                  />
                  <Input
                    label="SEO Keywords (comma separated)"
                    name="seoKeywords"
                    value={formData.seoKeywords}
                    onChange={handleInputChange}
                    size="lg"
                    icon={<i className="fas fa-key" />}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Open Graph Title"
                      name="ogTitle"
                      value={formData.ogTitle}
                      onChange={handleInputChange}
                      size="lg"
                      icon={<i className="fas fa-heading" />}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Textarea
                      label="Open Graph Description"
                      name="ogDescription"
                      value={formData.ogDescription}
                      onChange={handleInputChange}
                      size="lg"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 border-t pt-6">
              <Button
                variant="outlined"
                size="lg"
                onClick={() => navigate("/admin/categories")}
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
                    Update Category
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
