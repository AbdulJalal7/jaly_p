import { Client, Databases } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  // The event body is the newly created message document
  const messageData = req.body;

  if (!messageData || !messageData.receiver_id || !messageData.message) {
    return res.json({ success: false, reason: "Invalid event payload" });
  }

  const receiverId = messageData.receiver_id;
  const senderName = messageData.sender_name || "Someone"; // optional, see note below
  const messageText = messageData.message;
  const chatId = messageData.chat_id;

  // Initialize Appwrite server-side client with API key
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    // Fetch the receiver's user document to get their push token
    const receiver = await databases.getDocument(
      process.env.DATABASE_ID,
      "users",
      receiverId
    );

    const pushToken = receiver.push_token;

    if (!pushToken || !pushToken.startsWith("ExponentPushToken")) {
      log("No valid push token for receiver: " + receiverId);
      return res.json({ success: false, reason: "No push token" });
    }

    // Send the notification via Expo's Push API
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        sound: "default",
        title: "New Message 💬",
        body: messageText.length > 100
          ? messageText.substring(0, 97) + "..."
          : messageText,
        data: {
          chatId: chatId,
          screen: "chat",
        },
        priority: "high",
        channelId: "default",
      }),
    });

    const result = await response.json();
    log("Expo push result: " + JSON.stringify(result));

    return res.json({ success: true, result });
  } catch (err) {
    error("Failed to send notification: " + err.message);
    return res.json({ success: false, error: err.message });
  }
};
