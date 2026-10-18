// NAVITIME Route (totalnavi) via RapidAPI: door-to-door transit routes from Japan's real timetables.
// Shared by the build (scripts/timetable.mjs) and the phone (scripts/livetimes.ts). Names arrive in Japanese; `english()` gives the English station
// name when the rail data knows it, and operators and train types are translated here.
export interface Ride { line: string; type: string | null; company: string | null; colour: string | null; from: string; to: string; dep: string; arr: string }
export interface Route { dep: string; arr: string; minutes: number; fare: number | null; transfers: number; rides: Ride[] }

export const NAVITIME_HOST = 'navitime-route-totalnavi.p.rapidapi.com';
/** JST wall-clock time as NAVITIME wants it: 2026-12-19T10:40:00. */
export const jst = (ms: number) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 19);

export function routeUrl(a: [number, number], b: [number, number], startTime: string, limit = 3) {
  const u = new URL(`https://${NAVITIME_HOST}/route_transit`);
  u.searchParams.set('start', `${a[1]},${a[0]}`);
  u.searchParams.set('goal', `${b[1]},${b[0]}`);
  u.searchParams.set('start_time', startTime);
  u.searchParams.set('limit', String(limit));
  u.searchParams.set('datum', 'wgs84');
  u.searchParams.set('coord_unit', 'degree');
  return u.toString();
}

export const COMPANY: Record<string, string> = {
  小田急電鉄: 'Odakyu', 小田急箱根: 'Hakone Tozan', 箱根登山鉄道: 'Hakone Tozan', 箱根ロープウェイ: 'Hakone Ropeway', 箱根観光船: 'Hakone Sightseeing Cruise',
  'JR東日本': 'JR East', 'JR東海': 'JR Central', 'JR西日本': 'JR West', 東京メトロ: 'Tokyo Metro', 東京都交通局: 'Toei', 東急電鉄: 'Tokyu',
  京浜急行電鉄: 'Keikyu', 京王電鉄: 'Keio', 西武鉄道: 'Seibu', 東武鉄道: 'Tobu', ゆりかもめ: 'Yurikamome', 東京臨海高速鉄道: 'Rinkai Line', 東京モノレール: 'Tokyo Monorail',
  阪急電鉄: 'Hankyu', 阪神電気鉄道: 'Hanshin', 近畿日本鉄道: 'Kintetsu', 大阪市高速電気軌道: 'Osaka Metro', 京阪電気鉄道: 'Keihan', 南海電気鉄道: 'Nankai',
  京都市交通局: 'Kyoto Subway', 広島電鉄: 'Hiroden', 'JR西日本宮島フェリー': 'JR Miyajima Ferry', 伊豆箱根鉄道: 'Izuhakone',
};
export const TYPE: Record<string, string> = { 特急: 'Limited Express', 快速: 'Rapid', 新快速: 'Special Rapid', 急行: 'Express', 普通: 'Local', 各駅停車: 'Local', 準急: 'Semi-Express', 快速急行: 'Rapid Express', 通勤急行: 'Commuter Express', 区間急行: 'Section Express' };

/** Named trains, which NAVITIME gives as the line name. */
export const TRAIN: Record<string, string> = { のぞみ: 'Nozomi', ひかり: 'Hikari', こだま: 'Kodama', はこね: 'Romancecar Hakone', スーパーはこね: 'Romancecar Super Hakone', さがみ: 'Romancecar Sagami', ふじさん: 'Romancecar Fujisan', はるか: 'Haruka', ラピート: 'Rapi:t', 'ひのとり': 'Hinotori', 'あをによし': 'Aoniyoshi' };
/** Line names as NAVITIME writes them (after dropping the train type) → English. */
export const LINE: Record<string, string> = {
  東京モノレール: 'Tokyo Monorail', 都営大江戸線: 'Toei Ōedo Line', 都営新宿線: 'Toei Shinjuku Line', 都営三田線: 'Toei Mita Line', 都営浅草線: 'Toei Asakusa Line',
  東急世田谷線: 'Tōkyū Setagaya Line', 東急田園都市線: 'Tōkyū Den-en-toshi Line', 東急東横線: 'Tōkyū Tōyoko Line', 小田急小田原線: 'Odakyu Odawara Line', 京王井の頭線: 'Keiō Inokashira Line', 京王線: 'Keiō Line',
  東京メトロ千代田線: 'Tokyo Metro Chiyoda Line', 東京メトロ銀座線: 'Tokyo Metro Ginza Line', 東京メトロ日比谷線: 'Tokyo Metro Hibiya Line', 東京メトロ丸ノ内線: 'Tokyo Metro Marunouchi Line',
  東京メトロ副都心線: 'Tokyo Metro Fukutoshin Line', 東京メトロ半蔵門線: 'Tokyo Metro Hanzōmon Line', 東京メトロ東西線: 'Tokyo Metro Tōzai Line', 東京メトロ有楽町線: 'Tokyo Metro Yūrakuchō Line', 東京メトロ南北線: 'Tokyo Metro Namboku Line',
  ＪＲ中央線: 'JR Chūō Line', ＪＲ中央総武線: 'JR Chūō–Sōbu Line', ＪＲ総武線: 'JR Sōbu Line', ＪＲ埼京線: 'JR Saikyō Line', ＪＲ山手線: 'JR Yamanote Line', ＪＲ京浜東北線: 'JR Keihin-Tōhoku Line',
  ＪＲ湘南新宿ライン: 'JR Shōnan-Shinjuku Line', ＪＲ東海道本線: 'JR Tōkaidō Line', ＪＲ京都線: 'JR Kyoto Line', ＪＲ神戸線: 'JR Kobe Line', ＪＲ大阪環状線: 'JR Osaka Loop Line', ＪＲゆめ咲線: 'JR Yumesaki Line',
  ＪＲ山陽本線: "JR San'yō Line", ＪＲ宮島航路: 'JR Miyajima Ferry', ＪＲ奈良線: 'JR Nara Line', ＪＲ嵯峨野線: 'JR Sagano Line', ＪＲ大和路線: 'JR Yamatoji Line', ＪＲ東西線: 'JR Tōzai Line',
  りんかい線: 'Rinkai Line', ゆりかもめ: 'Yurikamome', 箱根登山線: 'Hakone Tozan Line', 箱根登山ケーブルカー: 'Hakone Tozan Cable Car', 箱根ロープウェイ: 'Hakone Ropeway',
  京阪本線: 'Keihan Main Line', 阪急京都本線: 'Hankyu Kyoto Line', 阪神なんば線: 'Hanshin Namba Line', 阪神本線: 'Hanshin Main Line', 近鉄奈良線: 'Kintetsu Nara Line', 近鉄京都線: 'Kintetsu Kyoto Line',
  OsakaMetro御堂筋線: 'Osaka Metro Midōsuji Line', OsakaMetro中央線: 'Osaka Metro Chūō Line', OsakaMetro堺筋線: 'Osaka Metro Sakaisuji Line', OsakaMetro四つ橋線: 'Osaka Metro Yotsubashi Line', OsakaMetro長堀鶴見緑地線: 'Osaka Metro Nagahori Tsurumi-ryokuchi Line',
  京都市営烏丸線: 'Kyoto Subway Karasuma Line', 京都市営東西線: 'Kyoto Subway Tōzai Line', 京急本線: 'Keikyū Main Line', 京急空港線: 'Keikyū Airport Line', 京急: 'Keikyū',
};
const STATION: Record<string, string> = {
  羽田空港第３ターミナル: 'Haneda Airport Terminal 3', 羽田空港第１・第２ターミナル: 'Haneda Airport Terminal 1/2', 明治神宮前: 'Meiji-jingumae', 静岡: 'Shizuoka', 宮島: 'Miyajima pier', 宮島口: 'Miyajimaguchi',
  広電西広島: 'Hiroden Nishi-Hiroshima', 土橋: 'Dobashi', 袋町: 'Fukuromachi', 市ヶ谷: 'Ichigaya', 新宿: 'Shinjuku', 小田原: 'Odawara', 箱根湯本: 'Hakone-Yumoto',
};
const TYPES: Record<string, string> = { ...{ 各停: 'Local', 空港快速: 'Haneda Express', エアポート快特: 'Airport Limited Express', 快特: 'Limited Express' } };
/** Station and line names to English: the dictionaries above, then the rail data's own names. */
export function translator(stations: Map<string, string>, lines: Map<string, string>) {
  const half = (s: string) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  const bare = (s: string) => s.replace(/[（(〔［].*?[）)〕］]/g, '').replace(/駅$/, '').trim();
  const station = (ja: string) => STATION[bare(ja)] ?? stations.get(ja) ?? stations.get(bare(ja)) ?? bare(ja);
  const allTypes = { ...TYPE, ...TYPES };
  const line = (ja: string) => {
    const base = half(ja.replace(/（.*?）/g, '').trim());
    const train = Object.keys(TRAIN).find((k) => base.startsWith(k));
    if (train) return TRAIN[train];
    const tram = base.match(/^広島電鉄(\d+)号線/);
    if (tram) return `Hiroden streetcar Line ${tram[1]}`;
    const kind = Object.keys(allTypes).sort((a, b) => b.length - a.length).find((k) => base.endsWith(k) && base.length > k.length);
    const core = kind ? base.slice(0, -kind.length) : base;
    const en = LINE[core] ?? lines.get(core);
    return en ? `${en}${kind ? ` (${allTypes[kind]})` : ''}` : ja;
  };
  return { station, line };
}

type Section = { type?: string; move?: string; name?: string; line_name?: string; from_time?: string; to_time?: string; transport?: { name?: string; color?: string; type?: string; company?: { name?: string } } };
type Item = { summary?: { move?: { from_time?: string; to_time?: string; time?: number; transit_count?: number; fare?: Record<string, number>; reference_fare?: Record<string, number> } }; sections?: Section[] };
/** One NAVITIME item → a compact route (a through train listed twice is joined into one ride). */
export function normalize(item: Item, english: (ja: string) => string = (s) => s): Route | null {
  const mv = item.summary?.move;
  if (!mv?.from_time || !mv.to_time) return null;
  const secs = item.sections ?? [];
  const rides: Ride[] = [];
  secs.forEach((s, i) => {
    if (s.type !== 'move' || !s.move || s.move === 'walk') return;
    const ride: Ride = {
      line: s.line_name ?? s.transport?.name ?? s.move,
      type: s.transport?.type ? TYPE[s.transport.type] ?? s.transport.type : s.move === 'superexpress_train' ? 'Shinkansen' : null,
      company: s.transport?.company?.name ? COMPANY[s.transport.company.name] ?? s.transport.company.name : null,
      colour: s.transport?.color ?? null, from: english(secs[i - 1]?.name ?? ''), to: english(secs[i + 1]?.name ?? ''), dep: s.from_time ?? '', arr: s.to_time ?? '',
    };
    const last = rides.at(-1);
    if (last && last.line === ride.line && last.arr === ride.dep && last.to === ride.from) { last.to = ride.to; last.arr = ride.arr; }
    else rides.push(ride);
  });
  const fare = mv.reference_fare?.lowest_total_ticket ?? mv.fare?.unit_0 ?? null;
  const dep = rides[0]?.dep || mv.from_time;
  const arr = rides.at(-1)?.arr || mv.to_time;
  return { dep, arr, minutes: Math.round((Date.parse(arr) - Date.parse(dep)) / 60000), fare, transfers: Math.max(0, rides.length - 1), rides };
}
