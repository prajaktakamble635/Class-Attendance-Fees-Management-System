import { Button } from "@material-tailwind/react";

export function ClearButton({ onClick }) {
  return (
      <Button variant="text" color="red" onClick={onClick} className="mr-1">
        <span>Clear</span>
      </Button>
  );
}