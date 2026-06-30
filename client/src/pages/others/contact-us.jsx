import axios from "axios";
import React, { useState } from "react";
axios.defaults.withCredentials = true;

export function ContactUs() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [responseMsg, setResponseMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !mobile || !email || !message) {
      setResponseMsg("⚠️ Please fill all fields before submitting.");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contact-us`,
        { name, mobile, email, message }
      );

      if (res.data.success) {
        setResponseMsg("✅ Your message has been sent successfully.");
        setName("");
        setMobile("");
        setEmail("");
        setMessage("");
      } else {
        setResponseMsg(res.data.message || "❌ Failed to send message. Please try again.");
      }
    } catch (error) {
      setResponseMsg("❌ Error sending message. Please try again later.");
    }
  };

  return (
    <>
      <div className="absolute inset-0 z-0 h-full w-full bg-gray-300" />
      <div className="container mx-auto p-4 ">
        <div className="absolute top-12 md:top-2/4 lg:top-2/4 left-2/4 w-full max-w-[28rem] -translate-x-2/4 sm:-translate-y-1/4 lg:-translate-y-2/4 transform animate-fade-in bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">Contact Us</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Mobile</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter your mobile"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Message</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 h-28 focus:outline-none focus:ring focus:ring-blue-400"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Send Message
            </button>
          </form>

          {responseMsg && (
            <p className="mt-4 text-center text-sm font-medium text-red-600">
              {responseMsg}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default ContactUs;
