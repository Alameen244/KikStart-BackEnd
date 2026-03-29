// import cron from "node-cron";
// import { v2 as cloudinary } from "cloudinary";
// import ImageTrash from "../models/imageTrashModel.js";

// cron.schedule("0 3 * * *", async () => {
//   try {

//     console.log("Running Cloudinary cleanup job...");

//     const expiredImages = await ImageTrash.find({
//       deleteAfter: { $lte: new Date() }
//     });

//     for (const img of expiredImages) {

//       await cloudinary.uploader.destroy(img.public_id);

//       await ImageTrash.deleteOne({ _id: img._id });

//       console.log("Deleted from Cloudinary:", img.public_id);
//     }

//   } catch (err) {
//     console.error("Cleanup job error:", err);
//   }
// });
