import axios from "axios";

const instance = axios.create({
    baseURL: "https://api.eyeson.team/",
    timeout: 10000,
    headers: {
        "Authorization": "Your-API-key",
        "authority": "api.eyeson.team",
    }
})

export default instance;
