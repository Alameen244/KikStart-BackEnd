
import dotenv from 'dotenv'
dotenv.config()

const port = process.env.PORT || 3000

import {connectDB} from './config/db.js'
connectDB()

import app from './app.js'

app.listen(port, () => {
  console.log(`server running on port http://localhost:${port}`)
})
