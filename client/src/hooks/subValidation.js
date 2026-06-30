import { toast } from 'react-toastify';
export const validateSubFormData = (subFormData, validationRules) => {
    let hasError = false;
    for (const rule of validationRules) {
        if (!subFormData[rule.field]) {
            toast.warn(rule.message, {
                position: toast.POSITION.TOP_CENTER
            });
            hasError = true;
            break;
        }
    }
    return hasError;
};