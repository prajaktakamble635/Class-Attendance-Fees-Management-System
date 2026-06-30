import { Button } from "@material-tailwind/react";

export function UpdateButton({ onClick, disabled, isSubmitting }) {
  return (
    <Button disabled={disabled} variant="gradient" color="green" onClick={onClick}>
      <span>{isSubmitting ? "Updating" : "Update"}</span>
    </Button>
  );
}