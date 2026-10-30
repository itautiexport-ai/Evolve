const API_BASE_URL = "/api";

// Clear legacy stored tokens on load
if (typeof window !== "undefined" && window.localStorage) {
  try {
    localStorage.removeItem("evolve_auth_token");
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)evolve_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Session expired listener system
type SessionExpiredHandler = () => void;
const sessionExpiredHandlers: SessionExpiredHandler[] = [];

export function onSessionExpired(handler: SessionExpiredHandler): () => void {
  sessionExpiredHandlers.push(handler);
  return () => {
    const idx = sessionExpiredHandlers.indexOf(handler);
    if (idx !== -1) sessionExpiredHandlers.splice(idx, 1);
  };
}

function notifySessionExpired() {
  clearAuthToken();
  sessionExpiredHandlers.forEach((h) => h());
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const csrfToken = getCsrfTokenFromCookie();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };

  const method = (options.method || "GET").toUpperCase();
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method) && csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include", // Essential for HttpOnly session cookies
    headers,
  });

  if (response.status === 401) {
    // Session expired or invalid
    notifySessionExpired();
    const error = await response.json().catch(() => ({ error: "Unauthorized" }));
    const err: any = new Error(error.error || "Session expired. Please log in again.");
    err.status = 401;
    err.code = error.code;
    err.data = error;
    throw err;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    const err: any = new Error(error.error || `Request failed with status ${response.status}`);
    err.status = response.status;
    err.code = error.code;
    err.data = error;
    throw err;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ---------- Auth ----------
export const authApi = {
  signup: (
    dataOrName: { name: string; email: string; password: string; phone?: string; vibeName?: string } | string,
    email?: string,
    password?: string,
    phone?: string,
    vibeName?: string
  ) => {
    let payload: any;
    if (typeof dataOrName === "object" && dataOrName !== null) {
      payload = dataOrName;
    } else {
      payload = { name: dataOrName, email, password, phone, vibeName };
    }
    return apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login: (identifier: string, password: string) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, email: identifier, password }),
    }),

  checkStatus: (identifier: string) =>
    apiRequest(`/auth/status?identifier=${encodeURIComponent(identifier)}`),

  logout: () =>
    apiRequest("/auth/logout", {
      method: "POST",
    }),

  getMe: () => apiRequest("/auth/me"),
};

// ---------- Goals ----------
export const goalsApi = {
  getAll: () => apiRequest("/goals"),
  create: (goal: any) => apiRequest("/goals", { method: "POST", body: JSON.stringify(goal) }),
  update: (id: string, goal: any) => apiRequest(`/goals/${id}`, { method: "PUT", body: JSON.stringify(goal) }),
  delete: (id: string) => apiRequest(`/goals/${id}`, { method: "DELETE" }),
  addMilestone: (goalId: string, title: string, dueDate?: string) =>
    apiRequest(`/goals/${goalId}/milestones`, { method: "POST", body: JSON.stringify({ title, dueDate }) }),
  updateMilestone: (id: string, data: any) =>
    apiRequest(`/goals/milestones/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMilestone: (id: string) => apiRequest(`/goals/milestones/${id}`, { method: "DELETE" }),
  addJournalEntry: (goalId: string, content: string, mood?: string, date?: string) =>
    apiRequest(`/goals/${goalId}/journal`, { method: "POST", body: JSON.stringify({ content, mood, date }) }),
};

// ---------- Habits ----------
export const habitsApi = {
  getAll: () => apiRequest("/habits"),
  create: (habit: any) => apiRequest("/habits", { method: "POST", body: JSON.stringify(habit) }),
  update: (id: string, habit: any) => apiRequest(`/habits/${id}`, { method: "PUT", body: JSON.stringify(habit) }),
  delete: (id: string) => apiRequest(`/habits/${id}`, { method: "DELETE" }),
  setHistory: (habitId: string, date: string, completed: boolean) =>
    apiRequest(`/habits/${habitId}/history/${date}`, { method: "PUT", body: JSON.stringify({ completed }) }),
};

// ---------- Masters ----------
export const mastersApi = {
  getAll: () => apiRequest("/masters"),
  create: (master: any) => apiRequest("/masters", { method: "POST", body: JSON.stringify(master) }),
  update: (id: string, master: any) => apiRequest(`/masters/${id}`, { method: "PUT", body: JSON.stringify(master) }),
  delete: (id: string) => apiRequest(`/masters/${id}`, { method: "DELETE" }),
};

// ---------- Gratitude ----------
export const gratitudeApi = {
  getAll: () => apiRequest("/gratitude"),
  create: (content: string, category?: string, vibe?: string, date?: string) =>
    apiRequest("/gratitude", { method: "POST", body: JSON.stringify({ content, category, vibe, date }) }),
  delete: (id: string) => apiRequest(`/gratitude/${id}`, { method: "DELETE" }),
};

// ---------- Weekly Reviews ----------
export const reviewsApi = {
  getAll: () => apiRequest("/reviews"),
  save: (data: { weekStartDate?: string; weekKey?: string; happinessScore?: number; risks?: string[]; commitments?: string[]; content?: any }) =>
    apiRequest("/reviews", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/reviews/${id}`, { method: "DELETE" }),
  clearAll: () => apiRequest("/reviews", { method: "DELETE" }),
};

// ---------- Music ----------
export const musicApi = {
  getAll: () => apiRequest("/music"),
  create: (title: string, description: string, url: string) =>
    apiRequest("/music", { method: "POST", body: JSON.stringify({ title, description, url }) }),
  delete: (id: string) => apiRequest(`/music/${id}`, { method: "DELETE" }),
};

// ---------- Affirmation Audio ----------
export const affirmationAudioApi = {
  get: () => apiRequest("/affirmation-audio"),
  save: (base64Audio: string) =>
    apiRequest("/affirmation-audio", { method: "POST", body: JSON.stringify({ base64Audio }) }),
  delete: () => apiRequest("/affirmation-audio", { method: "DELETE" }),
};

// ---------- Vision Board ----------
export const visionBoardApi = {
  get: () => apiRequest("/vision-board"),
  save: (data: { boardData?: any; centerQuote?: string; isCompleted?: boolean; boardOwner?: string }) =>
    apiRequest("/vision-board", { method: "PUT", body: JSON.stringify(data) }),
};

// ---------- Manifestations ----------
export const manifestationApi = {
  get: () => apiRequest("/manifestations"),
  save: (data: { current?: any; accomplishedList?: any[] }) =>
    apiRequest("/manifestations", { method: "PUT", body: JSON.stringify(data) }),
};

// ---------- Preferences ----------
export const preferencesApi = {
  get: () => apiRequest("/preferences"),
  save: (preferences: any) =>
    apiRequest("/preferences", { method: "PUT", body: JSON.stringify({ preferences }) }),
};

// ---------- Admin Management ----------
export const adminApi = {
  getUsers: () => apiRequest("/admin/users"),
  createUser: (userData: any) => apiRequest("/admin/users", { method: "POST", body: JSON.stringify(userData) }),
  updateUser: (id: string, userData: any) =>
    apiRequest(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(userData) }),
  updateUserStatus: (id: string, status: "approved" | "pending" | "rejected") =>
    apiRequest(`/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteUser: (id: string) => apiRequest(`/admin/users/${id}`, { method: "DELETE" }),
  updatePermissions: (userId: string, permissions: any) =>
    apiRequest(`/admin/permissions/${userId}`, { method: "PUT", body: JSON.stringify(permissions) }),
  getLogs: () => apiRequest("/admin/logs"),
  addLog: (action: string, details: string) =>
    apiRequest("/admin/logs", { method: "POST", body: JSON.stringify({ action, details }) }),
};

export function setAuthToken(_token?: string) {
  // Authentication uses HttpOnly cookies; ensure legacy tokens are purged
  clearAuthToken();
}

export function clearAuthToken() {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem("evolve_auth_token");
    } catch {
      // Ignore errors
    }
  }
}
