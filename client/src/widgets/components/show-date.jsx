import moment from "moment";
import React from "react";

export function ShowDate(props) {
    if(props.timestamp) {
        const date = new Date(props.timestamp);
        const tempDate = moment(date, 'DD MM YYYY');
        const formatedDate = moment(tempDate).format('Do MMM YYYY');
        return <>{formatedDate}</>;
    }
    else {
        return <></>;
    }

}