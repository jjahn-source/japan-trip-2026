import { useState, useEffect } from "react";

export type JMAAlert = {
  area: string;
  code: string;
  level: "warning" | "advisory" | "emergency";
  name: string; // e.g. "大雨" (Heavy Rain), "熱中症" (Heatstroke)
};

// JMA Region codes for our bases
const REGIONS = {
  Tokyo: "130000",
  Kyoto: "260000",
  Osaka: "270000"
};

export function useJMAAlerts() {
  const [alerts, setAlerts] = useState<JMAAlert[]>([]);

  useEffect(() => {
    let mounted = true;

    // We fetch Tokyo as the primary example, but could map through all if needed
    fetch(`https://www.jma.go.jp/bosai/warning/data/warning/${REGIONS.Tokyo}.json`)
      .then(res => {
        if (!res.ok) throw new Error("JMA fetch failed");
        return res.json();
      })
      .then(data => {
        if (!mounted) return;

        // JMA JSON is complex. A simplified extraction for warnings (class 02) or emergencies (class 03):
        const parsedAlerts: JMAAlert[] = [];

        try {
          const areaTypes = data.areaTypes || [];
          // Drill down into the specific areas
          if (areaTypes[1] && areaTypes[1].areas) {
            areaTypes[1].areas.forEach((area: any) => {
               if (area.warnings) {
                 area.warnings.forEach((w: any) => {
                   // Status 1 means active warning. Status 0 means clear.
                   if (w.status === "発表" || w.status === "継続") {
                      // Filter for actual severe warnings (code starts with 02, 03, or 3)
                      // 02 = warning (警報), 03 = emergency (特別警報)
                      if (w.code.startsWith("02") || w.code.startsWith("03") || w.code === "33") {
                        parsedAlerts.push({
                          area: area.name,
                          code: w.code,
                          level: w.code.startsWith("03") ? "emergency" : "warning",
                          // We don't have the dictionary mapped here, so we fallback to generic unless known
                          name: w.code === "33" ? "Heatstroke Alert" : "Severe Weather Warning"
                        });
                      }
                   }
                 });
               }
            });
          }
        } catch (e) {
          console.error("Failed parsing JMA data", e);
        }

        // Deduplicate
        const unique = parsedAlerts.filter((v, i, a) => a.findIndex(t => (t.code === v.code)) === i);
        setAlerts(unique);
      })
      .catch(() => {
        // Silent fail
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { alerts };
}
