import API from './axios'

export const farmIntelAPI = {
  // Planting Calendar
  listCalendar: () => API.get('/calendar/'),
  createCalendarEntry: (data) => API.post('/calendar/', data),
  updateCalendarEntry: (id, data) => API.put(`/calendar/${id}`, data),
  deleteCalendarEntry: (id) => API.delete(`/calendar/${id}`),

  // Soil Health
  listSoilRecords: () => API.get('/soil/'),
  addSoilRecord: (data) => API.post('/soil/', data),

  // Irrigation
  listIrrigation: (params) => API.get('/irrigation/', { params }),
  createIrrigation: (data) => API.post('/irrigation/', data),
  completeIrrigation: (id, data) => API.post(`/irrigation/${id}/complete`, data),

  // Pest Library (public)
  searchPestLibrary: (params) => API.get('/pest-library/', { params }),
  getPestEntry: (id) => API.get(`/pest-library/${id}`),
}
