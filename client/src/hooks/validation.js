import { toast } from 'react-toastify';
export const validateFormData = (formData, validationRules) => {
    let hasError = false;
    for (const rule of validationRules) {
        if (!formData[rule.field]) {
            toast.warn(rule.message, {
                position: toast.POSITION.TOP_CENTER
            });
            hasError = true;
            break;
        }
    }
    return hasError;
};