const officerService = require('../services/officerService');
const path = require('path');
const fs = require('fs');

const getApplications = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.loanType) filters.loanType = req.query.loanType;

    const applications = await officerService.getAllApplications(filters);
    res.json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
};

const getApplication = async (req, res, next) => {
  try {
    const application = await officerService.getApplicationById(req.params.id);
    res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const application = await officerService.updateApplicationStatus(req.params.id, status, req.user._id);
    res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
};

const downloadDocument = async (req, res, next) => {
  try {
    const document = await officerService.getDocumentForDownload(req.params.docId);

    if (!fs.existsSync(document.path)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.download(document.path, document.originalName);
  } catch (error) {
    next(error);
  }
};

const reviewDocument = async (req, res, next) => {
  try {
    const { status, reviewComment } = req.body;
    const document = await officerService.updateDocumentReview(
      req.params.docId,
      status,
      reviewComment,
      req.user._id
    );
    res.json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const dashboardData = await officerService.getDashboardStats();
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    next(error);
  }
};

const addNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }
    const note = await officerService.addNote(req.params.id, req.user._id, content.trim());
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};

const getNotes = async (req, res, next) => {
  try {
    const notes = await officerService.getNotes(req.params.id);
    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
};

const getActivity = async (req, res, next) => {
  try {
    const activity = await officerService.getActivity(req.params.id);
    res.json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getApplications,
  getApplication,
  updateStatus,
  downloadDocument,
  reviewDocument,
  getDashboardStats,
  addNote,
  getNotes,
  getActivity,
};
