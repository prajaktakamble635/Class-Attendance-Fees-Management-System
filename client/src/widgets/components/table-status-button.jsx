import { Tooltip, Typography } from "@material-tailwind/react";
import PropTypes from "prop-types";

export function TableStatusButton({ rowObj, changeStatus }) {
  return (
    <Tooltip content={rowObj.status === 1 ? "inactive" : "active"}>
      <Typography
        as="button"
        className={`text-base font-semibold ${
          rowObj.status === 1 ? "text-red-600" : "text-green-600"
        }`}
        onClick={() => changeStatus(rowObj.id, rowObj.status === 1 ? 2 : 1)}
      >
        <i className={`fas fa-${rowObj.status === 1 ? "ban" : "check"}`}></i>
      </Typography>
    </Tooltip>
  );
}

TableStatusButton.propTypes = {
  rowObj: PropTypes.object.isRequired,
  changeStatus: PropTypes.func.isRequired,
};
