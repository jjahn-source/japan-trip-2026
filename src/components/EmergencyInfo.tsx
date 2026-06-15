import { Phone, Heart, FileText, AlertTriangle } from "lucide-react";
import { EMERGENCY_CONTACTS } from "../data/emergency";
import { SectionHeading } from "./SectionHeading";

export function EmergencyInfo() {
  const criticalNumbers = EMERGENCY_CONTACTS.slice(0, 3); // Ambulance, Police, Hospital
  const otherContacts = EMERGENCY_CONTACTS.slice(3);

  return (
    <section className="section-pad py-24">
      <SectionHeading
        kicker="Safety"
        title="Emergency Contacts & Protocols"
        sub="Save this page. In Japan, most people speak limited English—hotels can help translate. Document numbers below."
      />

      {/* Critical Numbers - Big & Bold */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {criticalNumbers.map((info) => (
          <a
            key={info.title}
            href={`tel:${info.phone}`}
            className="glass rounded-2xl border border-red-500/30 bg-red-500/10 p-6 hover:bg-red-500/15 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <Heart size={24} className="text-red-400" />
            </div>
            <p className="text-xs font-bold text-red-300 uppercase mb-2">{info.category}</p>
            <p className="font-bold text-xl mb-1 text-white">{info.phone}</p>
            <p className="text-sm text-slate-300">{info.title}</p>
          </a>
        ))}
      </div>

      {/* Critical Info Box */}
      <div className="glass rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-300 mb-2">If something goes wrong:</h3>
            <ol className="space-y-1 text-sm text-slate-200">
              <li>1. <strong>Stay calm</strong>. Most issues are solvable.</li>
              <li>2. <strong>Call your hotel</strong>. They speak English + can translate for police/hospital.</li>
              <li>3. <strong>Get documentation</strong>: Police report #, hospital receipt, insurance claim form.</li>
              <li>4. <strong>Contact insurance</strong> for losses over $50.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Other Important Contacts */}
      <div className="space-y-4">
        {otherContacts.map((info) => (
          <div
            key={info.title}
            className="glass rounded-2xl border border-white/10 p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">{info.category}</p>
                <h3 className="font-bold text-lg mt-1">{info.title}</h3>
              </div>
              {info.phone !== "24/7" && (
                <a
                  href={`tel:${info.phone}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 border border-rose-500/30 rounded text-rose-300 text-xs font-bold hover:bg-rose-500/30 transition-colors shrink-0"
                >
                  <Phone size={14} />
                  Call
                </a>
              )}
            </div>

            {info.phone !== "24/7" && (
              <p className="font-mono text-sm text-amber-300 mb-3 font-bold">{info.phone}</p>
            )}

            <div className="space-y-1.5">
              {info.details.map((detail, i) => (
                <p key={i} className="text-sm text-slate-300 leading-relaxed flex gap-2">
                  <span className="text-slate-500 shrink-0">•</span>
                  <span>{detail}</span>
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Reference Card */}
      <div className="mt-8 glass rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
        <h3 className="font-bold text-cyan-300 mb-4 flex items-center gap-2">
          <FileText size={16} />
          What to carry/screenshot:
        </h3>
        <ul className="grid md:grid-cols-2 gap-2 text-sm text-slate-300">
          <li>✓ Passport copies (2 physical + 1 photo)</li>
          <li>✓ Travel insurance policy number</li>
          <li>✓ Hotel addresses in Japanese (from Airbnb listing)</li>
          <li>✓ Credit card 24/7 fraud numbers</li>
          <li>✓ Embassy contact info (memorize phone)</li>
          <li>✓ Day 1 detailed itinerary (for police if lost)</li>
        </ul>
      </div>
    </section>
  );
}
