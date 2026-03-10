// DocumentController provides basic CRUD stubs for document management
import { sendSuccess } from "../utils/response.js";

const uploadDocument = async (req, res) => {
  return sendSuccess(res, 200, "Document uploaded (stub)");
};

const viewDocument = async (req, res) => {
  return sendSuccess(res, 200, "Document view details (stub)");
};

const downloadDocument = async (req, res) => {
  return sendSuccess(res, 200, "Document download (stub)");
};

const deleteDocument = async (req, res) => {
  return sendSuccess(res, 200, "Document deleted (stub)");
};

const updateDocument = async (req, res) => {
  return sendSuccess(res, 200, "Document updated (stub)");
};

const shareDocument = async (req, res) => {
  return sendSuccess(res, 200, "Document shared (stub)");
};

const archiveDocument = async (req, res) => {
  return sendSuccess(res, 200, "Document archived (stub)");
};

const restoreDocument = async (req, res) => {
  return sendSuccess(res, 200, "Document restored (stub)");
};

export default {
  uploadDocument,
  viewDocument,
  downloadDocument,
  deleteDocument,
  updateDocument,
  shareDocument,
  archiveDocument,
  restoreDocument,
};
