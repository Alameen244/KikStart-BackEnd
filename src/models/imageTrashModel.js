import mongoose from "mongoose";

const imageTrashSchema = new mongoose.Schema({
    public_id: {
        type: String,
        required: true,
        index: true
    },
    deleteAfter: {
        type: Date,
        required: true,
        index: true
    }
}, { timestamps: true });
const imageTrashModel = mongoose.model("imageTrash" ,  imageTrashSchema)
export default imageTrashModel;
