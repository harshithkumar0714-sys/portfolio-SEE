import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Bot,
  CalendarClock,
  Lightbulb,
  LoaderCircle,
  Send,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";

import { api, errorMessage } from "../services/api";
import { Card, PageTitle } from "../components/ui";

type Message = {
  role: "assistant" | "user";
  text: string;
};

type Recommendation = {
  type: string;
  title: string;
  detail: string;
  action: string;
  topicId?: number;
};

const prompts = [
  "What should I focus on?",
  "Help me plan for exams",
  "How can I revise better?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I’m here to help you make a study plan that feels manageable. Ask me what to focus on, talk through an upcoming exam, or get ideas for revising a tricky topic.",
    },
  ]);

  const [recommendations, setRecommendations] = useState<
    Recommendation[]
  >([]);

  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  /*
   * Load assistant status and personalized recommendations.
   *
   * Important:
   * Do not make the useEffect callback itself async.
   * React expects the callback to return either nothing
   * or a cleanup function.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadAssistantData() {
      try {
        const [recommendationResponse, statusResponse] =
          await Promise.all([
            api.get<{ recommendations: Recommendation[] }>(
              "/recommendations"
            ),
            api.get<{ provider: "local" | "configured-ai" }>(
              "/assistant/status"
            ),
          ]);

        if (cancelled) {
          return;
        }

        setRecommendations(
          recommendationResponse.data.recommendations
        );

        setAiConfigured(
          statusResponse.data.provider === "configured-ai"
        );
      } catch (cause) {
        if (cancelled) {
          return;
        }

        setError(errorMessage(cause));
      }
    }

    void loadAssistantData();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Keep the newest chat message visible.
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, busy]);

  /*
   * Send a message to the assistant.
   */
  async function send(text = input) {
    const message = text.trim();

    if (!message || busy) {
      return;
    }

    setInput("");

    setMessages((items) => [
      ...items,
      {
        role: "user",
        text: message,
      },
    ]);

    setBusy(true);
    setError("");

    try {
      const { data } = await api.post<{
        reply: string;
        provider: "local" | "configured-ai";
      }>("/assistant", {
        message,
      });

      setAiConfigured(data.provider === "configured-ai");

      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: data.reply,
        },
      ]);
    } catch (cause) {
      setError(errorMessage(cause));

      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: "I couldn’t reach your study data right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  /*
   * Handle chat form submission.
   */
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send();
  }

  return (
    <div>
      <PageTitle
        eyebrow="A THOUGHTFUL STUDY COMPANION"
        title="Study assistant"
        description="A second brain for your study plan, whenever you need one."
      />

      {error && <div className="notice-error">{error}</div>}

      <div className="assistant-layout">
        {/* Chat section */}
        <Card className="chat-card">
          <div className="chat-heading">
            <span className="assistant-avatar">
              <Sparkles size={17} />
            </span>

            <div>
              <strong>Your study companion</strong>

              <small>
                <i className="online-dot" />
                Here to help you find your next step
              </small>
            </div>

            <span className="private-chip">
              {aiConfigured === null
                ? "CHECKING MODE"
                : aiConfigured
                  ? "CONFIGURED AI"
                  : "LOCAL ASSISTANT"}
            </span>
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                className={`chat-message message-${message.role}`}
                key={`${index}-${message.role}`}
              >
                <span className="message-avatar">
                  {message.role === "assistant" ? (
                    <Bot size={16} />
                  ) : (
                    <UserRound size={15} />
                  )}
                </span>

                <div className="message-content">
                  <span>
                    {message.role === "assistant"
                      ? "YOUR STUDY COMPANION"
                      : "YOU"}
                  </span>

                  <p>{message.text}</p>
                </div>
              </div>
            ))}

            {busy && (
              <div className="chat-message message-assistant">
                <span className="message-avatar">
                  <Bot size={16} />
                </span>

                <div className="message-content">
                  <span>YOUR STUDY COMPANION</span>

                  <p className="typing">
                    <i />
                    <i />
                    <i />
                  </p>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested prompts */}
          <div className="prompt-suggestions">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void send(prompt)}
                disabled={busy}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat input */}
          <form className="chat-input" onSubmit={submit}>
            <input
              aria-label="Message your study companion"
              placeholder="Ask about your plan, a tricky topic, or exam prep..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={1000}
            />

            <button
              aria-label="Send message"
              type="submit"
              disabled={!input.trim() || busy}
            >
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>

          {/* Privacy / AI mode information */}
          <p className="chat-disclaimer">
            {aiConfigured
              ? "Your question and limited study context are shared with the configured AI provider; your name and email are not."
              : aiConfigured === false
                ? "Local assistant: your question and study context stay on this server."
                : "Personalized study suggestions use your SmartStudy workspace."}
          </p>
        </Card>

        {/* Right sidebar */}
        <aside className="assistant-side">
          {/* Recommendations */}
          <Card className="recommendation-card">
            <div className="card-heading">
              <div>
                <h2>For your next session</h2>
                <p>A few ideas, picked for you</p>
              </div>

              <span className="recommendation-spark">
                <Sparkles size={16} />
              </span>
            </div>

            {recommendations.length > 0 ? (
              <div className="recommendation-list">
                {recommendations.slice(0, 5).map((item, index) => (
                  <button
                    className="recommendation-item"
                    type="button"
                    key={`${item.type}-${index}`}
                    onClick={() =>
                      item.topicId
                        ? void send(
                            `Help me review ${item.title}`
                          )
                        : void send(item.title)
                    }
                  >
                    <span
                      className={`recommendation-icon recommendation-${item.type}`}
                    >
                      {item.type === "exam" ? (
                        <CalendarClock size={15} />
                      ) : item.type === "weak" ? (
                        <Target size={15} />
                      ) : (
                        <Lightbulb size={15} />
                      )}
                    </span>

                    <span className="recommendation-copy">
                      <strong>{item.title}</strong>

                      <small>{item.detail}</small>

                      <em>
                        {item.action}
                        <ArrowRight size={12} />
                      </em>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="field-hint">
                Your recommendations will show up here.
              </p>
            )}
          </Card>

          {/* Study tip */}
          <Card className="assistant-tip">
            <div className="assistant-tip-icon">
              <Lightbulb size={17} />
            </div>

            <span className="section-kicker">A STUDY TIP</span>

            <h2>Try explaining it simply.</h2>

            <p>
              If you can explain an idea in your own words, you’re
              building a kind of understanding that lasts.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}