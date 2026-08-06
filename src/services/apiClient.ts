import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach bearer token to outgoing requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('farma_jwt');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Catch expired JWT tokens & clear session cleanly
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Clear expired credentials if backend rejects the token
            localStorage.removeItem('farma_jwt');
            localStorage.removeItem('farma_auth');

            // Reload app to return cleanly to login screen
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);