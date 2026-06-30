import moment from "moment";

export const formatDateOnly = (date) => moment(new Date(date), 'DD MM YYYY').format('Do MMM YYYY');