const API_BASE = import.meta.env.VITE_API_BASE ?? "https://book-data-analizer-api.vercel.app";

export type AskResult = { answer: string; via: "remote" };

export async function askChatGPT(question: string, dataSample: any[], companies?: string[]): Promise<AskResult> {
  const r = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, data: dataSample, companies }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error ?? "Remote error");
  return j; // { answer, via: "remote" }
}

export async function pingChat(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/api/ping`, { method: "GET" });
    return r.ok;
  } catch {
    return false;
  }
}
