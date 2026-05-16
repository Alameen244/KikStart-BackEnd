import { client, SERVICE_SID } from "../config/twilio.js";
import twilio from "twilio";
export const createConversation = async (req, res) => {
  try {
    const { friendlyName } = req.body;
    if (!friendlyName) {
      return res.status(400).json({
        success: false,
        message: "friendlyName is required",
      });
    }
    const conversation = await client.conversations.v1
      .services(SERVICE_SID)
      .conversations.create({ friendlyName });
    res.status(201).json({
      success: true,
      conversationSid: conversation.sid,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const addParticipant = async (req, res) => {
  try {
    const { conversationSid, identity } = req.body;

    // Validation
    if (!conversationSid || !identity) {
      return res.status(400).json({
        success: false,
        message: "conversationSid and identity are required",
      });
    }

    // Get all participants
    const participants = await client.conversations.v1
      .services(SERVICE_SID)
      .conversations(conversationSid)
      .participants
      .list();

    // Check duplicate
    const alreadyExists = participants.find(
      (participant) => participant.identity === identity
    );

    // If already exists
    if (alreadyExists) {
      return res.status(200).json({
        success: true,
        message: "Participant already exists",
        participantSid: alreadyExists.sid,
      });
    }

    // Create participant
    const participant = await client.conversations.v1
      .services(SERVICE_SID)
      .conversations(conversationSid)
      .participants.create({
        identity,
      });

    return res.status(201).json({
      success: true,
      message: "Participant added successfully",
      participantSid: participant.sid,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
export const sendMessage = async (req, res) => {
  try {
    const { conversationSid, author, message } = req.body;
    if (!conversationSid || !author || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const msg = await client.conversations.v1
      .services(SERVICE_SID)
      .conversations(conversationSid)
      .messages.create({
        author,
        body: message,
      });
    res.status(201).json({
      success: true,
      messageSid: msg.sid,
      body: msg.body,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
export const getMessages = async (req, res) => {
  try {
    const { conversationSid } = req.params;
    const messages = await client.conversations.v1
      .services(SERVICE_SID)
      .conversations(conversationSid)
      .messages.list({ limit: 50 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
export const deleteConversation = async (req, res) => {
  try {
    const { conversationSid } = req.params;
    await client.conversations.v1
      .services(SERVICE_SID)
      .conversations(conversationSid)
      .remove();
    res.status(200).json({
      success: true,
      message: "Conversation deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
export const generateToken = async (req, res) => {
  try {
    const { identity } = req.body;
    const AccessToken = twilio.jwt.AccessToken;
    const ConversationsGrant = AccessToken.ConversationsGrant;
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET,
      {
        identity,
      }
    );
    const conversationsGrant = new ConversationsGrant({
      serviceSid: SERVICE_SID,
    });
    token.addGrant(conversationsGrant);
    res.status(200).json({
      token: token.toJwt(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
