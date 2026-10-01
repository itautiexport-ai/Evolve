const API_BASE_URL = "http://localhost:3001/api";

function getToken(): string | null {
  return localStorage.getItem("evolve_auth_token");
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "unknown error" }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ---------- Auth ----------
export const authApi = {
  signup: (name: string, email: string, password: string) =>
    apiRequest("/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) }),

  login: (email: string, password: string) =>
    apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
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
  create: (content: string, date?: string) =>
    apiRequest("/gratitude", { method: "POST", body: JSON.stringify({ content, date }) }),
  delete: (id: string) => apiRequest(`/gratitude/${id}`, { method: "DELETE" }),
};

// ---------- Weekly Reviews ----------
export const reviewsApi = {
  getAll: () => apiRequest("/reviews"),
  create: (weekStartDate: string, content: any) =>
    apiRequest("/reviews", { method: "POST", body: JSON.stringify({ weekStartDate, content }) }),
  delete: (id: string) => apiRequest(`/reviews/${id}`, { method: "DELETE" }),
  clearAll: () => apiRequest("/reviews", { method: "DELETE" }),
};

// ---------- Music ----------
export const musicApi = {
  getAll: () => apiRequest("/music"),
  create: (title: string, url: string) =>
    apiRequest("/music", { method: "POST", body: JSON.stringify({ title, url }) }),
  delete: (id: string) => apiRequest(`/music/${id}`, { method: "DELETE" }),
};

// ---------- Affirmation Audio ----------
export const affirmationAudioApi = {
  get: () => apiRequest("/affirmation-audio"),
  save: (base64Audio: string) =>
    apiRequest("/affirmation-audio", { method: "POST", body: JSON.stringify({ base64Audio }) }),
  delete: () => apiRequest("/affirmation-audio", { method: "DELETE" }),
};

export function setAuthToken(token: string) {
  localStorage.setItem("evolve_auth_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("evolve_auth_token");
}
