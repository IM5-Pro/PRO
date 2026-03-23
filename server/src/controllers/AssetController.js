import Asset from "../models/Asset.js";
import { sendError, sendSuccess } from "../utils/response.js";

export const getAssets = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const assets = await Asset.find({ employee: employeeId });
    return sendSuccess(res, 200, "Assets fetched", { data: assets });
  } catch (err) {
    return sendError(res, 500, "Failed to fetch assets", { error: err.message });
  }
};

export const addAsset = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const asset = new Asset({ ...req.body, employee: employeeId });
    await asset.save();
    return sendSuccess(res, 201, "Asset assigned", { data: asset });
  } catch (err) {
    return sendError(res, 500, "Failed to assign asset", { error: err.message });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Asset.findByIdAndUpdate(id, req.body, { new: true });
    return sendSuccess(res, 200, "Asset updated", { data: updated });
  } catch (err) {
    return sendError(res, 500, "Failed to update asset", { error: err.message });
  }
};

export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    await Asset.findByIdAndDelete(id);
    return sendSuccess(res, 200, "Asset deleted");
  } catch (err) {
    return sendError(res, 500, "Failed to delete asset", { error: err.message });
  }
};
