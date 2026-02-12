import mongoose from 'mongoose'
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected successfully`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
