import mongoose, { Schema } from "mongoose";

const feedbackSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating: {
        type: String,
        enum: ["Terrible", "Mauvais", "Correct", "Bon", "Excellent"],
        required: true
    },
    message: {
        type: String,
        required: true
    },
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback