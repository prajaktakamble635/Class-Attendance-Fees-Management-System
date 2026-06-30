import axios from 'axios';
import { handleError } from '@/hooks/errorHandling'
export const fetchData = async (url) => {
    try {
        const response = await axios.get(url);
        if (response.status === 200) {
            return response.data;
        }
        else return null;
    } catch (error) {
        handleError(error);
        return null;
    }
}