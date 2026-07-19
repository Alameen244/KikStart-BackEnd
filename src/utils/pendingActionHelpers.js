import crypto from "crypto";
import AuthModel from "../models/authModel.js";
import { PendingActionModel, PENDING_ACTION_TYPE } from "../models/pendingActionModel.js";
import { sendEmail } from "./mailer.js";
import { coachApprovalTemplate } from "../Templates/coachApprovalTemplate.js";

const PENDING_HOURS = 24;

const actionLabel = (actionType, payload) => {
  switch (actionType) {
    case PENDING_ACTION_TYPE.EMAIL_CHANGE:
      return `Change your account email to ${payload.newEmail}`;
    case PENDING_ACTION_TYPE.UNASSIGN_PROGRAM:
      return "Remove one of your assigned programs";
    case PENDING_ACTION_TYPE.DELETE_COACH:
      return "Permanently delete your coach account";
    default:
      return "Update your account";
  }
};

// req is passed in so we can build an absolute link without a hardcoded env var.
// If you'd rather pin it explicitly, set API_BASE_URL in .env and it'll be preferred.
const resolveBaseUrl = (req) =>
  process.env.API_BASE_URL || `${req.protocol}://${req.get("host")}`;

export const createPendingAction = async ({ coach, actionType, payload = {}, requestedBy, req }) => {
  const existing = await PendingActionModel.findOne({
    coach: coach._id,
    actionType,
    status: "pending",
  });
  if (existing) {
    return { error: "A similar request is already pending approval for this coach" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + PENDING_HOURS * 60 * 60 * 1000);

  const pendingAction = await PendingActionModel.create({
    coach: coach._id,
    actionType,
    payload,
    requestedBy,
    token,
    expiresAt,
  });

  const baseUrl = resolveBaseUrl(req);
  const approveUrl = `${baseUrl}/api/v1/coach-actions/${token}/approve`;
  const rejectUrl = `${baseUrl}/api/v1/coach-actions/${token}/reject`;

  try {
    await sendEmail({
      to: coach.email,
      subject: "Approval needed for your coach account",
      text: `${actionLabel(actionType, payload)}. Approve: ${approveUrl}  Reject: ${rejectUrl}`,
      html: coachApprovalTemplate({
        name: coach.name,
        actionLabel: actionLabel(actionType, payload),
        approveUrl,
        rejectUrl,
        expiresAt: expiresAt.toLocaleString(),
      }),
    });
  } catch (mailError) {
    console.error("createPendingAction email error:", mailError);
  }

  return { pendingAction };
};

// Shared executor used by both the coach's email-link click AND the admin's force-apply.
export const applyPendingAction = async (pendingAction, resultStatus) => {
  const coach = await AuthModel.findById(pendingAction.coach);
  if (!coach) {
    pendingAction.status = "rejected";
    pendingAction.respondedAt = new Date();
    await pendingAction.save();
    return { error: "Coach no longer exists" };
  }

  switch (pendingAction.actionType) {
    case PENDING_ACTION_TYPE.EMAIL_CHANGE: {
      const emailTaken = await AuthModel.findOne({
        email: pendingAction.payload.newEmail,
        _id: { $ne: coach._id },
      });
      if (emailTaken) {
        pendingAction.status = "rejected";
        pendingAction.respondedAt = new Date();
        await pendingAction.save();
        return { error: "That email is no longer available" };
      }
      coach.email = pendingAction.payload.newEmail;
      await coach.save();
      break;
    }
    case PENDING_ACTION_TYPE.UNASSIGN_PROGRAM: {
      coach.coachProfile.assingedPrograms = coach.coachProfile.assingedPrograms.filter(
        (entry) => String(entry.program) !== String(pendingAction.payload.programId),
      );
      await coach.save();
      break;
    }
    case PENDING_ACTION_TYPE.DELETE_COACH: {
      await AuthModel.findByIdAndDelete(coach._id);
      break;
    }
    default:
      return { error: "Unknown action type" };
  }

  pendingAction.status = resultStatus;
  pendingAction.respondedAt = new Date();
  await pendingAction.save();

  return { data: { actionType: pendingAction.actionType, coachId: coach._id } };
};
