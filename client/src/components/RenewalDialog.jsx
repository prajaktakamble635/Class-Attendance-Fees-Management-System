import React from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Typography,
} from "@material-tailwind/react";
import { Calendar, AlertCircle } from 'lucide-react';

export function RenewalDialog({ open, onClose, renewalData }) {
  if (!renewalData) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDaysRemaining = (renewalDate) => {
    if (!renewalDate) return 0;
    const today = new Date();
    const renewal = new Date(renewalDate);
    const diffTime = renewal - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining(renewalData.renewalDate);

  return (
    <Dialog
      open={open}
      // handler={onClose}
      size="sm"
      className="bg-gradient-to-br from-blue-50 to-white"
    >
      <DialogHeader className="flex items-center gap-2 text-blue-900">
        <AlertCircle className="h-6 w-6 text-blue-900" />
        <Typography variant="h4">AMC Renewal Reminder</Typography>
      </DialogHeader>

      <DialogBody className="space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-md border-l-4 border-blue-800">
          {/* <Typography variant="h6" color="blue-gray" className="mb-3">
            Project Details
          </Typography> */}

          <div className="space-y-2 text-justify">
             <Typography className="text-lg font-semibold text-gray-900 leading-relaxed">
            <span className="font-semibold">Dear Customer,</span>
            <br />
            This is a reminder that your project's AMC (Annual Maintenance Contract) will expire on{' '}
            <span className="font-bold text-blue-900">
              {formatDate(renewalData.renewalDate)}
            </span>.
            <br />
            Kindly contact <span className="font-semibold text-blue-900">Soft The Next</span> for renewal to avoid any interruption in services.
            <br />
            Thank you.
          </Typography>            
          </div>
        </div>

        <div className="bg-blue-100 rounded-lg p-4 border border-blue-300">
          <Typography className="text-center text-blue-900 font-semibold">
            {daysRemaining > 0
              ? Only `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining until renewal!`
              : daysRemaining === 0
              ? 'Renewal is due today!'
              : `Renewal is overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} !`
            }
          </Typography>
        </div>      
      </DialogBody>
      <DialogFooter>
        <Button
          onClick={onClose}
          className="px-6 bg-blue-900 hover:bg-blue-800 text-white"
        >
          Got it, Thanks!
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default RenewalDialog;