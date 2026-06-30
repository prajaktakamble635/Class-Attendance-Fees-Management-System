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
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

export default function ViewWebsiteStatsHolder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "SproutEdge Agro - View Website Stats";
    getWebsiteStatsData();
  }, [id]);

  const getWebsiteStatsData = () => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/websiteStatsApi/getWebsiteStatById?id=${id}`)
      .then((response) => {
        if (response.status === 200) {
          setStatsData(response.data);
          setIsLoading(false);
        }
      })
      .catch((errors) => {
        handleError(errors);
        switch (errors.response?.status) {
          case 401:
            navigate("/auth/sign-in", { replace: true });
            break;
          case 404:
            toast.error("Website Stats not found", { theme });
            navigate("/admin/website-stats", { replace: true });
            break;
          default:
            navigate("/admin/website-stats", { replace: true });
        }
      });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <img
          src="/logo.jpg"
          className="w-48 h-18 object-contain mb-8 animate-bounce"
          alt="logo"
        />
        <div className="loading-text">Loading, please wait...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mb-8 mt-12 flex transform flex-col gap-12">
      <Card className="bg-white from-blue-gray-700 to-blue-gray-800 dark:bg-gradient-to-br">
        <CardHeader
          variant="gradient"
          color={sidenavColor}
          className="mb-4 p-3"
        >
          <div className="flex items-center justify-between">
            <Typography variant="h6" color="white">
              View Website Stats
            </Typography>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(`/admin/edit-website-stats/${id}`)}
                className="inline-flex self-center"
                variant="outlined"
                color="white"
                size="sm"
              >
                <i className="fas fa-pen-to-square self-center pr-2" />
                EDIT
              </Button>
              <Button
                onClick={() => navigate("/admin/website-stats")}
                className="inline-flex self-center"
                variant="outlined"
                color="white"
                size="sm"
              >
                <i className="fas fa-arrow-left self-center pr-2" />
                BACK
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="bg-white from-blue-gray-700 to-blue-gray-800 dark:bg-gradient-to-br">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Typography variant="small" color="blue-gray" className="font-bold">
                  Stats ID
                </Typography>
                <Typography className="text-gray-700">
                  {statsData?.id}
                </Typography>
              </div>

              <div className="flex flex-col gap-2">
                <Typography variant="small" color="blue-gray" className="font-bold">
                  Status
                </Typography>
                <div>
                  <Chip
                    variant="gradient"
                    color={statsData?.status === 2 ? "red" : "green"}
                    value={statsData?.status === 2 ? "Inactive" : "Active"}
                    className="inline-block px-3 py-1 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="small" color="blue-gray" className="font-bold">
                Stat Type
              </Typography>
              <Typography className="text-gray-700">
                {statsData?.statType || "--"}
              </Typography>
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="small" color="blue-gray" className="font-bold">
                Stats Title
              </Typography>
              <div className="rounded-lg bg-gray-50 p-4">
                <Typography className="text-gray-700">
                  {statsData?.statsTitle}
                </Typography>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="small" color="blue-gray" className="font-bold">
                Number
              </Typography>
              <Typography className="text-gray-700">
                {statsData?.number || "--"}
              </Typography>
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="small" color="blue-gray" className="font-bold">
                Short Description
              </Typography>
              <div className="rounded-lg bg-gray-50 p-4">
                <Typography className="text-gray-700 whitespace-pre-wrap">
                  {statsData?.shortDescription}
                </Typography>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Typography variant="small" color="blue-gray" className="font-bold">
                  Created At
                </Typography>
                <Typography className="text-gray-700">
                  <ShowDateTime timestamp={statsData?.createdAt} />
                </Typography>
              </div>

              <div className="flex flex-col gap-2">
                <Typography variant="small" color="blue-gray" className="font-bold">
                  Updated At
                </Typography>
                <Typography className="text-gray-700">
                  <ShowDateTime timestamp={statsData?.updatedAt} />
                </Typography>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
