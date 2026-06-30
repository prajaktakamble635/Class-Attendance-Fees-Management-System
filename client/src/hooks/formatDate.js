import moment from "moment";

export const formatDate = (date) => moment(new Date(date), 'DD MM YYYY, h:mm a').format('Do MMM YYYY, h:mm a');