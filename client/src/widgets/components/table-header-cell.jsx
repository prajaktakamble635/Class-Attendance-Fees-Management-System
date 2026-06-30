import { Tooltip, Typography } from "@material-tailwind/react";
import PropTypes from "prop-types";
import { memo, useState } from "react";

export const TableHeaderCell = memo(
  ({
    columnName,
    text,
    orderBy,
    handleOrderBy,
    isOrderByAvailable,
    orderDirection,
    extraClasses,
    isCheckBox=false,
    checked,
    onChange,
    isIcon=false,
    icon,
    iconHandler,
    isExport=false,
    exportIcon,
    exportHandler
  }) => {
    const isSorted = orderBy === columnName;
    const order = isSorted ? "fa-sort-" + orderDirection : "fa-sort";

    const handleClick = (event) => {
      event.preventDefault();
      handleOrderBy(columnName);
    };

    return (
      <th
        key={columnName}
        className={`border-b border-gray-700 px-2 py-2 text-left ${extraClasses}`}
      >
        {isOrderByAvailable ? (
          <div className="flex items-center">
            {isCheckBox && (
              <input type="checkbox" className="me-2 hover:cursor-pointer" checked={checked} onChange={()=>onChange(checked ? false: true)} />
            )}
            <Typography
              as="button"
              variant="small"
              className={`text-blue-gray-${
                isSorted ? "700" : "400"
              } flex flex-row text-[11px] font-bold dark:text-white`}
              onClick={handleClick}
            >
              <p>{text}</p> 
              <i className={`fas pl-1 ${order}`}></i>
            </Typography>
            {isIcon && (
              <Tooltip content="Delete Selected">
                <Typography
                  as="button"
                  onClick={iconHandler}
                  className="text-red-800"
                >
                  <i className={`${icon} ms-10`}></i>
                </Typography>
              </Tooltip>
            )}
            {isExport && (
              <Tooltip content="Export Selected">
                <Typography
                  as="button"
                  onClick={exportHandler}
                  className="text-blue-800"
                >
                  <i className={`${exportIcon} ms-3`}></i>
                </Typography>
              </Tooltip>
            )}
          </div>
        ) : (
          <Typography
            as="button"
            variant="small"
            className={`flex flex-row text-[11px] font-bold text-blue-gray-400 dark:text-white`}
          >
            {text}
          </Typography>
        )}
      </th>
    );
  }
);

TableHeaderCell.propTypes = {
  text: PropTypes.string.isRequired,
  orderBy: PropTypes.string.isRequired,
  handleOrderBy: PropTypes.func.isRequired,
  isOrderByAvailable: PropTypes.bool.isRequired,
};
