import { useMaterialTailwindController } from "@/context/index.jsx";
import { handleError } from "@/hooks/errorHandling";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Typography
} from "@material-tailwind/react";
import axios from "axios";
import { Edit, FileText } from "lucide-react";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ViewSeoHolder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [seo, setSeo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    fetchSeoData();
  }, [id]);

  const fetchSeoData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/seoApi/getSeoById?id=${id}`
      );
      setSeo(response.data);
      setIsLoading(false);
    } catch (error) {
      handleError(error, theme);
      if (error.response?.status === 401)
        navigate("/auth/sign-in", { replace: true });
      else if (error.response?.status === 404)
        navigate("/admin/seo", { replace: true });
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
              SEO Details - {seo?.page}
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                color="white"
                size="sm"
                onClick={() => navigate(`/admin/edit-seo/${id}`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outlined"
                color="white"
                size="sm"
                onClick={() => navigate("/admin/seo")}
                className="flex items-center gap-2"
              >
                <i className="fas fa-arrow-left" />
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="px-6">
          {seo && (
            <div className="space-y-6">
              {/* Page Information */}
              <div className="rounded-lg bg-blue-gray-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-info-circle mr-2" />
                  Page Information
                </Typography>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Page Name
                    </Typography>
                    <Typography className="font-bold text-blue-gray-900">
                      {seo.page || "--"}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Meta Tags */}
              <div className="rounded-lg bg-purple-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-tags mr-2" />
                  Meta Tags
                </Typography>
                <div className="space-y-4">
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Meta Title
                    </Typography>
                    <Typography className="text-blue-gray-900">
                      {seo.metaTitle || "--"}
                    </Typography>
                    <Typography variant="small" className="mt-1 text-gray-500">
                      Length: {seo.metaTitle?.length || 0} characters
                    </Typography>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      Meta Description
                    </Typography>
                    <Typography className="text-blue-gray-900">
                      {seo.metaDescription || "--"}
                    </Typography>
                    <Typography variant="small" className="mt-1 text-gray-500">
                      Length: {seo.metaDescription?.length || 0} characters
                    </Typography>
                  </div>
                  {seo.metaKeywords && (
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <Typography
                        variant="small"
                        className="mb-1 font-semibold text-blue-gray-600"
                      >
                        Meta Keywords
                      </Typography>
                      <Typography className="text-blue-gray-900">
                        {seo.metaKeywords}
                      </Typography>
                    </div>
                  )}
                </div>
              </div>

              {/* Open Graph */}
              <div className="rounded-lg bg-blue-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fab fa-facebook mr-2" />
                  Open Graph (Social Media)
                </Typography>
                <div className="space-y-4">
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      OG Title
                    </Typography>
                    <Typography className="text-blue-gray-900">
                      {seo.ogTitle || "--"}
                    </Typography>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <Typography
                      variant="small"
                      className="mb-1 font-semibold text-blue-gray-600"
                    >
                      OG Description
                    </Typography>
                    <Typography className="text-blue-gray-900">
                      {seo.ogDescription || "--"}
                    </Typography>
                  </div>
                  {seo.ogImageUrl && (
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <Typography
                        variant="small"
                        className="mb-3 font-semibold text-blue-gray-600"
                      >
                        OG Image
                      </Typography>
                      <img
                        src={`${import.meta.env.VITE_API_URL}${seo.ogImageUrl}`}
                        alt="OG Image"
                        className="max-h-96 rounded-lg border border-gray-300 object-contain"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                        }}
                      />
                      {/* <Typography variant="small" className="mt-2 text-gray-500">
                        URL: {seo.ogImageUrl}
                      </Typography> */}
                    </div>
                  )}
                </div>
              </div>

              {/* SEO Preview */}
              <div className="rounded-lg bg-green-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-eye mr-2" />
                  Search Engine Preview
                </Typography>
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <div className="space-y-2">
                    <Typography className="cursor-pointer text-xl font-semibold text-blue-600 hover:underline">
                      {seo.metaTitle || "Page Title"}
                    </Typography>
                    <Typography variant="small" className="text-green-700">
                      {import.meta.env.VITE_FRONTEND_URL}/{seo.page}
                    </Typography>
                    <Typography variant="small" className="text-gray-600">
                      {seo.metaDescription ||
                        "Page description will appear here..."}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Social Media Preview */}
              <div className="rounded-lg bg-indigo-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fab fa-facebook mr-2" />
                  Social Media Preview
                </Typography>
                <div className="max-w-lg overflow-hidden rounded-lg bg-white shadow-sm">
                  {seo.ogImageUrl && (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${seo.ogImageUrl}`}
                      alt="Social Preview"
                      className="h-64 w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  )}
                  <div className="p-4">
                    <Typography
                      variant="small"
                      className="uppercase text-gray-500"
                    >
                      {import.meta.env.VITE_FRONTEND_URL}
                    </Typography>
                    <Typography className="mt-1 font-bold text-blue-gray-900">
                      {seo.ogTitle || seo.metaTitle || "Page Title"}
                    </Typography>
                    <Typography variant="small" className="mt-1 text-gray-600">
                      {seo.ogDescription ||
                        seo.metaDescription ||
                        "Page description..."}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* SEO Score / Recommendations */}
              <div className="rounded-lg bg-amber-50 p-6">
                <Typography variant="h6" className="mb-4 text-blue-gray-700">
                  <i className="fas fa-chart-line mr-2" />
                  SEO Health Check
                </Typography>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {seo.metaTitle && seo.metaTitle.length <= 60 ? (
                      <i className="fas fa-check-circle text-2xl text-green-600" />
                    ) : (
                      <i className="fas fa-exclamation-circle text-2xl text-orange-600" />
                    )}
                    <div>
                      <Typography className="font-semibold text-blue-gray-900">
                        Meta Title Length
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        {seo.metaTitle?.length || 0} characters
                        {seo.metaTitle && seo.metaTitle.length <= 60
                          ? " - Optimal"
                          : " - Consider shortening to 60 characters"}
                      </Typography>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {seo.metaDescription &&
                    seo.metaDescription.length >= 150 &&
                    seo.metaDescription.length <= 160 ? (
                      <i className="fas fa-check-circle text-2xl text-green-600" />
                    ) : (
                      <i className="fas fa-exclamation-circle text-2xl text-orange-600" />
                    )}
                    <div>
                      <Typography className="font-semibold text-blue-gray-900">
                        Meta Description Length
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        {seo.metaDescription?.length || 0} characters
                        {seo.metaDescription &&
                        seo.metaDescription.length >= 150 &&
                        seo.metaDescription.length <= 160
                          ? " - Optimal"
                          : " - Recommended: 150-160 characters"}
                      </Typography>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {seo.ogImageUrl ? (
                      <i className="fas fa-check-circle text-2xl text-green-600" />
                    ) : (
                      <i className="fas fa-times-circle text-2xl text-red-600" />
                    )}
                    <div>
                      <Typography className="font-semibold text-blue-gray-900">
                        OG Image
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        {seo.ogImageUrl
                          ? "Present"
                          : "Missing - Add for better social sharing"}
                      </Typography>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {seo.metaKeywords ? (
                      <i className="fas fa-check-circle text-2xl text-green-600" />
                    ) : (
                      <i className="fas fa-info-circle text-2xl text-blue-600" />
                    )}
                    <div>
                      <Typography className="font-semibold text-blue-gray-900">
                        Keywords
                      </Typography>
                      <Typography variant="small" className="text-gray-600">
                        {seo.metaKeywords
                          ? "Present"
                          : "Optional - Can improve categorization"}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4 border-t pt-6">
            <Button
              variant="outlined"
              size="lg"
              onClick={() => navigate("/admin/seo")}
            >
              <i className="fas fa-arrow-left mr-2" />
              Back to List
            </Button>
            <Button
              variant="gradient"
              color={sidenavColor}
              size="lg"
              onClick={() => navigate(`/admin/edit-seo/${id}`)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit SEO
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
