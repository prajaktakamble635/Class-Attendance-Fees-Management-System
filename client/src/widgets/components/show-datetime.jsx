import moment from "moment";
import React from "react";

export function ShowDateTime(props) {
    const date = new Date(props.timestamp);
    const tempDate = moment(date, 'DD MM YYYY, h:mm a');
    const formatedDate = moment(tempDate).format('Do MMM YYYY, h:mm a');
    return <>{formatedDate}</>;
}