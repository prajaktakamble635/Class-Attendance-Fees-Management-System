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
import { FileText } from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

export default function EditSeoHolder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [formData, setFormData] = useState({
    page: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: "",
  });

  const [ogImageFile, setOgImageFile] = useState(null);
  const [ogImagePreview, setOgImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetchSeoData();
  }, [id]);

  const fetchSeoData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/seoApi/getSeoById?id=${id}`
      );
      const data = response.data;
      setFormData({
        page: data.page || "",
        metaTitle: data.metaTitle || "",
        metaDescription: data.metaDescription || "",
        metaKeywords: data.metaKeywords || "",
        ogTitle: data.ogTitle || "",
        ogDescription: data.ogDescription || "",
        ogImageUrl: data.ogImageUrl || "",
      });
      if (data.ogImageUrl) {
        setOgImagePreview(`${import.meta.env.VITE_API_URL}${data.ogImageUrl}`);
      }
      setIsLoading(false);
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401)
        navigate("/auth/sign-in", { replace: true });
      else if (error.response?.status === 404)
        navigate("/admin/seo", { replace: true });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPG, PNG, or WebP).", {
          position: "top-center",
          theme,
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should not exceed 5MB.", {
          position: "top-center",
          theme,
        });
        return;
      }

      setOgImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setOgImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationRules = [
      { field: "page", required: true, message: "Please enter page name." },
      { field: "metaTitle", required: true, message: "Please enter meta title." },
      { field: "metaDescription", required: true, message: "Please enter meta description." },
    ];

    const hasError = validateFormData(formData, validationRules, theme);
    if (hasError) return;

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("id", parseInt(id));
      formDataToSend.append("page", formData.page);
      formDataToSend.append("metaTitle", formData.metaTitle);
      formDataToSend.append("metaDescription", formData.metaDescription);
      formDataToSend.append("metaKeywords", formData.metaKeywords);
      formDataToSend.append("ogTitle", formData.ogTitle);
      formDataToSend.append("ogDescription", formData.ogDescription);

      if (ogImageFile) {
        formDataToSend.append("ogImage", ogImageFile);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/seoApi/updateSeo`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.status === 200) {
        toast.success("SEO entry updated successfully!", {
          position: "top-center",
          theme,
        });
        navigate("/admin/seo");
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
              <FileText className="mr-3 inline h-6 w-6" />
              Edit SEO - {formData.page}
            </Typography>
            <Button
              variant="outlined"
              color="white"
              size="sm"
              onClick={() => navigate("/admin/seo")}
              className="flex items-center gap-2"
            >
              <i className="fas fa-arrow-left" />
              Back to SEO List
            </Button>
          </div>
        </CardHeader>
        <CardBody className="px-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Information */}
              {/* <div className="rounded-lg bg-blue-gray-50 p-6">
                <Typography variant="h6" className="mb-0 text-blue-gray-700">
                  <i className="fas fa-info-circle mr-2" />
                  Page Information: {formData.page}
                </Typography>
              </div> */}

              {/* Meta Tags Section */}
              <div className="rounded-lg bg-blue-gray-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-tags mr-2" />
                  Meta Tags
                </Typography>
                <div className="space-y-6">
                  <div>
                    <Input
                      label="Meta Title"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleInputChange}
                      required
                      size="lg"
                      maxLength={255}
                      icon={<i className="fas fa-heading" />}
                    />
                    <Typography variant="small" className="mt-1 text-gray-600">
                      Appears in browser tab and search results. Max 255 characters.
                    </Typography>
                  </div>
                  <div>
                    <Textarea
                      label="Meta Description *"
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleInputChange}
                      required
                      size="lg"
                      rows={4}
                    />
                    <Typography variant="small" className="mt-1 text-gray-600">
                      Brief description for search engines (150-160 characters recommended).
                    </Typography>
                  </div>
                  <div>
                    <Textarea
                      label="Meta Keywords"
                      name="metaKeywords"
                      value={formData.metaKeywords}
                      onChange={handleInputChange}
                      size="lg"
                      rows={3}
                    />
                    <Typography variant="small" className="mt-1 text-gray-600">
                      Comma-separated keywords (e.g., agriculture, farming, organic).
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Open Graph Section */}
              <div className="rounded-lg bg-blue-gray-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fab fa-facebook mr-2" />
                  Open Graph (Social Media Sharing)
                </Typography>
                <div className="space-y-6">
                  <div>
                    <Input
                      label="OG Title"
                      name="ogTitle"
                      value={formData.ogTitle}
                      onChange={handleInputChange}
                      size="lg"
                      maxLength={255}
                      icon={<i className="fas fa-heading" />}
                    />
                    <Typography variant="small" className="mt-1 text-gray-600">
                      Title when shared on social media. Max 255 characters.
                    </Typography>
                  </div>
                  <div>
                    <Textarea
                      label="OG Description"
                      name="ogDescription"
                      value={formData.ogDescription}
                      onChange={handleInputChange}
                      size="lg"
                      rows={4}
                    />
                    <Typography variant="small" className="mt-1 text-gray-600">
                      Description when shared on social media.
                    </Typography>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-blue-gray-700">
                      OG Image
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="w-full rounded-lg border border-blue-gray-200 p-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <Typography variant="small" className="mt-1 text-gray-600">
                      Recommended size: 1200x630px. Max 5MB. Formats: JPG, PNG, WebP.
                    </Typography>
                    {ogImagePreview && (
                      <div className="mt-4">
                        <Typography variant="small" className="mb-2 font-medium">
                          Preview:
                        </Typography>
                        <img
                          src={ogImagePreview}
                          alt="OG Image Preview"
                          className="h-48 rounded-lg border border-gray-300 object-cover"
                          crossOrigin="anonymous"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SEO Best Practices */}
              <div className="rounded-lg bg-amber-50 p-6">
                <Typography variant="h6" className="mb-3 text-blue-gray-700">
                  <i className="fas fa-lightbulb mr-2" />
                  SEO Best Practices
                </Typography>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <i className="fas fa-check-circle mr-2 mt-0.5 text-green-600" />
                    <span>Keep meta titles under 60 characters for optimal display</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle mr-2 mt-0.5 text-green-600" />
                    <span>Meta descriptions should be 150-160 characters</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle mr-2 mt-0.5 text-green-600" />
                    <span>Include relevant keywords naturally in titles and descriptions</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle mr-2 mt-0.5 text-green-600" />
                    <span>OG images should be 1200x630px for best results on social media</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle mr-2 mt-0.5 text-green-600" />
                    <span>Make each page's meta information unique and descriptive</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 border-t pt-6">
              <Button
                variant="outlined"
                size="lg"
                onClick={() => navigate("/admin/seo")}
                disabled={isSubmitting}
              >
                <i className="fas fa-times mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
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
                    Update SEO
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
