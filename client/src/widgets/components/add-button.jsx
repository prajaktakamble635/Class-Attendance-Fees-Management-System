import { Button } from "@material-tailwind/react";

export function AddButton({ onClick }) {
  return (
      <Button variant="gradient" color="green" onClick={onClick}>
        <span>Add</span>
      </Button>
  );
}