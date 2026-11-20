import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Battery,
  Bell,
  Bluetooth,
  Calculator,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  Code2,
  File,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  Globe,
  HardDrive,
  Home,
  Image as ImageIcon,
  Info,
  Leaf,
  LockKeyhole,
  Maximize2,
  Minus,
  Monitor,
  Moon,
  MoreHorizontal,
  Music2,
  NotebookPen,
  Plus,
  Power,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Sun,
  Terminal,
  Trash2,
  Volume2,
  VolumeX,
  Wifi,
  X,
  type LucideIcon,
} from "lucide-react";

type AppId = "files" | "browser" | "terminal" | "notes" | "calculator" | "settings";
type Wallpaper = "lake" | "aurora" | "dusk";

type SystemSettings = {
  wallpaper: Wallpaper;
  wifi: boolean;
  bluetooth: boolean;
  nightLight: boolean;
  notifications: boolean;
  brightness: number;
  volume: number;
};

type DesktopWindow = {
  id: AppId;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
};

type AppMeta = {
  title: string;
  description: string;
  icon: LucideIcon;
  tint: string;
};

const APP_META: Record<AppId, AppMeta> = {
  files: { title: "Arquivos", description: "Explore suas pastas", icon: FolderOpen, tint: "mint" },
  browser: { title: "Navegador", description: "Acesse a web", icon: Globe, tint: "blue" },
  terminal: { title: "Terminal", description: "Linha de comando", icon: Terminal, tint: "slate" },
  notes: { title: "Notas", description: "Suas ideias, em um só lugar", icon: NotebookPen, tint: "amber" },
  calculator: { title: "Calculadora", description: "Faça uma conta", icon: Calculator, tint: "violet" },
  settings: { title: "Configurações", description: "Personalize seu sistema", icon: Settings, tint: "gray" },
};

const APP_ORDER: AppId[] = ["browser", "files", "terminal", "notes", "calculator", "settings"];

const DEFAULT_SETTINGS: SystemSettings = {
  wallpaper: "lake",
  wifi: true,
  bluetooth: false,
  nightLight: false,
  notifications: true,
  brightness: 82,
  volume: 58,
};

const WINDOW_SIZES: Record<AppId, { width: number; height: number }> = {
  files: { width: 920, height: 590 },
  browser: { width: 1020, height: 650 },
  terminal: { width: 760, height: 500 },
  notes: { width: 760, height: 560 },
  calculator: { width: 390, height: 570 },
  settings: { width: 830, height: 610 },
};

const FILES: Record<string, FileEntry[]> = {
  "Pasta pessoal": [
    { name: "Área de trabalho", kind: "folder", detail: "5 itens", modified: "Hoje, 10:32" },
    { name: "Documentos", kind: "folder", detail: "3 itens", modified: "Hoje, 09:18" },
    { name: "Downloads", kind: "folder", detail: "2 itens", modified: "Ontem" },
    { name: "Imagens", kind: "folder", detail: "8 itens", modified: "Ontem" },
    { name: "Música", kind: "folder", detail: "4 itens", modified: "12 de junho" },
    { name: "Projetos", kind: "folder", detail: "2 itens", modified: "10 de junho" },
    { name: "sobre-mint.txt", kind: "file", detail: "2 KB", modified: "Hoje, 10:04", icon: FileText },
    { name: "paisagem.png", kind: "file", detail: "4,8 MB", modified: "Hoje, 08:52", icon: FileImage },
  ],
  "Área de trabalho": [
    { name: "Bem-vindo ao Mint", kind: "file", detail: "1 KB", modified: "Hoje", icon: FileText },
    { name: "Captura de tela.png", kind: "file", detail: "1,2 MB", modified: "Hoje", icon: FileImage },
    { name: "Projetos", kind: "folder", detail: "2 itens", modified: "Ontem" },
  ],
  Documentos: [
    { name: "Anotações.txt", kind: "file", detail: "3 KB", modified: "Hoje, 09:18", icon: FileText },
    { name: "Lista de tarefas.txt", kind: "file", detail: "1 KB", modified: "Ontem", icon: FileText },
    { name: "Projetos", kind: "folder", detail: "2 itens", modified: "10 de junho" },
  ],
  Downloads: [
    { name: "guia-do-usuario.pdf", kind: "file", detail: "1,4 MB", modified: "Ontem", icon: FileText },
    { name: "pacote-de-temas.zip", kind: "file", detail: "860 KB", modified: "12 de junho", icon: File },
  ],
  Imagens: [
    { name: "paisagem.png", kind: "file", detail: "4,8 MB", modified: "Hoje, 08:52", icon: FileImage },
    { name: "wallpaper-mint.png", kind: "file", detail: "3,2 MB", modified: "Ontem", icon: ImageIcon },
    { name: "fotos", kind: "folder", detail: "6 itens", modified: "11 de junho" },
  ],
  Música: [
    { name: "manhã tranquila.mp3", kind: "file", detail: "4,2 MB", modified: "12 de junho", icon: Music2 },
    { name: "playlist.m3u", kind: "file", detail: "2 KB", modified: "10 de junho", icon: FileText },
  ],
  Projetos: [
    { name: "site-pessoal", kind: "folder", detail: "12 itens", modified: "Hoje" },
    { name: "ideias.md", kind: "file", detail: "4 KB", modified: "Ontem", icon: Code2 },
  ],
  Lixeira: [],
};

type FileEntry = {
  name: string;
  kind: "folder" | "file";
  detail: string;
  modified: string;
  icon?: LucideIcon;
};

type DragState = { id: AppId; pointerX: number; pointerY: number; windowX: number; windowY: number };

function readSavedSettings(): SystemSettings {
  try {
    const saved = window.localStorage.getItem("mint-os-settings");
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } as SystemSettings;
  } catch {
    // Keep the desktop usable if local storage is unavailable.
  }
  return DEFAULT_SETTINGS;
}

function AppIcon({ app, size = 20 }: { app: AppId; size?: number }) {
  const Icon = APP_META[app].icon;
  return <Icon size={size} strokeWidth={1.8} />;
}

function DesktopShortcut({
  title,
  icon: Icon,
  tint,
  selected,
  onClick,
  onDoubleClick,
}: {
  title: string;
  icon: LucideIcon;
  tint: string;
  selected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  return (
    <button
      className={`desktop-shortcut ${selected ? "is-selected" : ""}`}
      type="button"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter") onDoubleClick();
      }}
      title={`${title} - clique duas vezes para abrir`}
    >
      <span className={`desktop-shortcut-icon shortcut-${tint}`}>
        <Icon size={29} strokeWidth={1.8} />
      </span>
      <span className="desktop-shortcut-label">{title}</span>
    </button>
  );
}

function AppWindow({
  item,
  active,
  settings,
  updateSetting,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onDragStart,
  onDragMove,
  onDragEnd,
  notify,
}: {
  item: DesktopWindow;
  active: boolean;
  settings: SystemSettings;
  updateSetting: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onDragStart: (event: ReactPointerEvent<HTMLElement>) => void;
  onDragMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  notify: (message: string) => void;
}) {
  const meta = APP_META[item.id];
  const style: CSSProperties = item.maximized
    ? { zIndex: item.z }
    : { left: item.x, top: item.y, width: item.width, height: item.height, zIndex: item.z };

  return (
    <section
      className={`app-window ${active ? "is-active" : ""} ${item.maximized ? "is-maximized" : ""}`}
      style={style}
      onPointerDown={onFocus}
      aria-label={meta.title}
    >
      <header
        className="window-titlebar"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        onDoubleClick={(event) => {
          if (!(event.target as HTMLElement).closest("button")) onMaximize();
        }}
      >
        <div className="window-title">
          <span className={`window-app-mark app-mark-${meta.tint}`}><AppIcon app={item.id} size={16} /></span>
          <span>{meta.title}</span>
        </div>
        <div className="window-controls" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" aria-label="Minimizar" title="Minimizar" onClick={onMinimize}><Minus size={15} /></button>
          <button type="button" aria-label="Maximizar" title={item.maximized ? "Restaurar" : "Maximizar"} onClick={onMaximize}><Maximize2 size={13} /></button>
          <button type="button" className="window-close" aria-label="Fechar" title="Fechar" onClick={onClose}><X size={15} /></button>
        </div>
      </header>
      <div className={`window-body window-body-${item.id}`}>
        {item.id === "files" && <FileManager notify={notify} />}
        {item.id === "browser" && <BrowserApp />}
        {item.id === "terminal" && <TerminalApp />}
        {item.id === "notes" && <NotesApp notify={notify} />}
        {item.id === "calculator" && <CalculatorApp />}
        {item.id === "settings" && <SettingsApp settings={settings} updateSetting={updateSetting} />}
      </div>
    </section>
  );
}

function FileManager({ notify }: { notify: (message: string) => void }) {
  const [fileSystem, setFileSystem] = useState(FILES);
  const [location, setLocation] = useState("Pasta pessoal");
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState("");
  const entries = (fileSystem[location] ?? []).filter((entry) => entry.name.toLowerCase().includes(filter.toLowerCase()));
  const sidebar = [
    { name: "Pasta pessoal", icon: Home },
    { name: "Área de trabalho", icon: Monitor },
    { name: "Documentos", icon: FileText },
    { name: "Downloads", icon: ArrowDown },
    { name: "Imagens", icon: ImageIcon },
    { name: "Música", icon: Music2 },
    { name: "Lixeira", icon: Trash2 },
  ];

  function createFolder() {
    const existing = fileSystem[location] ?? [];
    let number = 1;
    let name = "Nova pasta";
    while (existing.some((entry) => entry.name === name)) {
      number += 1;
      name = `Nova pasta ${number}`;
    }
    setFileSystem((current) => ({
      ...current,
      [location]: [...(current[location] ?? []), { name, kind: "folder", detail: "Pasta vazia", modified: "Agora" }],
    }));
    setSelected(name);
    notify(`${name} criada`);
  }

  return (
    <div className="file-manager">
      <aside className="file-sidebar">
        <div className="sidebar-label">LUGARES</div>
        {sidebar.map(({ name, icon: Icon }) => (
          <button key={name} type="button" className={`file-location ${location === name ? "is-current" : ""}`} onClick={() => { setLocation(name); setSelected(""); setFilter(""); }}>
            <Icon size={17} strokeWidth={1.8} />
            <span>{name}</span>
          </button>
        ))}
        <div className="sidebar-divider" />
        <div className="sidebar-label">DISPOSITIVOS</div>
        <button type="button" className="file-location" onClick={() => notify("Disco local: 182 GB disponíveis")}>
          <HardDrive size={17} strokeWidth={1.8} />
          <span>Disco local</span>
        </button>
        <div className="disk-meter"><span /></div>
        <p className="disk-caption">182 GB livres</p>
      </aside>
      <main className="file-main">
        <div className="file-toolbar">
          <div className="file-nav-buttons">
            <button type="button" aria-label="Voltar" title="Voltar" onClick={() => { setLocation("Pasta pessoal"); setSelected(""); }}><ArrowLeft size={16} /></button>
            <button type="button" aria-label="Avançar" title="Avançar" onClick={() => setLocation("Documentos")}><ArrowRight size={16} /></button>
          </div>
          <div className="file-breadcrumb">
            <button type="button" onClick={() => setLocation("Pasta pessoal")}>Pasta pessoal</button>
            {location !== "Pasta pessoal" && <><ChevronRight size={13} /><span>{location}</span></>}
          </div>
          <label className="file-search"><Search size={15} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Pesquisar nesta pasta" /></label>
          <button type="button" className="toolbar-icon-button" aria-label="Mais opcoes" onClick={() => notify("Todas as pastas estão atualizadas")}><MoreHorizontal size={19} /></button>
        </div>
        <div className="file-content-heading">
          <div>
            <h2>{location}</h2>
            <p>Seus arquivos, organizados do seu jeito.</p>
          </div>
          <button type="button" className="new-folder-button" onClick={createFolder}><Plus size={15} /> Nova pasta</button>
        </div>
        {entries.length > 0 ? (
          <div className="files-grid">
            {entries.map((entry) => {
              const Icon = entry.kind === "folder" ? Folder : (entry.icon ?? File);
              return (
                <button
                  key={entry.name}
                  type="button"
                  className={`file-tile ${selected === entry.name ? "is-selected" : ""}`}
                  onClick={() => setSelected(entry.name)}
                  onDoubleClick={() => {
                    if (entry.kind === "folder") {
                      setLocation(entry.name);
                      setSelected("");
                    } else {
                      notify(`Visualização de ${entry.name}`);
                    }
                  }}
                  title={entry.kind === "folder" ? "Clique duas vezes para abrir" : entry.name}
                >
                  <span className={`file-tile-icon ${entry.kind === "folder" ? "folder-glyph" : "document-glyph"}`}><Icon size={30} strokeWidth={1.6} /></span>
                  <span className="file-tile-name">{entry.name}</span>
                  <span className="file-tile-detail">{entry.detail}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty-folder"><span><Trash2 size={22} /></span><strong>{location === "Lixeira" ? "A lixeira está vazia" : "Nenhum arquivo encontrado"}</strong><p>Os itens que você criar aparecerão aqui.</p></div>
        )}
        <div className="file-statusbar"><span>{entries.length} {entries.length === 1 ? "item" : "itens"}</span><span>{selected ? `Selecionado: ${selected}` : ""}</span></div>
      </main>
    </div>
  );
}

type BrowserPage = { kind: "home" } | { kind: "search"; query: string } | { kind: "site"; title: string; url: string };

function BrowserApp() {
  const [address, setAddress] = useState("https://start.mint/");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState<BrowserPage>({ kind: "home" });
  const [bookmarked, setBookmarked] = useState(false);

  function navigate(value: string) {
    const query = value.trim();
    if (!query) return;
    if (query.includes(" ") || !query.includes(".")) {
      setPage({ kind: "search", query });
      setAddress(`duckduckgo.com/?q=${encodeURIComponent(query)}`);
      return;
    }
    const url = query.startsWith("http") ? query : `https://${query}`;
    setAddress(url);
    setPage({ kind: "site", title: query.replace(/^https?:\/\//, "").replace(/\/$/, ""), url });
  }

  function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(address);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(searchText);
  }

  return (
    <div className="browser-app">
      <div className="browser-toolbar">
        <button type="button" title="Voltar" aria-label="Voltar" onClick={() => setPage({ kind: "home" })}><ArrowLeft size={16} /></button>
        <button type="button" title="Avançar" aria-label="Avançar" onClick={() => setPage({ kind: "home" })}><ArrowRight size={16} /></button>
        <button type="button" title="Atualizar" aria-label="Atualizar" onClick={() => setPage((current) => ({ ...current }))}><RefreshCw size={15} /></button>
        <form className="browser-address" onSubmit={submitAddress}>
          <ShieldCheck size={15} />
          <input aria-label="Endereço" value={address} onChange={(event) => setAddress(event.target.value)} />
          <button type="button" title={bookmarked ? "Remover favorito" : "Adicionar aos favoritos"} onClick={() => setBookmarked((current) => !current)}><Star size={15} fill={bookmarked ? "currentColor" : "none"} /></button>
        </form>
        <button type="button" className="browser-menu-button" aria-label="Menu do navegador"><MoreHorizontal size={18} /></button>
      </div>
      <div className="browser-bookmarks">
        <button type="button" onClick={() => { setPage({ kind: "home" }); setAddress("https://start.mint/"); }}><Leaf size={14} /> Página inicial</button>
        <button type="button" onClick={() => navigate("linuxmint.com")}><span className="bookmark-dot mint-dot">m</span> Linux Mint</button>
        <button type="button" onClick={() => navigate("wikipedia.org")}><span className="bookmark-dot wiki-dot">W</span> Wikipedia</button>
        {bookmarked && <button type="button" onClick={() => setPage({ kind: "home" })}><Star size={13} /> Favorito salvo</button>}
      </div>
      <div className="browser-page">
        {page.kind === "home" && (
          <div className="browser-home">
            <div className="browser-brand"><span className="browser-brand-mark"><Leaf size={27} /></span><div><strong>mint<span>start</span></strong><small>um bom lugar para começar</small></div></div>
            <form className="browser-search" onSubmit={submitSearch}><Search size={18} /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Pesquise na web ou digite um endereço" /><button type="submit" aria-label="Pesquisar"><ArrowUpRight size={17} /></button></form>
            <div className="browser-shortcuts">
              <button type="button" onClick={() => navigate("linuxmint.com")}><span className="browser-shortcut-icon shortcut-linux"><Leaf size={19} /></span><span>Linux Mint</span></button>
              <button type="button" onClick={() => navigate("wikipedia.org")}><span className="browser-shortcut-icon shortcut-wiki">W</span><span>Wikipedia</span></button>
              <button type="button" onClick={() => navigate("developer.mozilla.org")}><span className="browser-shortcut-icon shortcut-mdn">M</span><span>MDN Web Docs</span></button>
              <button type="button" onClick={() => navigate("github.com")}><span className="browser-shortcut-icon shortcut-github"><Code2 size={18} /></span><span>GitHub</span></button>
            </div>
            <p className="browser-home-caption">Uma janela simples para suas ideias e descobertas.</p>
          </div>
        )}
        {page.kind === "search" && (
          <div className="browser-results">
            <div className="results-search-brand"><span><Leaf size={18} /></span><form className="browser-search compact-search" onSubmit={submitSearch}><Search size={16} /><input value={searchText || page.query} onChange={(event) => setSearchText(event.target.value)} /><button type="submit"><ArrowUpRight size={16} /></button></form></div>
            <p className="results-count">Resultados simulados para <strong>{page.query}</strong></p>
            {[
              { label: `${page.query} - comunidade e documentação`, url: "linuxmint.com", text: "Encontre guias, novidades e conversas sobre software livre e o ambiente Linux Mint." },
              { label: `Aprenda sobre ${page.query}`, url: "wikipedia.org", text: "Uma introdução clara, com artigos e referências para continuar sua pesquisa." },
              { label: `Recursos para ${page.query}`, url: "developer.mozilla.org", text: "Documentação, tutoriais e recursos úteis para explorar com mais profundidade." },
            ].map((result) => <button type="button" className="search-result" key={result.url} onClick={() => navigate(result.url)}><span>{result.url}</span><strong>{result.label}</strong><p>{result.text}</p></button>)}
            <small className="demo-search-note">Modo de demonstração: os resultados são exemplos locais.</small>
          </div>
        )}
        {page.kind === "site" && (
          <div className="site-preview">
            <span className="site-preview-mark"><Globe size={22} /></span>
            <p className="site-address">{page.url}</p>
            <h2>{page.title}</h2>
            <p>O navegador Mint está pronto para você explorar. Esta janela de demonstração mantém a navegação dentro do desktop simulado.</p>
            <button type="button" className="site-home-button" onClick={() => { setPage({ kind: "home" }); setAddress("https://start.mint/"); }}>Voltar à página inicial</button>
          </div>
        )}
      </div>
    </div>
  );
}

function TerminalApp() {
  const [history, setHistory] = useState<string[]>([
    "Mint Terminal 1.0  |  Sessão local",
    "Bem-vindo, visitante. Digite 'help' para ver os comandos disponíveis.",
    "",
  ]);
  const [command, setCommand] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  function runCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = command.trim();
    if (!value) return;
    const [name, ...args] = value.split(/\s+/);
    let output = "";
    switch (name.toLowerCase()) {
      case "help":
        output = "Comandos: help, neofetch, ls, pwd, whoami, date, uname, echo, clear, about";
        break;
      case "neofetch":
        output = "Mint OS 22.1 (simulado)\nKernel: Linux 6.8.0-mint\nAmbiente: Cinnamon-inspired\nMemória: 2.1 GiB / 8 GiB\nTema: Mint Green  |  Shell: mint-terminal";
        break;
      case "ls":
        output = "Área de trabalho/   Documentos/   Downloads/   Imagens/   Música/   Projetos/   sobre-mint.txt";
        break;
      case "pwd":
        output = "/home/visitante";
        break;
      case "whoami":
        output = "visitante";
        break;
      case "date":
        output = new Date().toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" });
        break;
      case "uname":
        output = "MintOS mint-kernel 6.8.0-generic x86_64";
        break;
      case "echo":
        output = args.join(" ");
        break;
      case "about":
        output = "Mint OS é uma demonstração interativa de desktop. Nenhum comando altera o sistema real.";
        break;
      case "clear":
        setHistory([]);
        setCommand("");
        return;
      default:
        output = `${name}: comando não encontrado. Digite 'help' para ver as opções.`;
    }
    setHistory((current) => [...current, `visitante@mint:~$ ${value}`, output, ""]);
    setCommand("");
  }

  return (
    <div className="terminal-app">
      <div className="terminal-toolbar"><span><span className="terminal-live-dot" /> visitante@mint: ~</span><button type="button" title="Novo terminal" onClick={() => { setHistory((current) => [...current, "", "Nova sessão iniciada.", ""]); }}><Plus size={16} /></button></div>
      <div className="terminal-output" ref={outputRef}>
        <div className="terminal-ascii" aria-hidden="true">{`  __  __ _       _   ___  ____\n |  \/  (_)_ __ | |_|_ _|/ ___|\n | |\/| | | '_ \| __|| | \___ \\n | |  | | | | | | |_ | |  ___) |\n |_|  |_|_|_| |_|\__|___||____/`}</div>
        {history.map((line, index) => <div className={`terminal-line ${line.startsWith("visitante@mint") ? "terminal-prompt-line" : ""}`} key={`${index}-${line}`}>{line || "\u00a0"}</div>)}
        <form className="terminal-input-line" onSubmit={runCommand}><span>visitante@mint:~$</span><input autoFocus value={command} onChange={(event) => setCommand(event.target.value)} aria-label="Comando" spellCheck={false} autoComplete="off" /><span className="terminal-caret" /></form>
      </div>
      <div className="terminal-footer"><span>zsh</span><span>UTF-8</span><span>Seguro · ambiente simulado</span></div>
    </div>
  );
}

function NotesApp({ notify }: { notify: (message: string) => void }) {
  const [note, setNote] = useState(() => {
    try { return window.localStorage.getItem("mint-os-note") ?? "Bem-vinda ao Mint OS.\n\nUm espaço tranquilo para anotar ideias, planos e tudo o que merece ser lembrado."; }
    catch { return "Bem-vinda ao Mint OS.\n\nUm espaço tranquilo para anotar ideias, planos e tudo o que merece ser lembrado."; }
  });
  const [savedAt, setSavedAt] = useState("Salvo neste dispositivo");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try { window.localStorage.setItem("mint-os-note", note); } catch { /* Storage is optional. */ }
      setSavedAt("Salvo agora");
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [note]);

  return (
    <div className="notes-app">
      <aside className="notes-sidebar">
        <div className="notes-sidebar-top"><span>Minhas notas</span><button type="button" aria-label="Nova nota" title="Nova nota" onClick={() => { setNote(""); notify("Nova nota criada"); }}><Plus size={17} /></button></div>
        <button type="button" className="note-list-item is-selected"><span className="note-list-mark" /><span><strong>Boas-vindas</strong><small>Hoje · 10:42</small></span></button>
        <button type="button" className="note-list-item" onClick={() => setNote("Ideias para depois\n\n- Explorar os aplicativos\n- Personalizar o papel de parede") }><span className="note-list-mark note-list-mark-blue" /><span><strong>Ideias para depois</strong><small>Ontem · 16:20</small></span></button>
        <div className="notes-sidebar-bottom"><Cloud size={15} /> Salvo localmente</div>
      </aside>
      <main className="notes-editor">
        <div className="notes-editor-toolbar"><span className="notes-breadcrumb">Notas <ChevronRight size={13} /> Boas-vindas</span><div><span className="notes-saved"><Check size={14} /> {savedAt}</span><button type="button" title="Mais opções"><MoreHorizontal size={18} /></button></div></div>
        <div className="notes-paper"><div className="note-date">{new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase()}</div><h2>Boas-vindas ao Mint</h2><textarea aria-label="Conteúdo da nota" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Comece a escrever..." spellCheck /></div>
      </main>
    </div>
  );
}

function evaluateExpression(source: string): string {
  const tokens = source.replace(/[−]/g, "-").replace(/[×]/g, "*").replace(/[÷]/g, "/").match(/\d*\.?\d+|[()+\-*/%]/g) ?? [];
  let cursor = 0;
  function factor(): number {
    const token = tokens[cursor++];
    if (token === "+") return factor();
    if (token === "-") return -factor();
    if (token === "(") {
      const value = expression();
      if (tokens[cursor++] !== ")") throw new Error("Parênteses incompletos");
      return value;
    }
    const value = Number(token);
    if (!Number.isFinite(value)) throw new Error("Expressão inválida");
    if (tokens[cursor] === "%") { cursor += 1; return value / 100; }
    return value;
  }
  function term(): number {
    let value = factor();
    while (tokens[cursor] === "*" || tokens[cursor] === "/") {
      const operator = tokens[cursor++];
      const next = factor();
      value = operator === "*" ? value * next : value / next;
    }
    return value;
  }
  function expression(): number {
    let value = term();
    while (tokens[cursor] === "+" || tokens[cursor] === "-") {
      const operator = tokens[cursor++];
      const next = term();
      value = operator === "+" ? value + next : value - next;
    }
    return value;
  }
  const result = expression();
  if (cursor !== tokens.length || !Number.isFinite(result)) throw new Error("Expressão inválida");
  return Number(result.toPrecision(10)).toString();
}

function CalculatorApp() {
  const [expression, setExpression] = useState("");
  const [justCalculated, setJustCalculated] = useState(false);
  const display = expression || "0";
  const keys = ["AC", "+/-", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "="];

  function press(key: string) {
    if (key === "AC") { setExpression(""); setJustCalculated(false); return; }
    if (key === "=") {
      try { setExpression(evaluateExpression(expression).replace(/-/g, "−")); setJustCalculated(true); }
      catch { setExpression("Erro"); setJustCalculated(true); }
      return;
    }
    if (key === "+/-") {
      if (!expression) return;
      setExpression(expression.startsWith("−") ? expression.slice(1) : `−${expression}`);
      setJustCalculated(false);
      return;
    }
    if (key === "%") {
      setExpression((current) => current && !/[+−×÷.]$/.test(current) ? `${current}%` : current);
      setJustCalculated(false);
      return;
    }
    if (["+", "−", "×", "÷"].includes(key)) {
      setExpression((current) => {
        if (!current || current === "Erro") return key === "−" ? "−" : current;
        return /[+−×÷]$/.test(current) ? `${current.slice(0, -1)}${key}` : `${current}${key}`;
      });
      setJustCalculated(false);
      return;
    }
    setExpression((current) => {
      const base = justCalculated || current === "Erro" ? "" : current;
      return key === "." && base.split(/[+−×÷]/).at(-1)?.includes(".") ? base : `${base}${key}`;
    });
    setJustCalculated(false);
  }

  return (
    <div className="calculator-app">
      <div className="calculator-heading"><span>Calculadora</span><button type="button" title="Histórico"><Clock size={16} /></button></div>
      <div className="calculator-display"><span className="calculator-expression">{expression && expression !== "Erro" ? expression : "&nbsp;"}</span><strong>{display}</strong></div>
      <div className="calculator-keys">
        {keys.map((key) => <button key={key} type="button" className={`calc-key ${["÷", "×", "−", "+", "="].includes(key) ? "calc-operator" : ""} ${key === "AC" ? "calc-clear" : ""} ${key === "=" ? "calc-equals" : ""} ${key === "0" ? "calc-zero" : ""}`} onClick={() => press(key)}>{key}</button>)}
      </div>
      <div className="calculator-safe-note"><ShieldCheck size={13} /> cálculos feitos localmente</div>
    </div>
  );
}

type SettingsPage = "appearance" | "network" | "system";

function SettingsApp({
  settings,
  updateSetting,
}: {
  settings: SystemSettings;
  updateSetting: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
}) {
  const [section, setSection] = useState<SettingsPage>("appearance");
  const nav = [
    { id: "appearance" as const, title: "Aparência", icon: SlidersHorizontal },
    { id: "network" as const, title: "Rede e conexão", icon: Wifi },
    { id: "system" as const, title: "Sobre o sistema", icon: Info },
  ];

  return (
    <div className="settings-app">
      <aside className="settings-sidebar">
        <div className="settings-search"><Search size={15} /><input placeholder="Buscar nas configurações" /></div>
        <div className="settings-nav-list">{nav.map(({ id, title, icon: Icon }) => <button key={id} type="button" className={section === id ? "is-current" : ""} onClick={() => setSection(id)}><Icon size={17} />{title}</button>)}</div>
        <div className="settings-version"><span className="settings-version-icon"><Leaf size={19} /></span><span><strong>Mint OS</strong><small>Versão 22.1</small></span></div>
      </aside>
      <main className="settings-main">
        {section === "appearance" && <>
          <div className="settings-heading"><span className="settings-eyebrow">PERSONALIZAÇÃO</span><h2>Aparência</h2><p>Deixe sua área de trabalho com a sua cara.</p></div>
          <section className="settings-section">
            <h3>Papel de parede</h3><p className="settings-section-copy">Escolha a paisagem que acompanha seu dia.</p>
            <div className="wallpaper-options">
              <button type="button" className={`wallpaper-option wallpaper-option-lake ${settings.wallpaper === "lake" ? "is-selected" : ""}`} onClick={() => updateSetting("wallpaper", "lake")}><span className="wallpaper-preview preview-lake" />{settings.wallpaper === "lake" && <span className="wallpaper-check"><Check size={13} /></span>}<strong>Lago sereno</strong><small>Verde natural</small></button>
              <button type="button" className={`wallpaper-option wallpaper-option-aurora ${settings.wallpaper === "aurora" ? "is-selected" : ""}`} onClick={() => updateSetting("wallpaper", "aurora")}><span className="wallpaper-preview preview-aurora" />{settings.wallpaper === "aurora" && <span className="wallpaper-check"><Check size={13} /></span>}<strong>Aurora boreal</strong><small>Brilho suave</small></button>
              <button type="button" className={`wallpaper-option wallpaper-option-dusk ${settings.wallpaper === "dusk" ? "is-selected" : ""}`} onClick={() => updateSetting("wallpaper", "dusk")}><span className="wallpaper-preview preview-dusk" />{settings.wallpaper === "dusk" && <span className="wallpaper-check"><Check size={13} /></span>}<strong>Fim de tarde</strong><small>Tons quentes</small></button>
            </div>
          </section>
          <section className="settings-section settings-row-section"><div><h3>Luz noturna</h3><p>Reduz a luz azul da tela ao anoitecer.</p></div><Toggle checked={settings.nightLight} onChange={(value) => updateSetting("nightLight", value)} label="Luz noturna" /></section>
          <section className="settings-section brightness-setting"><div><h3>Brilho da tela</h3><strong>{settings.brightness}%</strong></div><input aria-label="Brilho da tela" type="range" min="20" max="100" value={settings.brightness} onChange={(event) => updateSetting("brightness", Number(event.target.value))} /></section>
        </>}
        {section === "network" && <>
          <div className="settings-heading"><span className="settings-eyebrow">CONECTIVIDADE</span><h2>Rede e conexão</h2><p>Gerencie as conexões deste desktop simulado.</p></div>
          <section className="connection-row"><span className="connection-icon"><Wifi size={20} /></span><div><strong>Wi-Fi</strong><p>{settings.wifi ? "Conectado à rede Casa" : "Desconectado"}</p></div><Toggle checked={settings.wifi} onChange={(value) => updateSetting("wifi", value)} label="Wi-Fi" /></section>
          <section className="connection-row"><span className="connection-icon connection-blue"><Bluetooth size={20} /></span><div><strong>Bluetooth</strong><p>{settings.bluetooth ? "Visível para dispositivos próximos" : "Desativado"}</p></div><Toggle checked={settings.bluetooth} onChange={(value) => updateSetting("bluetooth", value)} label="Bluetooth" /></section>
          <div className="network-details"><span className="network-details-icon"><ShieldCheck size={17} /></span><div><strong>Conexões seguras</strong><p>Este ambiente de demonstração não envia dados de rede.</p></div></div>
        </>}
        {section === "system" && <>
          <div className="settings-heading"><span className="settings-eyebrow">INFORMAÇÕES</span><h2>Sobre o sistema</h2><p>Uma experiência desktop inspirada no Linux Mint.</p></div>
          <div className="about-banner"><span className="about-logo"><Leaf size={38} /></span><div><span>DESKTOP EDITION</span><h3>Mint OS 22.1</h3><p>Ambiente interativo inspirado no Cinnamon.</p></div></div>
          <div className="about-info-list"><div><span>Versão do ambiente</span><strong>1.0.0 · Edição demonstração</strong></div><div><span>Sessão</span><strong>Visitante</strong></div><div><span>Armazenamento</span><strong>182 GB disponíveis</strong></div><div><span>Licença</span><strong>Software livre, espírito aberto</strong></div></div>
          <button type="button" className="system-check-button"><RefreshCw size={15} /> Sistema atualizado</button>
        </>}
      </main>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`toggle-switch ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}><span /></button>;
}

function QuickSettings({
  settings,
  updateSetting,
  onOpenSettings,
}: {
  settings: SystemSettings;
  updateSetting: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
  onOpenSettings: () => void;
}) {
  const toggles = [
    { key: "wifi" as const, title: "Wi-Fi", icon: Wifi, active: settings.wifi },
    { key: "bluetooth" as const, title: "Bluetooth", icon: Bluetooth, active: settings.bluetooth },
    { key: "nightLight" as const, title: "Luz noturna", icon: Moon, active: settings.nightLight },
    { key: "notifications" as const, title: "Notificações", icon: Bell, active: settings.notifications },
  ];

  return (
    <div className="quick-panel popover-panel" onPointerDown={(event) => event.stopPropagation()}>
      <div className="quick-panel-heading"><div><span>Configurações rápidas</span><small>{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</small></div><button type="button" aria-label="Abrir configurações" onClick={onOpenSettings}><Settings size={17} /></button></div>
      <div className="quick-toggles">{toggles.map(({ key, title, icon: Icon, active }) => <button key={key} type="button" className={`quick-toggle ${active ? "is-on" : ""}`} onClick={() => updateSetting(key, !active)}><span className="quick-toggle-icon"><Icon size={18} /></span><span>{title}</span><span className="quick-toggle-state">{active ? "Ativado" : "Desativado"}</span></button>)}</div>
      <div className="quick-slider-row"><Sun size={16} /><input aria-label="Brilho" type="range" min="20" max="100" value={settings.brightness} onChange={(event) => updateSetting("brightness", Number(event.target.value))} /><span>{settings.brightness}%</span></div>
      <div className="quick-slider-row"><Volume2 size={16} /><input aria-label="Volume" type="range" min="0" max="100" value={settings.volume} onChange={(event) => updateSetting("volume", Number(event.target.value))} /><span>{settings.volume}%</span></div>
      <div className="quick-panel-footer"><span><Battery size={16} /> Bateria carregada</span><button type="button" onClick={onOpenSettings}>Todas as configurações <ArrowUpRight size={14} /></button></div>
    </div>
  );
}

export default function App() {
  const [settings, setSettings] = useState<SystemSettings>(readSavedSettings);
  const [windows, setWindows] = useState<DesktopWindow[]>([]);
  const [activeId, setActiveId] = useState<AppId | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [powerMenuOpen, setPowerMenuOpen] = useState(false);
  const [quickPanelOpen, setQuickPanelOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState("");
  const [clock, setClock] = useState(new Date());
  const [toast, setToast] = useState("");
  const [sessionState, setSessionState] = useState<"active" | "locked" | "off">("active");
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem("mint-os-settings", JSON.stringify(settings)); } catch { /* Settings stay available for this session. */ }
  }, [settings]);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  };

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  function focusWindow(id: AppId) {
    setWindows((current) => {
      const top = current.reduce((highest, item) => Math.max(highest, item.z), 10);
      return current.map((item) => item.id === id ? { ...item, minimized: false, z: top + 1 } : item);
    });
    setActiveId(id);
  }

  function openApp(id: AppId) {
    setStartMenuOpen(false);
    setQuickPanelOpen(false);
    setNotificationPanelOpen(false);
    setPowerMenuOpen(false);
    setMenuSearch("");
    const existing = windows.find((item) => item.id === id);
    if (existing) {
      focusWindow(id);
      return;
    }
    const base = WINDOW_SIZES[id];
    const width = Math.min(base.width, Math.max(340, window.innerWidth - 32));
    const height = Math.min(base.height, Math.max(320, window.innerHeight - 116));
    const x = Math.max(12, Math.min(window.innerWidth - width - 18, 112 + (windows.length * 36) % 190));
    const y = Math.max(12, Math.min(window.innerHeight - height - 82, 48 + (windows.length * 30) % 125));
    const z = windows.reduce((highest, item) => Math.max(highest, item.z), 10) + 1;
    setWindows((current) => [...current, { id, x, y, width, height, z, minimized: false, maximized: false }]);
    setActiveId(id);
  }

  function closeWindow(id: AppId) {
    setWindows((current) => current.filter((item) => item.id !== id));
    if (activeId === id) {
      const next = [...windows].filter((item) => item.id !== id && !item.minimized).sort((a, b) => b.z - a.z)[0];
      setActiveId(next?.id ?? null);
    }
  }

  function minimizeWindow(id: AppId) {
    setWindows((current) => current.map((item) => item.id === id ? { ...item, minimized: true } : item));
    if (activeId === id) {
      const next = [...windows].filter((item) => item.id !== id && !item.minimized).sort((a, b) => b.z - a.z)[0];
      setActiveId(next?.id ?? null);
    }
  }

  function toggleTaskbarWindow(id: AppId) {
    const item = windows.find((current) => current.id === id);
    if (!item) { openApp(id); return; }
    if (activeId === id && !item.minimized) minimizeWindow(id);
    else focusWindow(id);
  }

  function toggleMaximize(id: AppId) {
    setWindows((current) => current.map((item) => item.id === id ? { ...item, maximized: !item.maximized } : item));
    setActiveId(id);
  }

  function startDragging(id: AppId, event: ReactPointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    const item = windows.find((current) => current.id === id);
    if (!item || item.maximized) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveId(id);
    setDrag({ id, pointerX: event.clientX, pointerY: event.clientY, windowX: item.x, windowY: item.y });
  }

  function moveWindow(id: AppId, event: ReactPointerEvent<HTMLElement>) {
    if (!drag || drag.id !== id) return;
    const item = windows.find((current) => current.id === id);
    if (!item) return;
    const maxX = window.innerWidth - Math.min(item.width, 220);
    const maxY = window.innerHeight - 118;
    const x = Math.max(-item.width + 220, Math.min(maxX, drag.windowX + event.clientX - drag.pointerX));
    const y = Math.max(0, Math.min(maxY, drag.windowY + event.clientY - drag.pointerY));
    setWindows((current) => current.map((windowItem) => windowItem.id === id ? { ...windowItem, x, y } : windowItem));
  }

  const changeSetting = updateSetting;
  const appSearchResults = APP_ORDER.filter((id) => APP_META[id].title.toLocaleLowerCase("pt-BR").includes(menuSearch.toLocaleLowerCase("pt-BR")));
  const timeLabel = clock.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dateLabel = clock.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(" de ", " ");
  function handlePower(action: "lock" | "restart" | "off") {
    setPowerMenuOpen(false);
    setStartMenuOpen(false);
    if (action === "lock") setSessionState("locked");
    if (action === "off") setSessionState("off");
    if (action === "restart") {
      setWindows([]);
      setActiveId(null);
      setSessionState("active");
      notify("Sessão reiniciada");
    }
  }

  return (
    <div className={`desktop-shell wallpaper-${settings.wallpaper} ${settings.nightLight ? "night-light-on" : ""}`}>
      <div className="desktop-wallpaper" />
      <div className="desktop-shade" />
      <div className="desktop-shortcuts" onPointerDown={(event) => { if (event.target === event.currentTarget) setSelectedShortcut(""); }}>
        <DesktopShortcut title="Pasta pessoal" icon={Home} tint="home" selected={selectedShortcut === "home"} onClick={() => setSelectedShortcut("home")} onDoubleClick={() => openApp("files")} />
        <DesktopShortcut title="Documentos" icon={FileText} tint="documents" selected={selectedShortcut === "documents"} onClick={() => setSelectedShortcut("documents")} onDoubleClick={() => openApp("files")} />
        <DesktopShortcut title="Navegador" icon={Globe} tint="browser" selected={selectedShortcut === "browser"} onClick={() => setSelectedShortcut("browser")} onDoubleClick={() => openApp("browser")} />
        <DesktopShortcut title="Lixeira" icon={Trash2} tint="trash" selected={selectedShortcut === "trash"} onClick={() => setSelectedShortcut("trash")} onDoubleClick={() => openApp("files")} />
      </div>

      <main className="workspace" onPointerDown={(event) => { if (event.target === event.currentTarget) { setActiveId(null); setSelectedShortcut(""); } }}>
        {windows.filter((item) => !item.minimized).map((item) => (
          <AppWindow
            key={item.id}
            item={item}
            active={activeId === item.id}
            settings={settings}
            updateSetting={changeSetting}
            onFocus={() => focusWindow(item.id)}
            onClose={() => closeWindow(item.id)}
            onMinimize={() => minimizeWindow(item.id)}
            onMaximize={() => toggleMaximize(item.id)}
            onDragStart={(event) => startDragging(item.id, event)}
            onDragMove={(event) => moveWindow(item.id, event)}
            onDragEnd={() => setDrag(null)}
            notify={notify}
          />
        ))}
      </main>

      <div className="desktop-widgets" aria-hidden="true"><span className="widget-greeting">um espaço seu</span><span className="widget-date">{clock.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span></div>

      {startMenuOpen && <>
        <button className="dismiss-layer" type="button" aria-label="Fechar menu" onClick={() => { setStartMenuOpen(false); setPowerMenuOpen(false); }} />
        <section className="start-menu popover-panel" onPointerDown={(event) => event.stopPropagation()}>
          <div className="start-menu-search"><Search size={17} /><input autoFocus value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} placeholder="Buscar aplicativos..." /></div>
          <div className="start-menu-main">
            <aside className="start-menu-rail">
              <div className="start-menu-brand"><span><Leaf size={22} /></span><strong>mint</strong></div>
              <button type="button" className="rail-user" title="Conta do visitante"><span>V</span></button>
              <button type="button" className="rail-settings" title="Configurações" onClick={() => openApp("settings")}><Settings size={18} /></button>
            </aside>
            <div className="start-menu-apps">
              <div className="menu-section-title"><span>{menuSearch ? "Resultados" : "Seus aplicativos"}</span><span className="menu-app-count">{appSearchResults.length}</span></div>
              {appSearchResults.length > 0 ? appSearchResults.map((id) => {
                const meta = APP_META[id];
                return <button type="button" className="menu-app-row" key={id} onClick={() => openApp(id)}><span className={`menu-app-icon app-mark-${meta.tint}`}><AppIcon app={id} size={19} /></span><span><strong>{meta.title}</strong><small>{meta.description}</small></span><ChevronRight className="menu-app-chevron" size={15} /></button>;
              }) : <div className="menu-no-results"><Search size={20} /><span>Nenhum aplicativo encontrado</span></div>}
              {!menuSearch && <div className="menu-recent"><span>Recentes</span><button type="button" onClick={() => openApp("notes")}><NotebookPen size={15} /><span>Boas-vindas</span><small>hoje</small></button></div>}
            </div>
          </div>
          <div className="start-menu-footer"><div className="start-user-info"><span className="start-avatar">V</span><span><strong>Visitante</strong><small>Sessão local</small></span></div><button type="button" className={`power-button ${powerMenuOpen ? "is-open" : ""}`} aria-label="Opções de energia" title="Opções de energia" onClick={() => setPowerMenuOpen((value) => !value)}><Power size={18} /></button>
            {powerMenuOpen && <div className="power-options"><button type="button" onClick={() => handlePower("lock")}><LockKeyhole size={15} /> Bloquear sessão</button><button type="button" onClick={() => handlePower("restart")}><RefreshCw size={15} /> Reiniciar desktop</button><button type="button" onClick={() => handlePower("off")}><Power size={15} /> Desligar</button></div>}
          </div>
        </section>
      </>}

      {quickPanelOpen && <><button className="dismiss-layer" type="button" aria-label="Fechar configurações rápidas" onClick={() => setQuickPanelOpen(false)} /><QuickSettings settings={settings} updateSetting={updateSetting} onOpenSettings={() => openApp("settings")} /></>}

      {notificationPanelOpen && <><button className="dismiss-layer" type="button" aria-label="Fechar notificações" onClick={() => setNotificationPanelOpen(false)} /><section className="notification-panel popover-panel"><div className="notification-heading"><div><strong>Notificações</strong><small>Seu dia, em um relance.</small></div><button type="button" onClick={() => setNotificationPanelOpen(false)}><X size={16} /></button></div><div className="notification-empty"><span><Bell size={20} /></span><strong>Tudo em dia</strong><p>As notificações novas aparecerão aqui.</p></div><div className="notification-date"><CalendarDaysIcon />{clock.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</div></section></>}

      {toast && <div className="desktop-toast"><span className="toast-check"><Check size={14} /></span>{toast}</div>}

      <footer className="taskbar">
        <button type="button" className={`start-button ${startMenuOpen ? "is-active" : ""}`} aria-label="Menu Mint" title="Menu Mint" onClick={() => { setStartMenuOpen((value) => !value); setQuickPanelOpen(false); setNotificationPanelOpen(false); }}><span className="start-leaf"><Leaf size={22} /></span><span className="start-button-label">Mint</span></button>
        <div className="taskbar-divider" />
        <div className="pinned-apps">{["browser", "files", "terminal"].map((id) => {
          const appId = id as AppId;
          const open = windows.some((item) => item.id === appId);
          const running = windows.some((item) => item.id === appId && !item.minimized);
          return <button key={appId} type="button" className={`taskbar-app ${open ? "has-window" : ""} ${activeId === appId && running ? "is-active" : ""}`} title={APP_META[appId].title} aria-label={APP_META[appId].title} onClick={() => toggleTaskbarWindow(appId)}><span className={`taskbar-app-icon app-mark-${APP_META[appId].tint}`}><AppIcon app={appId} size={19} /></span>{open && <span className="taskbar-indicator" />}</button>;
        })}</div>
        <div className="taskbar-divider taskbar-divider-soft" />
        <div className="open-window-list">{windows.filter((item) => item.id !== "browser" && item.id !== "files" && item.id !== "terminal").map((item) => <div key={item.id} className={`open-window-tab ${activeId === item.id && !item.minimized ? "is-active" : ""}`}><button type="button" className="open-window-select" onClick={() => toggleTaskbarWindow(item.id)}><AppIcon app={item.id} size={16} /><span>{APP_META[item.id].title}</span></button><button type="button" className="open-window-close" aria-label={`Fechar ${APP_META[item.id].title}`} onClick={() => closeWindow(item.id)}><X size={12} /></button></div>)}</div>
        <div className="taskbar-spacer" />
        <button type="button" className="tray-icon" aria-label="Notificações" title="Notificações" onClick={() => { setNotificationPanelOpen((value) => !value); setQuickPanelOpen(false); }}><Bell size={16} /></button>
        <button type="button" className="tray-cluster" aria-label="Configurações rápidas" title="Configurações rápidas" onClick={() => { setQuickPanelOpen((value) => !value); setNotificationPanelOpen(false); }}><span className={settings.wifi ? "tray-active" : ""}><Wifi size={16} /></span><span>{settings.volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}</span><span><Battery size={16} /></span><ChevronDown size={12} className="tray-chevron" /></button>
        <button type="button" className="clock-button" onClick={() => { setNotificationPanelOpen((value) => !value); setQuickPanelOpen(false); }} aria-label="Abrir calendário"><span>{timeLabel}</span><small>{dateLabel}</small></button>
        <button type="button" className="show-desktop-button" aria-label="Mostrar área de trabalho" title="Mostrar área de trabalho" onClick={() => { setWindows((current) => current.map((item) => ({ ...item, minimized: true }))); setActiveId(null); }}><span /></button>
      </footer>

      {sessionState !== "active" && <div className="session-screen"><div className="session-backdrop" /><div className="session-content"><span className="session-logo"><Leaf size={36} /></span><p>{sessionState === "off" ? "MINT OS" : "SESSÃO BLOQUEADA"}</p><h1>{sessionState === "off" ? "Até logo." : "Olá, visitante."}</h1><span className="session-clock">{timeLabel}</span><button type="button" onClick={() => setSessionState("active")}>{sessionState === "off" ? <Power size={16} /> : <LockKeyhole size={16} />}{sessionState === "off" ? "Ligar desktop" : "Desbloquear sessão"}</button><small>Simulação de desktop · nenhuma ação afeta o computador</small></div></div>}
    </div>
  );
}

function CalendarDaysIcon() {
  return <Clock size={15} />;
}