import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Copy, Check, ExternalLink } from "lucide-react";
import { useJapanAlerts } from "../hooks/useJapanAlerts";
import { GUIDE } from "../data/guide";
import { PHRASES } from "../data/phrases";
import { FAQS } from "../data/faq";
import { TIPS } from "../data/tips";
import { DOCTRINES, DOCTRINE_PREAMBLE, type Severity } from "../data/doctrines";
import { EMERGENCY_LINES, ESSENTIALS, EMERGENCY_PHRASES } from "../data/essentials";
import { SectionHeading } from "./SectionHeading";
import { PackingView } from "./PackingView";
import { CurrencyCalc } from "./CurrencyCalc";

export type GuideTab = "survival" | "packing";

const SEVERITY_STYLE: Record<Severity, string> = {
  LAW: "bg-accent-500/20 text-accent-300 border-accent-500/40",
  STRONG: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  FLEX: "bg-sky-500/20 text-sky-300 border-sky-500/40",
};

function Accordion({ title, emoji, children, defaultOpen = false }: {
  title: string;
  emoji?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="font-bold sm:text-lg">
          {emoji && <span className="mr-2">{emoji}</span>}
          {title}
        </span>
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-4 sm:px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PhraseRow({ en, jp, romaji }: { en: string; jp: string; romaji: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.04]">
      <div className="min-w-0">
        <p className="text-sm font-medium">{en}</p>
        <p className="text-sm text-accent-300 font-[Noto_Serif_JP]">{jp}</p>
        <p className="text-xs text-slate-500 italic">{romaji}</p>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(jp).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        className="shrink-0 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={`Copy ${jp}`}
      >
        {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
      </button>
    </li>
  );
}

function JapanAlertsPanel() {
  const { alerts, loading, error } = useJapanAlerts();
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-10 rounded-2xl bg-orange-500/[0.06] border border-orange-500/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-bold text-orange-300 flex items-center gap-2">
          🌐 r/JapanTravel — hot right now
          {!loading && alerts.length > 0 && (
            <span className="text-[0.65rem] font-normal text-slate-500">{alerts.length} posts</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-orange-500/15 divide-y divide-white/5">
          {loading && (
            <div className="px-4 py-4 text-xs text-slate-500">Fetching latest posts…</div>
          )}
          {!loading && (error || alerts.length === 0) && (
            <div className="px-4 py-4 text-xs text-slate-500">Couldn't reach Reddit — try refreshing.</div>
          )}
          {alerts.map((a) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {a.flair && (
                    <span className="text-[0.6rem] font-bold uppercase tracking-wide text-orange-300/70">
                      {a.flair}
                    </span>
                  )}
                  <span className="text-[0.6rem] text-slate-600">{a.age} · ↑{a.score}</span>
                </div>
                <p className="text-sm text-slate-200 group-hover:text-white leading-snug">{a.title}</p>
              </div>
              <ExternalLink size={12} className="shrink-0 mt-1 text-slate-600 group-hover:text-slate-400" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function GuideView({ tab }: { tab: GuideTab }) {
  if (tab === "packing") return <PackingView />;
  return (
    <div className="section-pad py-24 pt-32">
      <JapanAlertsPanel />
      <SectionHeading
        kicker="The Manual"
        title="Survival Guide"
        sub="Transport, money, etiquette, December tactics, and emergencies — everything you'd otherwise google at 11pm in a hotel bed."
      />

      {/* Emergency & Essentials — one tap away */}
      <div id="emergency" className="mb-16">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🆘</span>
          <h3 className="text-xl sm:text-2xl font-extrabold">Emergency & Essentials</h3>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed max-w-3xl mb-4">
          The numbers you hope to never tap — but want one tap away. On a phone these dial directly.
          When in doubt, the JNTO hotline (English, 24/7) is the call.
        </p>

        {/* Tap-to-call lines */}
        <div className="grid gap-2.5 sm:grid-cols-2 mb-4">
          {EMERGENCY_LINES.map((l) => (
            <a
              key={l.label}
              href={`tel:${l.tel}`}
              className="glass rounded-2xl p-4 flex items-start gap-3 border-red-500/20 hover:bg-red-500/5 transition-colors"
            >
              <span className="text-2xl shrink-0">{l.emoji}</span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-100">{l.label}</span>
                  <span className="font-black text-accent-300 tabular-nums">{l.number}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{l.note}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Essentials cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          {ESSENTIALS.map((c) => (
            <div key={c.title} className="glass rounded-2xl p-4">
              <p className="font-bold text-sm text-slate-100 mb-1.5">{c.emoji} {c.title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        {/* Emergency phrases — copy-ready */}
        <div className="glass rounded-2xl p-4">
          <p className="text-xs font-bold text-accent-300 uppercase tracking-wider mb-2.5">Emergency phrases</p>
          <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {EMERGENCY_PHRASES.map((p) => (
              <li key={p.en} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-slate-300">{p.en}</span>
                <span className="text-right shrink-0">
                  <span className="text-accent-300 font-[Noto_Serif_JP]">{p.jp}</span>
                  <span className="block text-[0.65rem] text-slate-500 italic">{p.romaji}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Crew Doctrines — the standing orders */}
      <div className="mb-16">
        <div className="glass rounded-2xl p-5 sm:p-6 mb-5 border-accent-500/20">
          <h3 className="text-xl sm:text-2xl font-extrabold">📜 The Crew Doctrines</h3>
          <p className="mt-1.5 text-sm text-slate-400 leading-relaxed max-w-3xl">{DOCTRINE_PREAMBLE}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] font-bold">
            <span className={`rounded-full border px-2 py-0.5 ${SEVERITY_STYLE.LAW}`}>LAW · non-negotiable</span>
            <span className={`rounded-full border px-2 py-0.5 ${SEVERITY_STYLE.STRONG}`}>STRONG · owe a round</span>
            <span className={`rounded-full border px-2 py-0.5 ${SEVERITY_STYLE.FLEX}`}>FLEX · vibes</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {DOCTRINES.map((d, i) => (
            <motion.div
              key={d.code}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.3, delay: (i % 2) * 0.04 }}
              className="glass rounded-2xl p-4 flex flex-col"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl shrink-0">{d.emoji}</span>
                <span className="text-[0.6rem] font-mono font-bold text-slate-600 tabular-nums">{d.code}</span>
                <h4 className="font-bold text-sm leading-tight flex-1">{d.title}</h4>
                <span className={`shrink-0 text-[0.55rem] font-bold border rounded-full px-1.5 py-0.5 ${SEVERITY_STYLE[d.severity]}`}>
                  {d.severity}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">{d.law}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {GUIDE.map((section) => (
          <div key={section.id} id={section.id}>
            <h3 className="text-xl sm:text-2xl font-extrabold mb-1">
              {section.emoji} {section.title}
            </h3>
            <p className="text-slate-400 text-sm mb-4">{section.intro}</p>
            <div className="space-y-3">
              {section.articles.map((a) => (
                <Accordion key={a.title} title={a.title} emoji={a.emoji}>
                  <ul className="space-y-2.5">
                    {a.body.map((p, i) => (
                      <li key={i} className="text-sm text-slate-300 leading-relaxed pl-3 border-l-2 border-accent-500/30">
                        {p}
                      </li>
                    ))}
                  </ul>
                </Accordion>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick tactics grid (legacy tips) */}
      <div className="mt-20">
        <SectionHeading
          kicker="Cheat Sheet"
          title="Quick Tactics"
          sub="The ten things that separate a smooth trip from eight people standing confused in Shinjuku Station."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TIPS.map((t) => (
            <div key={t.title} className="glass rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
              <div className="text-2xl mb-2">{t.emoji}</div>
              <h3 className="font-bold mb-1.5">{t.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Phrasebook */}
      <div className="mt-20">
        <SectionHeading
          kicker="言葉 · Kotoba"
          title="Pocket Phrasebook"
          sub="Tap the copy icon to grab the Japanese — paste it, show it, point at it."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {PHRASES.map((g) => (
            <Accordion key={g.group} title={g.group} emoji={g.emoji} defaultOpen={g.group === "Survival Basics"}>
              <ul className="divide-y divide-white/5">
                {g.phrases.map((p) => (
                  <PhraseRow key={p.en} {...p} />
                ))}
              </ul>
            </Accordion>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20">
        <SectionHeading
          kicker="Everything Else"
          title="FAQ"
          sub={`${FAQS.length} questions you were going to google. Don't.`}
        />
        <div className="space-y-2.5">
          {FAQS.map((f) => (
            <Accordion key={f.q} title={f.q}>
              <p className="text-sm text-slate-300 leading-relaxed">{f.a}</p>
            </Accordion>
          ))}
        </div>
      </div>

      {/* Currency Calculator */}
      <div className="mt-20">
        <CurrencyCalc />
      </div>
    </div>
  );
}
