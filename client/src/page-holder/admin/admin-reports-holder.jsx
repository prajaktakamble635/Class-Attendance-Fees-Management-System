import OverallPerformance from "@/page-sections/admin/reports/overallPerformance";
import SubjectWiseReport from "@/page-sections/admin/reports/subjectWise";
import { Card } from "@material-tailwind/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";


export default function AdminReportsHolder() {

  const [activeTab, setActiveTab] = useState("subject");
  const [conditionData, setConditionData] = useState([]);
  const [examSessionOptions, setExamSessionOptions] = useState([]);
  const [subjectData, setSubjectData] = useState([]);

  useEffect(() => {
      fetchConditions();
  },[]);

  

  const fetchConditions = async () => {
      try {
          const res = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/superAdminApi/getAllBoardSubjectConditionData`
          );
          setConditionData(res.data.conditionData || []);
      } catch (err) {
          console.error("Error fetching conditions:", err);
          toast.error("Failed to load board/standard data");
      }
  };

  const fetchExamSessions = async (conditionId) => {
      try {
          const res = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/superAdminApi/getExamSessionsByCondition`,
              { params: { conditionId } }
          );
          setExamSessionOptions(res.data.sessionData || []);
      } catch (err) {
          console.error("Error loading exam sessions:", err);
          setExamSessionOptions([]);
      }
  };
  
  return (
    <Card className="w-full min-h-screen bg-transparent" >
      {/* <div className="flex w-full mb-4 bg-gray-100 rounded-full p-1 mt-6">
        <button
          onClick={() => setActiveTab("subject")}
          className={`flex-1 text-center py-3 text-sm font-medium rounded-full transition-all duration-300
            ${activeTab === "subject"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:text-gray-800"
            }`}
        >
          Subject-wise Report
        </button>

        <button
          onClick={() => setActiveTab("overall")}
          className={`flex-1 text-center py-3 text-sm font-medium rounded-full transition-all duration-300
            ${activeTab === "overall"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:text-gray-800"
            }`}
        >
          Overall Performance
        </button>
      </div> */}

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "subject" && (
          <div className="animate-fade-in">
            <SubjectWiseReport
              conditionData={conditionData}
              fetchExamSessions={fetchExamSessions}
              examSessionOptions={examSessionOptions}
            />
          </div>
        )}

        {activeTab === "overall" && (
          <div className="animate-fade-in">
            <OverallPerformance
              conditionData={conditionData}
              fetchExamSessions={fetchExamSessions}
              examSessionOptions={examSessionOptions}
            />
          </div>
        )}
      </div>
    </Card>
  )

}