import { toast } from 'react-toastify';
export function handleError(error) {
    const errorMessages = {
        304: 'The requested information is already available on your device, so no new data needs to be retrieved from the server.',
        401: 'Please log in to access.',
        403: 'You don\'t have permission to access the requested resources, please contact the administrator to request access.',
        404: 'A requested resource is not available on the server, please contact the system administrator for assistance.',
        405: 'The website doesn\'t support the action you\'re trying to perform. Please try a different action or contact the website administrator for assistance.',
        406: 'We can\'t provide the information you\'re looking for in a format that your device can understand. Please try again later or contact the website administrator for assistance.',
        407: 'The server is asking for authentication before allowing access. Please provide valid login credentials or contact the system administrator for assistance.',
        409: 'Sorry, there is a conflict with the server and your request cannot be processed at this time. Please try again later or contact the system administrator for assistance.',
        410: 'The requested resource is no longer available on this server.',
        413: 'The file you\'re trying to upload is too large. Please reduce the file size and try again.',
        414: 'The URL is too long, please use a shorter one.',
        415: 'The type of file or information you are trying to upload is not supported. Please use a different file or type of information.',
        422: error.response.data ? error.response.data.error : '',
        429: 'You\'ve made too many requests. Please wait a while before trying again.',
        500: error.response.data ? error.response.data.error : '',
        501: 'We\'re sorry, the server is unable to do what you\'ve requested right now. Please try again later or contact the system administrator for help.',
        default: 'An error occurred. Please try again later or contact the system administrator for assistance.',
    };

    const message = errorMessages[error.response.status] || errorMessages.default;
    toast.error(message, { position: toast.POSITION.TOP_CENTER });
};