import API from './axios'
import { apiConfig } from './config'
import { mockFarmIntelAPI } from './mockApi'

const api = apiConfig.useMock ? mockFarmIntelAPI : API

export const farmIntelAPI = {
  // Planting Calendar
  listCalendar: () =>
    apiConfig.useMock ? api.getCalendar() : API.get('/calendar/'),
  createCalendarEntry: (data) =>
    apiConfig.useMock ? api.createCalendarEntry(data) : API.post('/calendar/', data),
  updateCalendarEntry: (id, data) =>
    apiConfig.useMock ? api.updateCalendarEntry(id, data) : API.put(`/calendar/${id}`, data),
  deleteCalendarEntry: (id) =>
    apiConfig.useMock ? api.deleteCalendarEntry(id) : API.delete(`/calendar/${id}`),

  // Soil Health
  listSoilRecords: () =>
    apiConfig.useMock ? Promise.resolve({ data: { data: [] } }) : API.get('/soil/'),
  addSoilRecord: (data) =>
    apiConfig.useMock ? Promise.resolve({ data: { success: true } }) : API.post('/soil/', data),

  // Irrigation
  listIrrigation: (params) =>
    apiConfig.useMock ? Promise.resolve({ data: { data: [] } }) : API.get('/irrigation/', { params }),
  createIrrigation: (data) =>
    apiConfig.useMock ? Promise.resolve({ data: { success: true } }) : API.post('/irrigation/', data),
  completeIrrigation: (id, data) =>
    apiConfig.useMock ? Promise.resolve({ data: { success: true } }) : API.post(`/irrigation/${id}/complete`, data),

  // Pest Library (public)
  searchPestLibrary: (params) =>
    apiConfig.useMock ? Promise.resolve({ data: { data: [] } }) : API.get('/pest-library/', { params }),
  getPestEntry: (id) =>
    apiConfig.useMock ? Promise.resolve({ data: { data: {} } }) : API.get(`/pest-library/${id}`),
}
