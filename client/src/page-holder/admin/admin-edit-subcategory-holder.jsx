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

export default function EditSubCategoryHolder({ id }) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [formData, setFormData] = useState({
    name: "",
    categoryIdFk: "",
    shortDescription: "",
    description: "",
    sortOrder: 0,
    status: 1,
    forInternational: 0,
    forDomestic: 0,
    forLocal: 0,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    ogTitle: "",
    ogDescription: "",
    metaRobots: "index, follow",
  });

  const [images, setImages] = useState({
    coverImage: null,
    listingImage: null,
    ogImage: null,
  });

  const [imagePreviews, setImagePreviews] = useState({
    coverImage: null,
    listingImage: null,
    ogImage: null,
  });

  const [existingImages, setExistingImages] = useState({
    coverImage: null,
    listingImage: null,
    ogImage: null,
  });

  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const statusOptions = [
    { value: 1, label: "Active" },
    { value: 2, label: "Inactive" },
  ];

  const metaRobotsOptions = [
    { value: "index, follow", label: "Index, Follow" },
    { value: "noindex, follow", label: "No Index, Follow" },
    { value: "index, nofollow", label: "Index, No Follow" },
    { value: "noindex, nofollow", label: "No Index, No Follow" },
  ];

  useEffect(() => {
    document.title = "SproutEdge Agro - Edit SubCategory";
    fetchCategories();
    if (id) {
      fetchSubCategoryData();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/categoryApi/getActiveCategories`,
        {}
      );
      if (response.status === 200) {
        const categoryOptions = response.data.categories.map((cat) => ({
          value: cat.id,
          label: cat.name,
        }));
        setCategories(categoryOptions);
      }
    } catch (errors) {
      handleError(errors);
    }
  };

  const fetchSubCategoryData = async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/subCategoryApi/getSubCategoryById?id=${id}`
      );
      if (response.status === 200) {
        const subCategory = response.data;
        setFormData({
          name: subCategory.name || "",
          categoryIdFk: subCategory.categoryIdFk || "",
          shortDescription: subCategory.shortDescription || "",
          description: subCategory.description || "",
          sortOrder: subCategory.sortOrder || 0,
          status: subCategory.status || 1,
          forInternational: subCategory.forInternational || 0,
          forDomestic: subCategory.forDomestic || 0,
          forLocal: subCategory.forLocal || 0,
          seoTitle: subCategory.seoTitle || "",
          seoDescription: subCategory.seoDescription || "",
          seoKeywords: subCategory.seoKeywords || "",
          ogTitle: subCategory.ogTitle || "",
          ogDescription: subCategory.ogDescription || "",
          metaRobots: subCategory.metaRobots || "index, follow",
        });
        setExistingImages({
          coverImage: subCategory.coverImageUrl || null,
          listingImage: subCategory.listingImageUrl || null,
          ogImage: subCategory.ogImageUrl || null,
        });
      }
    } catch (error) {
      handleError(error);
      if (error.response?.status === 404) {
        toast.error("SubCategory not found", { theme });
        navigate("/admin/subcategories");
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

  const handleCheckboxChange = (name) => {
    setFormData({
      ...formData,
      [name]: formData[name] === 1 ? 0 : 1,
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
      { field: "name", required: true, message: "Please enter subcategory name." },
    ];

    const hasError = validateFormData(formData, validationRules, theme);
    if (hasError) return;

    // Validate short description length
    if (formData.shortDescription && formData.shortDescription.length > 255) {
      toast.error("Short description must not exceed 255 characters", { theme });
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('id', id);
      submitData.append('name', formData.name);
      if (formData.categoryIdFk) submitData.append('categoryIdFk', formData.categoryIdFk);
      submitData.append('shortDescription', formData.shortDescription);
      submitData.append('description', formData.description);
      submitData.append('sortOrder', formData.sortOrder);
      submitData.append('status', formData.status);
      submitData.append('forInternational', formData.forInternational);
      submitData.append('forDomestic', formData.forDomestic);
      submitData.append('forLocal', formData.forLocal);
      submitData.append('seoTitle', formData.seoTitle);
      submitData.append('seoDescription', formData.seoDescription);
      submitData.append('seoKeywords', formData.seoKeywords);
      submitData.append('ogTitle', formData.ogTitle);
      submitData.append('ogDescription', formData.ogDescription);
      submitData.append('metaRobots', formData.metaRobots);

      if (images.coverImage) submitData.append('coverImage', images.coverImage);
      if (images.listingImage) submitData.append('listingImage', images.listingImage);
      if (images.ogImage) submitData.append('ogImage', images.ogImage);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/subCategoryApi/updateSubCategory`,
        submitData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 200) {
        toast.success("SubCategory updated successfully!", {
          position: "top-center",
          theme,
        });
        navigate("/admin/subcategories");
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
          Loading subcategory data...
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
              Edit SubCategory
            </Typography>
            <Button
              variant="outlined"
              color="white"
              size="sm"
              onClick={() => navigate("/admin/subcategories")}
              className="flex items-center gap-2"
            >
              <i className="fas fa-arrow-left" />
              Back to SubCategories
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
                      label="SubCategory Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      size="lg"
                      icon={<i className="fas fa-tag" />}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm text-blue-gray-700">
                      Parent Category (Optional)
                    </label>
                    <ReactSelect
                      options={categories}
                      value={categories.find(
                        (opt) => opt.value === formData.categoryIdFk
                      )}
                      onChange={(selectedOption) =>
                        setFormData({
                          ...formData,
                          categoryIdFk: selectedOption?.value || "",
                        })
                      }
                      placeholder="Select Parent Category"
                      isClearable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Textarea
                      label="Short Description"
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleInputChange}
                      size="lg"
                      rows={2}
                    />
                    <Typography variant="small" className="mt-1 text-gray-600">
                      {formData.shortDescription.length}/255 characters
                    </Typography>
                  </div>
                  <div className="md:col-span-2">
                    <Textarea
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      size="lg"
                      rows={4}
                    />
                  </div>
                  <div className="self-end">
                    <Input
                      label="Sort Order"
                      name="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={handleInputChange}
                      size="lg"
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
                  Select which markets this subcategory should be visible in
                </Typography>
                <div className="space-y-3">
                  <Checkbox
                    label={
                      <Typography className="font-medium text-blue-gray-700">
                        Global Fresh Connect
                      </Typography>
                    }
                    checked={formData.forInternational === 1}
                    onChange={() => handleCheckboxChange("forInternational")}
                    color={sidenavColor}
                  />
                  <Checkbox
                    label={
                      <Typography className="font-medium text-blue-gray-700">
                        Bharat Fresh Hub
                      </Typography>
                    }
                    checked={formData.forDomestic === 1}
                    onChange={() => handleCheckboxChange("forDomestic")}
                    color={sidenavColor}
                  />
                  <Checkbox
                    label={
                      <Typography className="font-medium text-blue-gray-700">
                        Daily Basket
                      </Typography>
                    }
                    checked={formData.forLocal === 1}
                    onChange={() => handleCheckboxChange("forLocal")}
                    color={sidenavColor}
                  />
                </div>
              </div>

              {/* Image Uploads */}
              <div className="rounded-lg bg-purple-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <ImageIcon className="mr-2 inline h-5 w-5" />
                  SubCategory Images
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
                      Cover/Banner Image
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
                      Thumbnail/Listing Image
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

                  {/* OG Image */}
                  {/* <div className="md:col-span-2">
                    <Typography
                      variant="small"
                      className="mb-2 font-semibold text-blue-gray-700"
                    >
                      Open Graph Image (for social media sharing)
                    </Typography>
                    {imagePreviews.ogImage ? (
                      <div className="relative">
                        <img
                          src={imagePreviews.ogImage}
                          alt="OG preview"
                          className="h-48 w-full rounded-lg object-cover"
                        />
                        <IconButton
                          size="sm"
                          color="red"
                          className="absolute right-2 top-2"
                          onClick={() => removeImage("ogImage")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    ) : existingImages.ogImage ? (
                      <div className="relative">
                        <img
                          src={`${import.meta.env.VITE_API_URL}${
                            existingImages.ogImage
                          }`}
                          alt="OG existing"
                          className="h-48 w-full rounded-lg object-cover"
                          crossOrigin="anonymous"
                        />
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, "ogImage")}
                            className="hidden"
                            id="ogImage-upload-edit"
                          />
                          <label
                            htmlFor="ogImage-upload-edit"
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
                          onChange={(e) => handleImageChange(e, "ogImage")}
                          className="hidden"
                          id="ogImage-upload"
                        />
                        <label
                          htmlFor="ogImage-upload"
                          className="cursor-pointer"
                        >
                          <Upload className="mx-auto mb-2 h-8 w-8 text-blue-gray-400" />
                          <Typography variant="small" className="text-gray-600">
                            Click to upload
                          </Typography>
                        </label>
                      </div>
                    )}
                  </div> */}
                </div>
              </div>

              {/* SEO Fields */}
              <div className="rounded-lg bg-amber-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-search mr-2" />
                  SEO & Meta Information
                </Typography>
                <Typography variant="small" className="mb-4 text-gray-600">
                  Optimize your subcategory for search engines and social media
                  sharing
                </Typography>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Input
                      label="SEO Title"
                      name="seoTitle"
                      value={formData.seoTitle}
                      onChange={handleInputChange}
                      size="lg"
                      icon={<i className="fas fa-heading" />}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Textarea
                      label="SEO Description"
                      name="seoDescription"
                      value={formData.seoDescription}
                      onChange={handleInputChange}
                      size="lg"
                      rows={3}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="SEO Keywords"
                      name="seoKeywords"
                      value={formData.seoKeywords}
                      onChange={handleInputChange}
                      size="lg"
                      icon={<i className="fas fa-key" />}
                    />
                    <Typography variant="small" className="mt-1 text-gray-600">
                      Separate keywords with commas
                    </Typography>
                  </div>
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
                  {/* <div className="md:col-span-2">
                    <label className="mb-1 block text-sm text-blue-gray-700">
                      Meta Robots
                    </label>
                    <ReactSelect
                      options={metaRobotsOptions}
                      value={metaRobotsOptions.find(
                        (opt) => opt.value === formData.metaRobots
                      )}
                      onChange={(selectedOption) =>
                        setFormData({
                          ...formData,
                          metaRobots: selectedOption?.value || "index, follow",
                        })
                      }
                      placeholder="Select Meta Robots"
                      className="react-select-container"
                      classNamePrefix="react-select"
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                  </div> */}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 border-t pt-6">
              <Button
                variant="outlined"
                size="lg"
                onClick={() => navigate("/admin/subcategories")}
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
                    Update SubCategory
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
