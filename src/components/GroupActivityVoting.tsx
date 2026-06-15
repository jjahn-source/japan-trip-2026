import { ThumbsUp, Trash2, Plus } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useState } from "react";
import { SectionHeading } from "./SectionHeading";
import { DAYS } from "../data/itinerary";

type Proposal = {
  id: string;
  title: string;
  description: string;
  city: string;
  date: string;
  cost?: string;
  votes: Record<string, boolean>; // person name -> voted yes
  proposedBy: string;
  createdAt: string;
};

const CREW_MEMBERS = [
  "Person 1",
  "Person 2",
  "Person 3",
  "Person 4",
  "Person 5",
  "Person 6",
  "Person 7",
  "Person 8",
];

export function GroupActivityVoting() {
  const [proposals, setProposals] = useLocalStorage<Proposal[]>("activity-proposals", []);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: "",
    description: "",
    city: "Tokyo",
    date: DAYS[0]?.date || "2026-12-15",
    cost: "",
    proposedBy: "Person 1",
  });

  const getDayLabel = (date: string) => {
    const dayIndex = DAYS.findIndex((d) => d.date === date);
    return dayIndex >= 0 ? `Day ${dayIndex + 1}` : "Unknown";
  };

  const handleAddProposal = () => {
    if (!newProposal.title.trim()) {
      alert("Title required");
      return;
    }
    const proposal: Proposal = {
      id: Date.now().toString(),
      title: newProposal.title,
      description: newProposal.description,
      city: newProposal.city,
      date: newProposal.date,
      cost: newProposal.cost,
      votes: {},
      proposedBy: newProposal.proposedBy,
      createdAt: new Date().toISOString(),
    };
    setProposals([...proposals, proposal]);
    setNewProposal({
      title: "",
      description: "",
      city: "Tokyo",
      date: DAYS[0]?.date || "2026-12-15",
      cost: "",
      proposedBy: "Person 1",
    });
    setIsAddingNew(false);
  };

  const handleVote = (proposalId: string, person: string) => {
    setProposals(
      proposals.map((p) => {
        if (p.id !== proposalId) return p;
        const newVotes = { ...p.votes };
        if (newVotes[person]) {
          delete newVotes[person];
        } else {
          newVotes[person] = true;
        }
        return { ...p, votes: newVotes };
      })
    );
  };

  const handleDelete = (proposalId: string) => {
    setProposals(proposals.filter((p) => p.id !== proposalId));
  };

  const sortedByVotes = [...proposals].sort((a, b) => {
    const aVotes = Object.keys(a.votes).length;
    const bVotes = Object.keys(b.votes).length;
    return bVotes - aVotes;
  });

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Crew Decision"
        title="Group Activity Voting"
        sub="Propose ideas. Crew votes. Majority rules."
      />

      {isAddingNew ? (
        // New Proposal Form
        <div className="glass rounded-2xl border border-cyan-500/30 p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-100 mb-4">Propose an activity</h2>

          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Activity name *
              </label>
              <input
                type="text"
                placeholder="e.g., Team onsen night, Karaoke at Roppongi, Hike Mt. Fuji"
                value={newProposal.title}
                onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Description (what, why, when)
              </label>
              <input
                type="text"
                placeholder="Details that help crew decide..."
                value={newProposal.description}
                onChange={(e) =>
                  setNewProposal({ ...newProposal, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">City</label>
                <select
                  value={newProposal.city}
                  onChange={(e) => setNewProposal({ ...newProposal, city: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
                >
                  {["Tokyo", "Kyoto", "Hiroshima", "Osaka", "Other"].map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Date</label>
                <select
                  value={newProposal.date}
                  onChange={(e) => setNewProposal({ ...newProposal, date: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
                >
                  {DAYS.map((day) => (
                    <option key={day.date} value={day.date}>
                      {getDayLabel(day.date)} — {day.date}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Cost estimate (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., ¥5,000 per person"
                  value={newProposal.cost}
                  onChange={(e) => setNewProposal({ ...newProposal, cost: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Proposed by
                </label>
                <select
                  value={newProposal.proposedBy}
                  onChange={(e) => setNewProposal({ ...newProposal, proposedBy: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
                >
                  {CREW_MEMBERS.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddProposal}
              className="flex-1 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-300 hover:bg-emerald-500/30 transition-colors font-bold text-sm"
            >
              Propose
            </button>
            <button
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded text-slate-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingNew(true)}
          className="w-full px-4 py-3 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 hover:bg-cyan-500/30 transition-colors font-bold mb-8 flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Propose an activity
        </button>
      )}

      {/* Proposals List */}
      <div className="space-y-4">
        {sortedByVotes.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No proposals yet. Start the conversation!</p>
          </div>
        ) : (
          sortedByVotes.map((proposal) => {
            const voteCount = Object.keys(proposal.votes).length;
            const passThreshold = CREW_MEMBERS.length / 2;

            return (
              <div
                key={proposal.id}
                className={`glass rounded-lg border p-4 transition-colors ${
                  voteCount > passThreshold
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-100">{proposal.title}</h3>
                    <p className="text-xs text-slate-400">
                      Proposed by {proposal.proposedBy} · {getDayLabel(proposal.date)} ·{" "}
                      {proposal.city}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(proposal.id)}
                    className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {proposal.description && (
                  <p className="text-sm text-slate-300 mb-2">{proposal.description}</p>
                )}

                {proposal.cost && (
                  <p className="text-xs text-slate-400 mb-3">💰 {proposal.cost}</p>
                )}

                {/* Vote Status */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          voteCount > passThreshold ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${(voteCount / CREW_MEMBERS.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-300">
                      {voteCount}/{CREW_MEMBERS.length}
                    </span>
                  </div>
                  {voteCount > passThreshold && (
                    <p className="text-xs text-emerald-300 font-bold">✓ Approved</p>
                  )}
                </div>

                {/* Crew Voting Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {CREW_MEMBERS.map((person) => {
                    const hasVoted = proposal.votes[person];
                    return (
                      <button
                        key={person}
                        onClick={() => handleVote(proposal.id, person)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded transition-colors ${
                          hasVoted
                            ? "bg-emerald-500 text-white"
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {hasVoted ? (
                          <>
                            <ThumbsUp size={12} className="inline mr-1" />
                            {person.split(" ")[1]}
                          </>
                        ) : (
                          person.split(" ")[1]
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Guide */}
      <div className="mt-8 glass rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <h3 className="font-bold text-cyan-300 mb-3">How voting works:</h3>
        <ul className="space-y-1 text-sm text-slate-300">
          <li>• <strong>Propose:</strong> Any crew member can suggest an activity</li>
          <li>• <strong>Vote:</strong> Tap your name to vote yes. Tap again to remove your vote</li>
          <li>• <strong>Approve:</strong> 50%+ votes = activity is approved (use as a suggestion)</li>
          <li>• <strong>Delete:</strong> Proposer or organizer can remove closed proposals</li>
          <li>• <strong>Tone:</strong> This is for optional activities or variations on plans — not override the itinerary</li>
        </ul>
      </div>
    </section>
  );
}
