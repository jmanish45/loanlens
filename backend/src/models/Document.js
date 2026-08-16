const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LoanApplication',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: ['salary_slip', 'bank_statement', 'itr', 'form16', 'pan', 'aadhaar', 'property_document', 'other'],
    },
    originalName: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected'],
      default: 'pending_review',
    },
    reviewComment: {
      type: String,
      default: null,
      trim: true,
    },
    // AI Document Intelligence fields
    aiProcessing: {
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
      },
      predictedType: {
        type: String,
        enum: ['PAN', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT', 'FORM_16', 'ITR', 'OTHER', 'UNKNOWN'],
        default: null,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },
      extractedData: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      processedAt: {
        type: Date,
        default: null,
      },
      processingError: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
