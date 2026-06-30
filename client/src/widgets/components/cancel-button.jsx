import { Button } from "@material-tailwind/react";

export function CancelButton({ onClick }) {
  return (
      <Button variant="text" color="red" onClick={onClick} className="mr-1">
        <span>Cancel</span>
      </Button>
  );
}