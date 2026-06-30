import { ChevronDownIcon } from "@heroicons/react/24/solid/index.js";
import {
  Button,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";
import PropTypes from "prop-types";

export function TablePagination({
  currentPage,
  totalPages,
  from,
  to,
  totalRecords,
  handlePerPageChange,
  handlePageChange,
  perPage,
}) {
  return (
    <div className="flex justify-end pt-2">
      <nav aria-label="Page navigation example">
        <ul className="list-style-none flex">
          <li className="page-item self-center">
            <Menu>
              <MenuHandler>
                <Button
                  size="sm"
                  variant="outlined"
                  className="flex flex-row px-1 py-1 sm:px-2 sm:py-2"
                >
                  {perPage} rows
                  <ChevronDownIcon className="h-4 w-4 pl-1 text-inherit" />
                </Button>
              </MenuHandler>
              <MenuList>
                <MenuItem
                  onClick={(event) => {
                    event.preventDefault();
                    handlePerPageChange(50);
                  }}
                >
                  50
                </MenuItem>
                <MenuItem
                  onClick={(event) => {
                    event.preventDefault();
                    handlePerPageChange(100);
                  }}
                >
                  100
                </MenuItem>
                <MenuItem
                  onClick={(event) => {
                    event.preventDefault();
                    handlePerPageChange(250);
                  }}
                >
                  250
                </MenuItem>
                <MenuItem
                  onClick={(event) => {
                    event.preventDefault();
                    handlePerPageChange(500);
                  }}
                >
                  500
                </MenuItem>
              </MenuList>
            </Menu>
          </li>
          <li className="page-item disabled self-center">
            <a
              className="page-link pointer-events-none relative block rounded-full border-0 bg-transparent px-1 py-1.5 text-sm text-gray-800 outline-none transition-all duration-300 dark:text-white sm:px-3 sm:text-base"
              href="#"
            >
              {from}-{to} of {totalRecords}
            </a>
          </li>
          <li className="page-item self-center">
            <a
              className="page-link relative block rounded-full border-0 bg-transparent px-2 py-1.5 text-gray-700 outline-none transition-all duration-300 hover:bg-gray-200 hover:text-gray-800 focus:shadow-none dark:text-white dark:hover:bg-gray-600 sm:px-3"
              href="#"
              onClick={(event) => {
                event.preventDefault();
                handlePageChange(1);
              }}
            >
              <i className="fas fa-backward-step" />
            </a>
          </li>
          <li className="page-item self-center">
            <a
              className="page-link relative block rounded-full border-0 bg-transparent px-2 py-1.5 text-gray-700 outline-none transition-all duration-300 hover:bg-gray-200 hover:text-gray-800 focus:shadow-none dark:text-white dark:hover:bg-gray-600 sm:px-3"
              href="#"
              onClick={(event) => {
                event.preventDefault();
                handlePageChange(currentPage - 1);
              }}
            >
              <i className="fas fa-caret-left" />
            </a>
          </li>
          <li className="page-item disabled self-center">
            <a
              className="page-link pointer-events-none relative block rounded-full border-0 bg-transparent px-1 py-1.5 text-sm text-gray-800 outline-none transition-all duration-300 hover:bg-gray-200 hover:text-gray-800 focus:shadow-none dark:text-white dark:hover:bg-gray-600 sm:px-3 sm:text-base"
              href="#"
            >
              {currentPage}
            </a>
          </li>
          <li className="page-item self-center">
            <a
              className="page-link relative block rounded-full border-0 bg-transparent px-2 py-1.5 text-gray-700 outline-none transition-all duration-300 hover:bg-gray-200 hover:text-gray-800 focus:shadow-none dark:text-white dark:hover:bg-gray-600 sm:px-3"
              href="#"
              onClick={(event) => {
                event.preventDefault();
                handlePageChange(currentPage + 1);
              }}
            >
              <i className="fas fa-caret-right" />
            </a>
          </li>
          <li className="page-item self-center">
            <a
              className="page-link relative block rounded-full border-0 bg-transparent px-2 py-1.5 text-gray-700 outline-none transition-all duration-300 hover:bg-gray-200 hover:text-gray-800 focus:shadow-none dark:text-white dark:hover:bg-gray-600 sm:px-3"
              href="#"
              onClick={(event) => {
                event.preventDefault();
                handlePageChange(totalPages);
              }}
            >
              <i className="fas fa-forward-step" />
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}

TablePagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  from: PropTypes.number.isRequired,
  to: PropTypes.number.isRequired,
  totalRecords: PropTypes.number.isRequired,
  perPage: PropTypes.number.isRequired,
  handlePerPageChange: PropTypes.func.isRequired,
  handlePageChange: PropTypes.func.isRequired,
};
