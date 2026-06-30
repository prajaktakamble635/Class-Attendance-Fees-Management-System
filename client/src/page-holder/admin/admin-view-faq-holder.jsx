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

export default function ViewFAQHolder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [faqData, setFaqData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "SproutEdge Agro - View FAQ";
    getFAQData();
  }, [id]);

  const getFAQData = () => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/faqApi/getFAQById?id=${id}`)
      .then((response) => {
        if (response.status === 200) {
          setFaqData(response.data);
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
            toast.error("FAQ not found", { theme });
            navigate("/admin/faqs", { replace: true });
            break;
          default:
            navigate("/admin/faqs", { replace: true });
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
              View FAQ
            </Typography>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(`/admin/edit-faq/${id}`)}
                className="inline-flex self-center"
                variant="outlined"
                color="white"
                size="sm"
              >
                <i className="fas fa-pen-to-square self-center pr-2" />
                EDIT
              </Button>
              <Button
                onClick={() => navigate("/admin/faqs")}
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
                  FAQ ID
                </Typography>
                <Typography className="text-gray-700">
                  {faqData?.id}
                </Typography>
              </div>

              <div className="flex flex-col gap-2">
                <Typography variant="small" color="blue-gray" className="font-bold">
                  Status
                </Typography>
                <div>
                  <Chip
                    variant="gradient"
                    color={faqData?.status === 2 ? "red" : "green"}
                    value={faqData?.status === 2 ? "Inactive" : "Active"}
                    className="inline-block px-3 py-1 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="small" color="blue-gray" className="font-bold">
                FAQ Type
              </Typography>
              <Typography className="text-gray-700">
                {faqData?.faqType || "--"}
              </Typography>
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="small" color="blue-gray" className="font-bold">
                Question
              </Typography>
              <div className="rounded-lg bg-gray-50 p-4">
                <Typography className="text-gray-700">
                  {faqData?.question}
                </Typography>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="small" color="blue-gray" className="font-bold">
                Answer
              </Typography>
              <div className="rounded-lg bg-gray-50 p-4">
                <Typography className="text-gray-700 whitespace-pre-wrap">
                  {faqData?.answer}
                </Typography>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Typography variant="small" color="blue-gray" className="font-bold">
                  Created At
                </Typography>
                <Typography className="text-gray-700">
                  <ShowDateTime timestamp={faqData?.createdAt} />
                </Typography>
              </div>

              <div className="flex flex-col gap-2">
                <Typography variant="small" color="blue-gray" className="font-bold">
                  Updated At
                </Typography>
                <Typography className="text-gray-700">
                  <ShowDateTime timestamp={faqData?.updatedAt} />
                </Typography>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
