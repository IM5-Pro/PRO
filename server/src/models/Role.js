import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  // list of permissions assigned to this role
  permissions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
    },
  ],
});

const Role = mongoose.model("Role", roleSchema);

export default Role;
