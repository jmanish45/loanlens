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

// Notes
router.post('/applications/:id/notes', addNote);
router.get('/applications/:id/notes', getNotes);

// Activity
router.get('/applications/:id/activity', getActivity);

// Documents
router.get('/documents/:docId/download', downloadDocument);
router.patch('/documents/:docId/review', reviewDocument);

module.exports = router;
