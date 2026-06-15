import { Search } from "lucide-react";
import { PHRASES } from "../data/phrases";
import { useState, useMemo } from "react";
import { SectionHeading } from "./SectionHeading";

export function PhraseTranslator() {
  const [search, setSearch] = useState("");
  const [copiedPhrase, setCopiedPhrase] = useState<string>("");

  const filteredGroups = useMemo(() => {
    if (!search) return PHRASES;

    const q = search.toLowerCase();
    return PHRASES.map((group) => ({
      ...group,
      phrases: group.phrases.filter(
        (p) =>
          p.en.toLowerCase().includes(q) ||
          p.jp.includes(search) ||
          p.romaji.toLowerCase().includes(q)
      ),
    })).filter((g) => g.phrases.length > 0);
  }, [search]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhrase(text);
    setTimeout(() => setCopiedPhrase(""), 2000);
  };

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Language"
        title="Quick Phrase Translator"
        sub="Search in English, Japanese, or romaji. Tap any phrase to copy."
      />

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search in English, 日本語, or romaji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:bg-white/10 focus:border-cyan-400/50 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Phrase Groups */}
      <div className="space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.group}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{group.emoji}</span>
              <h2 className="text-lg font-bold text-slate-100">{group.group}</h2>
              <span className="text-xs text-slate-500">({group.phrases.length})</span>
            </div>

            <div className="grid gap-2">
              {group.phrases.map((phrase, i) => (
                <div
                  key={i}
                  onClick={() => copyToClipboard(phrase.jp)}
                  className="glass rounded-lg border border-white/10 p-4 cursor-pointer hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <p className="text-sm text-cyan-300 font-semibold group-hover:text-cyan-200">
                        {phrase.en}
                      </p>
                      <p className="text-xl font-bold text-slate-100 mt-1 group-hover:text-white transition-colors">
                        {phrase.jp}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 italic">
                        {phrase.romaji}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {copiedPhrase === phrase.jp ? (
                        <div className="text-xs font-bold text-emerald-300">Copied!</div>
                      ) : (
                        <div className="text-xs text-slate-500 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to copy
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">No phrases match your search.</p>
        </div>
      )}

      {/* How to Use */}
      <div className="mt-12 glass rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <h3 className="font-bold text-cyan-300 mb-3">How to use:</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li>• <strong>Search</strong> by English word (e.g. "thank you")</li>
          <li>• <strong>Search</strong> by romaji (e.g. "arigatō")</li>
          <li>• <strong>Search</strong> by 日本語 (e.g. "すみません")</li>
          <li>• <strong>Tap any phrase</strong> to copy the Japanese to your clipboard</li>
          <li>• <strong>Show this to staff</strong> when you're unsure — pointing at the Japanese is often clearer than speaking</li>
        </ul>
      </div>
    </section>
  );
}
