import axios from "axios";
import React, { useState } from "react";

axios.defaults.withCredentials = true;

export function DeleteMyData() {
  const [staffId, setStaffId] = useState("");
  const [mobile, setMobile] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!staffId || !mobile || !agreed) {
      setMessage("⚠️ Please fill all fields and agree to the policy before submitting.");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/delete-my-data`,
        { staffId, mobile }
      );

      if (response.data.success) {
        setMessage(response.data.message || "✅ Your data deletion request has been submitted successfully.");
        setStaffId("");
        setMobile("");
        setAgreed(false);
      } else {
        // Backend returned failure (e.g., invalid staff ID)
        setMessage(response.data.message || "❌ Failed to submit request.");
      }
    } catch (error) {
      if (error.response) {
        // Server responded with error status (e.g., 404, 500)
        setMessage(error.response.data.message || "❌ Request failed. Please try again.");
      } else if (error.request) {
        // No response received
        setMessage("⚠️ No response from server. Please check your connection.");
      } else {
        // Other error
        setMessage("❌ Error submitting request. Please contact admin.");
      }
    }
  };

  return (
    <>
      <div className="absolute inset-0 z-0 h-full w-full bg-gray-300" />
      <div className="container mx-auto p-4 relative z-10">
        <div className="mx-auto max-w-md bg-white shadow-lg rounded-2xl p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Delete My Data</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Staff ID</label>
              <input
                type="text"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="Enter your Staff ID"
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Mobile Number</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="Enter your Mobile Number"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-4 w-4"
                required
              />
              <span>
                I agree to the{" "}
                <a
                  href="https://shivkrupapatpedhi.softthenext.com/pages/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Privacy Policy
                </a>{" "}
                and request deletion of my data.
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
            >
              Submit Request
            </button>
          </form>

          {message && (
            <div className="mt-4 text-center text-sm text-gray-700">{message}</div>
          )}
        </div>
      </div>
    </>
  );
}

export default DeleteMyData;
