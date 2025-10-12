import mongoose, { Schema } from "mongoose";

const appointmentSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lawyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lawyer",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    mode: {
      type: String,
      enum: ["Cabinet", "Téléphone"],
      default: "Cabinet",
    },
    startTimeUTC: {
      type: Date,
      required: true
    },
    endTimeUTC: {
      type: Date,
      required: true
    },
    localDate: { 
      type: String, 
      required: true 
    }, // "yyyy-MM-dd" in lawyer's timezone
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Canceled", "Completed"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

// Prevent duplication for the same user
appointmentSchema.index(
  { user: 1, localDate: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["Pending", "Confirmed"] } } }
);


const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;


/*
localDate is required so every appointment has a day string — you fill it at creation time (as shown above).

The unique partial index ensures one active (Pending/Confirmed) appointment per user per localDate, enforced by MongoDB (atomic and resilient to concurrency).
*/