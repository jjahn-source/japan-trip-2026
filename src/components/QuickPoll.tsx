import { useState } from "react";
import { BarChart2, Plus, X } from "lucide-react";
import { useCrewPolls, type Poll } from "../hooks/useCrewPolls";
import { getIdentityName, CREW } from "../hooks/useIdentity";
import { FIREBASE_ENABLED } from "../lib/firebase";

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "closed";
  const min = Math.ceil(ms / 60000);
  return `${min}m left`;
}

function PollCard({
  poll,
  myName,
  onVote,
}: {
  poll: Poll;
  myName: string | null;
  onVote: (optIdx: number) => void;
}) {
  const isExpired = new Date(poll.expiresAt) <= new Date();
  const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
  const myVoteIdx = poll.options.findIndex((o) => myName && o.votes.includes(myName));
  const winnerVotes = Math.max(...poll.options.map((o) => o.votes.length));
  const winner = isExpired && winnerVotes > 0 ? poll.options.find((o) => o.votes.length === winnerVotes) : null;

  return (
    <div
      className={`glass rounded-xl p-3.5 border ${isExpired ? "border-white/5 opacity-70" : "border-violet-500/25"}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <p className="text-sm font-semibold leading-snug flex-1">{poll.question}</p>
        <span
          className={`text-[0.6rem] font-bold shrink-0 px-1.5 py-0.5 rounded-full ${
            isExpired ? "bg-white/8 text-slate-500" : "bg-violet-500/20 text-violet-300"
          }`}
        >
          {isExpired ? "closed" : timeLeft(poll.expiresAt)}
        </span>
      </div>

      <div className="space-y-1.5">
        {poll.options.map((opt, i) => {
          const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
          const isWinner = opt === winner;
          const isMine = myVoteIdx === i;
          return (
            <button
              key={i}
              type="button"
              disabled={isExpired || !myName}
              onClick={() => onVote(i)}
              className="w-full relative rounded-lg overflow-hidden text-left transition-all disabled:cursor-default hover:brightness-110 disabled:hover:brightness-100"
            >
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                  isWinner ? "bg-emerald-500/20" : isMine ? "bg-violet-500/15" : "bg-white/5"
                }`}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs">
                <span
                  className={`font-medium ${
                    isWinner ? "text-emerald-200" : isMine ? "text-violet-200" : "text-slate-300"
                  }`}
                >
                  {isWinner && "🏆 "}
                  {opt.text}
                </span>
                <span className={`tabular-nums font-bold shrink-0 ${isMine ? "text-violet-300" : "text-slate-500"}`}>
                  {opt.votes.length}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[0.6rem] text-slate-600 mt-2">
        {poll.createdBy} · {totalVotes} / {CREW.length} voted
      </p>
    </div>
  );
}

function NewPollForm({ onSubmit, onCancel }: { onSubmit: (q: string, opts: string[]) => void; onCancel: () => void }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const setOpt = (i: number, v: string) => setOptions(options.map((o, idx) => (idx === i ? v : o)));
  const addOption = () => { if (options.length < 4) setOptions([...options, ""]); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };

  const validOpts = options.filter((o) => o.trim());
  const canSubmit = question.trim().length > 0 && validOpts.length >= 2;

  return (
    <div className="glass rounded-xl p-3.5 border border-violet-500/25">
      <p className="text-[0.65rem] font-bold text-violet-300 uppercase tracking-wider mb-2.5">
        New poll · closes in 5 min
      </p>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What should we do?"
        maxLength={200}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500/40 mb-2"
      />
      <div className="space-y-1.5 mb-2.5">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <input
              type="text"
              value={opt}
              onChange={(e) => setOpt(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              maxLength={100}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500/30"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                aria-label="Remove option"
                className="text-slate-600 hover:text-rose-400 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {options.length < 4 && (
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Plus size={11} /> option
          </button>
        )}
        <div className="flex-1" />
        <button type="button" onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          cancel
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onSubmit(question, validOpts)}
          className="text-xs font-semibold bg-violet-500/20 border border-violet-500/30 text-violet-200 rounded-lg px-3 py-1.5 hover:bg-violet-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Launch poll
        </button>
      </div>
    </div>
  );
}

export function QuickPoll() {
  const [showForm, setShowForm] = useState(false);
  const { activePolls, recentPolls, create, vote } = useCrewPolls();
  const myName = getIdentityName();

  if (!FIREBASE_ENABLED) return null;

  const handleCreate = async (q: string, opts: string[]) => {
    if (!myName) return;
    await create(q, opts, myName);
    setShowForm(false);
  };

  const hasPolls = activePolls.length > 0 || recentPolls.length > 0;

  return (
    <div className="space-y-2">
      {activePolls.map((p) => (
        <PollCard key={p.id} poll={p} myName={myName} onVote={(i) => myName && vote(p.id, i, myName)} />
      ))}
      {recentPolls.map((p) => (
        <PollCard key={p.id} poll={p} myName={myName} onVote={() => {}} />
      ))}
      {showForm ? (
        <NewPollForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={!myName}
          title={!myName ? "Pick a name above to start a poll" : undefined}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            hasPolls
              ? "border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/5"
              : "border-violet-500/25 bg-violet-500/10 text-violet-300 hover:bg-violet-500/15"
          }`}
        >
          <BarChart2 size={12} />
          {hasPolls ? "New poll" : "Quick poll — settle it fast"}
        </button>
      )}
    </div>
  );
}
