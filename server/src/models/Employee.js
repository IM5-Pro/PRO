import mongoose from "mongoose";

const employeeDocumentSchema = new mongoose.Schema(
  {
    documentType: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true },
);

const employeeStatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["ACTIVE", "RESIGNED", "TERMINATED"],
      required: true,
    },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false },
);

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      unique: true,
      required: true,
      default: () => `EMP${Date.now()}`,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String },
    phoneNumber: { type: String },
    panNumber: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    aadhaarNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    department: { type: String, trim: true },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    designation: { type: String },
    joinDate: { type: Date, default: Date.now },
    joiningDate: { type: Date, default: Date.now },
    dateOfBirth: { type: Date },
    employmentType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT"],
      default: "FULL_TIME",
    },
    salary: { type: Number, default: 0 },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", index: true },
    managerID: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", index: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    salaryTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryTemplate",
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      zipCode: { type: String, default: "" },
    },
    addressLine: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    emergencyContact: {
      name: { type: String, default: "" },
      relation: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    documents: [employeeDocumentSchema],
    status: {
      type: String,
      enum: ["ACTIVE", "RESIGNED", "TERMINATED"],
      default: "ACTIVE",
    },
    statusHistory: {
      type: [employeeStatusHistorySchema],
      default: [],
    },
  },
  { timestamps: true },
);

employeeSchema.index({ departmentId: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ managerID: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ designation: 1 });
employeeSchema.index({ isActive: 1 });

employeeSchema.pre("save", function syncDates() {
  if (!this.manager && this.managerId) {
    this.manager = this.managerId;
  }
  if (!this.manager && this.managerID) {
    this.manager = this.managerID;
  }
  if (!this.managerId && this.manager) {
    this.managerId = this.manager;
  }
  if (!this.managerID && this.manager) {
    this.managerID = this.manager;
  }

  if (!this.managerId && this.managerID) {
    this.managerId = this.managerID;
  }
  if (!this.managerID && this.managerId) {
    this.managerID = this.managerId;
  }

  if (this.addressLine && !this.address?.street) {
    this.address = {
      ...(this.address || {}),
      street: this.addressLine,
    };
  }

  if (this.city && !this.address?.city) {
    this.address = {
      ...(this.address || {}),
      city: this.city,
    };
  }

  if (this.state && !this.address?.state) {
    this.address = {
      ...(this.address || {}),
      state: this.state,
    };
  }

  if (this.zipCode && !this.address?.zipCode) {
    this.address = {
      ...(this.address || {}),
      zipCode: this.zipCode,
    };
  }

  if (this.address?.city && !this.city) {
    this.city = this.address.city;
  }

  if (this.address?.state && !this.state) {
    this.state = this.address.state;
  }

  if (this.address?.zipCode && !this.zipCode) {
    this.zipCode = this.address.zipCode;
  }

  if (!this.joiningDate && this.joinDate) {
    this.joiningDate = this.joinDate;
  }
  if (!this.joinDate && this.joiningDate) {
    this.joinDate = this.joiningDate;
  }

  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.createdBy,
      changedAt: new Date(),
    });
  }

  if (!this.isNew && this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.createdBy,
      changedAt: new Date(),
    });
  }

});

employeeSchema.pre("findOneAndUpdate", function syncManagerAliases() {
  const update = this.getUpdate() || {};
  const hasSet = !!update.$set;
  const setPayload = hasSet ? update.$set : update;

  if (setPayload.manager && !setPayload.managerId) {
    setPayload.managerId = setPayload.manager;
  }

  if (setPayload.manager && !setPayload.managerID) {
    setPayload.managerID = setPayload.manager;
  }

  if (setPayload.managerID && !setPayload.managerId) {
    setPayload.managerId = setPayload.managerID;
  }

  if (setPayload.managerId && !setPayload.managerID) {
    setPayload.managerID = setPayload.managerId;
  }

  if (!setPayload.manager && setPayload.managerId) {
    setPayload.manager = setPayload.managerId;
  }

  if (!setPayload.manager && setPayload.managerID) {
    setPayload.manager = setPayload.managerID;
  }

  if (setPayload.status) {
    update.$push = update.$push || {};
    update.$push.statusHistory = {
      status: setPayload.status,
      changedAt: new Date(),
      changedBy: setPayload.updatedBy || setPayload.createdBy,
    };
  }

  if (hasSet) {
    update.$set = setPayload;
    this.setUpdate(update);
  } else {
    this.setUpdate({
      $set: setPayload,
      ...(update.$push ? { $push: update.$push } : {}),
    });
  }

});

export default mongoose.model("Employee", employeeSchema);
