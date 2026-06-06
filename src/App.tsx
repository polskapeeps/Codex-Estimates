import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  BarChart3,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FolderKanban,
  MapPin,
  Mail,
  Pencil,
  Phone,
  Plus,
  Printer,
  Save,
  Search,
  Settings,
  StickyNote,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  blankPaintingArea,
  blankPaintingInput,
  calculatePaintingEstimate,
} from "./calculators/paintingCalculator";
import "./App.css";
import { db, defaultSettings, ensureSettings, nowIso, saveActivity, uid } from "./lib/db";
import { decimalMoney, formatRange, money, shortDate } from "./lib/format";
import { useLiveQueryValue } from "./lib/useLiveQueryValue";
import {
  JOB_CATEGORIES,
  LOCAL_USER_ID,
  NOTE_TYPES,
  PROJECT_STATUSES,
  type BusinessSettings,
  type Client,
  type Estimate,
  type JobCategory,
  type NoteType,
  type PaintingAreaInput,
  type PaintingEstimateInput,
  type Project,
  type ProjectNote,
  type ProjectStatus,
} from "./lib/types";

type ProjectSort =
  | "recent"
  | "created"
  | "client"
  | "estimateHigh"
  | "estimateLow"
  | "due"
  | "status"
  | "category";

type ProjectFormState = {
  clientName: string;
  phone: string;
  email: string;
  company: string;
  title: string;
  jobCategory: JobCategory;
  siteAddress: string;
  description: string;
  desiredStartDate: string;
  estimateDueDate: string;
  tags: string;
  initialNote: string;
};

const emptyProjectForm = (): ProjectFormState => ({
  clientName: "",
  phone: "",
  email: "",
  company: "",
  title: "",
  jobCategory: "Painting",
  siteAddress: "",
  description: "",
  desiredStartDate: "",
  estimateDueDate: "",
  tags: "",
  initialNote: "",
});

const getClientName = (clients: Client[], clientId: string) =>
  clients.find((client) => client.id === clientId)?.name ?? "Unknown client";

const splitTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const numberFromInput = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const statusClass = (status: ProjectStatus) => `status status-${status.toLowerCase()}`;

const updateProjectStatus = async (project: Project, nextStatus: ProjectStatus) => {
  if (project.status === nextStatus) {
    return;
  }

  const timestamp = nowIso();
  const patch: Partial<Project> = {
    status: nextStatus,
    updatedAt: timestamp,
    archivedAt: nextStatus === "Archived" ? timestamp : undefined,
    bidSentAt: nextStatus === "Sent" ? timestamp : project.bidSentAt,
    wonAt: nextStatus === "Won" ? timestamp : project.wonAt,
    lostAt: nextStatus === "Lost" ? timestamp : project.lostAt,
  };

  await db.transaction("rw", db.projects, db.activityEvents, async () => {
    await db.projects.update(project.id, patch);
    await saveActivity(project.id, "status_changed", {
      oldStatus: project.status,
      newStatus: nextStatus,
    });
  });
};

function App() {
  useEffect(() => {
    void ensureSettings();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Navigate to="/projects" replace />} />
          <Route path="/login" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/new" element={<ProjectFormPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/projects/:projectId/edit" element={<ProjectFormPage />} />
          <Route path="/projects/:projectId/notes" element={<ProjectDetailPage focus="notes" />} />
          <Route path="/projects/:projectId/estimate" element={<EstimatePage />} />
          <Route path="/projects/:projectId/print" element={<PrintPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Shell() {
  const location = useLocation();
  const isPrintRoute = location.pathname.endsWith("/print");

  return (
    <div className={isPrintRoute ? "app-shell print-shell" : "app-shell"}>
      <aside className="sidebar no-print">
        <Link className="brand" to="/projects">
          <FolderKanban size={22} />
          <span>Codex Estimates</span>
        </Link>
        <nav className="nav-stack">
          <NavItem to="/projects" icon={<ClipboardList size={18} />} label="Projects" />
          <NavItem to="/projects/new" icon={<Plus size={18} />} label="New" />
          <NavItem to="/dashboard" icon={<BarChart3 size={18} />} label="Dashboard" />
          <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" />
        </nav>
        <div className="sync-panel">
          <CheckCircle2 size={16} />
          <span>Saved locally</span>
        </div>
      </aside>

      <main className="main">
        {!isPrintRoute && (
          <header className="topbar no-print">
            <div>
              <p className="eyebrow">Mobile PWA MVP</p>
              <h1>{location.pathname.includes("estimate") ? "Painting Estimate" : "Project Files"}</h1>
            </div>
            <Link className="primary-action" to="/projects/new">
              <Plus size={18} />
              <span>New Project</span>
            </Link>
          </header>
        )}
        <section className={isPrintRoute ? "print-content" : "content"}>
          <Outlet />
        </section>
      </main>

      <nav className="bottom-nav no-print">
        <NavItem to="/projects" icon={<ClipboardList size={18} />} label="Projects" />
        <NavItem to="/projects/new" icon={<Plus size={18} />} label="New" />
        <NavItem to="/dashboard" icon={<BarChart3 size={18} />} label="Dash" />
        <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" />
      </nav>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <NavLink className="nav-item" to={to}>
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function ProjectsPage() {
  const { value: projects } = useLiveQueryValue(() => db.projects.toArray(), [], [] as Project[]);
  const { value: clients } = useLiveQueryValue(() => db.clients.toArray(), [], [] as Client[]);
  const { value: notes } = useLiveQueryValue(() => db.projectNotes.toArray(), [], [] as ProjectNote[]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "All" | "Open">("Open");
  const [categoryFilter, setCategoryFilter] = useState<JobCategory | "All">("All");
  const [sortBy, setSortBy] = useState<ProjectSort>("recent");

  const visibleProjects = useMemo(() => {
    const search = query.trim().toLowerCase();

    return projects
      .filter((project) => !project.deletedAt)
      .filter((project) => {
        if (statusFilter === "Open") {
          return project.status !== "Archived";
        }

        if (statusFilter === "All") {
          return true;
        }

        return project.status === statusFilter;
      })
      .filter((project) => categoryFilter === "All" || project.jobCategory === categoryFilter)
      .filter((project) => {
        if (!search) {
          return true;
        }

        const client = clients.find((item) => item.id === project.clientId);
        const projectNotes = notes
          .filter((note) => note.projectId === project.id && !note.deletedAt)
          .map((note) => note.body)
          .join(" ");
        const haystack = [
          client?.name,
          client?.phone,
          client?.email,
          project.title,
          project.description,
          project.siteAddress,
          project.jobCategory,
          project.tags.join(" "),
          projectNotes,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      })
      .sort((first, second) => {
        const firstClient = getClientName(clients, first.clientId);
        const secondClient = getClientName(clients, second.clientId);

        switch (sortBy) {
          case "created":
            return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
          case "client":
            return firstClient.localeCompare(secondClient);
          case "estimateHigh":
            return (second.roughTotalRecommended ?? 0) - (first.roughTotalRecommended ?? 0);
          case "estimateLow":
            return (first.roughTotalRecommended ?? 0) - (second.roughTotalRecommended ?? 0);
          case "due":
            return (first.estimateDueDate || "9999").localeCompare(second.estimateDueDate || "9999");
          case "status":
            return first.status.localeCompare(second.status);
          case "category":
            return first.jobCategory.localeCompare(second.jobCategory);
          case "recent":
          default:
            return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
        }
      });
  }, [categoryFilter, clients, notes, projects, query, sortBy, statusFilter]);

  return (
    <div className="page-stack">
      <section className="toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, clients, notes"
          />
        </label>
        <label>
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ProjectStatus | "All" | "Open")}
          >
            <option value="Open">Open</option>
            <option value="All">All</option>
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Category</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as JobCategory | "All")}
          >
            <option value="All">All</option>
            {JOB_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as ProjectSort)}>
            <option value="recent">Recently updated</option>
            <option value="created">Newest created</option>
            <option value="client">Client A-Z</option>
            <option value="estimateHigh">Estimate high to low</option>
            <option value="estimateLow">Estimate low to high</option>
            <option value="due">Due date</option>
            <option value="status">Status</option>
            <option value="category">Job category</option>
          </select>
        </label>
      </section>

      <section className="project-list">
        {visibleProjects.length === 0 ? (
          <EmptyState />
        ) : (
          visibleProjects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              client={clients.find((client) => client.id === project.clientId)}
            />
          ))
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <FolderKanban size={34} />
      <h2>No matching projects</h2>
      <p>Create the first file or loosen the filters.</p>
      <Link className="primary-action" to="/projects/new">
        <Plus size={18} />
        <span>New Project</span>
      </Link>
    </div>
  );
}

function ProjectRow({ project, client }: { project: Project; client?: Client }) {
  return (
    <article className="project-row">
      <Link className="project-row-main" to={`/projects/${project.id}`}>
        <div className="project-row-title">
          <span className={statusClass(project.status)}>{project.status}</span>
          <h2>{client?.name || "Unknown client"}</h2>
          <p>{project.title}</p>
        </div>
        <div className="project-meta">
          <span>
            <MapPin size={15} />
            {project.siteAddress || "No address"}
          </span>
          <span>
            <CircleDollarSign size={15} />
            {formatRange(project.roughTotalMin, project.roughTotalMax)}
          </span>
          <span>{project.jobCategory}</span>
          <span>Updated {shortDate(project.updatedAt)}</span>
        </div>
        {project.tags.length > 0 && (
          <div className="tag-row">
            {project.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </Link>
      <div className="row-actions">
        <select
          aria-label="Project status"
          value={project.status}
          onChange={(event) => void updateProjectStatus(project, event.target.value as ProjectStatus)}
        >
          {PROJECT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <Link className="icon-button" title="Edit" to={`/projects/${project.id}/edit`}>
          <Pencil size={17} />
        </Link>
      </div>
    </article>
  );
}

function ProjectFormPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const isEdit = Boolean(projectId);
  const { value: project } = useLiveQueryValue(
    () => (projectId ? db.projects.get(projectId) : Promise.resolve(undefined)),
    [projectId],
    undefined as Project | undefined,
  );
  const { value: clients } = useLiveQueryValue(() => db.clients.toArray(), [], [] as Client[]);
  const [form, setForm] = useState<ProjectFormState>(emptyProjectForm);
  const client = project ? clients.find((item) => item.id === project.clientId) : undefined;

  useEffect(() => {
    if (!project || !client) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      clientName: client.name,
      phone: client.phone,
      email: client.email,
      company: client.company,
      title: project.title,
      jobCategory: project.jobCategory,
      siteAddress: project.siteAddress,
      description: project.description,
      desiredStartDate: project.desiredStartDate,
      estimateDueDate: project.estimateDueDate,
      tags: project.tags.join(", "),
      initialNote: "",
    });
  }, [client, project]);

  const update = (patch: Partial<ProjectFormState>) => setForm((current) => ({ ...current, ...patch }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const timestamp = nowIso();

    if (!form.clientName.trim() || !form.title.trim()) {
      return;
    }

    if (isEdit && project && client) {
      await db.transaction("rw", db.clients, db.projects, db.activityEvents, async () => {
        await db.clients.update(client.id, {
          name: form.clientName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          billingAddress: form.siteAddress.trim(),
          updatedAt: timestamp,
        });
        await db.projects.update(project.id, {
          title: form.title.trim(),
          jobCategory: form.jobCategory,
          siteAddress: form.siteAddress.trim(),
          description: form.description.trim(),
          desiredStartDate: form.desiredStartDate,
          estimateDueDate: form.estimateDueDate,
          tags: splitTags(form.tags),
          updatedAt: timestamp,
        });
        await saveActivity(project.id, "project_updated", { title: form.title.trim() });
      });
      navigate(`/projects/${project.id}`);
      return;
    }

    const clientId = uid("client");
    const newProjectId = uid("project");

    await db.transaction(
      "rw",
      db.clients,
      db.projects,
      db.projectNotes,
      db.activityEvents,
      async () => {
        await db.clients.add({
          id: clientId,
          userId: LOCAL_USER_ID,
          name: form.clientName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          billingAddress: form.siteAddress.trim(),
          notes: "",
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        await db.projects.add({
          id: newProjectId,
          userId: LOCAL_USER_ID,
          clientId,
          title: form.title.trim(),
          jobCategory: form.jobCategory,
          status: "New",
          siteAddress: form.siteAddress.trim(),
          description: form.description.trim(),
          desiredStartDate: form.desiredStartDate,
          estimateDueDate: form.estimateDueDate,
          tags: splitTags(form.tags),
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        if (form.initialNote.trim()) {
          await db.projectNotes.add({
            id: uid("note"),
            userId: LOCAL_USER_ID,
            projectId: newProjectId,
            noteType: "Site Visit",
            body: form.initialNote.trim(),
            pinned: false,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }

        await saveActivity(newProjectId, "project_created", { title: form.title.trim() });
      },
    );

    navigate(`/projects/${newProjectId}/estimate`);
  };

  return (
    <form className="form-grid page-stack" onSubmit={(event) => void submit(event)}>
      <PageHeader
        title={isEdit ? "Edit Project" : "New Project"}
        backTo={isEdit && project ? `/projects/${project.id}` : "/projects"}
      />
      <section className="form-section">
        <h2>Client</h2>
        <div className="two-column">
          <label>
            <span>Client name</span>
            <input
              required
              value={form.clientName}
              onChange={(event) => update({ clientName: event.target.value })}
            />
          </label>
          <label>
            <span>Company</span>
            <input value={form.company} onChange={(event) => update({ company: event.target.value })} />
          </label>
          <label>
            <span>Phone</span>
            <input
              value={form.phone}
              inputMode="tel"
              onChange={(event) => update({ phone: event.target.value })}
            />
          </label>
          <label>
            <span>Email</span>
            <input
              value={form.email}
              inputMode="email"
              onChange={(event) => update({ email: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Project</h2>
        <div className="two-column">
          <label>
            <span>Job title</span>
            <input required value={form.title} onChange={(event) => update({ title: event.target.value })} />
          </label>
          <label>
            <span>Category</span>
            <select
              value={form.jobCategory}
              onChange={(event) => update({ jobCategory: event.target.value as JobCategory })}
            >
              {JOB_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="wide">
            <span>Site address</span>
            <input
              value={form.siteAddress}
              onChange={(event) => update({ siteAddress: event.target.value })}
            />
          </label>
          <label>
            <span>Desired start</span>
            <input
              type="date"
              value={form.desiredStartDate}
              onChange={(event) => update({ desiredStartDate: event.target.value })}
            />
          </label>
          <label>
            <span>Estimate due</span>
            <input
              type="date"
              value={form.estimateDueDate}
              onChange={(event) => update({ estimateDueDate: event.target.value })}
            />
          </label>
          <label className="wide">
            <span>Tags</span>
            <input
              value={form.tags}
              placeholder="Interior, urgent, follow up"
              onChange={(event) => update({ tags: event.target.value })}
            />
          </label>
          <label className="wide">
            <span>Description</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => update({ description: event.target.value })}
            />
          </label>
          {!isEdit && (
            <label className="wide">
              <span>Initial notes</span>
              <textarea
                rows={5}
                value={form.initialNote}
                onChange={(event) => update({ initialNote: event.target.value })}
              />
            </label>
          )}
        </div>
      </section>
      <div className="sticky-actions">
        <button className="primary-action" type="submit">
          <Save size={18} />
          <span>{isEdit ? "Save Changes" : "Create Project"}</span>
        </button>
      </div>
    </form>
  );
}

function ProjectDetailPage({ focus }: { focus?: "notes" }) {
  const { projectId } = useParams();
  const { value: project } = useLiveQueryValue(
    () => (projectId ? db.projects.get(projectId) : Promise.resolve(undefined)),
    [projectId],
    undefined as Project | undefined,
  );
  const { value: clients } = useLiveQueryValue(() => db.clients.toArray(), [], [] as Client[]);
  const { value: notes } = useLiveQueryValue(
    () => (projectId ? db.projectNotes.where("projectId").equals(projectId).toArray() : []),
    [projectId],
    [] as ProjectNote[],
  );
  const { value: estimates } = useLiveQueryValue(
    () => (projectId ? db.estimates.where("projectId").equals(projectId).toArray() : []),
    [projectId],
    [] as Estimate[],
  );
  const { value: events } = useLiveQueryValue(
    () => (projectId ? db.activityEvents.where("projectId").equals(projectId).toArray() : []),
    [projectId],
    [],
  );
  const [noteBody, setNoteBody] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("Site Visit");

  const client = project ? clients.find((item) => item.id === project.clientId) : undefined;
  const latestEstimate = [...estimates].filter((estimate) => !estimate.deletedAt).sort(
    (first, second) => second.versionNumber - first.versionNumber,
  )[0];
  const visibleNotes = notes
    .filter((note) => !note.deletedAt)
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime());

  useEffect(() => {
    if (focus === "notes") {
      document.getElementById("notes")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focus]);

  if (!project) {
    return <MissingProject />;
  }

  const addNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const timestamp = nowIso();

    if (!noteBody.trim()) {
      return;
    }

    await db.transaction("rw", db.projectNotes, db.activityEvents, db.projects, async () => {
      await db.projectNotes.add({
        id: uid("note"),
        userId: LOCAL_USER_ID,
        projectId: project.id,
        noteType,
        body: noteBody.trim(),
        pinned: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      await db.projects.update(project.id, { updatedAt: timestamp });
      await saveActivity(project.id, "note_added", { noteType });
    });
    setNoteBody("");
  };

  const archiveProject = async () => {
    await updateProjectStatus(project, "Archived");
  };

  return (
    <div className="page-stack">
      <PageHeader title={project.title} backTo="/projects" />

      <section className="overview-grid">
        <article className="summary-panel">
          <div className="summary-topline">
            <span className={statusClass(project.status)}>{project.status}</span>
            <span>{project.jobCategory}</span>
          </div>
          <h2>{client?.name || "Unknown client"}</h2>
          <p>{project.description || "No description yet."}</p>
          <div className="contact-row">
            {client?.phone && (
              <a href={`tel:${client.phone}`}>
                <Phone size={16} />
                {client.phone}
              </a>
            )}
            {client?.email && (
              <a href={`mailto:${client.email}`}>
                <Mail size={16} />
                {client.email}
              </a>
            )}
            {project.siteAddress && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  project.siteAddress,
                )}`}
                target="_blank"
              >
                <MapPin size={16} />
                Map
              </a>
            )}
          </div>
        </article>

        <article className="estimate-panel">
          <p className="eyebrow">Current estimate</p>
          <strong>{formatRange(project.roughTotalMin, project.roughTotalMax)}</strong>
          <span>Recommended {money(project.roughTotalRecommended)}</span>
          <span>Confidence: {project.confidence ?? "none"}</span>
          <div className="action-row">
            <Link className="primary-action" to={`/projects/${project.id}/estimate`}>
              <Calculator size={18} />
              <span>Estimate</span>
            </Link>
            <Link className="secondary-action" to={`/projects/${project.id}/print`}>
              <Printer size={18} />
              <span>Print / PDF</span>
            </Link>
          </div>
        </article>
      </section>

      <section className="detail-actions no-print">
        <label>
          <span>Status</span>
          <select
            value={project.status}
            onChange={(event) => void updateProjectStatus(project, event.target.value as ProjectStatus)}
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <Link className="secondary-action" to={`/projects/${project.id}/edit`}>
          <Pencil size={18} />
          <span>Edit</span>
        </Link>
        <button className="secondary-action" type="button" onClick={() => void archiveProject()}>
          <Archive size={18} />
          <span>Archive</span>
        </button>
      </section>

      <section className="form-section" id="notes">
        <h2>Notes</h2>
        <form className="note-form" onSubmit={(event) => void addNote(event)}>
          <select value={noteType} onChange={(event) => setNoteType(event.target.value as NoteType)}>
            {NOTE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <textarea
            rows={4}
            value={noteBody}
            onChange={(event) => setNoteBody(event.target.value)}
            placeholder="Measurements, client requests, scope changes"
          />
          <button className="primary-action" type="submit">
            <StickyNote size={18} />
            <span>Add Note</span>
          </button>
        </form>
        <div className="note-list">
          {visibleNotes.length === 0 ? (
            <p className="muted">No notes yet.</p>
          ) : (
            visibleNotes.map((note) => (
              <article key={note.id} className="note-item">
                <div>
                  <span>{note.noteType}</span>
                  <time>{shortDate(note.createdAt)}</time>
                </div>
                <p>{note.body}</p>
              </article>
            ))
          )}
        </div>
      </section>

      {latestEstimate && (
        <section className="form-section">
          <h2>Latest Estimate</h2>
          <div className="estimate-summary-grid">
            <Metric label="Range" value={formatRange(latestEstimate.result.totalMin, latestEstimate.result.totalMax)} />
            <Metric label="Recommended" value={money(latestEstimate.result.recommendedTotal)} />
            <Metric label="Labor" value={`${latestEstimate.result.laborHoursMin} - ${latestEstimate.result.laborHoursMax} hr`} />
            <Metric label="Materials" value={money(latestEstimate.result.materialsMax)} />
          </div>
        </section>
      )}

      <section className="form-section">
        <h2>Activity</h2>
        <div className="activity-list">
          {events
            .slice()
            .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
            .slice(0, 8)
            .map((event) => (
              <div key={event.id}>
                <span>{event.eventType.replace(/_/g, " ")}</span>
                <time>{shortDate(event.createdAt)}</time>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

function EstimatePage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { value: project } = useLiveQueryValue(
    () => (projectId ? db.projects.get(projectId) : Promise.resolve(undefined)),
    [projectId],
    undefined as Project | undefined,
  );
  const { value: settings } = useLiveQueryValue(
    () => db.businessSettings.get("default").then((value) => value ?? ensureSettings()),
    [],
    defaultSettings(),
  );
  const { value: estimates } = useLiveQueryValue(
    () => (projectId ? db.estimates.where("projectId").equals(projectId).toArray() : []),
    [projectId],
    [] as Estimate[],
  );
  const latestEstimate = [...estimates].filter((estimate) => !estimate.deletedAt).sort(
    (first, second) => second.versionNumber - first.versionNumber,
  )[0];
  const [input, setInput] = useState<PaintingEstimateInput>(() => blankPaintingInput(settings));

  useEffect(() => {
    if (latestEstimate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(latestEstimate.input);
      return;
    }
    setInput(blankPaintingInput(settings));
  }, [latestEstimate, settings]);

  const previewId = latestEstimate?.id ?? "preview";
  const result = useMemo(
    () => calculatePaintingEstimate(previewId, project?.id ?? "preview-project", input, settings),
    [input, previewId, project?.id, settings],
  );

  if (!project) {
    return <MissingProject />;
  }

  const updateInput = (patch: Partial<PaintingEstimateInput>) =>
    setInput((current) => ({ ...current, ...patch }));

  const updateArea = (areaId: string, patch: Partial<PaintingAreaInput>) => {
    setInput((current) => ({
      ...current,
      areas: current.areas.map((area) => (area.id === areaId ? { ...area, ...patch } : area)),
    }));
  };

  const removeArea = (areaId: string) => {
    setInput((current) => ({
      ...current,
      areas: current.areas.filter((area) => area.id !== areaId),
    }));
  };

  const saveEstimate = async () => {
    const timestamp = nowIso();
    const estimateId = uid("estimate");
    const savedResult = calculatePaintingEstimate(estimateId, project.id, input, settings);
    const nextVersion =
      Math.max(0, ...estimates.map((estimate) => estimate.versionNumber || 0)) + 1;

    await db.transaction("rw", db.estimates, db.projects, db.activityEvents, async () => {
      await db.estimates.add({
        id: estimateId,
        userId: LOCAL_USER_ID,
        projectId: project.id,
        templateKey: "painting",
        versionNumber: nextVersion,
        status: "saved",
        input,
        result: savedResult,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      await db.projects.update(project.id, {
        status: project.status === "New" ? "Estimating" : project.status,
        roughTotalMin: savedResult.totalMin,
        roughTotalMax: savedResult.totalMax,
        roughTotalRecommended: savedResult.recommendedTotal,
        confidence: savedResult.confidence,
        updatedAt: timestamp,
      });
      await saveActivity(project.id, "estimate_saved", {
        versionNumber: nextVersion,
        totalMin: savedResult.totalMin,
        totalMax: savedResult.totalMax,
      });
    });

    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="page-stack">
      <PageHeader title="Painting Estimate" backTo={`/projects/${project.id}`} />

      <section className="estimate-hero">
        <div>
          <p className="eyebrow">Recommended</p>
          <strong>{money(result.recommendedTotal)}</strong>
          <span>{formatRange(result.totalMin, result.totalMax)}</span>
        </div>
        <div className="estimate-metrics">
          <Metric label="Labor" value={`${result.laborHoursMin} - ${result.laborHoursMax} hr`} />
          <Metric label="Materials" value={money(result.materialsMax)} />
          <Metric label="Markup" value={money(result.markupAmountMax)} />
          <Metric label="Confidence" value={result.confidence} />
        </div>
      </section>

      {result.warnings.length > 0 && (
        <section className="warning-list">
          {result.warnings.map((warning) => (
            <div key={warning}>
              <AlertTriangle size={18} />
              <span>{warning}</span>
            </div>
          ))}
        </section>
      )}

      <section className="form-section">
        <h2>Scope</h2>
        <div className="two-column">
          <label>
            <span>Interior / exterior</span>
            <select
              value={input.scopeType}
              onChange={(event) => updateInput({ scopeType: event.target.value as PaintingEstimateInput["scopeType"] })}
            >
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
            </select>
          </label>
          <label>
            <span>Paint supplied by</span>
            <select
              value={input.paintSuppliedBy}
              onChange={(event) =>
                updateInput({ paintSuppliedBy: event.target.value as PaintingEstimateInput["paintSuppliedBy"] })
              }
            >
              <option value="contractor">Contractor</option>
              <option value="client">Client</option>
            </select>
          </label>
          <NumberField
            label="Coats"
            value={input.coats}
            min={1}
            onChange={(value) => updateInput({ coats: value })}
          />
          <NumberField
            label="Default height"
            value={input.wallHeight}
            min={0}
            onChange={(value) => updateInput({ wallHeight: value })}
          />
          <label>
            <span>Condition</span>
            <select
              value={input.condition}
              onChange={(event) =>
                updateInput({ condition: event.target.value as PaintingEstimateInput["condition"] })
              }
            >
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </label>
          <label>
            <span>Prep level</span>
            <select
              value={input.prepLevel}
              onChange={(event) =>
                updateInput({ prepLevel: event.target.value as PaintingEstimateInput["prepLevel"] })
              }
            >
              <option value="light">Light</option>
              <option value="normal">Normal</option>
              <option value="heavy">Heavy</option>
            </select>
          </label>
          <label>
            <span>Color change</span>
            <select
              value={input.colorChange}
              onChange={(event) =>
                updateInput({ colorChange: event.target.value as PaintingEstimateInput["colorChange"] })
              }
            >
              <option value="none">None</option>
              <option value="similar">Similar</option>
              <option value="major">Major</option>
            </select>
          </label>
          <label>
            <span>Access</span>
            <select
              value={input.accessDifficulty}
              onChange={(event) =>
                updateInput({
                  accessDifficulty: event.target.value as PaintingEstimateInput["accessDifficulty"],
                })
              }
            >
              <option value="normal">Normal</option>
              <option value="ladder">Ladder</option>
              <option value="high ceiling">High ceiling</option>
              <option value="tight access">Tight access</option>
            </select>
          </label>
          <label>
            <span>Occupancy</span>
            <select
              value={input.occupancy}
              onChange={(event) =>
                updateInput({ occupancy: event.target.value as PaintingEstimateInput["occupancy"] })
              }
            >
              <option value="empty">Empty</option>
              <option value="occupied">Occupied</option>
            </select>
          </label>
          <NumberField
            label="Prep hours"
            value={input.prepHours}
            min={0}
            onChange={(value) => updateInput({ prepHours: value })}
          />
          <label className="wide">
            <span>Scope summary</span>
            <textarea
              rows={3}
              value={input.scopeSummary}
              onChange={(event) => updateInput({ scopeSummary: event.target.value })}
            />
          </label>
          <label className="wide">
            <span>Exclusions</span>
            <textarea
              rows={3}
              value={input.exclusions}
              onChange={(event) => updateInput({ exclusions: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="section-heading-row">
          <h2>Areas</h2>
          <button
            className="secondary-action"
            type="button"
            onClick={() =>
              setInput((current) => ({
                ...current,
                areas: [...current.areas, blankPaintingArea(`Area ${current.areas.length + 1}`)],
              }))
            }
          >
            <Plus size={18} />
            <span>Add Area</span>
          </button>
        </div>
        <div className="area-stack">
          {input.areas.map((area) => (
            <article key={area.id} className="area-editor">
              <div className="section-heading-row">
                <input
                  className="area-name-input"
                  value={area.name}
                  onChange={(event) => updateArea(area.id, { name: event.target.value })}
                  aria-label="Area name"
                />
                <button className="icon-button" type="button" onClick={() => removeArea(area.id)}>
                  <Trash2 size={17} />
                </button>
              </div>
              <div className="area-grid">
                <NumberField label="Length" value={area.length} min={0} onChange={(value) => updateArea(area.id, { length: value })} />
                <NumberField label="Width" value={area.width} min={0} onChange={(value) => updateArea(area.id, { width: value })} />
                <NumberField label="Height" value={area.height} min={0} onChange={(value) => updateArea(area.id, { height: value })} />
                <NumberField label="Wall sq ft" value={area.wallSqft} min={0} onChange={(value) => updateArea(area.id, { wallSqft: value })} />
                <NumberField label="Ceiling sq ft" value={area.ceilingSqft} min={0} onChange={(value) => updateArea(area.id, { ceilingSqft: value })} />
                <NumberField label="Doors" value={area.doors} min={0} onChange={(value) => updateArea(area.id, { doors: value })} />
                <NumberField label="Windows" value={area.windows} min={0} onChange={(value) => updateArea(area.id, { windows: value })} />
                <NumberField label="Trim lf" value={area.trimLinearFeet} min={0} onChange={(value) => updateArea(area.id, { trimLinearFeet: value })} />
                <NumberField label="Openings sq ft" value={area.openingsSqft} min={0} onChange={(value) => updateArea(area.id, { openingsSqft: value })} />
              </div>
              <div className="toggle-row">
                <BooleanToggle label="Walls" checked={area.includeWalls} onChange={(value) => updateArea(area.id, { includeWalls: value })} />
                <BooleanToggle label="Ceiling" checked={area.includeCeiling} onChange={(value) => updateArea(area.id, { includeCeiling: value })} />
                <BooleanToggle label="Trim" checked={area.includeTrim} onChange={(value) => updateArea(area.id, { includeTrim: value })} />
                <BooleanToggle label="Doors" checked={area.includeDoors} onChange={(value) => updateArea(area.id, { includeDoors: value })} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h2>Line Items</h2>
        <div className="line-table">
          <div className="line-table-head">
            <span>Item</span>
            <span>Qty</span>
            <span>Labor</span>
            <span>Materials</span>
            <span>Total</span>
          </div>
          {result.lineItems.map((item) => (
            <div className="line-table-row" key={item.id}>
              <span>{item.description}</span>
              <span>
                {item.quantity} {item.unit}
              </span>
              <span>
                {item.laborHoursMin} - {item.laborHoursMax} hr
              </span>
              <span>{money(item.materialCostMax)}</span>
              <strong>{formatRange(item.calculatedTotalMin, item.calculatedTotalMax)}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky-actions">
        <Link className="secondary-action" to={`/projects/${project.id}`}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </Link>
        <button className="primary-action" type="button" onClick={() => void saveEstimate()}>
          <Save size={18} />
          <span>Save Estimate</span>
        </button>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { value: projects } = useLiveQueryValue(() => db.projects.toArray(), [], [] as Project[]);
  const openProjects = projects.filter((project) => !project.deletedAt && project.status !== "Archived");
  const pipelineValue = openProjects.reduce((sum, project) => sum + (project.roughTotalRecommended ?? 0), 0);
  const sentValue = openProjects
    .filter((project) => project.status === "Sent" || project.status === "Limbo")
    .reduce((sum, project) => sum + (project.roughTotalRecommended ?? 0), 0);

  return (
    <div className="page-stack">
      <section className="dashboard-grid">
        <Metric label="Open files" value={String(openProjects.length)} />
        <Metric label="Pipeline" value={money(pipelineValue)} />
        <Metric label="Sent / Limbo" value={money(sentValue)} />
        <Metric
          label="Won / Active"
          value={String(openProjects.filter((project) => project.status === "Won" || project.status === "Active").length)}
        />
      </section>
      <section className="form-section">
        <h2>Status Breakdown</h2>
        <div className="status-breakdown">
          {PROJECT_STATUSES.map((status) => {
            const matching = projects.filter((project) => project.status === status && !project.deletedAt);
            const value = matching.reduce((sum, project) => sum + (project.roughTotalRecommended ?? 0), 0);

            return (
              <div key={status}>
                <span className={statusClass(status)}>{status}</span>
                <strong>{matching.length}</strong>
                <span>{money(value)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SettingsPage() {
  const { value: savedSettings } = useLiveQueryValue(
    () => db.businessSettings.get("default").then((value) => value ?? ensureSettings()),
    [],
    defaultSettings(),
  );
  const [settings, setSettings] = useState<BusinessSettings>(savedSettings);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(savedSettings);
  }, [savedSettings]);

  const update = (patch: Partial<BusinessSettings>) =>
    setSettings((current) => ({ ...current, ...patch, updatedAt: nowIso() }));

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await db.businessSettings.put({ ...settings, updatedAt: nowIso() });
  };

  return (
    <form className="page-stack form-grid" onSubmit={(event) => void saveSettings(event)}>
      <section className="form-section">
        <h2>Business</h2>
        <div className="two-column">
          <label>
            <span>Business name</span>
            <input
              value={settings.businessName}
              onChange={(event) => update({ businessName: event.target.value })}
            />
          </label>
          <label>
            <span>Owner name</span>
            <input value={settings.ownerName} onChange={(event) => update({ ownerName: event.target.value })} />
          </label>
          <label>
            <span>Phone</span>
            <input value={settings.phone} onChange={(event) => update({ phone: event.target.value })} />
          </label>
          <label>
            <span>Email</span>
            <input value={settings.email} onChange={(event) => update({ email: event.target.value })} />
          </label>
          <label className="wide">
            <span>Address</span>
            <input value={settings.address} onChange={(event) => update({ address: event.target.value })} />
          </label>
          <label className="wide">
            <span>Service area</span>
            <input
              value={settings.serviceArea}
              onChange={(event) => update({ serviceArea: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Pricing Defaults</h2>
        <div className="two-column">
          <NumberField
            label="Labor rate"
            value={settings.defaultHourlyRate}
            min={0}
            prefix="$"
            suffix="/hr"
            onChange={(value) => update({ defaultHourlyRate: value })}
          />
          <NumberField
            label="Markup"
            value={settings.defaultMarkupPercent}
            min={-100}
            suffix="%"
            onChange={(value) => update({ defaultMarkupPercent: value })}
          />
          <NumberField
            label="Sales tax"
            value={settings.defaultTaxPercent}
            min={0}
            suffix="%"
            onChange={(value) => update({ defaultTaxPercent: value })}
          />
          <BooleanToggle
            label="Show tax"
            checked={settings.taxEnabled}
            onChange={(value) => update({ taxEnabled: value })}
          />
          <NumberField
            label="Paint coverage"
            value={settings.paintCoverageSqftPerGallon}
            min={1}
            suffix="sq ft/gal"
            onChange={(value) => update({ paintCoverageSqftPerGallon: value })}
          />
          <NumberField
            label="Paint cost"
            value={settings.paintCostPerGallon}
            min={0}
            prefix="$"
            suffix="/gal"
            onChange={(value) => update({ paintCostPerGallon: value })}
          />
          <NumberField
            label="Waste factor"
            value={settings.wasteFactor}
            min={1}
            onChange={(value) => update({ wasteFactor: value })}
          />
          <NumberField
            label="Default coats"
            value={settings.defaultCoats}
            min={1}
            onChange={(value) => update({ defaultCoats: value })}
          />
          <NumberField
            label="Supplies"
            value={settings.suppliesPercent}
            min={0}
            suffix="%"
            onChange={(value) => update({ suppliesPercent: value })}
          />
          <NumberField
            label="Supply minimum"
            value={settings.suppliesMinimum}
            min={0}
            prefix="$"
            onChange={(value) => update({ suppliesMinimum: value })}
          />
        </div>
        <label>
          <span>Print footer</span>
          <textarea
            rows={4}
            value={settings.printFooter}
            onChange={(event) => update({ printFooter: event.target.value })}
          />
        </label>
      </section>

      <div className="sticky-actions">
        <button className="primary-action" type="submit">
          <Save size={18} />
          <span>Save Settings</span>
        </button>
      </div>
    </form>
  );
}

function PrintPage() {
  const { projectId } = useParams();
  const { value: project } = useLiveQueryValue(
    () => (projectId ? db.projects.get(projectId) : Promise.resolve(undefined)),
    [projectId],
    undefined as Project | undefined,
  );
  const { value: clients } = useLiveQueryValue(() => db.clients.toArray(), [], [] as Client[]);
  const { value: settings } = useLiveQueryValue(
    () => db.businessSettings.get("default").then((value) => value ?? ensureSettings()),
    [],
    defaultSettings(),
  );
  const { value: estimates } = useLiveQueryValue(
    () => (projectId ? db.estimates.where("projectId").equals(projectId).toArray() : []),
    [projectId],
    [] as Estimate[],
  );

  if (!project) {
    return <MissingProject />;
  }

  const client = clients.find((item) => item.id === project.clientId);
  const latestEstimate = [...estimates].filter((estimate) => !estimate.deletedAt).sort(
    (first, second) => second.versionNumber - first.versionNumber,
  )[0];
  const result = latestEstimate?.result;
  const taxAmount = settings.taxEnabled && result ? result.recommendedTotal * (settings.defaultTaxPercent / 100) : 0;
  const totalWithTax = result ? result.recommendedTotal + taxAmount : 0;

  return (
    <article className="print-page">
      <div className="print-actions no-print">
        <Link className="secondary-action" to={`/projects/${project.id}`}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </Link>
        <button className="primary-action" type="button" onClick={() => window.print()}>
          <Printer size={18} />
          <span>Print / PDF</span>
        </button>
      </div>

      <header className="print-header">
        <div>
          <h1>{settings.businessName || "Draft Estimate"}</h1>
          <p>{settings.ownerName}</p>
          <p>{settings.phone}</p>
          <p>{settings.email}</p>
          <p>{settings.address || settings.serviceArea}</p>
        </div>
        <div>
          <p className="eyebrow">Estimate</p>
          <strong>{project.title}</strong>
          <span>{shortDate(nowIso())}</span>
        </div>
      </header>

      <section className="print-two-column">
        <div>
          <h2>Client</h2>
          <p>{client?.name || "Unknown client"}</p>
          <p>{client?.phone}</p>
          <p>{client?.email}</p>
          <p>{project.siteAddress}</p>
        </div>
        <div>
          <h2>Summary</h2>
          <p>{latestEstimate?.input.scopeSummary || project.description}</p>
          <strong>{result ? formatRange(result.totalMin, result.totalMax) : "No estimate saved"}</strong>
          {result && <span>Recommended: {money(result.recommendedTotal)}</span>}
          {settings.taxEnabled && result && (
            <span>
              Tax: {decimalMoney(taxAmount)} | Total: {decimalMoney(totalWithTax)}
            </span>
          )}
        </div>
      </section>

      {result && (
        <section>
          <h2>Scope Items</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Estimate</th>
              </tr>
            </thead>
            <tbody>
              {result.lineItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td>
                    {item.quantity} {item.unit}
                  </td>
                  <td>{formatRange(item.calculatedTotalMin, item.calculatedTotalMax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {latestEstimate && (
        <section>
          <h2>Assumptions</h2>
          <ul>
            {latestEstimate.result.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
          <h2>Exclusions</h2>
          <p>{latestEstimate.input.exclusions}</p>
        </section>
      )}

      <footer>
        <p>{settings.printFooter}</p>
      </footer>
    </article>
  );
}

function PageHeader({ title, backTo }: { title: string; backTo: string }) {
  return (
    <div className="page-header">
      <Link className="secondary-action" to={backTo}>
        <ArrowLeft size={18} />
        <span>Back</span>
      </Link>
      <h2>{title}</h2>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  prefix,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  prefix?: string;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <div className="number-wrap">
        {prefix && <span>{prefix}</span>}
        <input
          type="number"
          min={min}
          step="0.01"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(numberFromInput(event.target.value))}
        />
        {suffix && <span>{suffix}</span>}
      </div>
    </label>
  );
}

function BooleanToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function MissingProject() {
  return (
    <div className="empty-state">
      <AlertTriangle size={34} />
      <h2>Project not found</h2>
      <Link className="primary-action" to="/projects">
        <ClipboardList size={18} />
        <span>Projects</span>
      </Link>
    </div>
  );
}

export default App;
