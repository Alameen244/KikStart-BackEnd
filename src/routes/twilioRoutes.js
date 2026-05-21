import express from "express"
const conversationRouter = express.Router();
import { createConversation, addParticipant, sendMessage, getMessages, getConversationByParticipants, deleteConversation, generateToken } from "../controllers/twilioController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";


conversationRouter.post("/create",authMiddleware,createConversation);
conversationRouter.post("/participant",authMiddleware,addParticipant);
conversationRouter.post("/message",authMiddleware, sendMessage);
conversationRouter.get("/find", authMiddleware, getConversationByParticipants);
conversationRouter.get("/messages/:conversationSid", authMiddleware,getMessages);
conversationRouter.delete("/:conversationSid",authMiddleware, deleteConversation);
conversationRouter.post("/token", authMiddleware, generateToken);
export default conversationRouter;
