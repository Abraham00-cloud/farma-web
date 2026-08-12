import axios from 'axios';

// 🌐 Switched from localhost to your deployed AWS backend IP/URL
const API_BASE_URL = 'http://farma-backend-env.eba-fizrsmzs.us-east-1.elasticbeanstalk.com/api/v1';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach bearer token to outgoing requests safely
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('farma_jwt');
    // Ensure token exists, isn't literal 'null'/'undefined', and is a non-empty string
    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
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