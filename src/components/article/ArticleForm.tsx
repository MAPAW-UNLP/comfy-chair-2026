// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Componente tipo formulario que permite tanto el alta como edición de articulos.
//
// -------------------------------------------------------------------------------------- 

// Importaciones de funcionalidades y librerías
import { useEffect, useRef, useState } from "react";
import { useNavigate } from '@tanstack/react-router';
import { articleSchema, type ArticleFormData } from '@/lib/validations';

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

// Importaciones de servicios
import { type User } from "@/services/userServices";
import { type Conference } from '@/components/conference/ConferenceApp';
import { type Session, getSessionsByConferenceGrupo1 } from "@/services/sessionServices";
import { type Article, type ArticleNew, type ArticleUpdate, createArticle, updateArticle } from "@/services/articleServices";

// Configuración escalable de validación de extensiones
const ALLOWED_ARTICLE_EXTENSIONS = [".pdf"]; 
const ALLOWED_SOURCE_EXTENSIONS = [".pdf", ".zip", ".rar", ".png", ".jpeg", ".jpg"]; 

/**
 * Helper para validar si un archivo posee una extensión permitida.
 */
const validateFileExtension = (file: File, allowedExtensions: string[]): boolean => {
  const fileName = file.name.toLowerCase();
  return allowedExtensions.some((ext) => fileName.endsWith(ext.toLowerCase()));
};

// Lo que espera recibir el componente
type ArticleFormProps = {
  conferences : Conference[];
  users: User[];
  editMode? : boolean;
  article? : Article;
  userId : number
};

//Cuerpo del Componente
const ArticleForm : React.FC<ArticleFormProps> = ({ conferences, users, editMode, article, userId }) => {

  // Navegacion
  const navigate = useNavigate();
  const navigateBack = () => navigate({ to: `/articles/${selectedConference}`, replace: true });

  // Setteo de sesiones
  const [sessions, setSessions] = useState<Session[]>([]); 

  // Manejo de errores y estados de carga
  const [error, setError] = useState<string | null>(null); 
  const [errors, setErrors] = useState<Partial<ArticleFormData>>({}); 
  const [showErrorAlert, setShowErrorAlert] = useState<boolean>(false); 
  const [loading, setLoading] = useState<boolean>(false); 
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false); 
  
  // Setteo de campos del formulario
  const [title, setTitle] = useState<string>(""); 
  const [abstract, setAbstract] = useState<string>(""); 
  const [articleType, setArticleType] = useState<string>("regular"); 
  const [selectedConference, setSelectedConference] = useState<number | null>(null); 
  const [selectedSession, setSelectedSession] = useState<string | null>(null); 
  const [authors, setAuthors] = useState<User[]>([]); 
  const [correspondingAuthor, setCorrespondingAuthor] = useState<string>(""); 

  // Obtener la conferencia actual seleccionada
  const currentConference = conferences.find((c) => c.id === selectedConference);
  // Ajusta 'accepts_multiple_sources' según la propiedad real de tu modelo Conference
  const acceptsMultipleSources = Boolean(currentConference?.count_sources === 0 ? false : true);

  // Manejo de archivos
  const mainFileRef = useRef<HTMLInputElement>(null); 
  const sourceFileRef = useRef<HTMLInputElement>(null); 
  const [mainFile, setMainFile] = useState<File | null>(null); 
  
  // AHORA sourceFiles ES UN ARRAY DE ARCHIVOS
  const [sourceFiles, setSourceFiles] = useState<File[]>([]); 
  
  const [mainFileError, setMainFileError] = useState<boolean>(false); 
  const [sourceFileError, setSourceFileError] = useState<boolean>(false); 
  const { mainFileName, sourceFileName, mainFileUrl, sourceFileUrl } = useArticleFiles(article ?? null); 

  //------------------------------------------------------------
  // Manejo de la seleccion de archivos
  //------------------------------------------------------------
  const handleMainFileClick = () => mainFileRef.current?.click();

  const handleMainFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMainFile(file);
      const isValid = validateFileExtension(file, ALLOWED_ARTICLE_EXTENSIONS);
      setMainFileError(!isValid);
      if (!isValid) {
        toast.error(`Formato no permitido. Solo se aceptan archivos: ${ALLOWED_ARTICLE_EXTENSIONS.join(", ")}`);
      }
    }
  };

  const handleSourceFileClick = () => sourceFileRef.current?.click();

  const handleSourceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedList = event.target.files;
    if (!selectedList || selectedList.length === 0) return;

    const filesArray = Array.from(selectedList);

    // Validar extensiones para cada archivo
    const hasInvalid = filesArray.some(file => !validateFileExtension(file, ALLOWED_SOURCE_EXTENSIONS));

    setSourceFiles(filesArray);
    setSourceFileError(hasInvalid);

    if (hasInvalid) {
      toast.error(`Uno o más archivos de fuentes no tienen un formato permitido.`);
    }
  };

  //------------------------------------------------------------
  // Manejo de la seleccion de autores
  //------------------------------------------------------------
  const handleAgregarAutor = (id: number) => {
    const autor = users.find((u) => u.id === id);
    if (autor && !authors.some((a) => a.id === autor.id)) {
      setAuthors([...authors, autor]);
    }
  };

  const handleEliminarAutor = (id: number) => {
    setAuthors(authors.filter((a) => a.id !== id));
    if (correspondingAuthor === String(id)) setCorrespondingAuthor(""); 
  };

  //------------------------------------------------------------
  // Manejo del boton de cancelación
  //------------------------------------------------------------
  const handleCancel = () => {
    navigateBack();
  }

  //------------------------------------------------------------
  // Manejo del boton de submit
  //------------------------------------------------------------
  const handleSubmit = async () => {

    setShowErrorAlert(false);

    if (mainFileError) {
      toast.error(`El archivo principal no tiene un formato válido (${ALLOWED_ARTICLE_EXTENSIONS.join(", ")}).`);
      return;
    }
    if (articleType === "poster" && sourceFileError) {
      toast.error("Uno o más archivos de fuentes no tienen un formato válido.");
      return;
    }

    // Nombres para validación de Zod
    const sourceFilesString = sourceFiles.map(f => f.name).join(", ");

    const formData = {
      conference: selectedConference ? String(selectedConference) : "",
      session: selectedSession ?? "",
      title: title.trim(),
      abstract: abstract.trim(),
      file: mainFile ? mainFile.name : "",
      authors: authors.length > 0 ? "ok" : "",
      correspondingAuthor: correspondingAuthor ?? "",
      sourcesFile: articleType === "poster" ? (sourceFiles.length > 0 ? sourceFilesString : "") : "ok",
    };

    const result = articleSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<ArticleFormData> = {};
      result.error.issues.forEach((error) => {
        if (error.path[0]) fieldErrors[error.path[0] as keyof ArticleFormData] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!authors.some(a => a.id === userId)) {
      toast.error("Debes incluirte como autor del artículo.");
      return;
    }

    try {

      setLoading(true);

      const article: ArticleNew = {
        title: title,
        main_file: mainFile!,
        // Nota: Si tu backend requiere múltiples fuentes en FormData, pasa sourceFiles (File[])
        source_file: articleType === "poster" && sourceFiles.length > 0 ? (sourceFiles as any) : null,
        status: 'reception',
        type: articleType,
        abstract: abstract,
        authors: authors.map((a) => a.id),
        corresponding_author: Number(correspondingAuthor),
        session: Number(selectedSession),
      };

      const response = await createArticle(article);
      console.log("Article Submit: ", response);

      toast.success('Artículo subido correctamente !', { duration: 5000 });
      navigateBack();

    } catch (error) {

      console.error("Error al subir el artículo: ", error);
      setError((error as Error).message);
      setShowErrorAlert(true);

    } finally {
      setLoading(false);
    }
  };

  //------------------------------------------------------------
  // Manejo del boton de update (edit mode)
  //------------------------------------------------------------
  const handleUpdate = async () => {

    if (!article) return;

    setShowErrorAlert(false);

    if (mainFileError) {
      toast.error(`El archivo principal no tiene un formato válido (${ALLOWED_ARTICLE_EXTENSIONS.join(", ")}).`);
      return;
    }
    if (articleType === "poster" && sourceFileError) {
      toast.error("Uno o más archivos de fuentes no tienen un formato válido.");
      return;
    }

    const sourceFilesString = sourceFiles.map(f => f.name).join(", ");

    const formDataForValidation = {
      conference: selectedConference ? String(selectedConference) : "",
      session: selectedSession ?? "",
      title: title.trim(),
      abstract: abstract.trim(),
      file: mainFile ? mainFile.name : mainFileName ?? "",
      authors: authors.length > 0 ? "ok" : "",
      correspondingAuthor: correspondingAuthor ?? "",
      sourcesFile: articleType === "poster" ? (sourceFiles.length > 0 ? sourceFilesString : sourceFileName ?? "") : "ok",
    };

    const result = articleSchema.safeParse(formDataForValidation);
    if (!result.success) {
      const fieldErrors: Partial<ArticleFormData> = {};
      result.error.issues.forEach((error) => {
        if (error.path[0]) fieldErrors[error.path[0] as keyof ArticleFormData] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!authors.some(a => a.id === userId)) {
      toast.error("Debes incluirte como autor del artículo.");
      return;
    }

    try {

      setLoading(true);

      const updated : ArticleUpdate = {
        title: title,
        abstract: abstract,
        type: articleType,
        status: 'reception',
        authors: authors.map((a) => a.id),
        corresponding_author: correspondingAuthor ? Number(correspondingAuthor) : null,
        session: selectedSession ? Number(selectedSession) : null,
      };

      if (mainFile) {
        updated.main_file = mainFile;
      }

      if (articleType === "regular") {
        updated.source_file = null; 
      } else if (sourceFiles.length > 0) {
        updated.source_file = sourceFiles as any;
      }

      const response = await updateArticle(article.id, updated);
      console.log('Article Update: ', response);
      
      toast.success('Artículo actualizado correctamente !', { duration: 5000 });
      navigateBack();

    } catch (error) {

      console.error('Error al actualizar el artículo: ', error);
      setError((error as Error).message);
      setShowErrorAlert(true);

    } finally {
      setLoading(false);
    }
  };

  //------------------------------------------------------------
  // Efecto para precargar al usuario autenticado como autor por defecto
  //------------------------------------------------------------
  useEffect(() => {
    if (!editMode) {
      handleAgregarAutor(userId);
    }
  }, [editMode, userId]);

  //------------------------------------------------------------
  // Efecto para precargar datos del form en modo edición
  //------------------------------------------------------------
  useEffect(() => {
    if (editMode && article) {
      setTitle(article.title);
      setAbstract(article.abstract);
      setArticleType(article.type);
      setSelectedConference(article.session?.conference?.id ?? null);
      setSelectedSession(article.session?.id ? String(article.session.id) : null);
      setAuthors(article.authors);
      setCorrespondingAuthor(String(article.corresponding_author?.id ?? ""));
    }
  }, [editMode, article]);

  //------------------------------------------------------------
  // Efecto para traer sesiones al cambiar la conferencia
  //------------------------------------------------------------
  useEffect(() => {
    if (selectedConference) {
      setLoadingSessions(true);

      getSessionsByConferenceGrupo1(Number(selectedConference)).then((data) => {
        setSessions(data);
        if (editMode && article?.session && article.session.conference?.id === selectedConference) {
          setSelectedSession(String(article.session.id));
        } else {
          setSelectedSession(null);
        }
      }).catch((err) => console.error("Error cargando sesiones:", err)).finally(() => setLoadingSessions(false));

    } else {
      setSessions([]);
      setSelectedSession(null);
    }
  }, [selectedConference, editMode, article]);

  const availableUsers = users.filter(u => 
    !authors.some(a => a.id === u.id)
  );

  // Formateador del texto a mostrar en el botón de fuentes
  const getSourceButtonText = () => {
    if (sourceFiles.length > 0) {
      return sourceFiles.map((f) => f.name).join(", ");
    }
    if (sourceFileName) {
      return sourceFileName;
    }
    return "Seleccionar archivo...";
  };

  //------------------------------------------------------------
  // Renderizado del componente
  //------------------------------------------------------------
  return (
    <div className="w-full max-w-3xl rounded-2xl shadow-md border p-4 bg-white flex flex-col gap-4">

      {/* Titulo del Form */}
      <h2 className="text-lg font-bold italic text-slate-500 text-center">
        {!editMode ? "Alta de Artículo" : "Editar Artículo"}
      </h2>

      <hr className="bg-slate-100" />

      {/* Conferencia y Sesión */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        
        {/* Combobox de Conferencia */}
        <div className="flex-1 flex flex-col gap-2">
          <Label htmlFor="conferencia">Conferencia {errors.conference && <p className="text-destructive">{errors.conference}</p>}</Label>
          <ConferenceCombobox value={selectedConference} onValueChange={setSelectedConference} conferences={conferences} disabled={editMode} />
        </div>

        {/* Select de Sesiones */}
        <div className="flex-1 flex flex-col gap-2">
          <Label htmlFor="sesion">
            Sesión {errors.session && <p className="text-destructive">{errors.session}</p>}
          </Label>
          <Select value={selectedSession ?? ""} onValueChange={(value) => setSelectedSession(value)} disabled={!selectedConference || loadingSessions}>
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

      {/* Campo de Título */}
      <div className="flex-1 flex flex-col gap-2">
        <Label htmlFor="titulo">Título {errors.title && <p className="text-destructive">{errors.title}</p>}</Label>
        <Input type="text" id="title" placeholder="Título del artículo..." maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)}/>
      </div>
      
      {/* Campo de Abstract */}
      <div className="flex-1 flex flex-col gap-2">
        <Label htmlFor="abstract">Abstract {errors.abstract && <p className="text-destructive">{errors.abstract}</p>}</Label>
        <Textarea id="DetalleRegular" placeholder="Hasta 300 caracteres..." value={abstract} maxLength={300} onChange={(e) => setAbstract(e.target.value)}/>
      </div>

      {/* RadioGroup tipo de artículo */}
      <div className="flex-1 flex flex-col gap-2">   
        <Label htmlFor="tipo-articulo">Tipo</Label>
        <RadioGroup value={articleType} onValueChange={setArticleType} className="flex flex-row gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={"regular"} id="regular" />
            <Label htmlFor="regular">Regular</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="poster" id="poster" />
            <Label htmlFor="poster">Poster</Label>
          </div>
        </RadioGroup>
      </div> 

      {/* Archivos */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        
        {/* Archivo principal */}
        <div className="flex-1 grid items-start gap-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="DetalleRegular">
              Artículo {errors.file && <p className="text-destructive">{errors.file}</p>}
            </Label>
            <span className="text-xs text-muted-foreground">
              Esta conferencia permite las siguientes extensiones: PDF, Docx, etc.
            </span>
          </div>
          <input 
            type="file" 
            ref={mainFileRef} 
            onChange={handleMainFileChange} 
            accept={ALLOWED_ARTICLE_EXTENSIONS.join(",")} 
            className="hidden" 
          />
          <Button
            variant="outline"
            onClick={handleMainFileClick}
            type="button"
            className={`w-full text-white transition-colors truncate ${
              mainFileError
                ? "bg-red-600 hover:bg-red-700"
                : mainFile
                ? "bg-lime-900 hover:bg-lime-950"                     
                : editMode && mainFileName  
                ? "bg-lime-900 hover:bg-lime-950"
                : "bg-slate-900 hover:bg-slate-800"                    
            }`}
          >
            {mainFile
              ? mainFile.name
              : mainFileName
              ? mainFileName
              : "Seleccionar archivo..."}
          </Button>
        </div>  

        {/* Archivo de fuentes solo si es Poster */}
        {articleType === "poster" && (
          <div className="flex-1 grid items-start gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="DetalleRegular">
                Fuentes {errors.sourcesFile && <p className="text-destructive">{errors.sourcesFile}</p>}
              </Label>
              <span className="text-xs text-muted-foreground">
                {acceptsMultipleSources 
                  ? "Esta conferencia permite muchas fuentes." 
                  : "Esta conferencia permite una sola fuente."}
              </span>
            </div>
            <input 
              type="file" 
              ref={sourceFileRef} 
              onChange={handleSourceFileChange} 
              accept={ALLOWED_SOURCE_EXTENSIONS.join(",")} 
              multiple={acceptsMultipleSources} // <-- Activa/Desactiva la selección múltiple
              className="hidden" 
            />
            <Button
              variant="outline"
              onClick={handleSourceFileClick}
              type="button"
              className={`w-full text-white transition-colors truncate ${
                sourceFileError
                  ? "bg-red-600 hover:bg-red-700"
                  : sourceFiles.length > 0
                  ? "bg-slate-900 hover:bg-slate-800"                         
                  : editMode && sourceFileName   
                  ? "bg-lime-900 hover:bg-lime-950"
                  : "bg-slate-900 hover:bg-slate-800"                        
              }`}
            >
              {getSourceButtonText()}
            </Button>
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
              onClick={() => downloadMainFile(article!.id, mainFileName)}
            >
              Ver archivo actual{mainFileName ? `: ${mainFileName}` : ""}
            </Button>
          )}

          {/* Botón archivo de fuentes */}
          {articleType === "poster" && sourceFileName && (
            <Button
              variant="link"
              className="p-0 m-0 h-auto leading-none text-sky-600 hover:underline"
              onClick={() => downloadSourceFile(article!.id, sourceFileName)}
            >
              Ver fuentes actuales{sourceFileName ? `: ${sourceFileName}` : ""}
            </Button>
          )}
        </div>
      )}

      {/* Combobox de autores */}
      <div className="flex-1 flex flex-col gap-2">
        <Label htmlFor="autor">Autores del Artículo {errors.authors && <p className="text-destructive">{errors.authors}</p>}</Label>
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
        <Select value={correspondingAuthor} onValueChange={setCorrespondingAuthor} disabled={authors.length === 0}>
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
      <div className="flex flex-row gap-2">
        {editMode && (
          <Button variant="outline" onClick={handleCancel} className="flex-1 bg-zinc-500 text-white" disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button variant="outline" onClick={editMode ? handleUpdate : handleSubmit} className="flex-1 bg-slate-900 text-white" disabled={loading}>
          {loading ? editMode ? "Guardando..." : "Subiendo..." : editMode ? "Guardar" : "Subir"}
        </Button>
      </div>
        
      {/* Alert de error */}
      {showErrorAlert && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>
            Error
          </AlertTitle>
          <AlertDescription>
              Hubo un error al subir el artículo {error}
          </AlertDescription>
        </Alert>
      )}
      
    </div>
  );
};

export default ArticleForm;