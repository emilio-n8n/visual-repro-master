import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft, Download, Loader2, Save, Wand2, ChevronDown,
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Heading1, Heading2, AlignLeft, AlignCenter, AlignRight, Link2,
  Plus, Trash2, Sparkles,
} from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import {
  Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";

type Artifact = {
  id: string;
  type: "slideshow" | "spreadsheet" | "dataviz" | "website" | "document" | "moodboard";
  title: string;
  content: string;
  mime_type: string;
};

export default function Studio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [a, setA] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("artifacts").select("id, type, title, content, mime_type").eq("id", id).maybeSingle()
      .then(({ data }) => {
        setA(data as Artifact | null);
        setEditedContent((data as Artifact | null)?.content ?? "");
        setLoading(false);
      });
  }, [id]);

  const persist = useCallback(async (content: string) => {
    if (!a) return;
    setSaving(true);
    const { error } = await supabase.from("artifacts").update({ content }).eq("id", a.id);
    setSaving(false);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { setA({ ...a, content }); setEditedContent(content); }
  }, [a]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-[#F0EAE0]/60">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement…
      </div>
    );
  }
  if (!a) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center text-[#F0EAE0]/60">
        Livrable introuvable. <Link to="/dashboard/agent" className="ml-2 underline text-[#C4A264]">Retour</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#F0EAE0] flex flex-col">
      <header className="border-b border-[#C4A264]/15 px-4 py-2 flex items-center gap-3 bg-[#0a0a0a] shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-[#F0EAE0]/70">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C4A264]">{a.type}</div>
          <div className="text-sm truncate">{a.title}</div>
        </div>
        {saving && <span className="text-xs text-[#F0EAE0]/40">Enregistrement…</span>}
      </header>

      <div className="flex-1 min-h-0">
        {a.type === "spreadsheet" && (
          <SpreadsheetStudio artifact={a} content={editedContent} onChange={setEditedContent} onSave={persist} />
        )}
        {a.type === "document" && (
          <DocumentStudio artifact={a} content={editedContent} onChange={setEditedContent} onSave={persist} />
        )}
        {(a.type === "slideshow" || a.type === "website" || a.type === "dataviz" || a.type === "moodboard") && (
          <HtmlStudio artifact={a} content={editedContent} onChange={setEditedContent} onSave={persist} />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   AI hook
============================================================ */
async function callAiEdit(artifactId: string, instruction: string, selection: string | null) {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forma-artifact-edit`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ artifactId, instruction, selection }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error ?? "Erreur");
  return data.content as string;
}

/* ============================================================
   Floating "Demander à l'IA" bubble (selection-based)
============================================================ */
function AiBubble({
  containerRef, onApply, busy,
}: {
  containerRef: React.RefObject<HTMLElement>;
  onApply: (instruction: string, selection: string) => Promise<void> | void;
  busy: boolean;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [selection, setSelection] = useState("");

  useEffect(() => {
    function update() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !containerRef.current) { setPos(null); setOpen(false); return; }
      const range = sel.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) { setPos(null); setOpen(false); return; }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) { setPos(null); return; }
      setSelection(sel.toString());
      setPos({ top: rect.top + window.scrollY - 40, left: rect.left + window.scrollX });
    }
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, [containerRef]);

  if (!pos) return null;

  return (
    <div
      style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 50 }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-gray-800 rounded-full shadow-lg border border-gray-200 text-xs hover:bg-gray-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C4A264]" />
          Demander à l'IA
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex items-center gap-1 w-[360px]">
          <Sparkles className="w-4 h-4 text-[#C4A264] shrink-0 ml-1" />
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && text.trim()) {
                await onApply(text.trim(), selection);
                setText(""); setOpen(false);
              }
              if (e.key === "Escape") { setOpen(false); setText(""); }
            }}
            placeholder="Reformule, raccourcis, traduis…"
            className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
          />
          <Button
            size="sm"
            disabled={busy || !text.trim()}
            onClick={async () => {
              await onApply(text.trim(), selection);
              setText(""); setOpen(false);
            }}
            className="h-7 bg-[#C4A264] hover:bg-[#C4A264]/90 text-black text-xs"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "OK"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DOWNLOAD MENU
============================================================ */
function DownloadMenu({ items }: { items: { label: string; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button size="sm" onClick={() => setOpen((o) => !o)} className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black">
        <Download className="w-4 h-4 mr-1" /> Télécharger <ChevronDown className="w-3 h-3 ml-1" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 min-w-[220px] bg-white rounded-md shadow-xl border border-gray-200 py-1">
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => { it.onClick(); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   DOCUMENT STUDIO  (rich text, Word-like)
============================================================ */
function DocumentStudio({
  artifact, content, onChange, onSave,
}: {
  artifact: Artifact;
  content: string;
  onChange: (s: string) => void;
  onSave: (c: string) => Promise<void>;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  // Initialize editor once
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === "") {
      // If content is markdown-like or plain, try to render. If looks like HTML, inject directly.
      const looksHtml = /<\w+[\s>]/.test(content);
      editorRef.current.innerHTML = looksHtml ? content : mdLikeToHtml(content);
    }
  }, [content]);

  function exec(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }

  function onInput() {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  async function aiApply(instruction: string, selection: string) {
    setBusy(true);
    try {
      const updated = await callAiEdit(artifact.id, instruction, selection || null);
      if (editorRef.current) {
        editorRef.current.innerHTML = /<\w+[\s>]/.test(updated) ? updated : mdLikeToHtml(updated);
        onChange(editorRef.current.innerHTML);
        await onSave(editorRef.current.innerHTML);
      }
      toast({ title: "Modification appliquée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  // === EXPORTS ===
  function exportHtml() {
    const html = `<!doctype html><meta charset="utf-8"><title>${escapeHtml(artifact.title)}</title>
<style>body{font-family:Georgia,serif;max-width:780px;margin:40px auto;padding:0 24px;line-height:1.6;color:#222}h1{font-family:'Helvetica Neue',Arial,sans-serif}</style>
<h1>${escapeHtml(artifact.title)}</h1>${editorRef.current?.innerHTML ?? ""}`;
    saveAs(new Blob([html], { type: "text/html;charset=utf-8" }), `${safeName(artifact.title)}.html`);
  }

  function exportPdf() {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 56;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let y = margin;

    // Title
    pdf.setFont("times", "bold"); pdf.setFontSize(22);
    pdf.text(artifact.title, margin, y); y += 30;

    const blocks = htmlToBlocks(editorRef.current?.innerHTML ?? "");
    for (const b of blocks) {
      const { font, size, style, text, indent, bullet } = b;
      pdf.setFont(font, style); pdf.setFontSize(size);
      const indentPx = (indent ?? 0) * 14;
      const prefix = bullet ? "• " : "";
      const lines = pdf.splitTextToSize(prefix + text, pageWidth - margin * 2 - indentPx);
      for (const line of lines) {
        if (y > pageHeight - margin) { pdf.addPage(); y = margin; }
        pdf.text(line, margin + indentPx, y);
        y += size * 1.4;
      }
      y += b.spaceAfter ?? 6;
    }
    pdf.save(`${safeName(artifact.title)}.pdf`);
  }

  async function exportDocx() {
    const blocks = htmlToBlocks(editorRef.current?.innerHTML ?? "");
    const children: Paragraph[] = [
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: artifact.title, bold: true, size: 44 })],
      }),
    ];
    for (const b of blocks) {
      const heading =
        b.heading === 1 ? HeadingLevel.HEADING_1 :
        b.heading === 2 ? HeadingLevel.HEADING_2 :
        b.heading === 3 ? HeadingLevel.HEADING_3 : undefined;
      children.push(new Paragraph({
        heading,
        bullet: b.bullet ? { level: 0 } : undefined,
        alignment: AlignmentType.LEFT,
        children: [new TextRun({
          text: b.text,
          bold: b.style === "bold" || b.style === "bolditalic",
          italics: b.style === "italic" || b.style === "bolditalic",
          size: b.heading ? undefined : 24,
        })],
      }));
    }
    const doc = new DocxDocument({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${safeName(artifact.title)}.docx`);
  }

  function exportMd() {
    const md = htmlToMarkdown(editorRef.current?.innerHTML ?? "");
    saveAs(new Blob([`# ${artifact.title}\n\n${md}`], { type: "text/markdown" }), `${safeName(artifact.title)}.md`);
  }

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-[#C4A264]/15 bg-[#0a0a0a] px-3 py-1.5 shrink-0">
        <ToolbarSelect
          options={[
            { label: "Paragraphe", value: "P" },
            { label: "Titre 1", value: "H1" },
            { label: "Titre 2", value: "H2" },
            { label: "Titre 3", value: "H3" },
          ]}
          onChange={(v) => exec("formatBlock", v)}
        />
        <Sep />
        <TbBtn icon={<Bold className="w-3.5 h-3.5" />} onClick={() => exec("bold")} />
        <TbBtn icon={<Italic className="w-3.5 h-3.5" />} onClick={() => exec("italic")} />
        <TbBtn icon={<UnderlineIcon className="w-3.5 h-3.5" />} onClick={() => exec("underline")} />
        <Sep />
        <TbBtn icon={<List className="w-3.5 h-3.5" />} onClick={() => exec("insertUnorderedList")} />
        <TbBtn icon={<ListOrdered className="w-3.5 h-3.5" />} onClick={() => exec("insertOrderedList")} />
        <Sep />
        <TbBtn icon={<AlignLeft className="w-3.5 h-3.5" />} onClick={() => exec("justifyLeft")} />
        <TbBtn icon={<AlignCenter className="w-3.5 h-3.5" />} onClick={() => exec("justifyCenter")} />
        <TbBtn icon={<AlignRight className="w-3.5 h-3.5" />} onClick={() => exec("justifyRight")} />
        <Sep />
        <TbBtn icon={<Link2 className="w-3.5 h-3.5" />} onClick={() => {
          const url = prompt("URL du lien"); if (url) exec("createLink", url);
        }} />
        <Sep />
        <TbBtn icon={<Heading1 className="w-3.5 h-3.5" />} onClick={() => exec("formatBlock", "H1")} />
        <TbBtn icon={<Heading2 className="w-3.5 h-3.5" />} onClick={() => exec("formatBlock", "H2")} />

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onSave(editorRef.current?.innerHTML ?? "")} className="text-[#F0EAE0]/70">
            <Save className="w-3.5 h-3.5 mr-1" /> Enregistrer
          </Button>
          <DownloadMenu items={[
            { label: "Document Word (.docx)", onClick: exportDocx },
            { label: "PDF (.pdf)", onClick: exportPdf },
            { label: "HTML (.html)", onClick: exportHtml },
            { label: "Markdown (.md)", onClick: exportMd },
          ]} />
        </div>
      </div>

      {/* Editor canvas - paper look */}
      <div className="flex-1 overflow-auto py-8">
        <div className="max-w-[820px] mx-auto bg-white shadow-xl rounded-sm">
          <h1 className="px-16 pt-14 pb-2 text-4xl font-bold text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
            {artifact.title}
          </h1>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={onInput}
            onBlur={() => onSave(editorRef.current?.innerHTML ?? "")}
            className="px-16 pb-20 pt-4 min-h-[800px] outline-none text-gray-800 prose-doc"
            style={{ fontFamily: "Georgia, serif", fontSize: "15px", lineHeight: 1.7 }}
          />
        </div>
      </div>

      <AiBubble containerRef={editorRef} onApply={aiApply} busy={busy} />
      <style>{`
        .prose-doc h1 { font-family: 'Helvetica Neue',Arial,sans-serif; font-size:28px; font-weight:700; margin:1.2em 0 .4em; color:#111; }
        .prose-doc h2 { font-family: 'Helvetica Neue',Arial,sans-serif; font-size:22px; font-weight:700; margin:1.2em 0 .4em; color:#111; }
        .prose-doc h3 { font-family: 'Helvetica Neue',Arial,sans-serif; font-size:18px; font-weight:700; margin:1em 0 .3em; color:#222; }
        .prose-doc p { margin: 0 0 1em; }
        .prose-doc ul { list-style: disc; padding-left: 1.5em; margin: 0 0 1em; }
        .prose-doc ol { list-style: decimal; padding-left: 1.5em; margin: 0 0 1em; }
        .prose-doc li { margin: .25em 0; }
        .prose-doc a { color: #2563eb; text-decoration: underline; }
        .prose-doc strong { font-weight: 700; }
        .prose-doc em { font-style: italic; }
      `}</style>
    </div>
  );
}

function TbBtn({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="p-1.5 rounded hover:bg-[#C4A264]/15 text-[#F0EAE0]/80 hover:text-[#C4A264]">
      {icon}
    </button>
  );
}
function Sep() { return <div className="w-px h-5 bg-[#C4A264]/15 mx-1" />; }
function ToolbarSelect({ options, onChange }: { options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <select onChange={(e) => onChange(e.target.value)}
      className="bg-[#0a0a0a] border border-[#C4A264]/20 text-[#F0EAE0]/80 text-xs px-2 py-1 rounded">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ============================================================
   SPREADSHEET STUDIO  (real grid)
============================================================ */
function SpreadsheetStudio({
  artifact, content, onChange, onSave,
}: {
  artifact: Artifact;
  content: string;
  onChange: (s: string) => void;
  onSave: (c: string) => Promise<void>;
}) {
  const [grid, setGrid] = useState<string[][]>(() => parseCsv(content));
  const [busy, setBusy] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setGrid(parseCsv(content)); }, [content]);

  function commit(g: string[][]) {
    setGrid(g);
    const csv = toCsv(g);
    onChange(csv);
  }
  function setCell(r: number, c: number, v: string) {
    const g = grid.map((row) => [...row]);
    while (g.length <= r) g.push(new Array(g[0]?.length ?? 1).fill(""));
    while (g[r].length <= c) g[r].push("");
    g[r][c] = v;
    commit(g);
  }
  function addRow() { commit([...grid, new Array(grid[0]?.length ?? 3).fill("")]); }
  function addCol() { commit(grid.map((r) => [...r, ""])); }
  function delRow(r: number) { if (grid.length <= 1) return; commit(grid.filter((_, i) => i !== r)); }
  function delCol(c: number) { if ((grid[0]?.length ?? 0) <= 1) return; commit(grid.map((row) => row.filter((_, i) => i !== c))); }

  async function runAi() {
    if (!aiPrompt.trim()) return;
    setBusy(true);
    try {
      const updated = await callAiEdit(artifact.id, aiPrompt.trim(), null);
      const g = parseCsv(updated);
      setGrid(g); onChange(toCsv(g));
      await onSave(toCsv(g));
      setAiPrompt("");
      toast({ title: "Tableur mis à jour" });
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  }

  function exportXlsx() {
    const ws = XLSX.utils.aoa_to_sheet(grid);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Données");
    XLSX.writeFile(wb, `${safeName(artifact.title)}.xlsx`);
  }
  function exportCsv() {
    saveAs(new Blob([toCsv(grid)], { type: "text/csv;charset=utf-8" }), `${safeName(artifact.title)}.csv`);
  }
  function exportPdf() {
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
    const margin = 30;
    const colW = (pdf.internal.pageSize.getWidth() - margin * 2) / (grid[0]?.length || 1);
    let y = margin;
    pdf.setFontSize(14); pdf.setFont("helvetica", "bold");
    pdf.text(artifact.title, margin, y); y += 24;
    pdf.setFontSize(9);
    grid.forEach((row, ri) => {
      pdf.setFont("helvetica", ri === 0 ? "bold" : "normal");
      row.forEach((cell, ci) => {
        const lines = pdf.splitTextToSize(String(cell ?? ""), colW - 6);
        pdf.text(lines, margin + ci * colW + 3, y + 12);
      });
      pdf.setDrawColor(220); pdf.line(margin, y + 18, pdf.internal.pageSize.getWidth() - margin, y + 18);
      y += 22;
      if (y > pdf.internal.pageSize.getHeight() - margin) { pdf.addPage(); y = margin; }
    });
    pdf.save(`${safeName(artifact.title)}.pdf`);
  }

  const cols = Math.max(1, ...grid.map((r) => r.length));

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-[#C4A264]/15 bg-[#0a0a0a] px-3 py-1.5 shrink-0">
        <Button size="sm" variant="ghost" onClick={addRow} className="text-[#F0EAE0]/80 hover:text-[#C4A264] text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Ligne
        </Button>
        <Button size="sm" variant="ghost" onClick={addCol} className="text-[#F0EAE0]/80 hover:text-[#C4A264] text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Colonne
        </Button>
        <Sep />
        <div className="flex items-center gap-1 flex-1 max-w-md">
          <Sparkles className="w-3.5 h-3.5 text-[#C4A264]" />
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runAi(); }}
            placeholder="Demander à l'IA : trier, ajouter une colonne 'total', remplir les valeurs manquantes…"
            className="flex-1 bg-[#1a1a1a] border border-[#C4A264]/20 text-[#F0EAE0] text-xs px-2 py-1 rounded outline-none focus:border-[#C4A264]/60"
          />
          <Button size="sm" disabled={busy || !aiPrompt.trim()} onClick={runAi} className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black h-7 text-xs">
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onSave(toCsv(grid))} className="text-[#F0EAE0]/70 text-xs">
            <Save className="w-3.5 h-3.5 mr-1" /> Enregistrer
          </Button>
          <DownloadMenu items={[
            { label: "Excel (.xlsx)", onClick: exportXlsx },
            { label: "CSV (.csv)", onClick: exportCsv },
            { label: "PDF (.pdf)", onClick: exportPdf },
          ]} />
        </div>
      </div>

      {/* Grid */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-[#fafafa]">
        <table className="border-collapse text-sm" style={{ fontFamily: "Inter,system-ui,sans-serif" }}>
          <thead>
            <tr>
              <th className="w-10 bg-[#eef0f2] border border-[#d0d4da] sticky top-0 left-0 z-20" />
              {Array.from({ length: cols }).map((_, c) => (
                <th key={c} className="min-w-[140px] h-7 bg-[#eef0f2] border border-[#d0d4da] text-xs text-gray-600 font-medium sticky top-0 z-10 group relative">
                  {colLetter(c)}
                  <button onClick={() => delCol(c)} className="opacity-0 group-hover:opacity-100 absolute right-1 top-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, r) => (
              <tr key={r} className="group">
                <td className="w-10 h-8 bg-[#eef0f2] border border-[#d0d4da] text-xs text-gray-600 text-center font-medium sticky left-0 z-10 relative">
                  {r + 1}
                  <button onClick={() => delRow(r)} className="opacity-0 group-hover:opacity-100 absolute right-1 top-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="border border-[#d0d4da] p-0 bg-white" style={{ minWidth: 140 }}>
                    <input
                      value={row[c] ?? ""}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      onBlur={() => onSave(toCsv(grid))}
                      className={`w-full h-8 px-2 text-sm bg-transparent outline-none focus:bg-[#fff8e5] focus:ring-2 focus:ring-[#C4A264]/40 ${r === 0 ? "font-semibold text-gray-800" : "text-gray-700"}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   HTML STUDIO  (slideshow / website / dataviz)
============================================================ */
function HtmlStudio({
  artifact, content, onChange, onSave,
}: {
  artifact: Artifact;
  content: string;
  onChange: (s: string) => void;
  onSave: (c: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  async function runAi() {
    if (!aiPrompt.trim()) return;
    setBusy(true);
    try {
      const updated = await callAiEdit(artifact.id, aiPrompt.trim(), null);
      onChange(updated); await onSave(updated);
      setAiPrompt("");
      toast({ title: "Mis à jour" });
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  }

  function exportHtml() {
    saveAs(new Blob([content], { type: "text/html;charset=utf-8" }), `${safeName(artifact.title)}.html`);
  }
  async function exportPdf() {
    // True PDF via jsPDF using iframe text content per slide/section. For complex HTML we capture via html2canvas-like approach: use jsPDF.html() if available.
    const w = 595, h = 842; // A4 pt
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      // jsPDF.html supports rendering HTML elements; use the iframe document body
      const body = iframe.contentDocument?.body;
      if (!body) throw new Error("Aperçu non prêt");
      await (pdf as any).html(body, {
        x: 0, y: 0,
        width: w,
        windowWidth: body.scrollWidth || 1100,
        autoPaging: "text",
      });
      pdf.save(`${safeName(artifact.title)}.pdf`);
    } catch (e: any) {
      toast({ title: "Export PDF impossible", description: e.message, variant: "destructive" });
    }
  }
  async function exportPng() {
    const html2canvas = (await import("html2canvas")).default;
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument?.body) return;
    const canvas = await html2canvas(iframe.contentDocument.body, { backgroundColor: "#fff", scale: 1.5, useCORS: true });
    canvas.toBlob((blob) => { if (blob) saveAs(blob, `${safeName(artifact.title)}.png`); });
  }

  const items = artifact.type === "spreadsheet"
    ? []
    : [
        { label: "PDF (.pdf)", onClick: exportPdf },
        { label: "Image (.png)", onClick: exportPng },
        { label: "HTML (.html)", onClick: exportHtml },
      ];

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      <div className="flex items-center gap-2 border-b border-[#C4A264]/15 bg-[#0a0a0a] px-3 py-1.5 shrink-0">
        <div className="flex items-center gap-1 flex-1 max-w-xl">
          <Sparkles className="w-3.5 h-3.5 text-[#C4A264]" />
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runAi(); }}
            placeholder="Demander à l'IA : change les couleurs, ajoute une slide, simplifie…"
            className="flex-1 bg-[#1a1a1a] border border-[#C4A264]/20 text-[#F0EAE0] text-xs px-2 py-1 rounded outline-none focus:border-[#C4A264]/60"
          />
          <Button size="sm" disabled={busy || !aiPrompt.trim()} onClick={runAi} className="bg-[#C4A264] hover:bg-[#C4A264]/90 text-black h-7 text-xs">
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
          </Button>
        </div>
        <div className="ml-auto"><DownloadMenu items={items} /></div>
      </div>
      <div className="flex-1 p-4">
        <iframe ref={iframeRef} srcDoc={content} title={artifact.title} sandbox="allow-scripts"
          className="w-full h-full bg-white rounded-sm border border-[#C4A264]/15" />
      </div>
    </div>
  );
}

/* ============================================================
   helpers
============================================================ */
function safeName(s: string) { return (s || "livrable").replace(/[^\w-]+/g, "_"); }
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
function colLetter(n: number) {
  let s = ""; n = n + 1;
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
function parseCsv(text: string): string[][] {
  if (!text?.trim()) return [["", "", ""], ["", "", ""], ["", "", ""]];
  const rows: string[][] = []; let row: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (c === "\r") {} else cur += c;
    }
  }
  row.push(cur); rows.push(row);
  return rows.filter((r, i) => i < rows.length - 1 || r.some((v) => v !== ""));
}
function toCsv(g: string[][]) {
  return g.map((r) => r.map((c) => /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c).join(",")).join("\n");
}
function mdLikeToHtml(s: string) {
  // very small fallback if content is plain text
  return s.split(/\n{2,}/).map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("");
}

type Block = {
  text: string;
  font: "times" | "helvetica";
  size: number;
  style: "normal" | "bold" | "italic" | "bolditalic";
  heading?: 1 | 2 | 3;
  bullet?: boolean;
  indent?: number;
  spaceAfter?: number;
};

function htmlToBlocks(html: string): Block[] {
  const div = document.createElement("div"); div.innerHTML = html;
  const out: Block[] = [];
  function walk(node: Node, ctx: Partial<Block>) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent ?? "").replace(/\s+/g, " ");
      if (t.trim()) out.push({
        text: t, font: ctx.font ?? "times", size: ctx.size ?? 12,
        style: ctx.style ?? "normal", heading: ctx.heading, bullet: ctx.bullet,
        indent: ctx.indent, spaceAfter: ctx.spaceAfter,
      });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName;
    let next = { ...ctx };
    if (tag === "H1") next = { font: "helvetica", size: 20, style: "bold", heading: 1, spaceAfter: 12 };
    else if (tag === "H2") next = { font: "helvetica", size: 16, style: "bold", heading: 2, spaceAfter: 10 };
    else if (tag === "H3") next = { font: "helvetica", size: 13, style: "bold", heading: 3, spaceAfter: 8 };
    else if (tag === "STRONG" || tag === "B") next.style = next.style === "italic" ? "bolditalic" : "bold";
    else if (tag === "EM" || tag === "I") next.style = next.style === "bold" ? "bolditalic" : "italic";
    else if (tag === "LI") { next.bullet = true; next.indent = (next.indent ?? 0) + 1; }
    else if (tag === "P" || tag === "DIV") next.spaceAfter = 8;
    el.childNodes.forEach((c) => walk(c, next));
    if (tag === "P" || tag === "LI" || tag === "DIV" || tag === "H1" || tag === "H2" || tag === "H3") {
      // ensure a paragraph break by appending a zero-width if no text was emitted
    }
  }
  div.childNodes.forEach((c) => walk(c, {}));
  return out;
}

function htmlToMarkdown(html: string): string {
  const div = document.createElement("div"); div.innerHTML = html;
  function w(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const inner = Array.from(el.childNodes).map(w).join("");
    switch (el.tagName) {
      case "H1": return `\n# ${inner}\n\n`;
      case "H2": return `\n## ${inner}\n\n`;
      case "H3": return `\n### ${inner}\n\n`;
      case "STRONG": case "B": return `**${inner}**`;
      case "EM": case "I": return `*${inner}*`;
      case "LI": return `- ${inner}\n`;
      case "UL": case "OL": return `\n${inner}\n`;
      case "BR": return `\n`;
      case "P": case "DIV": return `${inner}\n\n`;
      case "A": return `[${inner}](${el.getAttribute("href") ?? ""})`;
      default: return inner;
    }
  }
  return Array.from(div.childNodes).map(w).join("").replace(/\n{3,}/g, "\n\n").trim();
}
