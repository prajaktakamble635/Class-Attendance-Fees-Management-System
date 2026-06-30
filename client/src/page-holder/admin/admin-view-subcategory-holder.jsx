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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function ViewSubCategoryHolder({ id }) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const [subCategory, setSubCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "SproutEdge Agro - View SubCategory";
    if (id) {
      fetchSubCategoryData();
    }
  }, [id]);

  const fetchSubCategoryData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/subCategoryApi/getSubCategoryById?id=${id}`
      );
      if (response.status === 200) {
        setSubCategory(response.data);
      }
    } catch (error) {
      handleError(error);
      if (error.response?.status === 404) {
        toast.error("SubCategory not found", { theme });
        navigate("/admin/subcategories");
      } else if (error.response?.status === 401) {
        navigate("/auth/sign-in", { replace: true });
      }
    } finally {
      setIsLoading(false);
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

  if (!subCategory) {
    return (
      <div className="animate-fade-in mb-8 mt-12">
        <Card>
          <CardBody className="text-center py-12">
            <Typography className="text-gray-500 dark:text-gray-400">
              No subcategory data available
            </Typography>
            <Button
              className="mt-4"
              onClick={() => navigate("/admin/subcategories")}
            >
              Back to SubCategories
            </Button>
          </CardBody>
        </Card>
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
              <i className="fas fa-eye mr-3" />
              View SubCategory
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                color="white"
                size="sm"
                onClick={() => navigate(`/admin/edit-subcategory/${id}`)}
                className="flex items-center gap-2"
              >
                <i className="fas fa-edit" />
                Edit
              </Button>
              <Button
                variant="outlined"
                color="white"
                size="sm"
                onClick={() => navigate("/admin/subcategories")}
                className="flex items-center gap-2"
              >
                <i className="fas fa-arrow-left" />
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="px-6">
          <div className="space-y-6">
            {/* Images Section */}
            {(subCategory.coverImageUrl || subCategory.listingImageUrl || subCategory.ogImageUrl) && (
              <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                <Typography
                  variant="h6"
                  className="mb-4 text-gray-800 dark:text-white"
                >
                  <i className="fas fa-images mr-2"></i>SubCategory Images
                </Typography>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {subCategory.coverImageUrl && (
                    <div>
                      <Typography className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Cover Image
                      </Typography>
                      <img
                        src={`${import.meta.env.VITE_API_URL}${subCategory.coverImageUrl}`}
                        alt="Cover"
                        className="h-48 w-full rounded-lg object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                        }}
                      />
                    </div>
                  )}
                  {subCategory.listingImageUrl && (
                    <div>
                      <Typography className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Listing Image
                      </Typography>
                      <img
                        src={`${import.meta.env.VITE_API_URL}${subCategory.listingImageUrl}`}
                        alt="Listing"
                        className="h-48 w-full rounded-lg object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                        }}
                      />
                    </div>
                  )}
                  {subCategory.ogImageUrl && (
                    <div>
                      <Typography className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Open Graph Image
                      </Typography>
                      <img
                        src={`${import.meta.env.VITE_API_URL}${subCategory.ogImageUrl}`}
                        alt="OG Image"
                        className="h-48 w-full rounded-lg object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
              <Typography
                variant="h6"
                className="mb-4 text-gray-800 dark:text-white"
              >
                <i className="fas fa-info-circle mr-2"></i>Basic Information
              </Typography>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    SubCategory Name
                  </Typography>
                  <Typography className="text-sm text-gray-800 dark:text-white">
                    {subCategory.name || "--"}
                  </Typography>
                </div>
                <div>
                  <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Parent Category
                  </Typography>
                  <Typography className="text-sm text-gray-800 dark:text-white">
                    {subCategory.category?.name || "Uncategorized"}
                  </Typography>
                </div>
                <div>
                  <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Slug
                  </Typography>
                  <Typography className="text-sm text-gray-800 dark:text-white font-mono">
                    {subCategory.slug || "--"}
                  </Typography>
                </div>
                <div>
                  <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Sort Order
                  </Typography>
                  <Typography className="text-sm text-gray-800 dark:text-white">
                    {subCategory.sortOrder || "--"}
                  </Typography>
                </div>
                <div className="md:col-span-2">
                  <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Short Description
                  </Typography>
                  <Typography className="text-sm text-gray-800 dark:text-white">
                    {subCategory.shortDescription || "--"}
                  </Typography>
                </div>
                {subCategory.description && (
                  <div className="md:col-span-2">
                    <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Description
                    </Typography>
                    <Typography className="text-sm text-gray-800 dark:text-white whitespace-pre-wrap">
                      {subCategory.description}
                    </Typography>
                  </div>
                )}
                <div>
                  <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Status
                  </Typography>
                  <Chip
                    variant="gradient"
                    color={subCategory.status === 2 ? "red" : "green"}
                    value={subCategory.status === 2 ? "Inactive" : "Active"}
                    className="mt-1 w-fit px-2 py-0.5 text-[11px] font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Market Visibility */}
            <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
              <Typography
                variant="h6"
                className="mb-4 text-gray-800 dark:text-white"
              >
                <i className="fas fa-globe mr-2"></i>Market Visibility
              </Typography>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Global Fresh Connect
                  </Typography>
                  <Chip
                    variant="gradient"
                    color={subCategory.forInternational === 1 ? "green" : "red"}
                    value={subCategory.forInternational === 1 ? "Yes" : "No"}
                    className="mt-1 w-fit px-2 py-0.5 text-[11px] font-medium"
                  />
                </div>
                <div>
                  <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Bharat Fresh Hub
                  </Typography>
                  <Chip
                    variant="gradient"
                    color={subCategory.forDomestic === 1 ? "green" : "red"}
                    value={subCategory.forDomestic === 1 ? "Yes" : "No"}
                    className="mt-1 w-fit px-2 py-0.5 text-[11px] font-medium"
                  />
                </div>
                <div>
                  <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Daily Basket
                  </Typography>
                  <Chip
                    variant="gradient"
                    color={subCategory.forLocal === 1 ? "green" : "red"}
                    value={subCategory.forLocal === 1 ? "Yes" : "No"}
                    className="mt-1 w-fit px-2 py-0.5 text-[11px] font-medium"
                  />
                </div>
              </div>
            </div>

            {/* SEO Information */}
            {(subCategory.seoTitle ||
              subCategory.seoDescription ||
              subCategory.seoKeywords ||
              subCategory.canonicalUrl ||
              subCategory.metaRobots) && (
              <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                <Typography
                  variant="h6"
                  className="mb-4 text-gray-800 dark:text-white"
                >
                  <i className="fas fa-search mr-2"></i>SEO Information
                </Typography>
                <div className="space-y-4">
                  {subCategory.seoTitle && (
                    <div>
                      <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        SEO Title
                      </Typography>
                      <Typography className="text-sm text-gray-800 dark:text-white">
                        {subCategory.seoTitle}
                      </Typography>
                    </div>
                  )}
                  {subCategory.seoDescription && (
                    <div>
                      <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        SEO Description
                      </Typography>
                      <Typography className="text-sm text-gray-800 dark:text-white">
                        {subCategory.seoDescription}
                      </Typography>
                    </div>
                  )}
                  {subCategory.seoKeywords && (
                    <div>
                      <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        SEO Keywords
                      </Typography>
                      <Typography className="text-sm text-gray-800 dark:text-white">
                        {subCategory.seoKeywords}
                      </Typography>
                    </div>
                  )}
                  {/* {subCategory.canonicalUrl && (
                    <div>
                      <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Canonical URL
                      </Typography>
                      <Typography className="text-sm text-blue-600 dark:text-blue-400 font-mono break-all">
                        {subCategory.canonicalUrl}
                      </Typography>
                    </div>
                  )} */}
                  {/* {subCategory.metaRobots && (
                    <div>
                      <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Meta Robots
                      </Typography>
                      <Typography className="text-sm text-gray-800 dark:text-white">
                        {subCategory.metaRobots}
                      </Typography>
                    </div>
                  )} */}
                </div>
              </div>
            )}

            {/* Open Graph Information */}
            {(subCategory.ogTitle || subCategory.ogDescription) && (
              <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                <Typography
                  variant="h6"
                  className="mb-4 text-gray-800 dark:text-white"
                >
                  <i className="fas fa-share-nodes mr-2"></i>Open Graph Information
                </Typography>
                <div className="space-y-4">
                  {subCategory.ogTitle && (
                    <div>
                      <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        OG Title
                      </Typography>
                      <Typography className="text-sm text-gray-800 dark:text-white">
                        {subCategory.ogTitle}
                      </Typography>
                    </div>
                  )}
                  {subCategory.ogDescription && (
                    <div>
                      <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        OG Description
                      </Typography>
                      <Typography className="text-sm text-gray-800 dark:text-white">
                        {subCategory.ogDescription}
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
              <Typography
                variant="h6"
                className="mb-4 text-gray-800 dark:text-white"
              >
                <i className="fas fa-clock mr-2"></i>Timestamps
              </Typography>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Created At
                  </Typography>
                  <Typography className="text-sm text-gray-800 dark:text-white">
                    {subCategory.createdAt ? (
                      <ShowDateTime timestamp={subCategory.createdAt} />
                    ) : (
                      "--"
                    )}
                  </Typography>
                </div>
                <div>
                  <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Updated At
                  </Typography>
                  <Typography className="text-sm text-gray-800 dark:text-white">
                    {subCategory.updatedAt ? (
                      <ShowDateTime timestamp={subCategory.updatedAt} />
                    ) : (
                      "--"
                    )}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
