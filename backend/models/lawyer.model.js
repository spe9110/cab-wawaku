import mongoose, { Schema } from "mongoose";

const lawyerSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  photo: { type: String, required: true, trim: true },
  number_phone: { type: String, required: true, trim: true },
  job_details: {
    profession: { type: String, trim: true, maxlength: 100 },
    number_ONA: { type: String },
    barreau: { type: String, trim: true, maxlength: 100 },
    experience_years: { type: Number },
    specialization: { type: String, trim: true, maxlength: 100 }
  },
  location: [
    {
      label1: { type: String, required: true, trim: true },
      label2: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
      createdAt: { type: Date, default: Date.now },
    }
  ],
  social_media: [
    { name: { type: String, enum: ['LinkedIn','Facebook','Twitter','Instagram','YouTube','Website'], trim: true },
      url: { type: String, trim: true } }
  ],
  workDays: { type: [String], enum: ['Monday','Tuesday','Wednesday','Thursday','Friday'], default: ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
  workHours: {
    start: { type: String, default: "08:00" },
    end: { type: String, default: "17:00" }
  },
  breaks: [
    { start: { type: String, default: "12:00" }, end: { type: String, default: "13:00" } }
  ],
  exceptions: [{ type: String }], // "YYYY-MM-DD"
  timeZone: { type: String, default: "Africa/Kinshasa" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const Lawyer = mongoose.model("Lawyer", lawyerSchema);
export default Lawyer;