const LoanApplication = require('../models/LoanApplication');
const Document = require('../models/Document');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');

const createApplication = async (data, userId) => {
  const application = await LoanApplication.create({
    loanType: data.loanType,
    requestedAmount: data.requestedAmount,
    tenureMonths: data.tenureMonths,
    employmentType: data.employmentType,
    declaredMonthlyIncome: data.declaredMonthlyIncome,
    applicant: userId,
    status: 'draft',
  });

  await logActivity(application._id, userId, 'Application Created', {
    loanType: data.loanType,
    requestedAmount: data.requestedAmount,
  });

  return application;
};

const getUserApplications = async (userId) => {
  return await LoanApplication.find({ applicant: userId }).sort({ createdAt: -1 }).populate('documents');
};

const getApplicationByIdAndUser = async (id, userId) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw ApiError.badRequest('Invalid application ID format');
  }

  const application = await LoanApplication.findOne({ _id: id, applicant: userId }).populate('documents');

  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  return application;
};

const uploadDocument = async (applicationId, userId, fileData, documentType) => {
  const application = await getApplicationByIdAndUser(applicationId, userId);

  const document = await Document.create({
    application: applicationId,
    uploadedBy: userId,
    documentType,
    originalName: fileData.originalname,
    filename: fileData.filename,
    path: fileData.path,
    mimetype: fileData.mimetype,
    size: fileData.size,
  });

  application.documents.push(document._id);
  
  if (application.status === 'draft') {
    application.status = 'documents_pending';
  }
  
  await application.save();

  await logActivity(applicationId, userId, 'Document Uploaded', {
    documentType,
    originalName: fileData.originalname,
  });

  return document;
};

const updateApplicationStatus = async (applicationId, userId, status) => {
  const application = await getApplicationByIdAndUser(applicationId, userId);
  const previousStatus = application.status;
  application.status = status;
  await application.save();

  await logActivity(applicationId, userId, 'Status Changed', {
    from: previousStatus,
    to: status,
  });

  return application;
};

module.exports = {
  createApplication,
  getUserApplications,
  getApplicationByIdAndUser,
  uploadDocument,
  updateApplicationStatus,
};
