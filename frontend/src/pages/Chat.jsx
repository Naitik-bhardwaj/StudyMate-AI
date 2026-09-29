import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import api, { getApiErrorMessage } from "../api/axios.js";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const url = conversationId ? `/chat/${conversationId}` : "/chat";
      const { data } = await api.post(url, { message: userMessage.content });
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page chat-page">
      <h1>AI Study Chat</h1>
      <p className="page-subtitle">Ask anything — concepts, homework help, exam prep.</p>

      <div className="chat-window">
        {messages.length === 0 && (
          <div className="empty-state">Start the conversation by asking a question below.</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            <ReactMarkdown>{m.content}</ReactMarkdown>
          </div>
        ))}
        {loading && <div className="chat-bubble assistant typing">Thinking...</div>}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Ask me anything about your studies..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
