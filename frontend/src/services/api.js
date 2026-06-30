const API_BASE_URL = 'http://localhost:8080';

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMsg = 'Une erreur est survenue';
    try {
      const errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {
      // Pas de JSON dans la réponse d'erreur
    }
    throw new Error(errorMsg);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
};

export const api = {
  // === PROJETS ===
  projects: {
    getAll: (status) => {
      const url = status 
        ? `${API_BASE_URL}/api/projects?status=${encodeURIComponent(status)}`
        : `${API_BASE_URL}/api/projects`;
      return fetch(url).then(handleResponse);
    },
    getById: (id) => fetch(`${API_BASE_URL}/api/projects/${id}`).then(handleResponse),
    create: (project) => fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    }).then(handleResponse),
    update: (id, project) => fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    }).then(handleResponse),
    delete: (id) => fetch(`${API_BASE_URL}/api/projects/${id}`, { method: 'DELETE' }).then(handleResponse),
    changeStatus: (id, status) => fetch(`${API_BASE_URL}/api/projects/${id}/status?status=${encodeURIComponent(status)}`, {
      method: 'PATCH'
    }).then(handleResponse),
    addMember: (projectId, memberId) => fetch(`${API_BASE_URL}/api/projects/${projectId}/members/${memberId}`, {
      method: 'POST'
    }).then(handleResponse),
    removeMember: (projectId, memberId) => fetch(`${API_BASE_URL}/api/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE'
    }).then(handleResponse),
    getStats: (id) => fetch(`${API_BASE_URL}/api/projects/${id}/stats`).then(handleResponse),
  },

  // === TACHES ===
  tasks: {
    getByProject: (projectId, title) => {
      const url = title 
        ? `${API_BASE_URL}/api/projects/${projectId}/tasks?title=${encodeURIComponent(title)}`
        : `${API_BASE_URL}/api/projects/${projectId}/tasks`;
      return fetch(url).then(handleResponse);
    },
    getById: (id) => fetch(`${API_BASE_URL}/api/tasks/${id}`).then(handleResponse),
    create: (projectId, task) => fetch(`${API_BASE_URL}/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    }).then(handleResponse),
    update: (id, task) => fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    }).then(handleResponse),
    delete: (id) => fetch(`${API_BASE_URL}/api/tasks/${id}`, { method: 'DELETE' }).then(handleResponse),
    changeStatus: (id, status) => fetch(`${API_BASE_URL}/api/tasks/${id}/status?status=${encodeURIComponent(status)}`, {
      method: 'PATCH'
    }).then(handleResponse),
    assignMember: (id, memberId) => fetch(`${API_BASE_URL}/api/tasks/${id}/assign/${memberId}`, {
      method: 'PATCH'
    }).then(handleResponse),
    addHours: (id, hours) => fetch(`${API_BASE_URL}/api/tasks/${id}/hours?hours=${hours}`, {
      method: 'PATCH'
    }).then(handleResponse),
    searchGlobal: (title) => fetch(`${API_BASE_URL}/api/tasks/search?title=${encodeURIComponent(title)}`).then(handleResponse),
    filterGlobal: (status) => fetch(`${API_BASE_URL}/api/tasks?status=${encodeURIComponent(status)}`).then(handleResponse),
  },

  // === MEMBRES ===
  members: {
    getAll: () => fetch(`${API_BASE_URL}/api/members`).then(handleResponse),
    getById: (id) => fetch(`${API_BASE_URL}/api/members/${id}`).then(handleResponse),
    create: (member) => fetch(`${API_BASE_URL}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    }).then(handleResponse),
    update: (id, member) => fetch(`${API_BASE_URL}/api/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    }).then(handleResponse),
    delete: (id) => fetch(`${API_BASE_URL}/api/members/${id}`, { method: 'DELETE' }).then(handleResponse),
  },

  // === COMMENTAIRES ===
  comments: {
    getByTask: (taskId) => fetch(`${API_BASE_URL}/api/tasks/${taskId}/comments`).then(handleResponse),
    create: (taskId, comment) => fetch(`${API_BASE_URL}/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment)
    }).then(handleResponse),
    update: (id, comment) => fetch(`${API_BASE_URL}/api/comments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment)
    }).then(handleResponse),
    delete: (id) => fetch(`${API_BASE_URL}/api/comments/${id}`, { method: 'DELETE' }).then(handleResponse),
  }
};
