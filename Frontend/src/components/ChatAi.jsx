
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import axiosClient from "../utils/axiosClient";
import { Send } from "lucide-react";

function ChatAi({ problem }) {
  const [messages, setMessages] = useState([
    {
      role: "model",
      parts: [{ text: "Hi, how are you?" }],
      time: "12:45",
    },
    {
      role: "user",
      parts: [{ text: "I am good." }],
      time: "12:46",
    },
  ]);

  const [sending, setSending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  const getTime = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    
const onSubmit = async (data) => {
  const userMessage = data.message.trim();

  if (!userMessage || sending) return;

  const updatedMessages = [
    ...messages,
    {
      role: "user",
      parts: [{ text: userMessage }],
      time: getTime(),
    },
  ];

  setMessages(updatedMessages);
  reset();
  setSending(true);

  try {
    const response = await axiosClient.post("/ai/chat", {
      messages: updatedMessages.map(({ role, parts }) => ({
        role,
        parts,
      })),
      title: problem?.title,
      description: problem?.description,
      testCases: problem?.visibleTestCases,
      startCode: problem?.startCode,
    });

    const aiMessage =
      response.data.message ||
      response.data.content ||
      response.data.text ||
      "I couldn't generate a response.";

    setMessages((prev) => [
      ...prev,
      {
        role: "model",
        parts: [{ text: aiMessage }],
        time: getTime(),
      },
    ]);
  } catch (error) {
    console.error(
      "API Error:",
      error.response?.data || error.message
    );

    setMessages((prev) => [
      ...prev,
      {
        role: "model",
        parts: [{ text: "Error from AI Chatbot. Please try again." }],
        time: getTime(),
      },
    ]);
  } finally {
    setSending(false);
  }
};


  return (
    <div className="flex flex-col h-screen max-h-[80vh] min-h-[500px] bg-base-100">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat ${
              msg.role === "user" ? "chat-end" : "chat-start"
            }`}
          >
            {/* Avatar */}
            <div className="chat-image avatar">
              <div className="w-10 rounded-full">
                <img
                  alt={
                    msg.role === "user"
                      ? "User avatar"
                      : "AI assistant avatar"
                  }
                  src={
                    msg.role === "user"
                      ? "https://img.daisyui.com/images/profile/demo/anakeen@192.webp"
                      : "https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                  }
                />
              </div>
            </div>

            {/* Message header */}
            <div className="chat-header">
              {msg.role === "user" ? "You" : "AI Assistant"}
              <time className="text-xs opacity-50 ml-2">
                {msg.time}
              </time>
            </div>

            {/* Message bubble: use parts instead of content */}
            <div
              className={`chat-bubble ${
                msg.role === "user"
                  ? "chat-bubble-primary"
                  : "bg-base-200 text-base-content"
              }`}
            >
              {msg.parts?.map((part, partIndex) => (
                <span key={partIndex} className="whitespace-pre-wrap">
                  {part.text}
                </span>
              ))}
            </div>

            {/* Message footer */}
            <div className="chat-footer opacity-50 text-xs">
              {msg.role === "user"
                ? "Sent"
                : index === messages.length - 1 && sending
                ? "Thinking..."
                : "AI Assistant"}
            </div>
          </div>
        ))}

        {sending && (
          <div className="chat chat-start">
            <div className="chat-bubble bg-base-200 text-base-content">
              <span className="loading loading-dots loading-sm"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="sticky bottom-0 p-4 bg-base-100 border-t border-base-300"
      >
        <div className="flex items-center gap-2">
          <input
            placeholder="Ask me anything about this problem..."
            className="input input-bordered flex-1"
            disabled={sending}
            {...register("message", {
              required: true,
              minLength: 2,
            })}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending || !!errors.message}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatAi;
