import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Users, FolderKanban, MessageSquare, Image as ImageIcon, FileText, Brain, Building2, RefreshCw, LogOut } from "lucide-react";

const ACCESS_CODE = "120512";
const STORAGE_KEY = "forma_admin_access";

const COLORS = {
  bg: "#0a0908",
  surface: "#13110f",
  ivory: "#F0EAE0",
  ivoryDim: "rgba(240,234,224,0.55)",
  gold: "#C4A264",
  border: "rgba(240,234,224,0.08)",
};
const fontSerif = "'Cormorant Garamond', serif";

type Stats = {
  users: number;
  workspaces: number;
  projects: number;
  conversations: number;
  messages: number;
  renders: number;
  artifacts: number;
  memories: number;
};

type Row = Record<string, any>;

export default function Admin() {
  const [granted, setGranted] = useState(() => sessionStorage.getItem(STORAGE_KEY) === "1");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<Row[]>([]);
  const [workspaces, setWorkspaces] = useState<Row[]>([]);
  const [projects, setProjects] = useState<Row[]>([]);
  const [recent, setRecent] = useState<Row[]>([]);
  const [tab, setTab] = useState<"overview" | "users" | "workspaces" | "projects" | "activity">("overview");

  useEffect(() => {
    document.title = "FORMA · Admin";
  }, []);

  useEffect(() => {
    if (granted) load();
  }, [granted]);

  const load = async () => {
    setLoading(true);
    try {
      const tables = [
        "profiles", "workspaces", "projects", "conversations",
        "messages", "renders", "artifacts", "memories",
      ] as const;
      const counts = await Promise.all(
        tables.map((t) => supabase.from(t as any).select("id", { count: "exact", head: true }))
      );
      setStats({
        users: counts[0].count ?? 0,
        workspaces: counts[1].count ?? 0,
        projects: counts[2].count ?? 0,
        conversations: counts[3].count ?? 0,
        messages: counts[4].count ?? 0,
        renders: counts[5].count ?? 0,
        artifacts: counts[6].count ?? 0,
        memories: counts[7].count ?? 0,
      });

      const [u, w, p, m] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("workspaces").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("messages").select("id, role, content, created_at, conversation_id").order("created_at", { ascending: false }).limit(50),
      ]);
      setUsers(u.data ?? []);
      setWorkspaces(w.data ?? []);
      setProjects(p.data ?? []);
      setRecent(m.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setGranted(true);
      setErr("");
    } else {
      setErr("Code incorrect.");
    }
  };

  const lock = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setGranted(false);
    setCode("");
  };

  if (!granted) {
    return (
      <div style={{ background: COLORS.bg, color: COLORS.ivory, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui" }}>
        <form onSubmit={submit} style={{ width: "100%", maxWidth: 380, border: `1px solid ${COLORS.border}`, background: COLORS.surface, padding: 36, borderRadius: 8 }}>
          <Lock size={20} style={{ color: COLORS.gold, marginBottom: 16 }} />
          <h1 style={{ fontFamily: fontSerif, fontSize: 28, fontWeight: 400, marginBottom: 8 }}>Espace administrateur</h1>
          <p style={{ color: COLORS.ivoryDim, fontSize: 13, marginBottom: 24 }}>Saisissez le code d'accès pour continuer.</p>
          <input
            type="password"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
            placeholder="••••••"
            style={{
              width: "100%", padding: "12px 14px", background: COLORS.bg,
              border: `1px solid ${COLORS.border}`, color: COLORS.ivory,
              fontSize: 18, letterSpacing: "0.5em", textAlign: "center", borderRadius: 4,
              outline: "none",
            }}
          />
          {err && <div style={{ color: "#e07a5f", fontSize: 12, marginTop: 10 }}>{err}</div>}
          <button type="submit" style={{ marginTop: 20, width: "100%", padding: "12px", background: COLORS.gold, color: COLORS.bg, border: "none", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", borderRadius: 4 }}>
            Entrer
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, color: COLORS.ivory, minHeight: "100vh", fontFamily: "system-ui" }}>
      <header style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.surface }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: COLORS.gold }}>FORMA · Admin</div>
          <h1 style={{ fontFamily: fontSerif, fontSize: 26, fontWeight: 400, marginTop: 2 }}>Tableau de bord global</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={load} disabled={loading} style={btn()}>
            <RefreshCw size={14} style={{ marginRight: 6, animation: loading ? "spin 1s linear infinite" : undefined }} />
            Rafraîchir
          </button>
          <button onClick={lock} style={btn()}>
            <LogOut size={14} style={{ marginRight: 6 }} /> Verrouiller
          </button>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </header>

      <nav style={{ display: "flex", gap: 0, borderBottom: `1px solid ${COLORS.border}`, padding: "0 32px", background: COLORS.surface }}>
        {[
          ["overview", "Vue d'ensemble"],
          ["users", "Utilisateurs"],
          ["workspaces", "Cabinets"],
          ["projects", "Projets"],
          ["activity", "Activité récente"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k as any)}
            style={{
              padding: "14px 20px",
              background: "transparent",
              border: "none",
              color: tab === k ? COLORS.gold : COLORS.ivoryDim,
              borderBottom: tab === k ? `2px solid ${COLORS.gold}` : "2px solid transparent",
              fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <main style={{ padding: 32, maxWidth: 1400, margin: "0 auto" }}>
        {tab === "overview" && stats && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
              <Stat icon={<Users size={16} />} label="Utilisateurs" value={stats.users} />
              <Stat icon={<Building2 size={16} />} label="Cabinets" value={stats.workspaces} />
              <Stat icon={<FolderKanban size={16} />} label="Projets" value={stats.projects} />
              <Stat icon={<MessageSquare size={16} />} label="Conversations" value={stats.conversations} />
              <Stat icon={<MessageSquare size={16} />} label="Messages" value={stats.messages} />
              <Stat icon={<ImageIcon size={16} />} label="Rendus" value={stats.renders} />
              <Stat icon={<FileText size={16} />} label="Documents" value={stats.artifacts} />
              <Stat icon={<Brain size={16} />} label="Mémoires" value={stats.memories} />
            </div>
            <Section title="Derniers cabinets créés">
              <Table rows={workspaces.slice(0, 8)} cols={["name", "created_at"]} />
            </Section>
            <Section title="Derniers projets">
              <Table rows={projects.slice(0, 8)} cols={["name", "status", "created_at"]} />
            </Section>
          </>
        )}

        {tab === "users" && (
          <Section title={`Utilisateurs (${users.length})`}>
            <Table rows={users} cols={["full_name", "email", "onboarded", "created_at"]} />
          </Section>
        )}

        {tab === "workspaces" && (
          <Section title={`Cabinets (${workspaces.length})`}>
            <Table rows={workspaces} cols={["name", "owner_id", "created_at"]} />
          </Section>
        )}

        {tab === "projects" && (
          <Section title={`Projets (${projects.length})`}>
            <Table rows={projects} cols={["name", "status", "workspace_id", "created_at"]} />
          </Section>
        )}

        {tab === "activity" && (
          <Section title="Derniers messages (50)">
            <Table rows={recent.map(r => ({ ...r, content: String(r.content ?? "").slice(0, 120) }))} cols={["role", "content", "created_at"]} />
          </Section>
        )}
      </main>
    </div>
  );
}

function btn(): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center",
    padding: "8px 14px", background: "transparent",
    border: `1px solid ${COLORS.border}`, color: COLORS.ivory,
    fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase",
    cursor: "pointer", borderRadius: 4,
  };
}

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div style={{ padding: 20, border: `1px solid ${COLORS.border}`, background: COLORS.surface, borderRadius: 6 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.gold, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" }}>
      {icon} {label}
    </div>
    <div style={{ fontFamily: fontSerif, fontSize: 38, fontWeight: 400, marginTop: 6 }}>
      {value.toLocaleString("fr-FR")}
    </div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 32 }}>
    <h2 style={{ fontFamily: fontSerif, fontSize: 22, fontWeight: 400, marginBottom: 14, color: COLORS.ivory }}>{title}</h2>
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, overflow: "hidden", background: COLORS.surface }}>
      {children}
    </div>
  </section>
);

const Table = ({ rows, cols }: { rows: Row[]; cols: string[] }) => {
  if (!rows.length) return <div style={{ padding: 24, color: COLORS.ivoryDim, fontSize: 13 }}>Aucune donnée.</div>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            {cols.map((c) => (
              <th key={c} style={{ textAlign: "left", padding: "12px 16px", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: COLORS.gold, fontWeight: 500 }}>
                {c.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {cols.map((c) => (
                <td key={c} style={{ padding: "10px 16px", color: COLORS.ivory, verticalAlign: "top" }}>
                  {fmt(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function fmt(v: any): string {
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "✓" : "—";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    return new Date(v).toLocaleString("fr-FR");
  }
  if (typeof v === "object") return JSON.stringify(v).slice(0, 80);
  return String(v);
}
