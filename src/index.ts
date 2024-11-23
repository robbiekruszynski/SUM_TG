import { Telegraf, Context } from "telegraf";
import { HfInference } from "@huggingface/inference";
import { Message } from "telegraf/typings/core/types/typegram";

const BOT_TOKEN = "BIG BOOTY";
const HF_API_KEY = "BIG YOSHI";

const bot = new Telegraf(BOT_TOKEN);
const hf = new HfInference(HF_API_KEY);

const groupMessages: Record<number, { user: string; text: string }[]> = {};

function isTextMessage(message: Message): message is Message.TextMessage {
  return "text" in message;
}

bot.start((ctx: Context) => {
  ctx.reply(
    "Hello, My Queen Use /listen to start monitoring and /summary to get a high-level summary of the topics discussed."
  )
    .then(() => console.log("Bot started successfully."))
    .catch((err) => console.error("Error in /start:", err));
});

bot.command("listen", (ctx: Context) => {
  const chatId = ctx.chat?.id;
  if (chatId) {
    if (!groupMessages[chatId]) {
      groupMessages[chatId] = [];
      console.log(`Started listening in group: ${chatId}`);
    }
    ctx.reply("I'm now listening to conversations in this group.")
      .then(() => console.log("Listening activated for group:", chatId))
      .catch((err) => console.error("Error with listening:", err));
  } else {
    console.log("Failed to determine chat ID.");
    ctx.reply("Could not determine the group ID.")
      .catch((err) => console.error("Error sending group ID error:", err));
  }
});

bot.on("message", (ctx: Context) => {
  const chatId = ctx.chat?.id;
  if (chatId && groupMessages[chatId]) {
    const message = ctx.message;
    if (isTextMessage(message)) {
      const user = message.from.first_name || message.from.username || "Unknown User";
      const text = message.text;
      if (text.includes("gorlongo")) {
        console.log(`The word "gorlongo" was used by ${user}.`);
      }
      groupMessages[chatId].push({ user, text });
      console.log(`Logged Message: ${user}: ${text}`);
    } else {
      console.log("Non-text message received, ignoring.");
    }
  }
});

bot.command("summary", async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    console.log("Chat ID not found.");
    ctx.reply("I couldn't determine the chat ID, IDIOT.")
      .catch((err) => console.error("Error sending chat ID error:", err));
    return;
  }

  if (!groupMessages[chatId] || groupMessages[chatId].length === 0) {
    console.log("No messages logged for summary.");
    ctx.reply("No messages to summarize. Use /listen to start monitoring.")
      .catch((err) => console.error("Error sending no messages reply:", err));
    return;
  }

  // Prepare the conversation for summarization
  const conversation = groupMessages[chatId]
    .map((msg) => `${msg.user}: ${msg.text}`)
    .join("\n");

  if (!conversation || conversation.trim().length === 0) {
    console.log("Conversation is empty.");
    ctx.reply("The conversation is empty or invalid for summarization.")
      .catch((err) => console.error("Error sending empty conversation reply:", err));
    return;
  }

  console.log("\n--- Conversation Sent to API ---");
  console.log(conversation);
  console.log("--- End of Conversation ---\n");

  console.log("Triggering Hugging Face summarization...");

  try {
    const result = await hf.summarization({
      model: "facebook/bart-large-cnn",
      inputs: conversation,
      parameters: {
        max_length: 250,
        min_length: 10,
      },
    });

    console.log("Hugging Face API Response:");
    console.log(result);

    if (result && result.summary_text) {
      const summary = result.summary_text;

      console.log("\n--- Generated Summary ---");
      console.log(summary);
      console.log("--- End of Summary ---\n");

    
      ctx.reply(`Summary: ${summary}`)
        .then(() => console.log("Summary sent to group."))
        .catch((err) => console.error("Error sending summary notification:", err));
    } else {
      console.error("Invalid response from Hugging Face API. Full response:", result);
      ctx.reply("Failed to generate summary. Check the terminal logs.")
        .catch((err) => console.error("Error sending failure notification:", err));
    }
  } catch (err) {
    console.error("Error during Hugging Face API call:", err);
    ctx.reply("Failed to generate summary. Check the terminal logs.")
      .catch((err) => console.error("Error sending failure notification:", err));
  }
});

bot.launch().then(() => {
  console.log("Bot is running...");
});


process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

async function testHuggingFaceAPI() {
  const testConversation = "User1: Hello. User2: Hi! How are you? User1: I'm good, thanks!";
  try {
    const result = await hf.summarization({
      model: "facebook/bart-large-cnn",
      inputs: testConversation,
      parameters: { max_length: 250, min_length: 10 },
    });
    console.log("Direct Test Hugging Face API Result:", result);
  } catch (err) {
    console.error("Error with Hugging Face API (Direct Test):", err);
  }
}

testHuggingFaceAPI();





