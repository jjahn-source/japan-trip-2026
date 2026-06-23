import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, ChevronDown, ChevronUp, ThumbsUp, RefreshCw, TrendingDown, TrendingUp, Sparkles } from "lucide-react";
import { STAY_LEGS, COMBO_NOTES, GROUP, BUDGET_CAP_PP } from "../data/stays";
import { SectionHeading } from "./SectionHeading";
import { useStayVotes } from "../hooks/useStayVotes";
import { useStaysLive } from "../hooks/useStaysLive";
import { getIdentityName } from "../hooks/useIdentity";
import { FIREBASE_ENABLED } from "../lib/firebase";
import type { LiveListing, LiveLeg, LiveChangelog } from "../hooks/useStaysLive";
import type { StayLeg } from "../data/stays";

const CREW_INITIALS: Record<string, string> = {
  JJ: "JJ", Ethan: "ET", Steven: "SV", Alex: "AL",
  Charlie: "CH", Kaishun: "KS", Daniel: "DA", Junha: "JH",
};

// ─── Live card (from search results) ────────────────────────────────────────

function LiveCard({
  opt,
  rank,
  votes,
  myName,
  onVote,
}: {
  opt: LiveListing;
  rank: number;
  votes: string[];
  myName: string | null;
  onVote: () => void;
}) {
  const voted = myName ? votes.includes(myName) : false;
  const ratingStr = opt.rating
    ? `${opt.rating}★ (${opt.reviews?.toLocaleString()})`
    : "New listing";
  const bedsStr = [
    opt.bedrooms ? `${opt.bedrooms}BR` : null,
    opt.beds ? `${opt.beds} beds` : null,
    opt.baths ? `${opt.baths} baths` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const badge = opt.guestFav
    ? { label: "Guest Favorite", cls: "bg-amber-500/20 border-amber-400/40 text-amber-300" }
    : opt.superhost
    ? { label: "Superhost", cls: "bg-indigo-500/20 border-indigo-400/40 text-indigo-300" }
    : null;

  return (
    <div
      className={`glass rounded-xl overflow-hidden border flex flex-col group ${
        rank === 1 ? "border-amber-400/40 bg-amber-500/5 shadow-lg shadow-amber-500/10" : "border-white/10 hover:border-white/20"
      } transition-colors`}
    >
      {opt.imgUrl && (
        <a href={opt.url} target="_blank" rel="noopener noreferrer" className="block w-full h-40 overflow-hidden relative bg-slate-800 shrink-0">
          <img
            src={opt.imgUrl}
            alt={opt.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {badge && (
            <div className="absolute top-3 left-3 z-10">
              <span
                className={`text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-md backdrop-blur-md ${badge.cls}`}
              >
                {badge.label}
              </span>
            </div>
          )}

          <div className="absolute bottom-3 right-3 z-10">
            <span className={`text-[0.7rem] font-bold px-2 py-1 rounded-md shadow-md backdrop-blur-md ${rank === 1 ? "bg-amber-500/90 text-black" : "bg-black/70 text-white"}`}>
              #{rank} Pick
            </span>
          </div>
        </a>
      )}

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0 flex-1">
            {!opt.imgUrl && (
              <span className={`inline-block mb-1.5 shrink-0 text-[0.65rem] font-bold px-1.5 rounded-sm ${rank === 1 ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-slate-400"}`}>
                #{rank} Pick
              </span>
            )}
            <h4 className="font-bold text-base leading-snug line-clamp-2 text-white group-hover:text-indigo-300 transition-colors" title={opt.name}>
              {opt.name}
            </h4>
          </div>
          {!opt.imgUrl && badge && (
            <span
              className={`shrink-0 text-[0.62rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${badge.cls}`}
            >
              {badge.label}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mb-4">
          <span className={opt.rating ? "text-amber-400 font-medium" : ""}>{ratingStr}</span>
          {bedsStr && (
            <>
              <span className="text-slate-600">·</span>
              <span>{bedsStr}</span>
            </>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-4 mt-auto">
          <span className="text-emerald-400 font-extrabold text-lg tracking-tight">
            ${opt.ppCost}/pp
          </span>
          <span className="text-xs text-slate-400 font-medium">
            ${opt.totalUSD.toLocaleString()} total
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/5">
          <a
            href={opt.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View on Airbnb <ExternalLink size={12} />
          </a>

          {FIREBASE_ENABLED && (
            <div className="flex items-center gap-2">
              {votes.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {votes.slice(0, 4).map((v) => (
                    <span
                      key={v}
                      className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[0.5rem] font-bold text-slate-300"
                      title={v}
                    >
                      {CREW_INITIALS[v] ?? v.slice(0, 2)}
                    </span>
                  ))}
                  {votes.length > 4 && (
                    <span className="text-[0.6rem] text-slate-500 ml-0.5">
                      +{votes.length - 4}
                    </span>
                  )}
                </div>
              )}
              {myName && (
                <button
                  type="button"
                  onClick={onVote}
                  className={`inline-flex items-center gap-1 text-[0.65rem] font-semibold rounded-full px-2 py-1 border transition-colors ${
                    voted
                      ? "bg-accent-500/20 border-accent-500/40 text-accent-300"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-accent-500/10 hover:border-accent-500/20 hover:text-accent-400"
                  }`}
                  aria-label={voted ? "Remove vote" : "Vote for this place"}
                >
                  <ThumbsUp size={10} />
                  {voted ? "Voted" : "Vote"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Changelog pill strip ────────────────────────────────────────────────────

function ChangelogStrip({ changes }: { changes: LiveChangelog[] }) {
  if (!changes.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {changes.map((c, i) => {
        if (c.type === "new")
          return (
            <span key={i} className="inline-flex items-center gap-1 text-[0.65rem] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles size={9} /> New: {c.name.slice(0, 30)}
            </span>
          );
        if (c.type === "dropped")
          return (
            <span key={i} className="inline-flex items-center gap-1 text-[0.65rem] font-medium px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-500">
              Dropped: {c.name.slice(0, 30)}
            </span>
          );
        if (c.type === "price_drop")
          return (
            <span key={i} className="inline-flex items-center gap-1 text-[0.65rem] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingDown size={9} /> {c.name.slice(0, 24)} {c.pct}%
            </span>
          );
        if (c.type === "price_rise")
          return (
            <span key={i} className="inline-flex items-center gap-1 text-[0.65rem] font-medium px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
              <TrendingUp size={9} /> {c.name.slice(0, 24)} +{c.pct}%
            </span>
          );
        return null;
      })}
    </div>
  );
}

// ─── Live leg block ──────────────────────────────────────────────────────────

function LiveLegBlock({
  liveLeg,
  staticLeg,
}: {
  liveLeg: LiveLeg;
  staticLeg?: StayLeg;
}) {
  const [expanded, setExpanded] = useState(false);
  const { getVotes, toggle } = useStayVotes();
  const myName = getIdentityName();

  const top = liveLeg.options[0];
  const rest = liveLeg.options.slice(1);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h3 className="text-xl font-extrabold">
            {liveLeg.emoji} {liveLeg.city}
            <span className="text-slate-500 font-normal text-base ml-2">
              {liveLeg.cityJp}
            </span>
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            {liveLeg.dates} · {liveLeg.nights} nights
          </p>
        </div>
        <a
          href={liveLeg.searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-300 hover:text-accent-200 transition-colors border border-accent-500/30 rounded-full px-3 py-1.5"
        >
          Search Airbnb <ExternalLink size={11} />
        </a>
      </div>

      {staticLeg && (
        <p className="text-sm text-slate-400 mb-4 max-w-2xl">{staticLeg.brief}</p>
      )}

      <ChangelogStrip changes={liveLeg.changelog} />

      {top && (
        <LiveCard
          opt={top}
          rank={1}
          votes={getVotes(liveLeg.id, top.id)}
          myName={myName}
          onVote={() => myName && toggle(liveLeg.id, top.id, myName)}
        />
      )}

      {rest.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Hide alternatives" : `Show ${rest.length} more options`}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid gap-3 mt-3 sm:grid-cols-2">
                  {rest.map((opt, idx) => (
                    <LiveCard
                      key={opt.id}
                      opt={opt}
                      rank={idx + 2}
                      votes={getVotes(liveLeg.id, opt.id)}
                      myName={myName}
                      onVote={() => myName && toggle(liveLeg.id, opt.id, myName)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function StayView() {
  const liveData = useStaysLive();

  return (
    <section id="stays" className="section-pad py-24">
      <SectionHeading
        kicker="Accommodations"
        title="Where We're Staying"
        sub={`${GROUP} people · 3 bases · 14 nights · ≤$${BUDGET_CAP_PP}/person target`}
      />

      {liveData?.fetchedAt && (
        <div className="flex items-center gap-2 mb-6 -mt-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <RefreshCw size={10} />
            Live search pulled{" "}
            {new Date(liveData.fetchedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            at{" "}
            {new Date(liveData.fetchedAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              timeZoneName: "short",
            })}
          </span>
          {(liveData.totalNew > 0 || liveData.totalDropped > 0) && (
            <span className="text-[0.65rem] text-slate-500">
              {liveData.totalNew > 0 && `${liveData.totalNew} new`}
              {liveData.totalNew > 0 && liveData.totalDropped > 0 && " · "}
              {liveData.totalDropped > 0 && `${liveData.totalDropped} dropped`}
              {" "}since last run
            </span>
          )}
        </div>
      )}

      <div className="space-y-8 mb-12">
        {liveData
          ? liveData.legs.map((liveLeg, li) => {
              const staticLeg = STAY_LEGS.find((s) => s.id === liveLeg.id);
              return (
                <motion.div
                  key={liveLeg.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: li * 0.08 }}
                >
                  <LiveLegBlock liveLeg={liveLeg} staticLeg={staticLeg} />
                </motion.div>
              );
            })
          : STAY_LEGS.map((leg, li) => (
              // Fallback: static data while live JSON hasn't loaded yet
              <motion.div
                key={leg.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: li * 0.08 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div>
                    <h3 className="text-xl font-extrabold">
                      {leg.emoji} {leg.city}
                      <span className="text-slate-500 font-normal text-base ml-2">
                        {leg.cityJp}
                      </span>
                    </h3>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {leg.dates} · {leg.nights} nights
                    </p>
                  </div>
                  <a
                    href={leg.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-300 hover:text-accent-200 transition-colors border border-accent-500/30 rounded-full px-3 py-1.5"
                  >
                    Search Airbnb <ExternalLink size={11} />
                  </a>
                </div>
                <p className="text-sm text-slate-400 mb-5 max-w-2xl">{leg.brief}</p>
                <p className="text-xs text-slate-600 italic">Loading live search results…</p>
              </motion.div>
            ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {COMBO_NOTES.map((note, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="glass rounded-xl p-4 text-sm text-slate-400 leading-relaxed"
          >
            {note}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
