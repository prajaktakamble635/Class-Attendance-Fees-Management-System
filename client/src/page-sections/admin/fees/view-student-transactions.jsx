import { Card, CardBody, CardHeader, Typography, Button } from "@material-tailwind/react";
import { useMaterialTailwindController } from "@/context";
import { TableCell } from "@/widgets/components";
import axios from "axios";
import { useEffect, useState } from "react";
import { handleError } from "@/hooks/errorHandling";

export default function ViewStudentTransactions({ open, handleClose, studentId }) {
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, theme } = controller;

  const [transactions, setTransactions] = useState([]);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    if (open && studentId) {
      fetchTransactions();
    }
  }, [open, studentId]);

  const fetchTransactions = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/superAdminApi/getStudentFeesDetails/${studentId}`
      );

      if (data.success) {
        setStudent(data.students[0] || null); // backend returns array
        setTransactions(data.feesHistory || []); // backend key
      }
    } catch (error) {
      handleError(error, theme);
    }
  };

  if (!open) return null; // hide if modal not open

  // Construct full name
  const fullName = student
    ? `${student.firstName || ""} ${student.fatherName || ""} ${student.surnameName || ""}`.trim()
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <Card className="w-full max-w-4xl bg-white dark:bg-gradient-to-br from-blue-gray-700 to-blue-gray-800">
        {/* Header */}
        <CardHeader
          variant="gradient"
          color={sidenavColor}
          className="p-3 flex justify-between items-center"
        >
          <Typography variant="h6" color="white">
            {student ? `${fullName} (${student.rollNo || "--"})` : "Loading..."}
          </Typography>
          <Button size="sm" color="white" variant="outlined" onClick={handleClose}>
            <i className="fas fa-times mr-2" /> Close
          </Button>
        </CardHeader>

        {/* Fees Summary */}
        {student && (
          <CardBody className="flex justify-left gap-20 p-4 border-b border-blue-gray-200 dark:border-blue-gray-600">
            <Typography className="text-lg font-semibold text-blue-gray-700 dark:text-white">
              Total Fees Paid: <span className="font-bold">{student.feesPaid || "0"}</span>
            </Typography>
            <Typography className="text-lg font-semibold text-blue-gray-700 dark:text-white">
              Fees Remaining: <span className="font-bold">{student.feesRemaining || "0"}</span>
            </Typography>
          </CardBody>
        )}

        {/* Transactions Table */}
        <CardBody className="overflow-x-scroll p-4">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Amount Paid</th>
                <th className="p-2 text-left">Payment Mode</th>
                <th className="p-2 text-left">Transaction Ref</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-red-500">
                    No Transactions Found
                  </td>
                </tr>
              ) : (
                transactions.map((txn, index) => (
                  <tr key={txn.id}>
                    <TableCell text={index + 1} />
                    <TableCell text={new Date(txn.paymentDate).toLocaleDateString()} />
                    <TableCell text={txn.amountPaid || "0"} />
                    <TableCell text={txn.paymentMethod || "--"} />
                    <TableCell text={txn.transactionReference || "--"} />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
