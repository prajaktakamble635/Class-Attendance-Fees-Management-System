import React from "react";
import axios from "axios";
axios.defaults.withCredentials = true;

// ---------- Privacy Policy ----------
export function PrivacyPolicyContent() {
	return (
		<div className="container mx-auto p-4 relative z-10">
			<div className="mx-auto max-w-3xl bg-white shadow-lg rounded-2xl p-6 overflow-y-auto h-[90vh]">
				<h1 className="text-2xl font-bold mb-4 text-center">Privacy Policy</h1>

				<p className="mb-4">
					<strong>Effective Date:</strong> 29th Aug 2025 <br />
					<strong>Last Updated:</strong> 29th Aug 2025
				</p>

				<p className="mb-4">
					Sproutedge Agro (“App”, “we”, “our”, or “us”) is developed for internal
					use by <strong>Shivkrupa Sahakari Patpedhi Ltd., Mumbai</strong>.
					This Privacy Policy explains how we collect, use, and protect the
					personal and organizational data of our staff and customers.
				</p>

				<h2 className="text-xl font-semibold mb-2">1. Who Can Use This App</h2>
				<ul className="list-disc ml-6 mb-4">
					<li>Only staff members of Shivkrupa Sahakari Patpedhi Ltd., Mumbai can log in.</li>
					<li>Login IDs and passwords are created and managed by the organization’s admin.</li>
					<li>No external users or customers can access this app.</li>
				</ul>

				<h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
				<p className="mb-2">We collect the following types of information:</p>
				<ul className="list-disc ml-6 mb-4">
					<li><strong>Staff Data:</strong> Login details, GPS location (every 5 minutes), photos during loan recovery, profile info.</li>
					<li><strong>Customer Data:</strong> Lead & recovery details including customer name, mobile, account info, business, amounts, dates, remarks, and staff location.</li>
					<li><strong>Device Permissions:</strong> Camera (photos), Location (tracking), Storage (Excel import/export).</li>
				</ul>

				<h2 className="text-xl font-semibold mb-2">3. How We Use the Data</h2>
				<ul className="list-disc ml-6 mb-4">
					<li>To verify staff visits during loan recovery.</li>
					<li>To track staff activity and ensure accountability.</li>
					<li>To manage organizational leads and recovery records.</li>
					<li>To generate Excel reports for internal use.</li>
				</ul>

				<h2 className="text-xl font-semibold mb-2">4. Data Ownership</h2>
				<p className="mb-4">
					All lead and recovery data belongs to Shivkrupa Sahakari Patpedhi Ltd., Mumbai.
					Staff location data is retained only during employment and deleted upon resignation or termination.
				</p>

				<h2 className="text-xl font-semibold mb-2">5. Data Storage & Retention</h2>
				<ul className="list-disc ml-6 mb-4">
					<li>Data is securely stored in the organization’s server.</li>
					<li>Staff location history is deleted when the staff leaves the organization.</li>
					<li>Customer and financial records remain as per compliance requirements.</li>
				</ul>

				<h2 className="text-xl font-semibold mb-2">6. Data Sharing</h2>
				<p className="mb-4">We do not sell or share data with third parties. Data is only accessible to authorized admin.</p>

				<h2 className="text-xl font-semibold mb-2">7. Data Security</h2>
				<p className="mb-4">We implement industry-standard measures to protect data from unauthorized access or misuse.</p>

				<h2 className="text-xl font-semibold mb-2">8. User Rights</h2>
				<ul className="list-disc ml-6 mb-4">
					<li>Staff can request deletion of their location data upon leaving the organization.</li>
					<li>Staff cannot request deletion of organizational data (leads/recovery).</li>
				</ul>

				<h2 className="text-xl font-semibold mb-2">9. Contact Us</h2>
				<p>
					Shivkrupa Sahakari Patpedhi Ltd., Mumbai <br />
					Email: marketing@shivkrupa.in<br />
					Phone: 02269221111
				</p>
			</div>
		</div>
	);
}

// ---------- Terms & Conditions ----------
export function TermsConditions() {
	return (
		<div className="container mx-auto p-4 relative z-10">
			<div className="mx-auto max-w-3xl bg-white shadow-lg rounded-2xl p-6 overflow-y-auto h-[90vh]">
				<h1 className="text-2xl font-bold mb-4 text-center">Terms & Conditions</h1>

				<p><strong>Effective Date:</strong> 29th Aug 2025</p>

				<ol className="list-decimal ml-6 mb-4 mt-4">
					<li>Internal Use Only – Restricted to authorized staff of Shivkrupa Sahakari Patpedhi Ltd., Mumbai.</li>
					<li>Login Credentials – IDs are created by admin. Disabled IDs cannot log in.</li>
					<li>Location Tracking – By logging in, staff consent to continuous tracking every 5 minutes.</li>
					<li>Camera Usage – Staff must capture customer photos during loan recovery.</li>
					<li>Data Entry – Leads/recovery entries must be accurate and truthful.</li>
					<li>Data Ownership – All data belongs solely to the organization.</li>
					<li>Termination – Location data deleted upon staff exit; organizational data retained.</li>
					<li>Prohibited Use – Misuse or unauthorized sharing leads to action.</li>
					<li>Liability – Staff are responsible for keeping credentials secure.</li>
				</ol>
			</div>
		</div>
	);
}

// ---------- Data Deletion Policy ----------
export function DataDeletionPolicy() {
	return (
		<div className="container mx-auto p-4 relative z-10">
			<div className="mx-auto max-w-3xl bg-white shadow-lg rounded-2xl p-6 overflow-y-auto h-[90vh]">
				<h1 className="text-2xl font-bold mb-4 text-center">Data Deletion Policy</h1>

				<ol className="list-decimal ml-6 mb-4">
					<li>
						<strong>Staff Location Data:</strong> Deleted permanently when staff resigns or ID is deactivated.
					</li>
					<li>
						<strong>Staff Login Data:</strong> Username/Password credentials are removed after termination.
					</li>
					<li>
						<strong>Customer & Recovery Data:</strong> Retained as organization-owned business records even if staff leaves.
					</li>
					<li>
						<strong>How to Request Deletion:</strong>
						Staff may request deletion of their personal or location data by contacting the organization’s admin.
						Alternatively, staff can also submit a deletion request through the following form:{" "}
						<a
							href="https://shivkrupapatpedhi.softthenext.com/pages/delete-my-data"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 underline"
						>
							Delete My Data Request Form
						</a>.
					</li>
				</ol>
			</div>
		</div>
	);
}

// Default export (you can change depending on routing)
export default PrivacyPolicyContent;
