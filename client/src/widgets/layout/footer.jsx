import { Typography } from "@material-tailwind/react";
import PropTypes from "prop-types";

export function Footer({ brandName }) {
  const year = new Date().getFullYear();

  return (
    <div className="animate-fade-in z-10 mt-6 transform py-2">
      <div className="flex w-full flex-wrap items-center justify-center gap-6 px-2">
        <Typography
          variant="small"
          className="text-xs font-normal text-white lg:text-sm"
        >
          &copy; {year}, {brandName}
        </Typography>
      </div>
    </div>
  );
}

Footer.defaultProps = {
  brandName: "Gurukul Academy - All Rights Reserved",
};

Footer.propTypes = {
  brandName: PropTypes.string,
};

Footer.displayName = "/src/widgets/layout/footer.jsx";

export default Footer;
