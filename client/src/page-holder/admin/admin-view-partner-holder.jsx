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

export default function ViewPartnerHolder({ id }) {
  const navigate = useNavigate();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;
  const [partner, setPartner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "SproutEdge Agro - View Partner";
    if (id) {
      fetchPartnerData();
    }
  }, [id]);

  const fetchPartnerData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/partnersApi/getPartnerById?id=${id}`
      );
      if (response.status === 200) {
        setPartner(response.data);
      }
    } catch (error) {
      handleError(error);
      if (error.response?.status === 404) {
        toast.error("Partner not found", { theme });
        navigate("/admin/partners");
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
          Loading partner data...
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="animate-fade-in mb-8 mt-12">
        <Card>
          <CardBody className="text-center py-12">
            <Typography className="text-gray-500 dark:text-gray-400">
              No partner data available
            </Typography>
            <Button
              className="mt-4"
              onClick={() => navigate("/admin/partners")}
            >
              Back to Partners
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
              View Partner
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                color="white"
                size="sm"
                onClick={() => navigate(`/admin/edit-partner/${id}`)}
                className="flex items-center gap-2"
              >
                <i className="fas fa-edit" />
                Edit
              </Button>
              <Button
                variant="outlined"
                color="white"
                size="sm"
                onClick={() => navigate("/admin/partners")}
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
            {(partner.frontImage || partner.backImage) && (
              <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                <Typography
                  variant="h6"
                  className="mb-4 text-gray-800 dark:text-white"
                >
                  <i className="fas fa-images mr-2"></i>Partner Logos
                </Typography>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {partner.frontImage && (
                    <div>
                      <Typography className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Front/Primary Logo
                      </Typography>
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <img
                          src={`${import.meta.env.VITE_API_URL}${partner.frontImage}`}
                          alt="Front Logo"
                          className="h-48 w-full rounded-lg object-contain"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            e.target.src = "/placeholder-image.png";
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {partner.backImage && (
                    <div>
                      <Typography className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Back/Alternate Logo
                      </Typography>
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <img
                          src={`${import.meta.env.VITE_API_URL}${partner.backImage}`}
                          alt="Back Logo"
                          className="h-48 w-full rounded-lg object-contain"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            e.target.src = "/placeholder-image.png";
                          }}
                        />
                      </div>
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
                    Partner Name
                  </Typography>
                  <Typography className="text-sm text-gray-800 dark:text-white">
                    {partner.name || "--"}
                  </Typography>
                </div>
                <div>
                  <Typography className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Status
                  </Typography>
                  <Chip
                    variant="gradient"
                    color={partner.status === 2 ? "red" : "green"}
                    value={partner.status === 2 ? "Inactive" : "Active"}
                    className="mt-1 w-fit px-2 py-0.5 text-[11px] font-medium"
                  />
                </div>
              </div>
            </div>

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
                    {partner.createdAt ? (
                      <ShowDateTime timestamp={partner.createdAt} />
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
                    {partner.updatedAt ? (
                      <ShowDateTime timestamp={partner.updatedAt} />
                    ) : (
                      "--"
                    )}
                  </Typography>
                </div>
              </div>
            </div>

            {/* Interactive Preview (Flip Card Effect) */}
            {partner.frontImage && partner.backImage && (
              <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                <Typography
                  variant="h6"
                  className="mb-4 text-gray-800 dark:text-white"
                >
                  <i className="fas fa-repeat mr-2"></i>Interactive Preview
                </Typography>
                <Typography variant="small" className="mb-4 text-gray-600">
                  Hover over the card to see the flip effect (as it would appear on the website)
                </Typography>
                <div className="flex justify-center">
                  <div className="group perspective-1000 h-64 w-64">
                    <div className="relative h-full w-full transition-transform duration-500 transform-style-3d group-hover:rotate-y-180">
                      {/* Front */}
                      <div className="backface-hidden absolute h-full w-full rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
                        <img
                          src={`${import.meta.env.VITE_API_URL}${partner.frontImage}`}
                          alt="Front"
                          className="h-full w-full object-contain"
                          crossOrigin="anonymous"
                        />
                      </div>
                      {/* Back */}
                      <div className="backface-hidden rotate-y-180 absolute h-full w-full rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
                        <img
                          src={`${import.meta.env.VITE_API_URL}${partner.backImage}`}
                          alt="Back"
                          className="h-full w-full object-contain"
                          crossOrigin="anonymous"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .group:hover .group-hover\\:rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
