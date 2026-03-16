import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  Image as ImageIcon,
  Trash2,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getAvatarUrl, getDisplayNameFallback } from "../context/ProfileContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function GeminiChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(() => [
    {
      id: uid(),
      role: "assistant",
      text: "Ask anything — type a question or upload a screenshot.",
      createdAt: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [needsAgreement, setNeedsAgreement] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const avatarUrl = getAvatarUrl(user);
  const displayName = getDisplayNameFallback(user);
  const userInitial = (displayName?.trim()?.charAt(0) || "U").toUpperCase();

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    // autoscroll to bottom
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const canSend = useMemo(() => {
    return Boolean(input.trim() || imageFile) && !sending;
  }, [input, imageFile, sending]);

  const send = async () => {
    if (!canSend) return;
    const text = input.trim();

    const userMsg: ChatMsg = {
      id: uid(),
      role: "user",
      text: text || (imageFile ? "(screenshot)" : ""),
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    try {
      const fd = new FormData();
      fd.append("message", text);
      // Send last few turns so the model doesn't drift.
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.text,
        }));
      fd.append("history", JSON.stringify(history));
      if (imageFile) fd.append("image", imageFile);

      const res = await fetch(`${API_BASE}/chat/cloudflare`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        const detail = String(json?.detail ?? "");
        if (
          res.status === 412 ||
          detail.includes("CLOUDFLARE_MODEL_AGREEMENT_REQUIRED")
        ) {
          setNeedsAgreement(true);
          throw new Error(
            "Cloudflare model license agreement required. Click “Agree & Continue”."
          );
        }
        throw new Error(json?.detail || "Failed to get answer.");
      }

      const answerText = String(json?.answer ?? "").trim() || "No answer returned.";
      const botMsg: ChatMsg = {
        id: uid(),
        role: "assistant",
        text: answerText,
        createdAt: Date.now(),
      };
      setMessages((m) => [...m, botMsg]);
      setImageFile(null);
    } catch (e) {
      const errText = e instanceof Error ? e.message : "Something went wrong.";
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          text: `Sorry — I couldn't answer that. ${errText}`,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] rounded-full border border-cyan-400/60 bg-gradient-to-r from-cyan-500/90 via-sky-500/90 to-emerald-400/90 backdrop-blur px-5 py-3 shadow-[0_24px_70px_rgba(8,47,73,0.95)] hover:from-cyan-400 hover:via-sky-400 hover:to-emerald-300 transition-all hover:-translate-y-0.5"
        aria-label="Open Ask Anything with Anand Sir chat"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <MessageCircle className="h-4 w-4" />
          Ask anything with Anand Sir
        </span>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-[80]">
          <div
            className="absolute inset-0 bg-slate-950/40 sm:bg-transparent"
            onClick={() => setOpen(false)}
          />

          <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-[420px]">
            <div className="relative rounded-[1.75rem] border border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 shadow-[0_32px_90px_rgba(15,23,42,0.98)] overflow-hidden">
              <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -left-12 -bottom-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

              <header className="relative px-5 py-4 border-b border-slate-800/80 bg-gradient-to-r from-cyan-500/15 via-slate-950 to-emerald-400/10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300/80">
                  Ask anything with Anand Sir
                </p>
                <p className="text-sm font-semibold text-slate-100">
                  Personal chemistry tutor
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setMessages([
                      {
                        id: uid(),
                        role: "assistant",
                        text: "Ask anything — type a question or upload a screenshot.",
                        createdAt: Date.now(),
                      },
                    ])
                  }
                  className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-2 text-slate-300 hover:border-slate-500 hover:text-slate-200 transition-colors"
                  aria-label="New chat"
                  title="New chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-2 text-slate-300 hover:border-cyan-400/70 hover:text-cyan-200 transition-colors"
                  aria-label="Close chat"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

              <div
                ref={listRef}
                className="relative max-h-[58vh] sm:max-h-[520px] overflow-auto px-4 py-4 space-y-3 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900"
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2 ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {m.role === "assistant" && (
                      <div className="mt-0.5 h-7 w-7 shrink-0 rounded-xl bg-gradient-to-br from-cyan-400/30 to-emerald-400/20 border border-cyan-400/20 flex items-center justify-center text-[10px] font-bold text-cyan-100">
                        A
                      </div>
                    )}
                    <div
                      className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-relaxed border shadow-sm ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-emerald-400/20 border-cyan-400/40 text-slate-50"
                          : "bg-slate-900/80 border-slate-700/80 text-slate-100"
                      }`}
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {m.text}
                    </div>
                    {m.role === "user" && (
                      <div className="mt-0.5 h-7 w-7 shrink-0 rounded-xl bg-slate-900/80 border border-slate-700/80 overflow-hidden flex items-center justify-center">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Your profile"
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-200">
                            {userInitial}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {sending && (
                  <div className="flex items-start gap-2 justify-start">
                    <div className="mt-0.5 h-7 w-7 shrink-0 rounded-xl bg-gradient-to-br from-cyan-400/30 to-emerald-400/20 border border-cyan-400/20 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-cyan-200 animate-spin" />
                    </div>
                    <div className="max-w-[86%] rounded-2xl px-3 py-2 text-sm border border-slate-700/80 bg-slate-900/70 text-slate-200">
                      Thinking…
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/80 bg-slate-950/80 px-4 py-3 space-y-2">
              {needsAgreement && (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    This Cloudflare model requires a one-time “agree” license step.
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setSending(true);
                        const res = await fetch(
                          `${API_BASE}/chat/cloudflare/agree`,
                          { method: "POST" }
                        );
                        const json = await res.json();
                        if (!res.ok) {
                          throw new Error(json?.detail || "Agree failed.");
                        }
                        setNeedsAgreement(false);
                        setMessages((m) => [
                          ...m,
                          {
                            id: uid(),
                            role: "assistant",
                            text: "Thanks — agreement recorded. You can ask your question now.",
                            createdAt: Date.now(),
                          },
                        ]);
                      } catch (e) {
                        const errText =
                          e instanceof Error ? e.message : "Agree failed.";
                        setMessages((m) => [
                          ...m,
                          {
                            id: uid(),
                            role: "assistant",
                            text: `Sorry — I couldn't complete the agreement. ${errText}`,
                            createdAt: Date.now(),
                          },
                        ]);
                      } finally {
                        setSending(false);
                      }
                    }}
                    className="shrink-0 rounded-xl bg-amber-300 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-amber-200"
                  >
                    Agree &amp; Continue
                  </button>
                </div>
              )}
              {imagePreviewUrl && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={imagePreviewUrl}
                      alt="Selected screenshot preview"
                      className="h-10 w-10 rounded-xl object-cover border border-slate-800"
                    />
                    <p className="text-[11px] text-slate-300 truncate">
                      {imageFile?.name ?? "screenshot"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="text-[11px] text-slate-400 hover:text-rose-300"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-2.5 text-slate-200 hover:border-cyan-400/50 hover:text-cyan-200 transition-colors"
                  aria-label="Upload screenshot"
                  title="Upload screenshot"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setImageFile(f);
                    // allow selecting same file again
                    e.currentTarget.value = "";
                  }}
                />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question…"
                  className="flex-1 min-h-[46px] max-h-32 resize-none rounded-2xl bg-slate-900/70 border border-slate-700/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!canSend}
                  className="shrink-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:from-cyan-300 hover:to-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label="Send message"
                >
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send
                  </span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Tip: Press Enter to send, Shift+Enter for new line.
              </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

