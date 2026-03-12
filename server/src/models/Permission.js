import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
    group: {
      type: String,
      default: "General",
      index: true,
      trim: true,
    },
  },
  { timestamps: true },
);

permissionSchema.index({ module: 1, name: 1 }, { unique: true });

const Permission = mongoose.model("Permission", permissionSchema);
export default Permission;
