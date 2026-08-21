# Aspectos del Front Desarrollados por el Grupo 1

    El grupo 1 se encargó de la lectura, alta, baja y modificación de articulos. También se implementó la funcionalidad para solicitar la baja de un articulo cuando este ya fue aceptado en una sesión de una conferencia específica. 

# ---------- Hooks ----------

    useArticleFiles.tsx - (src/hooks/Grupo1/useArticleFiles.tsx)
        * Hook que gestiona la lectura, descarga y manejo de los archivos de un artículo (archivo principal y archivo de fuentes).

    useFetchArticle.tsx - (src/hooks/Grupo1/useFetchArticle.tsx)
        * Hook que obtiene un artículo específico por su ID.

    useFetchConference.tsx - (src/hooks/Grupo1/useFetchConference.tsx)
        * Hook que obtiene los datos de una conferencia por su ID.

    useFetchConferenceArticles.tsx - (src/hooks/Grupo1/useFetchConferenceArticles.tsx)
        * Hook que obtiene todos los artículos del usuario logueado pertenecientes a una conferencia específica.

    useFetchConferences.tsx - (src/hooks/Grupo1/useFetchConferences.tsx)
        * Hook que obtiene la lista completa de las conferencias activas.

    useFetchUsers.tsx - (src/hooks/Grupo1/useFetchUsers.tsx)
        * Hook que obtiene la lista de usuarios del sistema.

# ---------- Components ----------

    ArticleCard - (src/components/article/ArticleCard.tsx)
        * Props: objeto del tipo article.
        * Data: titulo, tipo, sesion, conferencia, estado y deadline de un articulo.
        * Acciones: ver detalle, editar (si permite), descargar archivo principal, descargar archivo fuentes (si tiene), eliminar (si permite).

    ArticleDeleteAccepted - (src/components/article/ArticleDeleteAccepted.tsx)
        * Props: trigger, callback
        * Data: dialogo de confirmación, motivo de la solicitud
        * Acciones: cancelar accion, confirmar solicitud de baja de articulo aceptado

    ArticleDeleteReception - (src/components/article/ArticleDeleteReception.tsx)
        * Props: trigger, callback
        * Data: dialogo de confirmación
        * Acciones: cancelar accion, confirmar eliminación de articulo
        
    ArticleDetail - (src/components/article/ArticleDetail.tsx)
        * Props: objeto del tipo article.
        * Data: todos los atributos de un articulo.
        * Acciones: ver archivo principal, ver archivo fuentes (si tiene), ver reviews del articulo (solo en estado aceptado o rechazado), volver al menu de articulos.

    ArticleForm - (src/components/article/ArticleForm.tsx)
        * Props: listado de conferencias, listado de usuarios, flag de edición (modo alta o edición), articulo (para modo edición), userId.
        * Data: todos los atributos de un articulo a crear o editar (en edición no se puede cambiar la conferencia).
        * Acciones: subir articulo (modo alta), editar articulo(modo edición), volver al menu de articulos (modo edición).

    ConferenceCombobox - (src/components/combobox/ConferenceCombobox.tsx)
        * Props: listado de conferencias, valor actual, flag de disabled (para modo edición del form), metodo onValueChange.
        * Data: titulo de cada conferencia.
        * Acciones: buscar y seleccionar conferencias.

    UserCombobox - (src/components/combobox/UserCombobox.tsx)
        * Props: listado de usuarios, metodo onValueChange.
        * Data: nombre completo y correo de cada usuario.
        * Acciones: buscar y seleccionar usuarios.

    Breadcrumb - (src/components/ui/Breadcrumb.tsx)
        * Props: items (rutas)
        * Data: ruta actual
        * Acciones: viajar a la ruta seleccionada

    ReviewBox - (src/components/reviews/ReviewBox.tsx)
        * Props: listado de reviews
        * Data: numero de review (dentro de la lista), revisor, puntaje y opinión.
        * Acciones: ninguna, solo muestra las reviews

# ---------- Routes ----------

    article/detail/$articleId.tsx - (src/routes/article/detail/articleId.tsx)
        * Hace uso del componente "ArticleDetail"
        * Muestra un breadcrumb que permite volver al menú anterior (articles/$conferenceId)
        * Muestra un mensaje si no encuentra un articulo con el id indicado

    article/edit/$articleId.tsx - (src/routes/article/edit/articleId.tsx)
        * Hace uso del componente "ArticleForm"
        * Muestra un mensaje si no encuentra un articulo con el id indicado
        * Bloquea la edición si ya pasó la deadline de la sesión del articulo o si el usuario autenticado no es autor
        
    article/create - (src/routes/article/create.tsx)
        * Hace uso del componente "ArticleForm"

    articles/$conferenceId - (src/routes/articles/conferenceId.tsx)
        * Hace uso del componente "ArticleCard"
        * Muestra un breadcrumb que permite volver al menú anterior (dashboard)
        * Muestra un mensaje si no encuentra una conferencia con el id indicado
        * Muestra todos los articulos de la conferencia seleccionada

# ---------- Services ----------

    articleServices - (src/services/articleServices.ts)
        * metodo "createArticle()"
        * metodo "updateArticle()"
        * metodo "getArticleById()"
        * metodo "getArticlesByConferenceId()"
        * metodo "deleteArticle()"
        * metodo "downloadMainFile()"
        * metodo "downloadSourceFile()"

    conferenceServices - (src/services/conferenceServices.ts) - Desarrollado por otro grupo, solo se usaron o crearon los metodos necesarios.
        * metodo "getActiveConferences()"
        * metodo "getConferenceById()"

    reviewerServices - (src/services/reviewerServices.ts) - Desarrollado por otro grupo, solo se usaron o crearon los metodos necesarios.
        * metodo "getReviewsByArticle()" 

    sessionServices - (src/services/sessionServices.ts) - Desarrollado por otro grupo, solo se usaron o crearon los metodos necesarios.
        * metodo "getSessionsByConferenceGrupo1()"

    userServices - (src/services/userServices.ts) - Desarrollado por otro grupo, solo se usaron o crearon los metodos necesarios.
        * metodo "getAllUsers()"
    