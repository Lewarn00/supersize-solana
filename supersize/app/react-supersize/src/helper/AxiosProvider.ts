import axios from "axios";
export const BASE_API_URL = "http://localhost:3000/api";

export interface AxiosResult {
    data: any,
    success: boolean,
    msg: string | null,
}

export const getUser = async (user: string): Promise<AxiosResult> => {
    const response = await axios.get(`${BASE_API_URL}/get-user?user=${user}`);

    if (response.status === 200) {
        return {data: JSON.parse(response.data), success: true, msg: null};
    } else {
        return {data: null, success: false, msg: response.statusText};
    }
}