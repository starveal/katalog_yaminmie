const API_BASE = '/api';
const CUSTOMER_ORDER_IDS_KEY = 'katalogwa_customer_order_ids';

export const getCustomerOrderIds = () => {
    try {
        const orderIds = JSON.parse(localStorage.getItem(CUSTOMER_ORDER_IDS_KEY) || '[]');
        return Array.isArray(orderIds)
            ? [...new Set(orderIds.filter((id) => (
                typeof id === 'string' &&
                /^order-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
            )))].slice(-100)
            : [];
    } catch {
        return [];
    }
};

export const saveCustomerOrderIds = (orderIds) => {
    localStorage.setItem(CUSTOMER_ORDER_IDS_KEY, JSON.stringify(orderIds.slice(-100)));
};

// Token Management
export const getAuthToken = () => localStorage.getItem('katalogwa_token');
export const setAuthToken = (token) => localStorage.setItem('katalogwa_token', token);
export const clearAuthToken = () => localStorage.removeItem('katalogwa_token');
export const isAuthenticated = () => !!getAuthToken();

// Auth Headers
const getHeaders = (isFormData = false) => {
    const token = getAuthToken();
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

// Error Handler
const handleResponse = async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const errorMsg = response.status === 413
            ? 'Foto terlalu besar untuk server. Coba unggah foto yang lebih kecil atau tempel URL foto.'
            : (data.message || `Request failed with status ${response.status}`);
        throw new Error(errorMsg);
    }
    return data;
};

// Store Settings
export const fetchStoreSettings = async () => {
    const res = await fetch(`${API_BASE}/store`);
    return handleResponse(res);
};

export const updateStoreSettings = async (settings) => {
    const res = await fetch(`${API_BASE}/store`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(settings)
    });
    return handleResponse(res);
};

export const uploadStoreLogo = async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await fetch(`${API_BASE}/store/logo`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData
    });
    return handleResponse(res);
};

export const uploadHomepageImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/store/homepage-image`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData
    });
    return handleResponse(res);
};

export const addRecommendedProduct = async (id) => {
    const res = await fetch(`${API_BASE}/store/recommended-products/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: getHeaders()
    });
    return handleResponse(res);
};

export const removeRecommendedProduct = async (id) => {
    const res = await fetch(`${API_BASE}/store/recommended-products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(res);
};

// Categories
export const fetchCategories = async () => {
    const res = await fetch(`${API_BASE}/categories`);
    return handleResponse(res);
};

export const createCategory = async (name) => {
    const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name })
    });
    return handleResponse(res);
};

export const updateCategory = async (id, name) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name })
    });
    return handleResponse(res);
};

export const deleteCategory = async (id) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(res);
};

// Products
export const fetchProducts = async ({ categoryId = '', search = '' } = {}) => {
    const params = new URLSearchParams();
    if (categoryId) params.append('categoryId', categoryId);
    if (search) params.append('search', search);

    const url = `${API_BASE}/products${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    return handleResponse(res);
};

export const createProduct = async (formData) => {
    const isFormData = formData instanceof FormData;
    const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: getHeaders(isFormData),
        body: isFormData ? formData : JSON.stringify(formData)
    });
    return handleResponse(res);
};

export const updateProduct = async (id, formData) => {
    const isFormData = formData instanceof FormData;
    const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(isFormData),
        body: isFormData ? formData : JSON.stringify(formData)
    });
    return handleResponse(res);
};

export const toggleProductStock = async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}/stock`, {
        method: 'PATCH',
        headers: getHeaders()
    });
    return handleResponse(res);
};

export const deleteProduct = async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(res);
};

// Orders
export const createOrder = async (order) => {
    const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
    });
    return handleResponse(res);
};

export const fetchOrders = async () => {
    const res = await fetch(`${API_BASE}/orders`, {
        headers: getHeaders()
    });
    return handleResponse(res);
};

export const fetchCustomerOrders = async (orderIds) => {
    if (orderIds.length === 0) return { success: true, count: 0, data: [] };
    const params = new URLSearchParams({ ids: orderIds.join(',') });
    const res = await fetch(`${API_BASE}/orders/history?${params.toString()}`);
    return handleResponse(res);
};

export const hideCompletedOrderFromAdmin = async (id) => {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(res);
};

export const hideAllCompletedOrdersFromAdmin = async () => {
    const res = await fetch(`${API_BASE}/orders/completed`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(res);
};

export const confirmOrder = async (id) => {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/confirm`, {
        method: 'PATCH',
        headers: getHeaders()
    });
    return handleResponse(res);
};

// Auth
export const loginAdmin = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
};

export const fetchAdminProfile = async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders()
    });
    return handleResponse(res);
};

export const updateAdminProfile = async (profile) => {
    const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profile)
    });
    return handleResponse(res);
};

export const updateAdminPassword = async (passwords) => {
    const res = await fetch(`${API_BASE}/auth/me/password`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(passwords)
    });
    return handleResponse(res);
};