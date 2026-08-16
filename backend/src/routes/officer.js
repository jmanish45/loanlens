const express = require('express');
const {
  getApplications,
  getApplication,
  updateStatus,
  downloadDocument,
  reviewDocument,
  getDashboardStats,
  addNote,
  getNotes,
  getActivity,
  getDocumentAnalysis,
  triggerReprocess,
  getApplicationValidation,
  deleteApplication,
  viewDocument,
} = require('../controllers/officerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and 'officer' or 'admin' role
router.use(protect);
router.use(authorize('officer', 'admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Applications
router.get('/applications', getApplications);
router.get('/applications/:id', getApplication);
router.patch('/applications/:id/status', updateStatus);
router.delete('/applications/:id', deleteApplication);

// Notes
router.post('/applications/:id/notes', addNote);
router.get('/applications/:id/notes', getNotes);

// Activity & Validation
router.get('/applications/:id/activity', getActivity);
router.get('/applications/:id/validation', getApplicationValidation);

// Documents
router.get('/documents/:docId/download', downloadDocument);
router.get('/documents/:docId/view', viewDocument);
router.patch('/documents/:docId/review', reviewDocument);
router.get('/documents/:docId/analysis', getDocumentAnalysis);
router.post('/documents/:docId/reprocess', triggerReprocess);

module.exports = router;

