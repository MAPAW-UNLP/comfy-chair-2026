// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Componente tipo formulario que permite tanto el alta como edición de articulos.
// Grupo 2 - Agrega el guardado como borrador: "Guardar borrador" persiste sin exigir
// completitud y "Subir" envía el artículo (en un borrador: PATCH + submit).
//
// -------------------------------------------------------------------------------------- 

// Importaciones de funcionalidades y librerías
import { useEffect, useRef, useState } from "react";
import { useBlocker, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { articleDraftSchema, articleSchema, type ArticleFormData } from '@/lib/validations';
import { completenessLabels, getMissingFields, type CompletenessField } from "@/lib/articleDraft";

// Importaciones de componentes UI
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, AlertCircleIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useArticleFiles } from "@/hooks/Grupo1/useArticleFiles";
import { UserCombobox } from "@/components/combobox/UserCombobox";
import { ConferenceCombobox } from "../combobox/ConferenceCombobox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { downloadMainFile, downloadSourceFile } from "@/services/articleServices";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DraftStatusBadge } from "./ArticleDraftBadges";
import { SubmitConfirmDialog, UnsavedChangesDialog } from "./ArticleDraftDialogs";
import { FileSelectButton } from "./FileSelectButton";
import { validateFileExtension, formatAllowedExtensions } from "@/lib/fileValidation";

// Importaciones de servicios
import { type User } from "@/services/userServices";
import { type Conference } from '@/components/conference/ConferenceApp';
import { useConferenceSessions } from '@/hooks/useConferenceSessions';
import { useSubmissionStatus } from '@/hooks/useSubmissionStatus';
import { type Article, type ArticleNew, type ArticleUpdate, ApiError, createArticle, isSubmissionPeriodClosed, submitArticle, updateArticle } from "@/services/articleServices";

// Configuración escalable de validación de extensiones
const ALLOWED_ARTICLE_EXTENSIONS = [".pdf"];
const ALLOWED_SOURCE_EXTENSIONS = [".pdf", ".zip", ".rar", ".png", ".jpeg", ".jpg"];

// Lo que espera recibir el componente
type ArticleFormProps = {
  conferences : Conference[];
  users: User[];
  editMode? : boolean;
  article? : Article;
  userId : number
  fixedConferenceId? : number;
  initialConferenceId?: number;
  initialSessionId?: number;
};

// Campos que el backend devuelve en los errores 400 y su equivalente en el form
const backendFieldMap: Partial<Record<string, keyof ArticleFormData>> = {
  title: "title",
  abstract: "abstract",
  main_file: "file",
  source_file: "sourcesFile",
  authors_ids: "authors",
  corresponding_author_id: "correspondingAuthor",
  session_id: "session",
};

//Cuerpo del Componente
const ArticleForm : React.FC<ArticleFormProps> = ({ conferences, users, editMode, article, userId, fixedConferenceId, initialConferenceId, initialSessionId }) => {

  // Navegacion
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Versión guardada del artículo (se actualiza con cada guardado de borrador)
  const [currentArticle, setCurrentArticle] = useState<Article | undefined>(article);

  // Siempre se vuelve al listado de submissions de la conferencia
  const navigateBack = () => {
    const conferenceId = selectedConference ?? currentArticle?.session?.conference?.id ?? fixedConferenceId;
    navigate({ to: conferenceId ? `/articles/${conferenceId}` : "/dashboard", replace: true });
  };

  // El alta y la edición de un borrador usan el flujo de borradores; un artículo ya enviado se edita como siempre
  const isDraftFlow = !editMode || article?.status === "draft";

  // Manejo de errores y estados de carga
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<ArticleFormData>>({});
  const [showErrorAlert, setShowErrorAlert] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingDraft, setSavingDraft] = useState<boolean>(false);
  const [submitAttempted, setSubmitAttempted] = useState<boolean>(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false);
  const busy = loading || savingDraft;

  // Cambios sin guardar: se usan refs para que el blocker lea siempre el valor actual
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const dirtyRef = useRef<boolean>(false);
  const allowLeaveRef = useRef<boolean>(false);
  useEffect(() => { dirtyRef.current = isDirty; }, [isDirty]);

  // Setteo de campos del formulario
  const [title, setTitle] = useState<string>("");
  const [abstract, setAbstract] = useState<string>("");
  const [articleType, setArticleType] = useState<string>("regular");
  const [selectedConference, setSelectedConference] = useState< number | null>(fixedConferenceId ?? initialConferenceId ?? null);
  const [selectedSession, setSelectedSession] = useState<string | null>(initialSessionId ? String(initialSessionId) : null);
  const [authors, setAuthors] = useState<User[]>([]);
  const [correspondingAuthor, setCorrespondingAuthor] = useState<string>("");


  // Obtener la conferencia actual seleccionada
  const currentConference = conferences.find((c) => c.id === selectedConference);
  // Ajusta 'accepts_multiple_sources' según la propiedad real de tu modelo Conference
  const acceptsMultipleSources = currentConference?.sources_multiple === true;

  // Contenedores de los campos obligatorios del borrador (para desplazarse al error)
  const conferenceFieldRef = useRef<HTMLDivElement>(null);
  const sessionFieldRef = useRef<HTMLDivElement>(null);
  const titleFieldRef = useRef<HTMLDivElement>(null);

  // Manejo de archivos
  const [mainFile, setMainFile] = useState<File | null>(null);

  // AHORA sourceFiles ES UN ARRAY DE ARCHIVOS
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);

  const [mainFileError, setMainFileError] = useState<boolean>(false);
  const [sourceFileError, setSourceFileError] = useState<boolean>(false);
  const { mainFileName, sourceFileName, mainFileUrl, sourceFileUrl } = useArticleFiles(currentArticle ?? null);

  const sessionsQuery = useConferenceSessions(selectedConference);
  const sessions = (sessionsQuery.data ?? []).filter((session) => session.conference?.id === selectedConference);
  const loadingSessions = sessionsQuery.isFetching;
  const currentSession = sessions.find((s) => String(s.id) === selectedSession && s.conference?.id === selectedConference)
    ?? (currentArticle?.session?.id === Number(selectedSession) && currentArticle.session.conference?.id === selectedConference ? currentArticle.session : null);
  const periodQuery = useSubmissionStatus(currentSession?.id);
  const canWrite = Boolean(currentSession && sessionsQuery.isSuccess && !sessionsQuery.isFetching && periodQuery.isSuccess && periodQuery.data?.submission_open && !periodQuery.isFetching);

  // Campos que faltan para poder subir (mismas reglas que el back)
  const missingFields = getMissingFields({
    title,
    abstract,
    hasMainFile: Boolean(mainFile) || Boolean(currentArticle?.main_file),
    type: articleType,
    authorsCount: authors.length,
    hasCorrespondingAuthor: Boolean(correspondingAuthor),
    hasSources: sourceFiles.length > 0 || (currentArticle?.sources?.length ?? 0) > 0,
  });

  // Envuelve un setter para marcar el formulario con cambios sin guardar
  const withDirty = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setIsDirty(true);
  };

  //------------------------------------------------------------
  // Aviso al salir con cambios sin guardar (navegación interna y cierre de pestaña)
  //------------------------------------------------------------
  const blocker = useBlocker({
    shouldBlockFn: () => dirtyRef.current && !allowLeaveRef.current,
    enableBeforeUnload: () => dirtyRef.current && !allowLeaveRef.current,
    withResolver: true,
  });

  // Sale del formulario sin pasar por el aviso de cambios sin guardar
  const leaveForm = () => {
    allowLeaveRef.current = true;
    navigateBack();
  };

  //------------------------------------------------------------
  // Manejo de la seleccion de archivos
  //------------------------------------------------------------
  const handleMainFileSelected = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setMainFile(file);
    setIsDirty(true);
    const isValid = validateFileExtension(file, ALLOWED_ARTICLE_EXTENSIONS);
    setMainFileError(!isValid);
    if (!isValid) {
      toast.error(`Formato no permitido. Solo se aceptan archivos: ${ALLOWED_ARTICLE_EXTENSIONS.join(", ")}`);
    }
  };

  const handleSourceFilesSelected = (filesArray: File[]) => {
    // Validar extensiones para cada archivo
    const hasInvalid = filesArray.some(file => !validateFileExtension(file, ALLOWED_SOURCE_EXTENSIONS));

    setSourceFiles(filesArray);
    setSourceFileError(hasInvalid);
    setIsDirty(true);

    if (hasInvalid) {
      toast.error(`Uno o más archivos de fuentes no tienen un formato permitido.`);
    }
  };

  //------------------------------------------------------------
  // Manejo de la seleccion de autores
  //------------------------------------------------------------
  const handleAgregarAutor = (id: number, markDirty: boolean = true) => {
    const autor = users.find((u) => u.id === id);
    if (autor && !authors.some((a) => a.id === autor.id)) {
      setAuthors([...authors, autor]);
      if (markDirty) setIsDirty(true);
    }
  };

  const handleEliminarAutor = (id: number) => {
    setAuthors(authors.filter((a) => a.id !== id));
    if (correspondingAuthor === String(id)) setCorrespondingAuthor("");
    setIsDirty(true);
  };

  //------------------------------------------------------------
  // Manejo del boton de cancelación (si hay cambios, el blocker muestra el aviso)
  //------------------------------------------------------------
  const handleCancel = () => {
    navigateBack();
  }

  //------------------------------------------------------------
  // Validaciones previas al guardado / envío
  //------------------------------------------------------------
  const validateFileFormats = (): boolean => {
    if (mainFileError) {
      toast.error(`El archivo principal no tiene un formato válido (${ALLOWED_ARTICLE_EXTENSIONS.join(", ")}).`);
      return false;
    }
    if (articleType === "poster" && sourceFileError) {
      toast.error("Uno o más archivos de fuentes no tienen un formato válido.");
      return false;
    }
    return true;
  };

  const validateLoggedUserIsAuthor = (): boolean => {
    if (!authors.some(a => a.id === userId)) {
      toast.error("Debes incluirte como autor del submission.");
      return false;
    }
    return true;
  };

  const setZodErrors = (issues: { path: PropertyKey[]; message: string }[]) => {
    const fieldErrors: Partial<ArticleFormData> = {};
    issues.forEach((issue) => {
      if (issue.path[0]) fieldErrors[issue.path[0] as keyof ArticleFormData] = issue.message;
    });
    setErrors(fieldErrors);
  };

  // Validación completa: la que se exige para subir el artículo
  const validateFullForm = (): boolean => {
    const sourceFilesString = sourceFiles.map(f => f.name).join(", ");
    const hasSavedSources = (currentArticle?.sources?.length ?? 0) > 0;

    const formData = {
      conference: selectedConference ? String(selectedConference) : "",
      session: selectedSession ?? "",
      title: title.trim(),
      abstract: abstract.trim(),
      file: mainFile ? mainFile.name : mainFileName ?? "",
      authors: authors.length > 0 ? "ok" : "",
      correspondingAuthor: correspondingAuthor ?? "",
      sourcesFile: articleType === "poster" ? (sourceFiles.length > 0 ? sourceFilesString : sourceFileName ?? (hasSavedSources ? "ok" : "")) : "ok",
    };

    const result = articleSchema.safeParse(formData);
    if (!result.success) {
      setZodErrors(result.error.issues);
      return false;
    }
    setErrors({});
    return true;
  };

  // Validación mínima: la que se exige para guardar un borrador
  const validateDraftForm = (): boolean => {
    const result = articleDraftSchema.safeParse({
      conference: selectedConference ? String(selectedConference) : "",
      session: selectedSession ?? "",
      title: title.trim(),
    });
    if (!result.success) {
      setZodErrors(result.error.issues);
      scrollToFirstDraftError(result.error.issues.map((issue) => issue.path[0]));
      return false;
    }
    setErrors({});
    return true;
  };

  // Desplaza la vista hasta el primer campo con error (en el orden en que aparecen en el form)
  const scrollToFirstDraftError = (fieldsWithError: PropertyKey[]) => {
    const fieldRefs = [
      { field: "conference", ref: conferenceFieldRef },
      { field: "session", ref: sessionFieldRef },
      { field: "title", ref: titleFieldRef },
    ];
    const target = fieldRefs.find(({ field }) => fieldsWithError.includes(field))?.ref.current;
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.querySelector<HTMLElement>("input, button")?.focus({ preventScroll: true });
  };

  //------------------------------------------------------------
  // Armado de los payloads
  //------------------------------------------------------------
  const buildNewArticle = (status: "draft" | "reception"): ArticleNew => ({
    title: title.trim(),
    main_file: mainFile,
    source_file: articleType === "poster" && sourceFiles.length > 0 ? sourceFiles : null,
    status,
    type: articleType,
    abstract: abstract,
    authors: authors.map((a) => a.id),
    corresponding_author: correspondingAuthor ? Number(correspondingAuthor) : null,
    session: Number(selectedSession),
  });

  const buildArticleUpdate = (): ArticleUpdate => {
    const updated : ArticleUpdate = {
      title: title.trim(),
      abstract: abstract,
      type: articleType,
      session: selectedSession ? Number(selectedSession) : null,
    };

    // El back no acepta autores o autor de notificación vacíos: si no hay, no se mandan
    if (authors.length > 0) updated.authors = authors.map((a) => a.id);
    if (correspondingAuthor) updated.corresponding_author = Number(correspondingAuthor);

    if (mainFile) {
      updated.main_file = mainFile;
    }

    if (articleType === "regular") {
      updated.source_file = null;
    } else if (sourceFiles.length > 0) {
      updated.source_file = sourceFiles;
    }

    return updated;
  };

  // Después de un guardado exitoso: el artículo guardado pasa a ser la referencia del form
  const applySavedArticle = (saved: Article) => {
    setCurrentArticle(saved);
    setMainFile(null);
    setSourceFiles([]);
    setIsDirty(false);
  };

  const ensurePeriodOpen = async (): Promise<boolean> => {
    if (!canWrite) {
      toast.error('Seleccioná una sesión con el período de submissions abierto.');
      return false;
    }
    const fresh = await periodQuery.refetch();
    if (fresh.isError) {
      toast.error('No se pudo comprobar el período. Revisá tu conexión e intentá de nuevo.');
      return false;
    }
    if (!fresh.data?.submission_open) {
      toast.error('El período de submissions de esta conferencia está cerrado. No podés guardar ni subir artículos ahora.');
      return false;
    }
    return true;
  };

  //------------------------------------------------------------
  // Manejo de errores de la API (alta, guardado y envío)
  //------------------------------------------------------------
  const handleApiError = (error: unknown) => {

    if (!(error instanceof ApiError)) {
      setError((error as Error).message);
      setShowErrorAlert(true);
      return;
    }

    if (isSubmissionPeriodClosed(error)) {
      void queryClient.invalidateQueries({ queryKey: ['submission-status'] });
      setError('El período de submissions de esta conferencia está cerrado. Tus cambios permanecen en el formulario.');
      setShowErrorAlert(true);
      toast.error('El período de submissions está cerrado. La operación no se completó; revisá el borrador antes de salir.');
    } else if (error.status === 400) {
      const fieldErrors: Partial<ArticleFormData> = {};
      const generalErrors: string[] = [];

      Object.entries(error.errors).forEach(([key, messages]) => {
        const field = backendFieldMap[key];
        if (field) fieldErrors[field] = messages.join(" ");
        else if (!(key in completenessLabels)) generalErrors.push(...messages);
      });

      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length > 0) setSubmitAttempted(true);
      if (generalErrors.length > 0) {
        setError(generalErrors.join(" "));
        setShowErrorAlert(true);
      }
    } else if (error.status === 403) {
      toast.error(editMode ? "No tenés permiso sobre este artículo" : "No tenés permisos para crear un submission en esta conferencia");
      leaveForm();
    } else if (error.status === 404) {
      toast.error(editMode ? "El artículo no existe" : "La conferencia o la sesión ya no existe");
      leaveForm();
    } else if (error.status === 409) {
      toast.error("Este artículo ya fue enviado");
      leaveForm();
    } else {
      setError(error.message);
      setShowErrorAlert(true);
    }
  };

  //------------------------------------------------------------
  // Manejo del boton "Guardar borrador"
  //------------------------------------------------------------
  // Devuelve true si se guardó. Con stayOnPage no redirige al listado
  // (lo usa el aviso de cambios sin guardar, que después continúa la navegación pendiente).
  const handleSaveDraft = async ({ stayOnPage = false }: { stayOnPage?: boolean } = {}): Promise<boolean> => {

    setShowErrorAlert(false);

    if (!await ensurePeriodOpen()) return false;

    if (!validateFileFormats() || !validateDraftForm()) return false;
    if (authors.length > 0 && !validateLoggedUserIsAuthor()) return false;

    try {

      setSavingDraft(true);

      if (editMode && currentArticle) {
        // Los siguientes guardados son PATCH sobre el mismo borrador
        const saved = await updateArticle(currentArticle.id, buildArticleUpdate());
        applySavedArticle(saved);
      } else {
        // Primer guardado: se crea el borrador
        await createArticle(buildNewArticle("draft"));
        setIsDirty(false);
      }

      toast.success("Borrador guardado", { description: "Podés retomarlo cuando quieras desde tus artículos.", duration: 5000 });

      // Después de guardar se vuelve al listado de submissions de la conferencia
      if (!stayOnPage) leaveForm();
      return true;

    } catch (error) {

      console.error("Error al guardar el borrador: ", error);
      // Sin respuesta del back (error de red): el form queda como estaba para reintentar
      if (error instanceof ApiError) handleApiError(error);
      else toast.error("No se pudo guardar", { description: "Revisá tu conexión e intentá de nuevo." });
      return false;

    } finally {
      setSavingDraft(false);
    }
  };

  //------------------------------------------------------------
  // Manejo del boton "Subir": valida y pide confirmación
  //------------------------------------------------------------
  const handleSubmitClick = () => {

    setShowErrorAlert(false);
    setSubmitAttempted(true);

    if (!canWrite) {
      toast.error('El período de submissions no está abierto.');
      return;
    }
    if (!validateFileFormats() || !validateFullForm() || !validateLoggedUserIsAuthor()) return;

    setShowSubmitDialog(true);
  };

  //------------------------------------------------------------
  // Envío confirmado: alta directa o, si es un borrador, guardar y después submit
  //------------------------------------------------------------
  const handleConfirmSubmit = async () => {

    if (!await ensurePeriodOpen()) {
      setShowSubmitDialog(false);
      return;
    }

    try {

      setLoading(true);

      if (editMode && currentArticle) {
        // submit valida contra lo guardado, así que primero se persisten los últimos cambios
        const saved = await updateArticle(currentArticle.id, buildArticleUpdate());
        applySavedArticle(saved);
        await submitArticle(currentArticle.id);
      } else {
        const response = await createArticle(buildNewArticle("reception"));
        console.log("Article Submit: ", response);
      }

      toast.success("Artículo subido", { description: `"${title.trim()}" pasó a estado Recibido.`, duration: 5000 });
      leaveForm();

    } catch (error) {

      console.error("Error al subir el artículo: ", error);
      handleApiError(error);

    } finally {
      setLoading(false);
      setShowSubmitDialog(false);
    }
  };

  //------------------------------------------------------------
  // Manejo del boton de update (edición de un artículo ya enviado)
  //------------------------------------------------------------
  const handleUpdate = async () => {

    if (!currentArticle) return;
    if (!await ensurePeriodOpen()) return;

    setShowErrorAlert(false);

    if (!validateFileFormats() || !validateFullForm() || !validateLoggedUserIsAuthor()) return;

    try {

      setLoading(true);

      // El estado no se manda: editar un artículo nunca lo cambia
      const response = await updateArticle(currentArticle.id, buildArticleUpdate());
      console.log('Article Update: ', response);

      toast.success('Submission actualizado correctamente !', { duration: 5000 });
      leaveForm();

    } catch (error) {

      console.error('Error al actualizar el artículo: ', error);
      handleApiError(error);

    } finally {
      setLoading(false);
    }
  };

  //------------------------------------------------------------
  // Efecto para precargar al usuario autenticado como autor por defecto
  //------------------------------------------------------------
  useEffect(() => {
    if (!editMode) {
      handleAgregarAutor(userId, false);
    }
  }, [editMode, userId]);

  //------------------------------------------------------------
  // Efecto para precargar datos del form en modo edición
  //------------------------------------------------------------
  useEffect(() => {
    if (editMode && article) {
      // Un borrador puede tener abstract y tipo vacíos
      setTitle(article.title);
      setAbstract(article.abstract ?? "");
      setArticleType(article.type ?? "regular");
      setSelectedConference(article.session?.conference?.id ?? null);
      setSelectedSession(article.session?.id ? String(article.session.id) : null);
      setAuthors(article.authors);
      setCorrespondingAuthor(article.corresponding_author?.id ? String(article.corresponding_author.id) : "");
    }
  }, [editMode, article]);

  //------------------------------------------------------------
  const availableUsers = users.filter(u =>
    !authors.some(a => a.id === u.id)
  );

  const getSourceButtonText = () => {
    if (sourceFiles.length > 0) {
      return sourceFiles.map((f) => f.name).join(", ");
    }
    if (sourceFileName) {
      return sourceFileName;
    }
    if (currentArticle?.sources?.length) {
      return currentArticle.sources.map((s) => s.filename).join(", ");
    }
    return "Seleccionar archivo...";
  };

const extensionesFormateadas = formatAllowedExtensions(currentConference?.allowed_extensions);

  // Campos faltantes que se listan en el resumen después de intentar subir
  const pendingFields: CompletenessField[] = submitAttempted && isDraftFlow ? missingFields : [];

  //------------------------------------------------------------
  // Renderizado del componente
  //------------------------------------------------------------
  return (
    <div className="w-full max-w-3xl rounded-2xl shadow-md border p-4 bg-white flex flex-col gap-4">

      {/* Titulo del Form */}
      <h2 className="text-lg font-bold italic text-slate-500 text-center">
        {!editMode ? "Alta de Submission" : isDraftFlow ? "Editar Borrador" : "Editar Submission"}
      </h2>

      <hr className="bg-slate-100" />

      {/* Estado del borrador y disponibilidad del período */}
      {isDraftFlow && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <DraftStatusBadge label={editMode ? "Borrador" : "Sin guardar"} />
          </div>
        </div>
      )}

      {/* Resumen de campos faltantes al intentar subir */}
      {pendingFields.length > 0 && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p className="font-semibold">
            No se pudo subir: {pendingFields.length === 1 ? "falta 1 campo" : `faltan ${pendingFields.length} campos`}
          </p>
          <ul className="list-disc pl-5">
            {pendingFields.map((field) => <li key={field}>{completenessLabels[field]}</li>)}
          </ul>
        </div>
      )}

      {/* Conferencia y Sesión */}
      <div className="flex flex-col md:flex-row gap-4 w-full">

        {/* Combobox de Conferencia */}
        <div ref={conferenceFieldRef} className="flex-1 flex flex-col gap-2 scroll-mt-24">
          <Label htmlFor="conferencia">Conferencia {errors.conference && <p className="text-destructive">{errors.conference}</p>}</Label>
          <ConferenceCombobox value={selectedConference} onValueChange={(id) => { setSelectedConference(id); setSelectedSession(null); setIsDirty(true); }} conferences={conferences} disabled={editMode || fixedConferenceId !== undefined || busy || periodQuery.isFetching || showSubmitDialog} />
        </div>

        {/* Select de Sesiones */}
        <div ref={sessionFieldRef} className="flex-1 flex flex-col gap-2 scroll-mt-24">
          <Label htmlFor="sesion">
            Sesión {errors.session && <p className="text-destructive">{errors.session}</p>}
          </Label>
          <Select value={selectedSession ?? ""} onValueChange={withDirty(setSelectedSession)} disabled={!selectedConference || loadingSessions || sessionsQuery.isError || busy || periodQuery.isFetching || showSubmitDialog}>
            <SelectTrigger className="w-full hover:bg-accent hover:text-accent-foreground">
              <SelectValue
                placeholder={
                  loadingSessions
                  ? "Cargando sesiones..."
                  : !selectedConference
                  ? "Seleccione una conferencia primero..."
                  : sessions.length
                  ? "Seleccione una sesión..."
                  : "No hay sesiones disponibles..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {sessionsQuery.isError && <p role="alert" className="text-sm text-destructive">No se pudieron consultar las sesiones. <Button type="button" variant="link" onClick={() => void sessionsQuery.refetch()}>Reintentar</Button></p>}
      {selectedConference && sessionsQuery.isSuccess && sessions.length === 0 && <p className="text-sm text-muted-foreground">No hay sesiones disponibles para esta conferencia.</p>}
      {currentSession && periodQuery.isError && <p role="alert" className="text-sm text-destructive">No se pudo consultar el período de submissions. <Button type="button" variant="link" onClick={() => void periodQuery.refetch()}>Reintentar</Button></p>}
      {currentSession && periodQuery.isFetching && <p className="text-sm text-muted-foreground">Comprobando el período de submissions...</p>}
      {currentSession && periodQuery.isSuccess && !periodQuery.isFetching && !periodQuery.data.submission_open && <p className="rounded-md bg-zinc-100 p-3 text-sm text-zinc-700">El período de submissions de esta conferencia está cerrado. Podés consultar el artículo, pero no guardar ni subir cambios.</p>}

      <fieldset disabled={!canWrite} className="contents">

      {/* Campo de Título */}
      <div ref={titleFieldRef} className="flex-1 flex flex-col gap-2 scroll-mt-24">
        <Label htmlFor="titulo">Título {errors.title && <p className="text-destructive">{errors.title}</p>}</Label>
        <Input type="text" id="title" placeholder="Título del submission..." maxLength={100} value={title} onChange={(e) => withDirty(setTitle)(e.target.value)}/>
      </div>
      
      {/* Campo de Abstract */}
      <div className="flex-1 flex flex-col gap-2">
        <Label htmlFor="abstract">Abstract {errors.abstract && <p className="text-destructive">{errors.abstract}</p>}</Label>
        <Textarea id="DetalleRegular" placeholder="Hasta 300 caracteres..." value={abstract} maxLength={300} onChange={(e) => withDirty(setAbstract)(e.target.value)}/>
      </div>

      {/* RadioGroup tipo de artículo */}
      <div className="flex-1 flex flex-col gap-2">
        <Label htmlFor="tipo-articulo">Tipo</Label>
        <RadioGroup value={articleType} onValueChange={withDirty(setArticleType)} className="flex flex-row gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={"regular"} id="regular" />
            <Label htmlFor="regular">Regular</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="poster" id="poster" />
            <Label htmlFor="poster">Poster</Label>
          </div>
        </RadioGroup>
        <span className="text-xs text-muted-foreground">
                {acceptsMultipleSources
                  ? "Esta conferencia permite muchas fuentes."
                  : "Esta conferencia permite una sola fuente."}
              </span>
                        <span className="text-xs text-muted-foreground">
            Esta conferencia permite las siguientes extensiones: {extensionesFormateadas}.
          </span>
      </div>

      {/* Archivos */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        
        {/* Archivo principal */}
        <div className="flex-1 grid items-start gap-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="DetalleRegular">
              Submission {errors.file && <p className="text-destructive">{errors.file}</p>}
            </Label>

          </div>
          <FileSelectButton
            label="Submission"
            accept={ALLOWED_ARTICLE_EXTENSIONS.join(",")}
            disabled={busy}
            hasError={mainFileError}
            hasFile={Boolean(mainFile) || Boolean(editMode && mainFileName)}
            displayText={mainFile ? mainFile.name : mainFileName ? mainFileName : "Seleccionar archivo..."}
            onFilesSelected={handleMainFileSelected}
          />
        </div>

        {/* Archivo de fuentes solo si es Poster */}
        {articleType === "poster" && (
          <div className="flex-1 grid items-start gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="DetalleRegular">
                Fuentes {errors.sourcesFile && <p className="text-destructive">{errors.sourcesFile}</p>}
              </Label>

            </div>
            <FileSelectButton
              label="Fuentes"
              accept={ALLOWED_SOURCE_EXTENSIONS.join(",")}
              multiple={acceptsMultipleSources}
              disabled={busy}
              hasError={sourceFileError}
              hasFile={sourceFiles.length === 0 && Boolean(editMode && (sourceFileName || currentArticle?.sources?.length))}
              displayText={getSourceButtonText()}
              onFilesSelected={handleSourceFilesSelected}
            />
          </div>
        )}

      </div>

      {/* Links de archivos actuales (solo en modo edición) */}
      {editMode && (mainFileUrl || sourceFileUrl) && (
        <div className="flex flex-col md:flex-row gap-2 items-start justify-between text-xs text-sky-600">

          {/* Botón archivo principal */}
          {mainFileName && (
            <Button
              variant="link"
              className="p-0 m-0 h-auto leading-none text-sky-600 hover:underline"
              onClick={() => downloadMainFile(currentArticle!.id, mainFileName)}
            >
              Ver archivo actual{mainFileName ? `: ${mainFileName}` : ""}
            </Button>
          )}

          {/* Botón archivo de fuentes */}
          {articleType === "poster" && sourceFileName && (
            <Button
              variant="link"
              className="p-0 m-0 h-auto leading-none text-sky-600 hover:underline"
              onClick={() => downloadSourceFile(currentArticle!.id, sourceFileName)}
            >
              Ver fuentes actuales{sourceFileName ? `: ${sourceFileName}` : ""}
            </Button>
          )}
        </div>
      )}

      {/* Combobox de autores */}
      <div className="flex-1 flex flex-col gap-2">
        <Label htmlFor="autor">Autores del Submission {errors.authors && <p className="text-destructive">{errors.authors}</p>}</Label>
        <UserCombobox onValueChange={handleAgregarAutor} backgroundWhite={true} users={availableUsers} />
      </div>

      {/* Lista de autores seleccionados */}
      {authors?.length > 0 && (
        <div className="flex flex-col gap-2 w-full">
          {authors.map((a) => (
            <div key={a.id} className="flex justify-between items-center bg-gray-100 px-3 py-1 rounded-lg shadow-sm w-full">
              <span className="truncate text-sm">{a.full_name} ({a.email})</span>
              <button type="button" onClick={() => handleEliminarAutor(a.id)} className="text-red-500 hover:text-red-700">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Select de autor de notificación */}
      <div className="flex-1 flex flex-col gap-2">
        <Label htmlFor="autorNotif">Autor de Notificación {errors.correspondingAuthor && <p className="text-destructive">{errors.correspondingAuthor}</p>}</Label>
        <Select value={correspondingAuthor} onValueChange={withDirty(setCorrespondingAuthor)} disabled={authors.length === 0}>
          <SelectTrigger className="w-full hover:bg-accent hover:text-accent-foreground">
            <SelectValue placeholder={authors.length > 0 ? "Seleccione un autor..." : "Seleccione un autor primero..."} />
          </SelectTrigger>
          <SelectContent>
            {authors.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.full_name} ({a.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <hr className="bg-slate-100" />

      {/* Botones inferiores */}
      {isDraftFlow ? (
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => handleSaveDraft()} className="w-full cursor-pointer" disabled={busy || !canWrite}>
            {savingDraft ? "Guardando borrador..." : "Guardar borrador"}
          </Button>
          <div className="flex flex-row gap-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1 bg-zinc-500 text-white cursor-pointer" disabled={busy}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={handleSubmitClick} className="flex-1 bg-slate-900 text-white cursor-pointer" disabled={busy || !canWrite}>
              {loading ? "Subiendo..." : "Subir"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1 bg-zinc-500 text-white hover:cursor-pointer" disabled={loading}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleUpdate} className="flex-1 bg-slate-900 text-white hover:cursor-pointer" disabled={loading || !canWrite}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      )}

      {/* Alert de error */}
      {showErrorAlert && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            Error
          </AlertTitle>
          <AlertDescription>
              No se pudo completar la operación: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Confirmación de subida */}
      <SubmitConfirmDialog
        open={showSubmitDialog}
        deadlineLabel={undefined}
        loading={loading}
        onCancel={() => setShowSubmitDialog(false)}
        onConfirm={handleConfirmSubmit}
      />

      {/* Aviso de cambios sin guardar */}
      <UnsavedChangesDialog
        open={blocker.status === "blocked"}
        saving={savingDraft}
        onLeave={() => blocker.proceed?.()}
        onStay={() => blocker.reset?.()}
        onSaveDraft={isDraftFlow && canWrite ? async () => {
          const saved = await handleSaveDraft({ stayOnPage: true });
          if (saved) blocker.proceed?.();
          else blocker.reset?.();
        } : undefined}
      />

      </fieldset>

    </div>
  );
};

export default ArticleForm;
