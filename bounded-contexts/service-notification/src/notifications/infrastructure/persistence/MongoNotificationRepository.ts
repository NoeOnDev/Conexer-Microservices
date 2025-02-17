import { NotificationRepository } from "../../domain/NotificationRepository";
import { Notification } from "../../domain/Notification";
import { NotificationChannel } from "../../domain/value-objects/NotificationChannel";
import { NotificationStatus } from "../../domain/value-objects/NotificationStatus";
import { Identifier } from "../../../_shared/domain/value-objects/Identifier";
import mongoose, { Document, Schema } from "mongoose";

interface NotificationDocument extends Document {
  id: string;
  recipientId: string;
  recipientType: string;
  channel: string;
  message: string;
  status: string;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>({
  id: { type: String, required: true, unique: true },
  recipientId: { type: String, required: true },
  recipientType: { type: String, required: true },
  channel: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, required: true },
});

const NotificationModel = mongoose.model<NotificationDocument>(
  "Notification",
  notificationSchema
);

export class MongoNotificationRepository implements NotificationRepository {
  async save(notification: Notification): Promise<void> {
    await NotificationModel.findOneAndUpdate(
      { id: notification.getId().getValue() },
      {
        recipientId: notification.getRecipientId().getValue(),
        recipientType: notification.getRecipientType(),
        channel: notification.getChannel().getValue(),
        message: notification.getMessage(),
        status: notification.getStatus().getValue(),
        createdAt: notification.getCreatedAt(),
      },
      { upsert: true, new: true }
    ).exec();
  }

  async findByRecipientId(recipientId: Identifier): Promise<Notification[]> {
    const notificationDocuments = await NotificationModel.find({
      recipientId: recipientId.getValue(),
    }).exec();
    return notificationDocuments.map(this.mapDocumentToNotification);
  }

  async findById(id: Identifier): Promise<Notification | null> {
    const notificationDocument = await NotificationModel.findOne({
      id: id.getValue(),
    }).exec();
    return notificationDocument
      ? this.mapDocumentToNotification(notificationDocument)
      : null;
  }

  private mapDocumentToNotification(
    notificationDocument: NotificationDocument
  ): Notification {
    return new Notification(
      Identifier.fromString(notificationDocument.recipientId),
      notificationDocument.recipientType as "User" | "Contact",
      NotificationChannel.from(notificationDocument.channel),
      notificationDocument.message,
      NotificationStatus.from(notificationDocument.status),
      Identifier.fromString(notificationDocument.id),
      notificationDocument.createdAt
    );
  }
}
