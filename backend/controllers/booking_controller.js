import Appointment from "../models/appointment.model.js";
import User from "../models/user.model.js";
import Lawyer from "../models/lawyer.model.js";
import Service from "../models/service.model.js";
import { DateTime } from "luxon";
import { getRDCongoHolidays } from "../holidays.js";
import { appointmentValidationSchema } from "../validation/appointment.validation.js";

/* -----------------------
   UTILS (shared helpers)
   ----------------------- */
const DEFAULT_TIMEZONE = "Africa/Kinshasa"; // change if you prefer

// This properly respects ISO offsets and converts to a supplied zone; returns NaN for invalid inputs.

const timeToMinutesLuxon = (time, zone = DEFAULT_TIMEZONE) => {
  let dateTime;

  if (time instanceof Date) {
    // stored JS Date is UTC — parse as UTC then convert to zone
    dateTime = DateTime.fromJSDate(time, { zone: "utc" }).setZone(zone);
  } else {
    // try ISO with offset preserved; setZone(true) lets DateTime keep the original offset
    dateTime = DateTime.fromISO(time, { setZone: true });
    if (!dateTime.isValid) {
      // HH:mm fallback (interpreted as local time in `zone`)
      const [hour, minute] = (time || "").split(":").map(Number);
      dateTime = DateTime.fromObject({ hour, minute }, { zone });
    } else {
      // convert the parsed instant to the requested zone
      dateTime = dateTime.setZone(zone);
    }
  }

  if (!dateTime.isValid) return NaN;
  return dateTime.hour * 60 + dateTime.minute;
};

const minutesToTimeLuxon = (minutes, zone = DEFAULT_TIMEZONE) => {
   // Create a DateTime at midnight in your timezone
  const dateTime = DateTime.fromObject({ hour: 0, minute: 0 }, { zone: DEFAULT_TIMEZONE })
    .plus({ minutes });
  return dateTime.toFormat("HH:mm");
};

const calculateEndTimeLuxon = (startTimeUTC, serviceDuration) => {
  const start = DateTime.fromISO(startTimeUTC, { zone: "utc" });
  const end = start.plus({ minutes: serviceDuration });
  return end.toUTC().toISO();  // ✅ return ISO string, not Date
};


/* -----------------------
   1) isWorkingDay
   - Uses luxon to determine weekday name reliably
   - Checks public holidays and lawyer exceptions/workDays
   - dateStr in "YYYY-MM-DD"
   ----------------------- */
const isWorkingDay = async (lawyer, dateStr) => {
  const timez = lawyer?.timeZone || DEFAULT_TIMEZONE;
  const dt = DateTime.fromISO(dateStr, { zone: timez });
  if (!dt.isValid) return false;

  const localDateStr = dt.toFormat("yyyy-MM-dd");
  const year = dt.year;

  // 🔑 Appeler l’API avec l’année de la date testée
  const holidays = await getRDCongoHolidays(year);

  if (holidays.includes(localDateStr)) return false;
  if (Array.isArray(lawyer.exceptions) && lawyer.exceptions.includes(localDateStr)) return false;

  if (Array.isArray(lawyer.workDays) && lawyer.workDays.length > 0) {
    const weekdayName = dt.toFormat("cccc"); // ex: "Monday"
    const normalized = lawyer.workDays.map(d => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase());
    if (!normalized.includes(weekdayName)) return false;
  }

  return true;
};

/* -----------------------
   2) findAvailableSlots
   - schedule: array of [ "HH:mm", "HH:mm" ] busy intervals
   - serviceDuration: integer minutes
   - workHours: { start: "08:00", end: "17:00" }
   - returns array of free intervals as [ "HH:mm", "HH:mm" ]
   ----------------------- */
 const findAvailableSlots = (busyIntervals, serviceDuration, workHours, zone = DEFAULT_TIMEZONE) => {
  const workStart = timeToMinutesLuxon(workHours.start, zone);
  const workEnd = timeToMinutesLuxon(workHours.end, zone);

  // Normalize busy intervals
  const normalized = (busyIntervals || [])
    .map(([s, e]) => {
      const sMin = timeToMinutesLuxon(s, zone);
      const eMin = timeToMinutesLuxon(e, zone);
      if (isNaN(sMin) || isNaN(eMin) || eMin <= sMin) return null;
      const startClamped = Math.max(sMin, workStart);
      const endClamped = Math.min(eMin, workEnd);
      return endClamped > startClamped ? [startClamped, endClamped] : null;
    })
    .filter(Boolean);


  // Merge overlaps
  normalized.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [s, e] of normalized) {
    if (!merged.length || merged[merged.length - 1][1] < s) {
      merged.push([s, e]);
    } else {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
    }
  }

  // find free gaps between workStart..workEnd (Free slots)
  const freeSlots = [];
  let prevEnd = workStart;
  for (const [s, e] of merged) {
    if (s - prevEnd >= serviceDuration) {
      freeSlots.push([minutesToTimeLuxon(prevEnd, zone), minutesToTimeLuxon(s, zone)]);
    }
    prevEnd = Math.max(prevEnd, e);
  }
  if (workEnd - prevEnd >= serviceDuration) {
    freeSlots.push([minutesToTimeLuxon(prevEnd, zone), minutesToTimeLuxon(workEnd, zone)]);
  }

  return freeSlots;
};

// Expand free intervals into usable start times only
const expandIntervalsToSlots = (intervals, serviceDuration, zone = DEFAULT_TIMEZONE, dateStr) => {
  const slots = [];

  // détecte automatiquement le fuseau de l'utilisateur
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  intervals.forEach(([start, end]) => {
    let current = DateTime.fromFormat(`${dateStr} ${start}`, "yyyy-MM-dd HH:mm", { zone });
    const endDateTime = DateTime.fromFormat(`${dateStr} ${end}`, "yyyy-MM-dd HH:mm", { zone });

    while (current.plus({ minutes: serviceDuration }) <= endDateTime) {
      const utcStart = current.toUTC().toISO();

      slots.push({
        // heure locale de l'utilisateur
        localTime: DateTime.fromISO(utcStart, { zone: "utc" }).setZone(userTimeZone).toFormat("HH:mm"),
        utcStart: utcStart // UTC stocké en DB / canonique
      });

      current = current.plus({ minutes: serviceDuration });
    }
  });

  return slots;
};


/* -----------------------
   3) getAvailableSlotsForLawyer
   - collects appointments + breaks for the specific date,
     then returns free intervals that can fit serviceDuration
   - dateStr "YYYY-MM-DD"
   ----------------------- */

const getAvailableSlotsForLawyer = async (lawyer, dateStr, serviceDuration) => {
  const zone = lawyer.timeZone || DEFAULT_TIMEZONE;

  // 1) is it a working day?
  const ok = await isWorkingDay(lawyer, dateStr);
  if (!ok) return [];

  const startOfDayUTC = DateTime.fromISO(dateStr, { zone }).startOf("day").toUTC();
  const endOfDayUTC   = DateTime.fromISO(dateStr, { zone }).endOf("day").toUTC();

  const appointments = await Appointment.find({
    lawyer: lawyer._id,
    startTimeUTC: { $gte: startOfDayUTC.toJSDate(), $lte: endOfDayUTC.toJSDate() },
    status: { $ne: "Canceled" }
  });

  // busy intervals in local time
  const busySlots = appointments.map(app => [
    DateTime.fromJSDate(app.startTimeUTC, { zone }).toFormat("HH:mm"),
    DateTime.fromJSDate(app.endTimeUTC, { zone }).toFormat("HH:mm")
  ]);

  // include lawyer breaks
  if (Array.isArray(lawyer.breaks)) {
    lawyer.breaks.forEach(b => {
      busySlots.push([
        DateTime.fromJSDate(b.start, { zone }).toFormat("HH:mm"),
        DateTime.fromJSDate(b.end, { zone }).toFormat("HH:mm")
      ]);
    });
  }

  const workHours = lawyer.workHours || { start: "08:00", end: "17:00" };
  const freeIntervals = findAvailableSlots(busySlots, serviceDuration, workHours, zone);

  let slots = expandIntervalsToSlots(freeIntervals, serviceDuration, zone, dateStr);

  // ✅ Filter slots already booked
  slots = slots.filter(slot => {
    const slotStart = DateTime.fromISO(slot.utcStart, { zone: "utc" }).toUTC().toMillis();
    const slotEnd   = DateTime.fromISO(slot.utcStart, { zone: "utc" }).plus({ minutes: serviceDuration }).toUTC().toMillis();

    return !appointments.some(app => {
      const appStart = DateTime.fromJSDate(app.startTimeUTC, { zone: "utc" }).toUTC().toMillis();
      const appEnd   = DateTime.fromJSDate(app.endTimeUTC, { zone: "utc" }).toUTC().toMillis();
      return slotStart < appEnd && slotEnd > appStart; // overlap
    });
  });

  return slots;
};

/* -----------------------
   4) findAvailableLawyers
   - find other lawyers offering the service and return their available slots
   ----------------------- */
const findAvailableLawyers = async (serviceId, dateStr, duration) => {
  const lawyers = await Lawyer.find({ services: serviceId });
  const availableLawyers = [];

  for (const lawyer of lawyers) {
    const slots = await getAvailableSlotsForLawyer(lawyer, dateStr, duration);
    if (slots.length > 0) {
      availableLawyers.push({
        lawyerId: lawyer._id,
        name: lawyer.name,
        availableSlots: slots
      });
    }
  }

  return availableLawyers;
};


/* -----------------------
   Helper: overlapsWithExisting(appointments, start, end)
   - overlap test (use epoch millis in UTC)
   ----------------------- */
const overlapsWithExisting = (appointments, startTimeUTC, endTimeUTC) => {
  // parse requested times into UTC millis (preserve offsets)
  const reqStart = DateTime.fromISO(startTimeUTC, { setZone: true }).toUTC().toMillis();
  const reqEnd   = DateTime.fromISO(endTimeUTC,   { setZone: true }).toUTC().toMillis();

  for (const appointment of appointments) {
    // appointment.startTimeUTC / endTimeUTC are JS Dates from Mongo
    const existingStart = DateTime.fromJSDate(appointment.startTimeUTC, { zone: "utc" }).toUTC().toMillis();
    const existingEnd   = DateTime.fromJSDate(appointment.endTimeUTC,   { zone: "utc" }).toUTC().toMillis();

    // standard interval overlap check (adjacent allowed)
    if (reqStart < existingEnd && reqEnd > existingStart) {
      return appointment;
    }
  }
  return null;
};


// validated - This business logic is used to fetch available slots each lawyer for a specific date
export const getAvailableSlotsForDate = async (req, res, next) => {
  try {
    // Expect: ?service=...&lawyer=...&startTimeUTC=2025-09-08
    let { service, lawyer, startTimeUTC } = req.query;

    if (!service || !lawyer || !startTimeUTC) {
      return next({ status: 400, message: "service, lawyer, and date are required" });
    }

    // Ensure we only keep the date portion (strip time + whitespace/newlines)
    const dateStr = startTimeUTC.trim().split("T")[0]; // "2025-09-08"
    
    const owner = await User.findById(req.user.id);
    if (!owner) return next({ status: 404, message: "User not found" });

    const serviceData = await Service.findById(service);
    if (!serviceData) return next({ status: 404, message: "Service not found" });

    const lawyerData = await Lawyer.findById(lawyer);
    if (!lawyerData) return next({ status: 404, message: "Lawyer not found" });

    const serviceDuration = Number(serviceData.duration);
    if (isNaN(serviceDuration) || serviceDuration <= 0) {
      return next({ status: 400, message: "Invalid service duration" });
    }

    // ✅ Pass only the clean date to slot generator
    const availableSlots = await getAvailableSlotsForLawyer(lawyerData, dateStr, serviceDuration);

    return res.status(200).json({
      success: true,
      message: availableSlots.length > 0
        ? "Available slots retrieved successfully"
        : "No available slots for the selected date",
      availableSlots
    });

  } catch (error) {
    next({ status: 500, message: error.message });
  }
};



/* -----------------------
   GET ALL AVAILABLE APPOINTMENT SLOTS
   ----------------------- */
export const getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({});
    const appointmentNumber = await Appointment.countDocuments();

    if (appointmentNumber === 0) {
      // Still using your middleware pattern
      return next({ status: 404, message: "No appointments found" });
    }

    return res.status(200).json({
      success: true,
      message: "Appointments retrieved successfully",
      count: appointmentNumber,
      appointments,
    });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
}

/* -----------------------
   Booking controller
   ----------------------- */
export const bookAppointment = async (req, res, next) => {
  try {
    const { error } = appointmentValidationSchema.validate(req.body, { abortEarly: false });
    if (error) return next({ status: 400, message: error.details[0].message });

    const { lawyer: lawyerId, service: serviceId, mode, startTimeUTC, notes } = req.body;

    const owner = await User.findById(req.user.id);
    const lawyer = await Lawyer.findById(lawyerId);
    const service = await Service.findById(serviceId);
    if (!owner || !lawyer || !service) return next({ status: 404, message: "User, lawyer or service not found" });

    const serviceDuration = Number(service.duration);
    const endTimeUTC = calculateEndTimeLuxon(startTimeUTC, serviceDuration);

    // Normalize date using the lawyer's timezone (so "same day" aligns with the lawyer schedule)
    const zone = lawyer.timeZone || DEFAULT_TIMEZONE;
  const date = DateTime.fromISO(startTimeUTC, { setZone: true }).setZone(zone).toFormat("yyyy-MM-dd");

  const availableSlots = await getAvailableSlotsForLawyer(lawyer, date, serviceDuration);

  // match slot as above (millis compare)
  const requestedMillis = DateTime.fromISO(startTimeUTC, { setZone: true }).toUTC().toMillis();
  const slotAvailable = availableSlots.some(slot =>
    DateTime.fromISO(slot.utcStart, { setZone: true }).toUTC().toMillis() === requestedMillis
  );
  if (!slotAvailable) {
    return res.status(400).json({
      success: false,
      message: "Requested slot not available",
      requestedSlot: { startTimeUTC, endTimeUTC, duration: serviceDuration },
      alternatives: availableSlots.map(s => s.utcStart),
      otherLawyers: await findAvailableLawyers(service._id, date, serviceDuration)
    });
  }

  // compute day boundaries in the same zone for DB queries
  const startOfDay = DateTime.fromISO(date, { zone }).startOf("day").toUTC();
  const endOfDay   = DateTime.fromISO(date, { zone }).endOf("day").toUTC();

  const [lawyerAppointments, userAppointments] = await Promise.all([
    Appointment.find({
      lawyer: lawyer._id,
      startTimeUTC: { $gte: startOfDay.toJSDate(), $lte: endOfDay.toJSDate() },
      status: { $ne: "Canceled" }
    }),
    Appointment.find({
      user: owner._id,
      startTimeUTC: { $gte: startOfDay.toJSDate(), $lte: endOfDay.toJSDate() },
      status: { $ne: "Canceled" }
    })
  ]);

  // Enforce: user can only book ONCE per day
  if (userAppointments.length > 0) {
    return res.status(400).json({
      success: false,
      message: "You already have a booking for this day (one booking per day allowed)."
    });
  }

  // Check lawyer overlap (still required to avoid simultaneous bookings for same lawyer)
  if (overlapsWithExisting(lawyerAppointments, startTimeUTC, endTimeUTC)) {
    return res.status(400).json({
      success: false,
      message: "This time slot has just been taken by another client."
    });
  }

  // create appointment: include localDate so we can add DB unique index
   const newAppointment = await Appointment.create({
      user: owner._id,
      lawyer: lawyer._id,
      service: service._id,
      startTimeUTC,
      endTimeUTC,
      localDate: date,      // yyyy-MM-dd in lawyer's zone
      mode: mode ?? "Cabinet",
      status: "Pending",
      notes: notes ?? ""
    });

    return res.status(201).json({ success: true, message: "Appointment booked successfully", newAppointment });

  } catch (err) {
    // handle duplicate-key at DB level (11000) - in case a concurrent request created the same user/day slot
    if (err && err.code === 11000) {
      return res.status(409).json({ success: false, message: "Conflict: you already have a booking for this day." });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};



/* -----------------------
   CANCEL APPOINTMENT
   ----------------------- */
export const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Step 1: Find appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) return next({ status: 404, message: "Appointment not found" });

    // Step 2: Authorization check
    // Allow cancel if current user is owner OR lawyer
    const userId = req.user.id;
    if (!appointment.user.equals(userId) && !appointment.lawyer.equals(userId)) {
      return next({ status: 403, message: "You are not authorized to cancel this appointment" });
    }

    // Step 3: Check current status
    if (["Canceled", "Completed"].includes(appointment.status)) {
      return next({ status: 400, message: `Cannot cancel appointment with status ${appointment.status}` });
    }

    // Step 4: Update status to canceled
    appointment.status = "Canceled";
    appointment.canceledAt = new Date(); // optional
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Appointment canceled successfully",
      appointment
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
