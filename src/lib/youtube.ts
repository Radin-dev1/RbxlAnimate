/** YouTube helpers — client-side title inference (no video download on static Pages). */

export function parseYoutubeId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v && v.length === 11) return v;
      const parts = u.pathname.split("/");
      const embed = parts.indexOf("embed");
      if (embed >= 0 && parts[embed + 1]?.length === 11) return parts[embed + 1];
      const shorts = parts.indexOf("shorts");
      if (shorts >= 0 && parts[shorts + 1]?.length === 11) return parts[shorts + 1];
    }
  } catch {
    return null;
  }
  return null;
}

export interface YoutubeMeta {
  id: string;
  title: string;
  thumbnail: string;
  inferredPrompt: string;
}

/** Map video title (+ notes) into a motion prompt the generator understands */
export function inferMotionFromTitle(title: string, notes = ""): string {
  const t = `${title} ${notes}`.toLowerCase();
  if (/\b(back\s*flip|backflip)\b/.test(t)) return "backflip";
  if (/\b(front\s*flip|frontflip)\b/.test(t)) return "frontflip";
  if (/\b(cart\s*wheel|cartwheel)\b/.test(t)) return "cartwheel";
  if (/\b(sword|katana|blade)\b/.test(t)) return "slash then block then slash";
  if (/\b(box|mma|fight|versus|vs\.?|duel|brawl)\b/.test(t)) return "punch then dodge then kick then punch";
  if (/\b(dance|tiktok|trend|griddy|floss)\b/.test(t)) return "dance then spin then victory";
  if (/\b(wave|hello|greet)\b/.test(t)) return "wave then point";
  if (/\b(walk|parkour|run|sprint)\b/.test(t)) return /run|sprint/.test(t) ? "run" : "walk";
  if (/\b(jump|leap)\b/.test(t)) return "jump then land hop";
  if (/\b(emote|roblox)\b/.test(t)) return "dance then flex then victory";
  // Fallback: use notes if present, else a varied combat/emote mix from title hash
  if (notes.trim()) return notes.trim();
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
  const pool = [
    "spin then kick then victory",
    "wave both arms then bow",
    "punch then dodge then slash",
    "backflip then celebrate",
    "dance then clap then flex",
  ];
  return pool[h % pool.length];
}

export async function fetchYoutubeMeta(urlOrId: string, notes = ""): Promise<YoutubeMeta | null> {
  const id = parseYoutubeId(urlOrId);
  if (!id) return null;
  const watch = `https://www.youtube.com/watch?v=${id}`;
  const thumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  let title = `YouTube ${id}`;
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`);
    if (res.ok) {
      const data = (await res.json()) as { title?: string };
      if (data.title) title = data.title;
    }
  } catch {
    // oEmbed may fail CORS in some environments — still proceed with id
  }
  return {
    id,
    title,
    thumbnail,
    inferredPrompt: inferMotionFromTitle(title, notes),
  };
}
