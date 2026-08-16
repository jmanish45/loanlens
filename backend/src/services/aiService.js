const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const Document = require('../models/Document');
const config = require('../config');
const { logActivity } = require('../utils/activityLogger');

/**
 * AI Document Processing Service
 * Handles communication with the Python FastAPI AI service
 */

const AI_SERVICE_URL = config.aiServiceUrl || 'http://localhost:8000';

/**
 * Process a document through the AI pipeline.
 * Called asynchronously after document upload (fire-and-forget).
 *
 * @param {string} documentId - MongoDB document ID
 */
const processDocument = async (documentId) => {
  let document;

  try {
    // Fetch the document record
    document = await Document.findById(documentId);
    if (!document) {
      console.error(`[AI] Document not found: ${documentId}`);
      return;
    }

    // Update status to processing
    document.aiProcessing.status = 'processing';
    await document.save();

    // Check if file exists
    const filePath = document.path;
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found on disk: ${filePath}`);
    }

    // Send file to AI service
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: document.originalName,
      contentType: document.mimetype,
    });

    console.log(`[AI] Processing document: ${document.originalName} (${documentId})`);

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/process-document`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 120000, // 2 minute timeout for AI processing
        maxContentLength: 50 * 1024 * 1024,
      }
    );

    const result = response.data;

    // Update document with AI results
    document.aiProcessing.status = result.processing_status || 'completed';
    document.aiProcessing.predictedType = result.document_type || null;
    document.aiProcessing.confidence = result.confidence || null;
    document.aiProcessing.extractedData = result.extracted_data || null;
    document.aiProcessing.processedAt = new Date();
    document.aiProcessing.processingError = result.processing_error || null;

    await document.save();

    console.log(
      `[AI] ✅ Document processed: ${document.originalName} → ${result.document_type} (${(result.confidence * 100).toFixed(0)}%)`
    );

    // Log activity
    await logActivity(document.application, null, 'AI Document Processed', {
      documentType: result.document_type,
      confidence: result.confidence,
      originalName: document.originalName,
    });

  } catch (error) {
    console.error(`[AI] ❌ Processing failed for ${documentId}:`, error.message);

    // Update document with error
    if (document) {
      try {
        document.aiProcessing.status = 'failed';
        document.aiProcessing.processingError = error.message;
        document.aiProcessing.processedAt = new Date();
        await document.save();
      } catch (saveErr) {
        console.error(`[AI] Failed to save error state:`, saveErr.message);
      }
    }
  }
};

/**
 * Re-process a document (officer-triggered).
 * Resets AI state and re-runs the pipeline.
 *
 * @param {string} documentId - MongoDB document ID
 */
const reprocessDocument = async (documentId) => {
  const document = await Document.findById(documentId);
  if (!document) {
    throw new Error('Document not found');
  }

  // Reset AI processing state
  document.aiProcessing.status = 'pending';
  document.aiProcessing.predictedType = null;
  document.aiProcessing.confidence = null;
  document.aiProcessing.extractedData = null;
  document.aiProcessing.processedAt = null;
  document.aiProcessing.processingError = null;
  await document.save();

  // Trigger processing (async)
  processDocument(documentId).catch((err) =>
    console.error(`[AI] Reprocess failed for ${documentId}:`, err.message)
  );

  return document;
};

module.exports = {
  processDocument,
  reprocessDocument,
};
