import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  countWords,
  formatMoney,
  minutesToHuman,
  uid,
  useStore,
  type Client,
} from "@/lib/horas-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Users,
  FileText,
  LayoutDashboard,
  Plus,
  Trash2,
  Download,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/app")({ component: Index });

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <Header />
      <div className="border-b border-amber-200 bg-amber-100 px-4 py-2.5 text-center text-sm text-amber-900">
        <span className="font-medium">⚠️ Prototipo de demostración:</span> no ingreses datos reales. Toda la información mostrada es ficticia y solo se guarda en tu navegador.
      </div>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-1 bg-secondary/60 p-1 sm:grid-cols-5 sm:gap-0">
            <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="h-4 w-4" />Resumen</TabsTrigger>
            <TabsTrigger value="clients" className="gap-2"><Users className="h-4 w-4" />Clientes</TabsTrigger>
            <TabsTrigger value="time" className="gap-2"><Clock className="h-4 w-4" />Horas</TabsTrigger>
            <TabsTrigger value="words" className="gap-2"><Sparkles className="h-4 w-4" />Palabras</TabsTrigger>
            <TabsTrigger value="pdf" className="gap-2"><FileText className="h-4 w-4" />Tarifario</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6"><Dashboard /></TabsContent>
          <TabsContent value="clients" className="mt-6"><Clients /></TabsContent>
          <TabsContent value="time" className="mt-6"><TimeTracker /></TabsContent>
          <TabsContent value="words" className="mt-6"><WordCounter /></TabsContent>
          <TabsContent value="pdf" className="mt-6"><Tarifario /></TabsContent>
        </Tabs>
      </main>
      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        Prototipo HorasClaras v1.1 · datos guardados en tu navegador
      </footer>
    </div>
  );
}

function Header() {
  const { store, reset } = useStore();
  return (
    <header className="border-b border-border/60 bg-card/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="font-display text-xl leading-none">F</span>
          </div>
          <div>
            <h1 className="font-display text-2xl leading-tight sm:text-3xl">HorasClaras</h1>
            <p className="text-xs text-muted-foreground">Hola, {store.profileName} · {store.clients.length} clientes activos</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { reset(); toast.success("Demo restaurada"); }} className="gap-1.5 text-muted-foreground">
          <RotateCcw className="h-3.5 w-3.5" /> Reset demo
        </Button>
      </div>
    </header>
  );
}

// ---------- Dashboard ----------
function Dashboard() {
  const { store } = useStore();
  const month = new Date().toISOString().slice(0, 7);

  const monthEntries = store.entries.filter((e) => e.date.startsWith(month));
  const billableMin = monthEntries.filter((e) => e.kind === "billable").reduce((s, e) => s + e.minutes, 0);
  const planMin = monthEntries.filter((e) => e.kind === "planning").reduce((s, e) => s + e.minutes, 0);
  const monthJobs = store.jobs.filter((j) => j.date.startsWith(month));

  let projected = monthJobs.reduce((s, j) => s + j.pricedAmount, 0);
  for (const e of monthEntries.filter((x) => x.kind === "billable")) {
    const c = store.clients.find((x) => x.id === e.clientId);
    if (c?.type === "hour") projected += (e.minutes / 60) * c.rate;
  }

  const perClient = store.clients.map((c) => {
    const ent = monthEntries.filter((e) => e.clientId === c.id);
    const min = ent.filter((e) => e.kind === "billable").reduce((s, e) => s + e.minutes, 0);
    const planning = ent.filter((e) => e.kind === "planning").reduce((s, e) => s + e.minutes, 0);
    const jobs = monthJobs.filter((j) => j.clientId === c.id);
    const words = jobs.reduce((s, j) => s + j.totalWords, 0);
    const amount = c.type === "hour" ? (min / 60) * c.rate : jobs.reduce((s, j) => s + j.pricedAmount, 0);
    return { client: c, billable: min, planning, words, amount };
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Mes en curso</p>
        <h2 className="font-display text-4xl sm:text-5xl">
          {formatMoney(projected, store.currency)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Ingresos proyectados este mes</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Horas facturables" value={minutesToHuman(billableMin)} tone="primary" />
        <Stat label="Horas planificación" value={minutesToHuman(planMin)} tone="muted" />
        <Stat label="Trabajos por palabra" value={`${monthJobs.length}`} tone="accent" />
      </div>

      <Card className="overflow-hidden border-border/60 p-0">
        <div className="border-b border-border/60 bg-secondary/40 px-5 py-3">
          <h3 className="font-display text-xl">Por cliente</h3>
        </div>
        <div className="divide-y divide-border/60">
          {perClient.length === 0 && <p className="p-6 text-sm text-muted-foreground">Todavía no hay clientes.</p>}
          {perClient.map(({ client, billable, planning, words, amount }) => (
            <div key={client.id} className="grid grid-cols-2 items-center gap-3 px-5 py-4 sm:grid-cols-5">
              <div className="col-span-2 sm:col-span-2">
                <p className="font-medium">{client.name}</p>
                <p className="text-xs text-muted-foreground">
                  {client.type === "hour" ? `${formatMoney(client.rate)}/h` : `${formatMoney(client.rate)}/palabra`}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-foreground">{minutesToHuman(billable)}</p>
                <p className="text-xs text-muted-foreground">facturable</p>
              </div>
              <div className="text-sm">
                <p className="text-foreground">{client.type === "word" ? `${words} palabras` : minutesToHuman(planning)}</p>
                <p className="text-xs text-muted-foreground">{client.type === "word" ? "traducidas" : "planificación"}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl">{formatMoney(amount, "ARS")}</p>
                <p className="text-xs text-muted-foreground">a cobrar</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "primary" | "muted" | "accent" }) {
  const bg = tone === "primary" ? "bg-primary text-primary-foreground" : tone === "accent" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground";
  return (
    <div className={`rounded-2xl ${bg} px-5 py-4`}>
      <p className="text-xs uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}

// ---------- Clientes ----------
function Clients() {
  const { store, update } = useStore();
  const [draft, setDraft] = useState<Partial<Client>>({ type: "hour", pricingMode: "auto", repetitionDiscount: 50 });

  const add = () => {
    if (!draft.name || !draft.rate) return toast.error("Completá nombre y tarifa");
    const c: Client = {
      id: uid(),
      name: draft.name!,
      type: (draft.type as "hour" | "word") ?? "hour",
      rate: Number(draft.rate),
      pricingMode: draft.pricingMode ?? "auto",
      repetitionDiscount: draft.repetitionDiscount ?? 50,
    };
    if (store.clients.length >= 10) return toast.error("Máximo 10 clientes en v1");
    update((s) => ({ ...s, clients: [...s.clients, c] }));
    setDraft({ type: "hour", pricingMode: "auto", repetitionDiscount: 50 });
    toast.success(`${c.name} agregado`);
  };

  const remove = (id: string) => {
    update((s) => ({
      ...s,
      clients: s.clients.filter((c) => c.id !== id),
      entries: s.entries.filter((e) => e.clientId !== id),
      jobs: s.jobs.filter((j) => j.clientId !== id),
    }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="border-border/60 p-0">
        <div className="divide-y divide-border/60">
          {store.clients.map((c) => (
            <div key={c.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.type === "hour" ? `Por hora · ${formatMoney(c.rate)}/h` : `Por palabra · ${formatMoney(c.rate)}/palabra · modo ${c.pricingMode}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(c.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs">Tarifa</Label>
                  <Input
                    type="number"
                    value={c.rate}
                    onChange={(e) =>
                      update((s) => ({
                        ...s,
                        clients: s.clients.map((x) => x.id === c.id ? { ...x, rate: Number(e.target.value) } : x),
                      }))
                    }
                  />
                </div>
                {c.type === "word" && (
                  <div>
                    <Label className="text-xs">% desc. repeticiones</Label>
                    <Input
                      type="number"
                      value={c.repetitionDiscount ?? 50}
                      onChange={(e) =>
                        update((s) => ({
                          ...s,
                          clients: s.clients.map((x) => x.id === c.id ? { ...x, repetitionDiscount: Number(e.target.value) } : x),
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-border/60 p-5">
        <h3 className="font-display text-xl">Nuevo cliente</h3>
        <p className="text-xs text-muted-foreground">Máx 10 en v1 · {store.clients.length}/10</p>
        <div className="mt-4 space-y-3">
          <div>
            <Label>Nombre</Label>
            <Input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Ej: Lucas Pereyra" />
          </div>
          <div>
            <Label>Tipo de tarifa</Label>
            <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as "hour" | "word" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">Por hora</SelectItem>
                <SelectItem value="word">Por palabra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{draft.type === "word" ? "Tarifa por palabra (ARS)" : "Tarifa por hora (ARS)"}</Label>
            <Input type="number" value={draft.rate ?? ""} onChange={(e) => setDraft({ ...draft, rate: Number(e.target.value) })} />
          </div>
          {draft.type === "word" && (
            <>
              <div>
                <Label>Modo de precio</Label>
                <Select value={draft.pricingMode} onValueChange={(v) => setDraft({ ...draft, pricingMode: v as "auto" | "manual" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático (palabras × tarifa)</SelectItem>
                    <SelectItem value="manual">Manual (ajusto yo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>% descuento repeticiones</Label>
                <Input type="number" value={draft.repetitionDiscount ?? 50} onChange={(e) => setDraft({ ...draft, repetitionDiscount: Number(e.target.value) })} />
              </div>
            </>
          )}
          <Button onClick={add} className="w-full gap-2"><Plus className="h-4 w-4" /> Agregar</Button>
        </div>
      </Card>
    </div>
  );
}

// ---------- Horas ----------
function TimeTracker() {
  const { store, update } = useStore();
  const hourClients = store.clients.filter((c) => c.type === "hour");
  const [draft, setDraft] = useState({
    clientId: hourClients[0]?.id ?? "",
    minutes: 60,
    kind: "billable" as "billable" | "planning",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const add = () => {
    if (!draft.clientId) return toast.error("Elegí un cliente");
    update((s) => ({
      ...s,
      entries: [{ id: uid(), ...draft }, ...s.entries],
    }));
    toast.success("Hora registrada");
    setDraft({ ...draft, note: "" });
  };

  const remove = (id: string) =>
    update((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="order-2 border-border/60 p-5 lg:order-1">
        <h3 className="font-display text-xl">Registrar</h3>
        <div className="mt-4 space-y-3">
          <div>
            <Label>Cliente</Label>
            <Select value={draft.clientId} onValueChange={(v) => setDraft({ ...draft, clientId: v })}>
              <SelectTrigger><SelectValue placeholder="Elegí un cliente" /></SelectTrigger>
              <SelectContent>
                {hourClients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {hourClients.length === 0 && <p className="mt-1 text-xs text-muted-foreground">Creá primero un cliente por hora.</p>}
          </div>
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </div>
          <div>
            <Label>Duración (minutos)</Label>
            <Input type="number" value={draft.minutes} onChange={(e) => setDraft({ ...draft, minutes: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v as "billable" | "planning" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="billable">Facturable</SelectItem>
                <SelectItem value="planning">Planificación propia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nota (opcional)</Label>
            <Input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Clase grupal B1…" />
          </div>
          <Button onClick={add} className="w-full gap-2"><Plus className="h-4 w-4" /> Registrar hora</Button>
        </div>
      </Card>

      <Card className="order-1 border-border/60 p-0 lg:order-2">
        <div className="border-b border-border/60 bg-secondary/40 px-5 py-3">
          <h3 className="font-display text-xl">Últimos registros</h3>
        </div>
        <div className="divide-y divide-border/60">
          {store.entries.length === 0 && <p className="p-6 text-sm text-muted-foreground">Sin registros todavía.</p>}
          {store.entries.map((e) => {
            const c = store.clients.find((x) => x.id === e.clientId);
            return (
              <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{e.date} · {e.note || "sin nota"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={e.kind === "billable" ? "default" : "secondary"} className={e.kind === "billable" ? "bg-primary text-primary-foreground" : ""}>
                    {e.kind === "billable" ? "facturable" : "planificación"}
                  </Badge>
                  <span className="w-16 text-right text-sm tabular-nums">{minutesToHuman(e.minutes)}</span>
                  <Button variant="ghost" size="icon" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ---------- Palabras ----------
function WordCounter() {
  const { store, update } = useStore();
  const wordClients = store.clients.filter((c) => c.type === "word");
  const [clientId, setClientId] = useState(wordClients[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [manualPrice, setManualPrice] = useState<number | "">("");

  const client = wordClients.find((c) => c.id === clientId);
  const counts = useMemo(() => countWords(text), [text]);

  const discount = client?.repetitionDiscount ?? 50;
  const billable = counts.total - counts.repeated * (discount / 100);
  const auto = client ? billable * client.rate : 0;

  const finalPrice =
    client?.pricingMode === "manual"
      ? typeof manualPrice === "number" ? manualPrice : auto
      : auto;

  const save = () => {
    if (!client || !text.trim()) return toast.error("Falta cliente o texto");
    update((s) => ({
      ...s,
      jobs: [
        {
          id: uid(),
          clientId: client.id,
          date: new Date().toISOString().slice(0, 10),
          title: title || "Sin título",
          totalWords: counts.total,
          repeatedWords: counts.repeated,
          pricedAmount: Math.round(finalPrice),
        },
        ...s.jobs,
      ],
    }));
    toast.success("Presupuesto guardado");
    setText(""); setTitle(""); setManualPrice("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="border-border/60 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Cliente (por palabra)</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Elegí un cliente" /></SelectTrigger>
              <SelectContent>
                {wordClients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Título del documento</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contrato comercial" />
          </div>
        </div>
        <div className="mt-4">
          <Label>Pegá el texto a traducir</Label>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={14} placeholder="Pegá acá el documento o un fragmento…" className="resize-y" />
        </div>
      </Card>

      <Card className="border-border/60 p-5">
        <h3 className="font-display text-xl">Presupuesto</h3>
        <div className="mt-4 space-y-2 text-sm">
          <Row k="Palabras totales" v={counts.total.toString()} />
          <Row k="Únicas" v={counts.unique.toString()} />
          <Row k="Repeticiones" v={counts.repeated.toString()} />
          <Row k={`Descuento aplicado`} v={`${discount}%`} />
          <Row k="Palabras facturables" v={billable.toFixed(0)} />
          <Row k="Tarifa" v={client ? `${formatMoney(client.rate)}/palabra` : "—"} />
        </div>
        <div className="mt-5 rounded-xl bg-secondary/60 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total {client?.pricingMode === "manual" ? "(editable)" : "automático"}</p>
          {client?.pricingMode === "manual" ? (
            <Input
              type="number"
              className="mt-1 border-0 bg-transparent p-0 font-display !text-3xl shadow-none focus-visible:ring-0"
              value={manualPrice === "" ? Math.round(auto) : manualPrice}
              onChange={(e) => setManualPrice(e.target.value === "" ? "" : Number(e.target.value))}
            />
          ) : (
            <p className="mt-1 font-display text-3xl">{formatMoney(finalPrice, store.currency)}</p>
          )}
        </div>
        <Button onClick={save} className="mt-4 w-full gap-2"><Plus className="h-4 w-4" /> Guardar presupuesto</Button>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium tabular-nums">{v}</span>
    </div>
  );
}

// ---------- Tarifario PDF ----------
function Tarifario() {
  const { store } = useStore();
  const month = new Date().toISOString().slice(0, 7);
  const monthLabel = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const rows = store.clients.map((c) => {
    const ent = store.entries.filter((e) => e.clientId === c.id && e.date.startsWith(month) && e.kind === "billable");
    const min = ent.reduce((s, e) => s + e.minutes, 0);
    const jobs = store.jobs.filter((j) => j.clientId === c.id && j.date.startsWith(month));
    const words = jobs.reduce((s, j) => s + j.totalWords, 0);
    const amount = c.type === "hour" ? (min / 60) * c.rate : jobs.reduce((s, j) => s + j.pricedAmount, 0);
    return { c, min, words, amount };
  });
  const total = rows.reduce((s, r) => s + r.amount, 0);

  const generate = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 60;

    doc.setFont("times", "italic");
    doc.setFontSize(28);
    doc.text("HorasClaras", 50, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Tarifario · ${monthLabel}`, pageW - 50, y, { align: "right" });
    y += 30;

    doc.setTextColor(40);
    doc.setFontSize(12);
    doc.text(store.profileName, 50, y);
    y += 30;

    doc.setDrawColor(220);
    doc.line(50, y, pageW - 50, y);
    y += 20;

    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Cliente", 50, y);
    doc.text("Detalle", 230, y);
    doc.text("Tarifa", 360, y);
    doc.text("Total", pageW - 50, y, { align: "right" });
    y += 8;
    doc.line(50, y, pageW - 50, y);
    y += 18;

    doc.setTextColor(30);
    doc.setFontSize(11);
    for (const r of rows) {
      if (r.amount === 0 && r.min === 0 && r.words === 0) continue;
      doc.text(r.c.name, 50, y);
      doc.text(
        r.c.type === "hour" ? `${minutesToHuman(r.min)} trabajadas` : `${r.words} palabras`,
        230, y,
      );
      doc.text(
        r.c.type === "hour" ? `${formatMoney(r.c.rate)}/h` : `${formatMoney(r.c.rate)}/pal.`,
        360, y,
      );
      doc.text(formatMoney(r.amount), pageW - 50, y, { align: "right" });
      y += 22;
    }

    y += 10;
    doc.setDrawColor(180);
    doc.line(50, y, pageW - 50, y);
    y += 24;
    doc.setFontSize(14);
    doc.text("Total a cobrar", 50, y);
    doc.setFont("times", "italic");
    doc.setFontSize(22);
    doc.text(formatMoney(total), pageW - 50, y, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(
      "Generado con HorasClaras · documento informativo, no es factura legal.",
      pageW / 2, doc.internal.pageSize.getHeight() - 40, { align: "center" },
    );

    doc.save(`tarifario-${month}.pdf`);
    toast.success("Tarifario PDF generado");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="border-border/60 p-0">
        <div className="border-b border-border/60 bg-secondary/40 px-5 py-3">
          <h3 className="font-display text-xl">Preview · {monthLabel}</h3>
        </div>
        <div className="space-y-3 p-6">
          <p className="font-display text-3xl">{store.profileName}</p>
          <div className="divide-y divide-border/60 rounded-xl border border-border/60">
            {rows.map((r) => (
              <div key={r.c.id} className="grid grid-cols-4 items-center gap-3 px-4 py-3 text-sm">
                <span className="font-medium">{r.c.name}</span>
                <span className="text-muted-foreground">{r.c.type === "hour" ? minutesToHuman(r.min) : `${r.words} pal.`}</span>
                <span className="text-muted-foreground">{r.c.type === "hour" ? `${formatMoney(r.c.rate)}/h` : `${formatMoney(r.c.rate)}/pal.`}</span>
                <span className="text-right font-medium tabular-nums">{formatMoney(r.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <span className="text-muted-foreground">Total a cobrar</span>
            <span className="font-display text-3xl">{formatMoney(total)}</span>
          </div>
        </div>
      </Card>

      <Card className="border-border/60 p-5">
        <h3 className="font-display text-xl">Listo para enviar</h3>
        <p className="mt-1 text-sm text-muted-foreground">Descargá el PDF y compartilo por WhatsApp o email.</p>
        <Button onClick={generate} className="mt-4 w-full gap-2" size="lg">
          <Download className="h-4 w-4" /> Generar tarifario PDF
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          v1: PDF informativo. En post-MVP: envío por email desde la app.
        </p>
      </Card>
    </div>
  );
}
