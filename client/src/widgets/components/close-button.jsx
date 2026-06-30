import { Button } from "@material-tailwind/react";

export function CloseButton({ onClick }) {
  return (
      <Button variant="text" color="red" onClick={onClick} className="mr-1">
        <span>Close</span>
      </Button>
  );
}