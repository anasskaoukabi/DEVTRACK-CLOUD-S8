import axios from 'axios';

let rawBaseUrl = import.meta.env.VITE_API_URL || '/api';

if (rawBaseUrl && !rawBaseUrl.startsWith('http') && !rawBaseUrl.startsWith('/')) {
  rawBaseUrl = `https://${rawBaseUrl}`;
}
if (rawBaseUrl && rawBaseUrl.startsWith('http') && !rawBaseUrl.endsWith('/api')) {
  rawBaseUrl = rawBaseUrl.replace(/\/$/, '') + '/api';
}

const api = axios.create({ baseURL: rawBaseUrl });

export const projectsApi = {
  getAll: () => api.get('/projects').then(r => r.data),
  getOne: (id) => api.get(`/projects/${id}`).then(r => r.data),
  create: (data) => api.post('/projects', data).then(r => r.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/projects/${id}`).then(r => r.data),
  getDashboard: (id) => api.get(`/projects/${id}/dashboard`).then(r => r.data),
  addDeveloper: (id, dev_id) => api.post(`/projects/${id}/developers`, { developer_id: dev_id }).then(r => r.data),
  removeDeveloper: (id, devId) => api.delete(`/projects/${id}/developers/${devId}`).then(r => r.data),
};

export const sprintsApi = {
  getByProject: (project_id) => api.get('/sprints', { params: { project_id } }).then(r => r.data),
  getOne: (id) => api.get(`/sprints/${id}`).then(r => r.data),
  create: (data) => api.post('/sprints', data).then(r => r.data),
  update: (id, data) => api.put(`/sprints/${id}`, data).then(r => r.data),
  complete: (id, force) => api.post(`/sprints/${id}/complete`, { force }).then(r => r.data),
  delete: (id) => api.delete(`/sprints/${id}`).then(r => r.data),
};

export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }).then(r => r.data),
  getOne: (id) => api.get(`/tasks/${id}`).then(r => r.data),
  create: (data) => api.post('/tasks', data).then(r => r.data),
  update: (id, d) => api.put(`/tasks/${id}`, d).then(r => r.data),
  delete: (id) => api.delete(`/tasks/${id}`).then(r => r.data),
  addSubtask: (id, d) => api.post(`/tasks/${id}/subtasks`, d).then(r => r.data),
  updateSubtask: (id, sid, d) => api.put(`/tasks/${id}/subtasks/${sid}`, d).then(r => r.data),
  deleteSubtask: (id, sid) => api.delete(`/tasks/${id}/subtasks/${sid}`).then(r => r.data),
};

export const bugsApi = {
  getByTask: (task_id) => api.get('/bugs', { params: { task_id } }).then(r => r.data),
  create: (data) => api.post('/bugs', data).then(r => r.data),
  update: (id, d) => api.put(`/bugs/${id}`, d).then(r => r.data),
  delete: (id) => api.delete(`/bugs/${id}`).then(r => r.data),
};

export const commentsApi = {
  getByTask: (task_id) => api.get('/comments', { params: { task_id } }).then(r => r.data),
  create: (data) => api.post('/comments', data).then(r => r.data),
  delete: (id) => api.delete(`/comments/${id}`).then(r => r.data),
};

export const developersApi = {
  getAll: () => api.get('/developers').then(r => r.data),
  getOne: (id) => api.get(`/developers/${id}`).then(r => r.data),
  getWorkload: (id) => api.get(`/developers/${id}/workload`).then(r => r.data),
  create: (data) => api.post('/developers', data).then(r => r.data),
  update: (id, d) => api.put(`/developers/${id}`, d).then(r => r.data),
  delete: (id) => api.delete(`/developers/${id}`).then(r => r.data),
};

export const timeLogsApi = {
  getByTask: (task_id) => api.get(`/time-logs/task/${task_id}`).then(r => r.data),
  create: (data) => api.post('/time-logs', data).then(r => r.data),
};

export const tagsApi = {
  getByProject: (project_id) => api.get('/tags', { params: { project_id } }).then(r => r.data),
  create: (data) => api.post('/tags', data).then(r => r.data),
  update: (id, d) => api.put(`/tags/${id}`, d).then(r => r.data),
  delete: (id) => api.delete(`/tags/${id}`).then(r => r.data),
};

export const attachmentsApi = {
  getByTask: (taskId) => api.get(`/attachments/task/${taskId}`).then(r => r.data),
  upload: (taskId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/attachments/task/${taskId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  delete: (id) => api.delete(`/attachments/${id}`).then(r => r.data),
};

export const notificationsApi = {
  getAll: () => api.get('/notifications').then(r => r.data),
  getUnreadCount: () => api.get('/notifications/unread-count').then(r => r.data.count),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then(r => r.data),
  delete: (id) => api.delete(`/notifications/${id}`).then(r => r.data),
};

export const risksApi = {
  getByProject: (project_id) => api.get('/risks', { params: { project_id } }).then(r => r.data),
  create: (data) => api.post('/risks', data).then(r => r.data),
  update: (id, d) => api.put(`/risks/${id}`, d).then(r => r.data),
  delete: (id) => api.delete(`/risks/${id}`).then(r => r.data),
};

export const milestonesApi = {
  getByProject: (project_id) => api.get('/milestones', { params: { project_id } }).then(r => r.data),
  getOne: (id) => api.get(`/milestones/${id}`).then(r => r.data),
  create: (data) => api.post('/milestones', data).then(r => r.data),
  update: (id, d) => api.put(`/milestones/${id}`, d).then(r => r.data),
  delete: (id) => api.delete(`/milestones/${id}`).then(r => r.data),
};

export const portfolioApi = {
  get: () => api.get('/portfolio').then(r => r.data),
};

export const planningPokerApi = {
  getSessions: (project_id) => api.get('/planning-poker', { params: { project_id } }).then(r => r.data),
  getByProject: (project_id) => api.get('/planning-poker', { params: { project_id } }).then(r => r.data),
  getOne: (id) => api.get(`/planning-poker/${id}`).then(r => r.data),
  create: (data) => api.post('/planning-poker', data).then(r => r.data),
  start: (id) => api.patch(`/planning-poker/${id}/start`).then(r => r.data),
  vote: (id, data) => api.post(`/planning-poker/${id}/vote`, data).then(r => r.data),
  reveal: (id) => api.patch(`/planning-poker/${id}/reveal`).then(r => r.data),
  consensus: (id, data) => api.patch(`/planning-poker/${id}/consensus`, data).then(r => r.data),
  delete: (id) => api.delete(`/planning-poker/${id}`).then(r => r.data),
};

export const exportApi = {
  downloadTasks: (params) => api.get('/export/tasks', { params, responseType: 'blob' }).then(r => r.data),
  downloadTimeLogs: (params) => api.get('/export/time-logs', { params, responseType: 'blob' }).then(r => r.data),
  downloadBugs: (params) => api.get('/export/bugs', { params, responseType: 'blob' }).then(r => r.data),
};

export const auditApi = {
  getAll: (params) => api.get('/audit', { params }).then(r => r.data),
};

export const documentsApi = {
  download: async (type, id, filename) => {
    const response = await api.get(`/documents/${type}/${id}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename || `${type}-${id}.pdf`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  },
};
// Generic CSV download helper
export const downloadCSV = (blob, filename) => {
  const url = URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};
export default api;