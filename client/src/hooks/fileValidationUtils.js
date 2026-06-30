import { toast } from 'react-toastify';

export const checkDocumentMimeType = (files) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'image/webp',  'image/gif',  'image/bmp',  'image/tiff',  'image/svg+xml', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    const invalidFiles = Array.from(files).filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
        invalidFiles.forEach(file => {
            toast.warn(file.type + ' file format not supported', {
                position: toast.POSITION.TOP_CENTER
            });
        });
        return false;
    }
    return true;
};

export const checkDocumentMimeTypeAsXlsx = (files) => {
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const invalidFiles = Array.from(files).filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
        invalidFiles.forEach(file => {
            toast.warn(file.type + ' file format not supported', {
                position: toast.POSITION.TOP_CENTER
            });
        });
        return false;
    }
    return true;
};

export const maxSelectFile = (files) => {
    if (files.length > 1) {
        toast.warn('Please select only one file.', {
            position: toast.POSITION.TOP_CENTER
        });
        return false;
    }
    return true;
};

export const checkFileSize = (files) => {
    const maxSize = 15 * 1024 * 1024; // 15MB
    const invalidFiles = Array.from(files).filter(file => file.size > maxSize);
    if (invalidFiles.length > 0) {
        invalidFiles.forEach(file => {
            toast.warn(file.name + ' should be less than 15MB', {
                position: toast.POSITION.TOP_CENTER
            });
        });
        return false;
    }
    return true;
};
