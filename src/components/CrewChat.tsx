import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useCrewChat } from "../hooks/useCrewChat";
import { getIdentityName } from "../hooks/useIdentity";
import { FIREBASE_ENABLED } from "../lib/firebase";
import { SectionHeading } from "./SectionHeading";

function fmtAt(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

export function CrewChat() {
  const { messages, send } = useCrewChat();
  const [draft, setDraft] = useState("");
  const myName = getIdentityName();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(0);

  useEffect(() => {
    if (messages.length > prevLen.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevLen.current = messages.length;
  }, [messages.length]);

  if (!FIREBASE_ENABLED) return null;

  const submit = async () => {
    const text = draft.trim();
    if (!text || !myName) return;
    setDraft("");
    await send(myName, text);
  };

  return (
    <section id="crew-chat" className="section-pad py-16">
      <SectionHeading
        kicker="Crew"
        title="Hype Thread"
        sub="Plans, dumb ideas, hype — all 8 of you in real time"
      />
      <div className="glass rounded-2xl overflow-hidden">
        <div ref={scrollRef} role="log" aria-live="polite" aria-label="Crew chat messages" className="h-80 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-10">
              No messages yet — kick it off
            </p>
          )}
          {messages.map((m) => {
            const isMe = m.author === myName;
            return (
              <div key={m.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[0.58rem] font-bold ${
                    isMe ? "bg-accent-500/30 text-accent-300" : "bg-white/10 text-slate-300"
                  }`}
                >
                  {m.author.slice(0, 2).toUpperCase()}
                </div>
                <div className={`max-w-[76%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <span className="text-[0.65rem] font-bold text-slate-500 px-1">{m.author}</span>
                  )}
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-snug break-words ${
                      isMe ? "bg-accent-500/20 text-slate-100 rounded-tr-sm" : "bg-white/10 text-slate-200 rounded-tl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[0.58rem] text-slate-600 px-1">{fmtAt(m.at)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/10 p-3 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder={myName ? "Say something…" : "Pick a name above to chat"}
            disabled={!myName}
            maxLength={500}
            aria-label="Chat message"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-accent-500/40 disabled:opacity-40 min-w-0"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || !myName}
            aria-label="Send"
            className="shrink-0 w-9 h-9 rounded-xl bg-accent-500/20 border border-accent-500/30 text-accent-300 hover:bg-accent-500/30 transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
