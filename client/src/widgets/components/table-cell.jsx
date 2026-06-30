import { Typography } from "@material-tailwind/react";
import PropTypes from "prop-types";
import { memo } from "react";

export const TableCell = memo(({ text, extraClasses }) => {
  return (
    <td className={`whitespace-nowrap border-b border-blue-gray-50  px-2 py-1 ${extraClasses}`}>
      {text && (
        <Typography className="text-xs font-semibold text-blue-gray-600 dark:text-white">
          {text}
        </Typography>
      )}
    </td>
  );
});

TableCell.propTypes = {
  text: PropTypes.node,
};
