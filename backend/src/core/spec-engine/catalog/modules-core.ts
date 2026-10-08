// ==========================================================================
// Catálogo Determinista: Módulos Transversales (Core)
// Autenticación, autorización, búsqueda, notificaciones, reportes, archivos,
// auditoría, integraciones y plataforma genérica de respaldo.
// Placeholders: {ACTOR} {ACTOR_CAP} {ADMIN} {PROJECT}
// ==========================================================================

import { DomainModule } from '../spec-types';

export const CORE_MODULES: DomainModule[] = [
  // ──────────────────────────────────────────────────────────────────
  // AUTENTICACIÓN Y SESIÓN
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'authentication',
    name: 'Autenticación y Sesión',
    icon: '🔐',
    description:
      'Registro de cuentas, inicio y cierre de sesión, recuperación de contraseña y protección de credenciales.',
    keywords: [
      { term: 'login', weight: 3 },
      { term: 'iniciar sesion', weight: 3 },
      { term: 'inicio de sesion', weight: 3 },
      { term: 'autenticacion', weight: 3 },
      { term: 'autenticar', weight: 2 },
      { term: 'contraseña', weight: 2 },
      { term: 'contrasena', weight: 2 },
      { term: 'password', weight: 2 },
      { term: 'credenciales', weight: 2 },
      { term: 'registrarse', weight: 2 },
      { term: 'crear cuenta', weight: 3 },
      { term: 'cuenta de usuario', weight: 3 },
      { term: 'cuentas', weight: 1 },
      { term: 'sesion', weight: 1 },
      { term: 'usuarios', weight: 1 },
      { term: 'usuario', weight: 1 },
      { term: 'acceso', weight: 1 },
      { term: 'perfil', weight: 1 },
    ],
    preferredActors: ['usuario', 'cliente', 'estudiante', 'paciente', 'empleado', 'socio'],
    templateCategory: 'authentication',
    useCases: [
      {
        key: 'auth_register',
        name: 'Registrar cuenta de usuario',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite a un {ACTOR} nuevo crear una cuenta en {PROJECT} con correo único y contraseña segura.',
        preconditions: [
          'El {ACTOR} no posee una cuenta registrada con su correo electrónico',
          'El formulario de registro está disponible',
        ],
        mainFlow: [
          'El {ACTOR} accede a la opción "Crear cuenta"',
          'Ingresa nombre completo, correo electrónico y contraseña',
          'Acepta los términos y condiciones de uso',
          'El sistema valida el formato y la unicidad del correo',
          'El sistema registra la cuenta con el rol por defecto',
          'El sistema inicia la sesión y muestra la pantalla principal',
        ],
        alternativeFlows: [
          {
            name: 'Verificación de correo electrónico',
            condition: 'La verificación por correo está habilitada',
            steps: [
              'El sistema envía un enlace de verificación con vigencia de 24 horas',
              'El {ACTOR} confirma desde su correo',
              'La cuenta cambia a estado activo',
            ],
          },
        ],
        exceptionFlows: [
          {
            name: 'Correo ya registrado',
            trigger: 'El correo ingresado pertenece a otra cuenta',
            steps: [
              'El sistema rechaza el registro',
              'Muestra el mensaje "El correo electrónico ya está registrado"',
            ],
            expectedError: 'El correo electrónico ya está registrado',
          },
        ],
        postconditions: [
          'Existe una cuenta activa asociada al correo',
          'La fecha de creación queda registrada en auditoría',
        ],
        requirements: [
          {
            key: 'auth_register_req',
            title: 'Registro de cuenta con validación de datos',
            description:
              'El sistema debe permitir al {ACTOR} crear una cuenta ingresando nombre completo (2 a 120 caracteres), correo electrónico único con formato válido y contraseña de 8 a 64 caracteres que incluya al menos una letra mayúscula y un dígito.',
            priority: 'high',
            templateCategory: 'authentication',
            variables: [{ name: 'Longitud de contraseña', type: 'string_length', min: 8, max: 64 }],
            scenarios: [
              {
                name: 'Registro exitoso con datos válidos',
                type: 'positive',
                given: [
                  'el {ACTOR} se encuentra en el formulario de registro',
                  'el correo "nuevo.usuario@empresa.com" no existe en el sistema',
                ],
                when: [
                  'ingresa nombre "Ana Torres", correo "nuevo.usuario@empresa.com" y contraseña "Clave2026Segura"',
                  'acepta los términos y confirma el registro',
                ],
                then: [
                  'el sistema crea la cuenta con rol por defecto',
                  'inicia la sesión y muestra el mensaje de bienvenida',
                ],
              },
              {
                name: 'Rechazo de correo con formato inválido',
                type: 'validation',
                given: ['el {ACTOR} se encuentra en el formulario de registro'],
                when: [
                  'ingresa el correo "usuario-sin-arroba.com" y datos válidos en el resto de campos',
                  'confirma el registro',
                ],
                then: [
                  'el sistema no crea la cuenta',
                  'muestra el mensaje "Ingrese un correo electrónico válido" junto al campo',
                ],
              },
              {
                name: 'Rechazo de correo duplicado',
                type: 'negative',
                given: ['existe una cuenta registrada con el correo "ana@empresa.com"'],
                when: ['el {ACTOR} intenta registrarse con el correo "ana@empresa.com"'],
                then: [
                  'el sistema rechaza el registro con el mensaje "El correo electrónico ya está registrado"',
                  'no se crea una segunda cuenta',
                ],
              },
              {
                name: 'Contraseña en el límite mínimo de 8 caracteres',
                type: 'boundary',
                given: ['el {ACTOR} se encuentra en el formulario de registro'],
                when: ['ingresa la contraseña "Abc12345" de exactamente 8 caracteres con mayúscula y dígito'],
                then: ['el sistema acepta la contraseña', 'completa el registro correctamente'],
              },
            ],
          },
        ],
      },
      {
        key: 'auth_login',
        name: 'Iniciar y cerrar sesión',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite al {ACTOR} autenticarse con sus credenciales, mantener una sesión segura y cerrarla.',
        preconditions: ['El {ACTOR} posee una cuenta activa', 'El {ACTOR} no tiene una sesión iniciada'],
        mainFlow: [
          'El {ACTOR} accede a la pantalla de inicio de sesión',
          'Ingresa correo electrónico y contraseña',
          'El sistema verifica las credenciales contra el almacén seguro',
          'El sistema crea la sesión y redirige a la pantalla principal',
        ],
        alternativeFlows: [
          {
            name: 'Cierre de sesión',
            condition: 'El {ACTOR} selecciona "Cerrar sesión"',
            steps: ['El sistema invalida la sesión activa', 'Redirige a la pantalla de inicio de sesión'],
          },
          {
            name: 'Recordar sesión',
            condition: 'El {ACTOR} marca la opción "Mantener sesión iniciada"',
            steps: [
              'El sistema extiende la vigencia de la sesión a 7 días',
              'La sesión se renueva automáticamente mientras esté vigente',
            ],
          },
        ],
        exceptionFlows: [
          {
            name: 'Credenciales incorrectas',
            trigger: 'El correo o la contraseña no coinciden',
            steps: [
              'El sistema rechaza el acceso sin indicar cuál dato falló',
              'Incrementa el contador de intentos fallidos',
            ],
            expectedError: 'Credenciales inválidas',
          },
          {
            name: 'Cuenta bloqueada por intentos fallidos',
            trigger: 'Se acumulan 5 intentos fallidos consecutivos',
            steps: ['El sistema bloquea la cuenta durante 15 minutos', 'Notifica al titular por correo'],
            expectedError: 'Cuenta bloqueada temporalmente',
          },
        ],
        postconditions: [
          'Existe una sesión asociada al {ACTOR} con fecha de expiración',
          'El intento de acceso queda registrado en la bitácora',
        ],
        requirements: [
          {
            key: 'auth_login_req',
            title: 'Inicio de sesión con credenciales y bloqueo por intentos',
            description:
              'El sistema debe autenticar al {ACTOR} con correo y contraseña, rechazar credenciales incorrectas con un mensaje genérico y bloquear la cuenta durante 15 minutos tras 5 intentos fallidos consecutivos.',
            priority: 'high',
            templateCategory: 'authentication',
            variables: [
              { name: 'Intentos fallidos permitidos', type: 'integer', min: 1, max: 5, unit: 'intentos' },
            ],
            scenarios: [
              {
                name: 'Inicio de sesión exitoso',
                type: 'positive',
                given: ['el {ACTOR} tiene una cuenta activa con correo "ana@empresa.com"'],
                when: ['ingresa el correo "ana@empresa.com" y su contraseña correcta', 'presiona "Ingresar"'],
                then: [
                  'el sistema crea la sesión',
                  'redirige a la pantalla principal mostrando el nombre del {ACTOR}',
                ],
              },
              {
                name: 'Rechazo por contraseña incorrecta',
                type: 'negative',
                given: ['el {ACTOR} tiene una cuenta activa'],
                when: ['ingresa su correo y una contraseña incorrecta'],
                then: [
                  'el sistema muestra el mensaje genérico "Credenciales inválidas"',
                  'no se crea ninguna sesión',
                ],
              },
              {
                name: 'Bloqueo temporal al quinto intento fallido',
                type: 'boundary',
                given: ['el {ACTOR} acumula 4 intentos fallidos consecutivos'],
                when: ['realiza un quinto intento con contraseña incorrecta'],
                then: [
                  'el sistema bloquea la cuenta durante 15 minutos',
                  'muestra el mensaje "Cuenta bloqueada temporalmente"',
                ],
              },
              {
                name: 'Cierre de sesión invalida el acceso',
                type: 'alternative',
                given: ['el {ACTOR} tiene una sesión iniciada'],
                when: [
                  'selecciona "Cerrar sesión"',
                  'intenta acceder a una pantalla protegida usando el botón atrás del navegador',
                ],
                then: [
                  'el sistema redirige a la pantalla de inicio de sesión',
                  'no muestra información de la sesión anterior',
                ],
              },
            ],
          },
          {
            key: 'auth_recovery_req',
            title: 'Recuperación de contraseña por correo',
            description:
              'El sistema debe permitir al {ACTOR} solicitar un enlace de restablecimiento de contraseña enviado a su correo, con vigencia de 15 minutos y de un solo uso.',
            priority: 'medium',
            templateCategory: 'authentication',
            variables: [
              {
                name: 'Vigencia del enlace de recuperación',
                type: 'integer',
                min: 1,
                max: 15,
                unit: 'minutos',
              },
            ],
            scenarios: [
              {
                name: 'Solicitud de recuperación con correo registrado',
                type: 'positive',
                given: ['el {ACTOR} tiene una cuenta con correo "ana@empresa.com"'],
                when: ['selecciona "Olvidé mi contraseña" e ingresa "ana@empresa.com"'],
                then: [
                  'el sistema envía un correo con un enlace de restablecimiento',
                  'muestra el mensaje "Si el correo existe, recibirá las instrucciones"',
                ],
              },
              {
                name: 'Enlace expirado tras 15 minutos',
                type: 'boundary',
                given: ['el {ACTOR} recibió un enlace de restablecimiento hace 16 minutos'],
                when: ['abre el enlace e intenta definir una nueva contraseña'],
                then: [
                  'el sistema rechaza la operación indicando que el enlace expiró',
                  'ofrece solicitar uno nuevo',
                ],
              },
              {
                name: 'Enlace ya utilizado',
                type: 'negative',
                given: ['el {ACTOR} ya restableció su contraseña con el enlace recibido'],
                when: ['vuelve a abrir el mismo enlace'],
                then: [
                  'el sistema indica que el enlace ya fue utilizado',
                  'no permite cambiar la contraseña nuevamente',
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // ROLES Y PERMISOS
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'authorization',
    name: 'Roles y Permisos',
    icon: '🛡️',
    description:
      'Asignación de roles, control de acceso por funcionalidad y protección contra accesos no autorizados.',
    keywords: [
      { term: 'rol', weight: 2 },
      { term: 'roles', weight: 3 },
      { term: 'permiso', weight: 2 },
      { term: 'permisos', weight: 3 },
      { term: 'privilegios', weight: 3 },
      { term: 'autorizacion', weight: 3 },
      { term: 'perfiles de acceso', weight: 3 },
      { term: 'niveles de acceso', weight: 3 },
      { term: 'administrador', weight: 1 },
      { term: 'control de acceso', weight: 3 },
    ],
    preferredActors: ['administrador'],
    implies: ['authentication'],
    templateCategory: 'permissions',
    useCases: [
      {
        key: 'authz_manage_roles',
        name: 'Administrar roles y permisos',
        actor: 'admin',
        priority: 'high',
        description:
          'Permite al {ADMIN} asignar roles a los usuarios y restringir funcionalidades según el rol.',
        preconditions: [
          'El {ADMIN} tiene sesión iniciada con rol de administrador',
          'Existen usuarios registrados',
        ],
        mainFlow: [
          'El {ADMIN} accede al panel de usuarios',
          'Selecciona un usuario y elige el nuevo rol',
          'El sistema valida que no se elimine al último administrador activo',
          'El sistema guarda el cambio y lo aplica en la siguiente petición del usuario',
        ],
        alternativeFlows: [
          {
            name: 'Desactivación de cuenta',
            condition: 'El {ADMIN} elige "Desactivar"',
            steps: ['El sistema marca la cuenta como inactiva', 'Cierra las sesiones activas del usuario'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Último administrador',
            trigger: 'Se intenta degradar o desactivar al único administrador activo',
            steps: ['El sistema rechaza la operación'],
            expectedError: 'Debe existir al menos un administrador activo',
          },
        ],
        postconditions: [
          'El usuario opera con los permisos del nuevo rol',
          'El cambio de rol queda auditado',
        ],
        requirements: [
          {
            key: 'authz_assign_req',
            title: 'Asignación de roles a usuarios',
            description:
              'El sistema debe permitir al {ADMIN} asignar uno de los roles definidos (por ejemplo Usuario, Supervisor o Administrador) a cada cuenta, aplicar el cambio de inmediato e impedir que el sistema quede sin administradores activos.',
            priority: 'high',
            templateCategory: 'permissions',
            scenarios: [
              {
                name: 'Asignación de rol exitosa',
                type: 'positive',
                given: [
                  'el {ADMIN} visualiza el listado de usuarios',
                  'el usuario "carlos@empresa.com" tiene rol Usuario',
                ],
                when: ['cambia el rol de "carlos@empresa.com" a Supervisor y guarda'],
                then: [
                  'el sistema confirma el cambio',
                  'el usuario accede a las funciones de Supervisor en su siguiente acción',
                ],
              },
              {
                name: 'Protección del último administrador',
                type: 'negative',
                given: ['existe un único administrador activo en el sistema'],
                when: ['el {ADMIN} intenta cambiar su propio rol a Usuario'],
                then: [
                  'el sistema rechaza el cambio con el mensaje "Debe existir al menos un administrador activo"',
                ],
              },
              {
                name: 'Desactivación cierra sesiones activas',
                type: 'alternative',
                given: ['el usuario "carlos@empresa.com" tiene una sesión iniciada'],
                when: ['el {ADMIN} desactiva la cuenta de "carlos@empresa.com"'],
                then: [
                  'el sistema cierra la sesión del usuario',
                  'rechaza sus siguientes peticiones con estado 401',
                ],
              },
            ],
          },
          {
            key: 'authz_access_req',
            title: 'Control de acceso por rol en todas las funcionalidades',
            description:
              'El sistema debe verificar en cada petición que el usuario esté autenticado (de lo contrario responder 401) y que su rol tenga permiso para la funcionalidad solicitada (de lo contrario responder 403), sin revelar la existencia de recursos ajenos.',
            priority: 'high',
            templateCategory: 'permissions',
            scenarios: [
              {
                name: 'Acceso permitido con rol autorizado',
                type: 'positive',
                given: ['el {ADMIN} tiene sesión iniciada'],
                when: ['accede al panel de administración de usuarios'],
                then: ['el sistema muestra el panel completo con estado 200'],
              },
              {
                name: 'Rechazo sin sesión iniciada',
                type: 'negative',
                given: ['no existe una sesión iniciada'],
                when: ['se solicita directamente la URL de una pantalla protegida'],
                then: ['el sistema responde con estado 401', 'redirige a la pantalla de inicio de sesión'],
              },
              {
                name: 'Rechazo con rol insuficiente',
                type: 'negative',
                given: ['el {ACTOR} tiene sesión iniciada con rol Usuario'],
                when: ['intenta acceder al panel de administración de usuarios'],
                then: [
                  'el sistema responde con estado 403',
                  'muestra el mensaje "No tiene permisos para esta acción"',
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // BÚSQUEDA Y FILTROS
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'search_filter',
    name: 'Búsqueda, Filtros y Paginación',
    icon: '🔎',
    description: 'Búsqueda por texto, filtros combinados, ordenamiento y paginación de listados.',
    keywords: [
      { term: 'buscar', weight: 2 },
      { term: 'busqueda', weight: 3 },
      { term: 'buscador', weight: 3 },
      { term: 'filtrar', weight: 2 },
      { term: 'filtro', weight: 2 },
      { term: 'filtros', weight: 3 },
      { term: 'ordenar', weight: 2 },
      { term: 'paginacion', weight: 3 },
      { term: 'listado', weight: 1 },
      { term: 'listados', weight: 1 },
    ],
    preferredActors: ['usuario', 'cliente', 'operador'],
    templateCategory: 'search_filter',
    useCases: [
      {
        key: 'search_main',
        name: 'Buscar y filtrar información',
        actor: 'primary',
        priority: 'medium',
        description:
          'Permite al {ACTOR} localizar registros mediante texto libre, filtros combinados y ordenamiento.',
        preconditions: ['El {ACTOR} tiene sesión iniciada', 'Existen registros en el listado'],
        mainFlow: [
          'El {ACTOR} ingresa un término de búsqueda de al menos 2 caracteres',
          'Selecciona filtros adicionales (estado, fecha, categoría)',
          'El sistema consulta los registros que coinciden con todos los criterios',
          'El sistema muestra los resultados paginados de 20 en 20 con el total encontrado',
        ],
        alternativeFlows: [
          {
            name: 'Ordenamiento',
            condition: 'El {ACTOR} selecciona una columna para ordenar',
            steps: [
              'El sistema reordena los resultados de forma ascendente o descendente',
              'Mantiene los filtros aplicados',
            ],
          },
        ],
        exceptionFlows: [
          {
            name: 'Sin resultados',
            trigger: 'Ningún registro coincide con los criterios',
            steps: [
              'El sistema muestra el mensaje "No se encontraron resultados"',
              'Ofrece limpiar los filtros',
            ],
            expectedError: 'No se encontraron resultados',
          },
        ],
        postconditions: ['Los criterios de búsqueda se conservan al navegar entre páginas'],
        requirements: [
          {
            key: 'search_text_req',
            title: 'Búsqueda por texto con validación de longitud',
            description:
              'El sistema debe permitir buscar registros por texto libre de 2 a 100 caracteres, ignorando mayúsculas y acentos, y mostrar un mensaje claro cuando no existan coincidencias.',
            priority: 'medium',
            templateCategory: 'search_filter',
            variables: [
              { name: 'Longitud del término de búsqueda', type: 'string_length', min: 2, max: 100 },
            ],
            scenarios: [
              {
                name: 'Búsqueda exitosa insensible a mayúsculas y acentos',
                type: 'positive',
                given: ['existe un registro con el nombre "Camión Eléctrico"'],
                when: ['el {ACTOR} busca el texto "camion electrico"'],
                then: ['el sistema muestra el registro "Camión Eléctrico" entre los resultados'],
              },
              {
                name: 'Búsqueda sin coincidencias',
                type: 'alternative',
                given: ['no existe ningún registro que contenga "zzzz"'],
                when: ['el {ACTOR} busca el texto "zzzz"'],
                then: [
                  'el sistema muestra el mensaje "No se encontraron resultados"',
                  'ofrece la acción "Limpiar filtros"',
                ],
              },
              {
                name: 'Término de un solo carácter',
                type: 'validation',
                given: ['el {ACTOR} se encuentra en el buscador'],
                when: ['ingresa el texto "a" y ejecuta la búsqueda'],
                then: ['el sistema solicita al menos 2 caracteres', 'no ejecuta la consulta'],
              },
              {
                name: 'Caracteres especiales no alteran la consulta',
                type: 'validation',
                given: ['el {ACTOR} se encuentra en el buscador'],
                when: ['ingresa el texto "\'; DROP TABLE registros; --"'],
                then: ['el sistema trata el texto como literal', 'responde sin errores y sin resultados'],
              },
            ],
          },
          {
            key: 'search_pagination_req',
            title: 'Paginación y ordenamiento de listados',
            description:
              'El sistema debe paginar los listados en bloques de 10, 20 o 50 registros (20 por defecto), mostrar el total de registros y permitir ordenar por columnas de forma ascendente o descendente conservando los filtros.',
            priority: 'medium',
            templateCategory: 'search_filter',
            variables: [
              { name: 'Registros por página', type: 'integer', min: 10, max: 50, unit: 'registros' },
            ],
            scenarios: [
              {
                name: 'Primera página con 20 registros',
                type: 'positive',
                given: ['existen 45 registros en el listado'],
                when: ['el {ACTOR} abre el listado sin filtros'],
                then: ['el sistema muestra 20 registros', 'indica "Mostrando 1-20 de 45" y 3 páginas'],
              },
              {
                name: 'Última página con registros restantes',
                type: 'boundary',
                given: ['existen 45 registros y se muestran 20 por página'],
                when: ['el {ACTOR} navega a la página 3'],
                then: ['el sistema muestra exactamente 5 registros', 'deshabilita el botón "Siguiente"'],
              },
              {
                name: 'Ordenamiento descendente conserva filtros',
                type: 'positive',
                given: ['el {ACTOR} aplicó el filtro de estado "activo"'],
                when: ['ordena por fecha de creación de forma descendente'],
                then: [
                  'los registros se muestran del más reciente al más antiguo',
                  'el filtro "activo" permanece aplicado',
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // NOTIFICACIONES
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'notifications',
    name: 'Notificaciones y Alertas',
    icon: '🔔',
    description: 'Envío de correos, mensajes y alertas en la aplicación ante eventos relevantes.',
    keywords: [
      { term: 'notificacion', weight: 3 },
      { term: 'notificaciones', weight: 3 },
      { term: 'notificar', weight: 3 },
      { term: 'correo electronico', weight: 2 },
      { term: 'correos', weight: 2 },
      { term: 'email', weight: 2 },
      { term: 'sms', weight: 3 },
      { term: 'whatsapp', weight: 3 },
      { term: 'alerta', weight: 2 },
      { term: 'alertas', weight: 2 },
      { term: 'aviso', weight: 1 },
      { term: 'avisos', weight: 2 },
      { term: 'recordatorio', weight: 3 },
      { term: 'recordatorios', weight: 3 },
      { term: 'push', weight: 2 },
    ],
    preferredActors: ['usuario', 'cliente', 'paciente', 'estudiante'],
    templateCategory: 'resilience_offline',
    useCases: [
      {
        key: 'notif_send',
        name: 'Enviar notificaciones ante eventos del sistema',
        actor: 'primary',
        priority: 'medium',
        description:
          'El sistema notifica al {ACTOR} por correo y en la aplicación cuando ocurren eventos relevantes para él.',
        preconditions: ['El {ACTOR} tiene un correo verificado', 'El servicio de correo está configurado'],
        mainFlow: [
          'Ocurre un evento relevante (confirmación, cambio de estado o recordatorio)',
          'El sistema construye el mensaje con la plantilla correspondiente',
          'El sistema envía el correo y registra la notificación en la bandeja interna',
          'El {ACTOR} visualiza la notificación y la marca como leída',
        ],
        alternativeFlows: [
          {
            name: 'Preferencias de notificación',
            condition: 'El {ACTOR} desactivó las notificaciones por correo',
            steps: ['El sistema omite el correo', 'Registra únicamente la notificación interna'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Fallo del servicio de correo',
            trigger: 'El servidor de correo no responde',
            steps: [
              'El sistema reintenta el envío hasta 3 veces con espera incremental',
              'Registra el fallo definitivo para revisión',
            ],
            expectedError: 'No se pudo entregar la notificación por correo',
          },
        ],
        postconditions: ['La notificación queda registrada con fecha de envío y estado de lectura'],
        requirements: [
          {
            key: 'notif_email_req',
            title: 'Notificación por correo electrónico con reintentos',
            description:
              'El sistema debe enviar un correo al {ACTOR} dentro de los 60 segundos posteriores a cada evento relevante, reintentar hasta 3 veces ante fallos del servidor de correo y respetar las preferencias de notificación del {ACTOR}.',
            priority: 'medium',
            variables: [{ name: 'Reintentos de envío', type: 'integer', min: 0, max: 3, unit: 'reintentos' }],
            scenarios: [
              {
                name: 'Correo enviado tras un evento relevante',
                type: 'positive',
                given: [
                  'el {ACTOR} tiene el correo "ana@empresa.com" verificado y las notificaciones activas',
                ],
                when: ['se confirma una operación asociada al {ACTOR}'],
                then: [
                  'el sistema envía un correo a "ana@empresa.com" en menos de 60 segundos',
                  'el correo contiene el detalle de la operación',
                ],
              },
              {
                name: 'Reintento ante fallo del servidor de correo',
                type: 'negative',
                given: ['el servidor de correo rechaza la primera conexión'],
                when: ['el sistema intenta enviar la notificación'],
                then: [
                  'el sistema reintenta hasta 3 veces con espera incremental',
                  'registra el resultado final del envío',
                ],
              },
              {
                name: 'Preferencia de correo desactivada',
                type: 'alternative',
                given: ['el {ACTOR} desactivó las notificaciones por correo'],
                when: ['ocurre un evento relevante'],
                then: ['el sistema no envía correo', 'registra la notificación solo en la bandeja interna'],
              },
            ],
          },
          {
            key: 'notif_inbox_req',
            title: 'Bandeja de notificaciones en la aplicación',
            description:
              'El sistema debe mostrar al {ACTOR} una bandeja con sus últimas 50 notificaciones, el contador de no leídas y la acción de marcar como leída individualmente o en bloque.',
            priority: 'low',
            variables: [
              {
                name: 'Notificaciones recientes mostradas',
                type: 'integer',
                min: 1,
                max: 50,
                unit: 'notificaciones',
              },
            ],
            scenarios: [
              {
                name: 'Contador de notificaciones no leídas',
                type: 'positive',
                given: ['el {ACTOR} tiene 3 notificaciones sin leer'],
                when: ['inicia sesión'],
                then: ['el ícono de notificaciones muestra el contador "3"'],
              },
              {
                name: 'Marcar notificación como leída',
                type: 'positive',
                given: ['el {ACTOR} tiene una notificación sin leer'],
                when: ['abre la bandeja y selecciona la notificación'],
                then: ['la notificación cambia a estado leída', 'el contador disminuye en 1'],
              },
              {
                name: 'Límite de 50 notificaciones recientes',
                type: 'boundary',
                given: ['el {ACTOR} acumula 60 notificaciones'],
                when: ['abre la bandeja'],
                then: [
                  'el sistema muestra las 50 más recientes',
                  'ofrece el enlace "Ver historial completo"',
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // REPORTES Y ESTADÍSTICAS
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'reporting',
    name: 'Reportes, Indicadores y Exportación',
    icon: '📊',
    description:
      'Generación de reportes por rango de fechas, paneles de indicadores y exportación a PDF/Excel.',
    keywords: [
      { term: 'reporte', weight: 3 },
      { term: 'reportes', weight: 3 },
      { term: 'informe', weight: 3 },
      { term: 'informes', weight: 3 },
      { term: 'estadistica', weight: 3 },
      { term: 'estadisticas', weight: 3 },
      { term: 'dashboard', weight: 3 },
      { term: 'indicador', weight: 2 },
      { term: 'indicadores', weight: 3 },
      { term: 'grafico', weight: 2 },
      { term: 'graficos', weight: 2 },
      { term: 'exportar', weight: 2 },
      { term: 'excel', weight: 2 },
      { term: 'pdf', weight: 1 },
      { term: 'metricas', weight: 2 },
      { term: 'kpi', weight: 3 },
      { term: 'tablero', weight: 2 },
    ],
    preferredActors: ['gerente', 'administrador', 'supervisor', 'contador', 'usuario'],
    templateCategory: 'export',
    useCases: [
      {
        key: 'report_generate',
        name: 'Generar reportes y consultar indicadores',
        actor: 'primary',
        priority: 'medium',
        description:
          'Permite al {ACTOR} obtener reportes por periodo, visualizar indicadores clave y exportarlos.',
        preconditions: [
          'El {ACTOR} tiene permiso de consulta de reportes',
          'Existen datos registrados en el periodo',
        ],
        mainFlow: [
          'El {ACTOR} selecciona el tipo de reporte y el rango de fechas',
          'El sistema valida que la fecha de inicio no sea posterior a la fecha de fin',
          'El sistema calcula los totales e indicadores sobre los datos persistidos',
          'El sistema muestra el reporte con tabla detallada y gráficos',
          'El {ACTOR} exporta el reporte a PDF o Excel',
        ],
        alternativeFlows: [
          {
            name: 'Periodo sin datos',
            condition: 'No existen registros en el rango',
            steps: [
              'El sistema muestra el reporte con totales en cero',
              'Indica "Sin movimientos en el periodo"',
            ],
          },
        ],
        exceptionFlows: [
          {
            name: 'Rango de fechas inválido',
            trigger: 'La fecha de inicio es posterior a la de fin',
            steps: ['El sistema no genera el reporte', 'Resalta los campos de fecha'],
            expectedError: 'La fecha de inicio debe ser anterior o igual a la fecha de fin',
          },
        ],
        postconditions: [
          'El reporte generado queda disponible para descarga con fecha y usuario que lo generó',
        ],
        requirements: [
          {
            key: 'report_range_req',
            title: 'Reporte por rango de fechas con validación',
            description:
              'El sistema debe generar reportes para un rango de fechas de 1 a 366 días, validar que la fecha de inicio sea anterior o igual a la de fin y presentar totales coherentes con el detalle mostrado.',
            priority: 'medium',
            templateCategory: 'export',
            variables: [
              { name: 'Días del rango de reporte', type: 'integer', min: 1, max: 366, unit: 'días' },
            ],
            scenarios: [
              {
                name: 'Reporte mensual generado correctamente',
                type: 'positive',
                given: ['existen 12 registros entre el 01/03/2026 y el 31/03/2026'],
                when: ['el {ACTOR} genera el reporte del 01/03/2026 al 31/03/2026'],
                then: [
                  'el sistema muestra los 12 registros',
                  'el total general coincide con la suma del detalle',
                ],
              },
              {
                name: 'Fecha de inicio posterior a la fecha de fin',
                type: 'negative',
                given: ['el {ACTOR} se encuentra en el formulario de reportes'],
                when: ['selecciona inicio 31/03/2026 y fin 01/03/2026'],
                then: [
                  'el sistema muestra el mensaje "La fecha de inicio debe ser anterior o igual a la fecha de fin"',
                  'no genera el reporte',
                ],
              },
              {
                name: 'Rango de un solo día',
                type: 'boundary',
                given: ['existen 3 registros el 15/03/2026'],
                when: ['el {ACTOR} genera el reporte con inicio y fin 15/03/2026'],
                then: ['el sistema muestra exactamente los 3 registros de ese día'],
              },
              {
                name: 'Periodo sin movimientos',
                type: 'alternative',
                given: ['no existen registros entre el 01/01/2020 y el 31/01/2020'],
                when: ['el {ACTOR} genera el reporte de ese periodo'],
                then: ['el sistema muestra totales en cero', 'indica "Sin movimientos en el periodo"'],
              },
            ],
          },
          {
            key: 'report_export_req',
            title: 'Exportación de reportes a PDF y Excel',
            description:
              'El sistema debe permitir exportar cualquier reporte generado a PDF y a Excel (CSV o XLSX), incluyendo encabezados, filtros aplicados, fecha de generación y el mismo contenido mostrado en pantalla.',
            priority: 'medium',
            templateCategory: 'export',
            scenarios: [
              {
                name: 'Exportación a PDF',
                type: 'positive',
                given: ['el {ACTOR} generó un reporte con 12 registros'],
                when: ['selecciona "Exportar a PDF"'],
                then: [
                  'el sistema descarga un archivo PDF con los 12 registros y el rango de fechas en el encabezado',
                ],
              },
              {
                name: 'Exportación a Excel',
                type: 'positive',
                given: ['el {ACTOR} generó un reporte con 12 registros'],
                when: ['selecciona "Exportar a Excel"'],
                then: [
                  'el sistema descarga un archivo con 12 filas de datos y una fila de encabezados',
                  'los valores numéricos se exportan como números',
                ],
              },
              {
                name: 'Nombre del archivo con fecha de generación',
                type: 'validation',
                given: ['el {ACTOR} exporta un reporte el 15/03/2026'],
                when: ['descarga el archivo'],
                then: ['el nombre del archivo incluye el tipo de reporte y la fecha "2026-03-15"'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // ARCHIVOS Y DOCUMENTOS
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'file_management',
    name: 'Carga y Descarga de Archivos',
    icon: '📎',
    description:
      'Subida de archivos con validación de tipo y tamaño, almacenamiento seguro y descarga controlada.',
    keywords: [
      { term: 'archivo', weight: 2 },
      { term: 'archivos', weight: 3 },
      { term: 'adjuntar', weight: 3 },
      { term: 'adjunto', weight: 2 },
      { term: 'adjuntos', weight: 3 },
      { term: 'subir', weight: 2 },
      { term: 'cargar archivo', weight: 3 },
      { term: 'imagen', weight: 1 },
      { term: 'imagenes', weight: 2 },
      { term: 'foto', weight: 1 },
      { term: 'fotos', weight: 2 },
      { term: 'documento', weight: 1 },
      { term: 'documentos', weight: 2 },
      { term: 'descargar', weight: 2 },
      { term: 'pdf', weight: 1 },
    ],
    preferredActors: ['usuario', 'empleado', 'cliente', 'estudiante'],
    coveredEntities: ['documento'],
    templateCategory: 'form_validation',
    useCases: [
      {
        key: 'file_upload',
        name: 'Subir y descargar archivos',
        actor: 'primary',
        priority: 'medium',
        description:
          'Permite al {ACTOR} adjuntar archivos permitidos a un registro y descargarlos posteriormente con control de acceso.',
        preconditions: [
          'El {ACTOR} tiene permiso de edición sobre el registro',
          'El almacenamiento tiene espacio disponible',
        ],
        mainFlow: [
          'El {ACTOR} selecciona "Adjuntar archivo" en el registro',
          'Elige un archivo desde su dispositivo',
          'El sistema valida la extensión permitida (PDF, JPG, PNG, XLSX) y el tamaño máximo de 10 MB',
          'El sistema almacena el archivo con un nombre único y lo asocia al registro',
          'El {ACTOR} visualiza el archivo en la lista de adjuntos y puede descargarlo',
        ],
        alternativeFlows: [
          {
            name: 'Reemplazo de archivo',
            condition: 'El {ACTOR} sube un archivo con el mismo nombre',
            steps: ['El sistema conserva la versión anterior', 'Registra la nueva versión con fecha'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Tipo de archivo no permitido',
            trigger: 'La extensión no está en la lista permitida',
            steps: ['El sistema rechaza la carga', 'Indica las extensiones permitidas'],
            expectedError: 'Tipo de archivo no permitido',
          },
          {
            name: 'Tamaño excedido',
            trigger: 'El archivo supera 10 MB',
            steps: ['El sistema rechaza la carga antes de transferir el contenido'],
            expectedError: 'El archivo supera el tamaño máximo de 10 MB',
          },
        ],
        postconditions: ['El archivo queda asociado al registro con autor, fecha y tamaño'],
        requirements: [
          {
            key: 'file_upload_req',
            title: 'Carga de archivos con validación de tipo y tamaño',
            description:
              'El sistema debe aceptar únicamente archivos PDF, JPG, PNG y XLSX de hasta 10240 KB (10 MB), rechazar cualquier otro tipo o tamaño antes de almacenarlo y sanear el nombre del archivo.',
            priority: 'medium',
            templateCategory: 'form_validation',
            variables: [{ name: 'Tamaño del archivo', type: 'integer', min: 1, max: 10240, unit: 'KB' }],
            scenarios: [
              {
                name: 'Carga exitosa de un PDF de 2 MB',
                type: 'positive',
                given: ['el {ACTOR} está editando un registro'],
                when: ['adjunta el archivo "contrato.pdf" de 2048 KB'],
                then: ['el sistema almacena el archivo', 'lo muestra en la lista de adjuntos con su tamaño'],
              },
              {
                name: 'Rechazo de archivo ejecutable',
                type: 'negative',
                given: ['el {ACTOR} está editando un registro'],
                when: ['intenta adjuntar el archivo "instalador.exe"'],
                then: [
                  'el sistema rechaza la carga con el mensaje "Tipo de archivo no permitido"',
                  'indica las extensiones permitidas',
                ],
              },
              {
                name: 'Archivo exactamente en el límite de 10 MB',
                type: 'boundary',
                given: ['el {ACTOR} está editando un registro'],
                when: ['adjunta un archivo PNG de exactamente 10240 KB'],
                then: ['el sistema acepta y almacena el archivo'],
              },
              {
                name: 'Nombre de archivo con caracteres especiales',
                type: 'validation',
                given: ['el {ACTOR} está editando un registro'],
                when: ['adjunta el archivo "informe final (v2) ñ&%.pdf"'],
                then: [
                  'el sistema almacena el archivo con un nombre saneado',
                  'conserva el nombre original para mostrarlo al {ACTOR}',
                ],
              },
            ],
          },
          {
            key: 'file_download_req',
            title: 'Descarga de archivos con control de acceso',
            description:
              'El sistema debe permitir descargar un archivo solo a usuarios con acceso al registro asociado, responder 404 cuando el archivo no exista y registrar cada descarga en la bitácora.',
            priority: 'medium',
            scenarios: [
              {
                name: 'Descarga autorizada',
                type: 'positive',
                given: ['el {ACTOR} tiene acceso al registro con el adjunto "contrato.pdf"'],
                when: ['selecciona "Descargar"'],
                then: ['el sistema entrega el archivo con su nombre original y tipo de contenido correcto'],
              },
              {
                name: 'Descarga denegada sin acceso al registro',
                type: 'negative',
                given: ['el {ACTOR} no tiene acceso al registro propietario del archivo'],
                when: ['solicita la URL directa del archivo'],
                then: ['el sistema responde con estado 403 o 404', 'no entrega el contenido'],
              },
              {
                name: 'Archivo eliminado previamente',
                type: 'alternative',
                given: ['el archivo "antiguo.pdf" fue eliminado del registro'],
                when: ['el {ACTOR} intenta descargarlo desde un enlace guardado'],
                then: ['el sistema responde con estado 404 y el mensaje "El archivo ya no está disponible"'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // AUDITORÍA Y TRAZABILIDAD
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'audit_log',
    name: 'Auditoría y Bitácora',
    icon: '🧾',
    description:
      'Registro inmutable de acciones de los usuarios con fecha, autor y detalle para consultas de auditoría.',
    keywords: [
      { term: 'auditoria', weight: 3 },
      { term: 'bitacora', weight: 3 },
      { term: 'trazabilidad', weight: 3 },
      { term: 'historial de cambios', weight: 3 },
      { term: 'historial', weight: 1 },
      { term: 'log de acciones', weight: 3 },
      { term: 'registro de actividad', weight: 3 },
      { term: 'quien hizo', weight: 2 },
    ],
    preferredActors: ['auditor', 'administrador', 'supervisor', 'gerente'],
    implies: ['authentication'],
    templateCategory: 'permissions',
    useCases: [
      {
        key: 'audit_consult',
        name: 'Consultar bitácora de auditoría',
        actor: 'primary',
        priority: 'medium',
        description:
          'Permite al {ACTOR} revisar quién realizó cada acción relevante, cuándo y sobre qué registro.',
        preconditions: ['El {ACTOR} tiene permiso de auditoría', 'Existen acciones registradas'],
        mainFlow: [
          'El {ACTOR} accede a la bitácora',
          'Filtra por usuario, tipo de acción y rango de fechas',
          'El sistema muestra las entradas en orden cronológico descendente',
          'El {ACTOR} abre una entrada y revisa el detalle del antes y el después',
        ],
        alternativeFlows: [
          {
            name: 'Exportación de bitácora',
            condition: 'El {ACTOR} selecciona "Exportar"',
            steps: ['El sistema genera un CSV con las entradas filtradas'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Intento de modificación',
            trigger: 'Se intenta editar o borrar una entrada de la bitácora',
            steps: ['El sistema rechaza la operación'],
            expectedError: 'Las entradas de auditoría son inmutables',
          },
        ],
        postconditions: ['La consulta de la bitácora también queda registrada'],
        requirements: [
          {
            key: 'audit_record_req',
            title: 'Registro inmutable de acciones relevantes',
            description:
              'El sistema debe registrar automáticamente cada creación, modificación, eliminación e inicio de sesión con usuario, fecha y hora, dirección IP, entidad afectada y valores anteriores y nuevos; las entradas no pueden editarse ni eliminarse desde la aplicación.',
            priority: 'medium',
            templateCategory: 'permissions',
            scenarios: [
              {
                name: 'Modificación registrada con antes y después',
                type: 'positive',
                given: ['el {ACTOR} tiene sesión iniciada'],
                when: ['modifica el nombre de un registro de "Valor A" a "Valor B"'],
                then: [
                  'la bitácora contiene una entrada con el usuario, la fecha y hora y el cambio "Valor A" → "Valor B"',
                ],
              },
              {
                name: 'Entradas de bitácora no editables',
                type: 'negative',
                given: ['existe una entrada de auditoría'],
                when: ['se intenta modificarla o eliminarla mediante la interfaz o la API'],
                then: [
                  'el sistema rechaza la operación con el mensaje "Las entradas de auditoría son inmutables"',
                ],
              },
              {
                name: 'Filtro por usuario y fecha',
                type: 'positive',
                given: ['existen entradas de los usuarios "ana" y "carlos" en marzo de 2026'],
                when: ['el {ACTOR} filtra por usuario "ana" y rango 01/03/2026 al 31/03/2026'],
                then: ['el sistema muestra solo las entradas de "ana" dentro del rango'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // INTEGRACIONES Y API
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'integration_api',
    name: 'API REST e Integraciones',
    icon: '🔌',
    description:
      'Exposición de servicios REST autenticados para sistemas externos, con respuestas y errores estandarizados.',
    keywords: [
      { term: 'api', weight: 3 },
      { term: 'api rest', weight: 3 },
      { term: 'rest', weight: 2 },
      { term: 'integracion', weight: 3 },
      { term: 'integraciones', weight: 3 },
      { term: 'integrar', weight: 2 },
      { term: 'webhook', weight: 3 },
      { term: 'webhooks', weight: 3 },
      { term: 'sincronizar', weight: 2 },
      { term: 'sincronizacion', weight: 2 },
      { term: 'servicio externo', weight: 3 },
      { term: 'erp', weight: 2 },
      { term: 'crm', weight: 1 },
    ],
    preferredActors: ['sistema_externo'],
    templateCategory: 'api_rest',
    useCases: [
      {
        key: 'api_consume',
        name: 'Consumir la API REST desde un sistema externo',
        actor: 'primary',
        priority: 'medium',
        description:
          'Un sistema externo se autentica con un token y consulta o registra información mediante endpoints REST.',
        preconditions: [
          'El sistema externo posee un token de acceso vigente',
          'El endpoint está publicado y documentado',
        ],
        mainFlow: [
          'El sistema externo envía una petición HTTPS con el token en la cabecera Authorization',
          'La API valida el token y los permisos asociados',
          'La API valida el cuerpo de la petición contra el esquema definido',
          'La API procesa la operación y responde en JSON con el código de estado correspondiente',
        ],
        alternativeFlows: [
          {
            name: 'Paginación de resultados',
            condition: 'La consulta devuelve más de 100 registros',
            steps: ['La API responde la primera página y los metadatos de paginación'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Token ausente o inválido',
            trigger: 'La cabecera Authorization falta o el token expiró',
            steps: ['La API responde 401 con un cuerpo de error estándar'],
            expectedError: '401 Unauthorized',
          },
          {
            name: 'Cuerpo inválido',
            trigger: 'El JSON no cumple el esquema',
            steps: ['La API responde 422 detallando los campos inválidos'],
            expectedError: '422 Unprocessable Entity',
          },
          {
            name: 'Límite de peticiones',
            trigger: 'Se superan 120 peticiones por minuto',
            steps: ['La API responde 429 e indica el tiempo de espera'],
            expectedError: '429 Too Many Requests',
          },
        ],
        postconditions: ['Cada petición queda registrada con su identificador de correlación'],
        requirements: [
          {
            key: 'api_contract_req',
            title: 'Autenticación, validación y límites de la API REST',
            description:
              'La API debe exigir un token válido en cada petición (401 si falta o expiró), validar el cuerpo contra el esquema publicado (422 con detalle de campos), limitar a 120 peticiones por minuto por cliente (429) y responder siempre en JSON con la estructura { success, data, message }.',
            priority: 'medium',
            templateCategory: 'api_rest',
            variables: [
              {
                name: 'Peticiones por minuto permitidas',
                type: 'integer',
                min: 1,
                max: 120,
                unit: 'peticiones',
              },
            ],
            scenarios: [
              {
                name: 'Petición autenticada exitosa',
                type: 'positive',
                given: ['el sistema externo posee un token vigente'],
                when: ['envía GET /api/v1/recursos con la cabecera Authorization'],
                then: ['la API responde 200 con un JSON { success: true, data: [...] }'],
              },
              {
                name: 'Petición sin token',
                type: 'negative',
                given: ['la petición no incluye la cabecera Authorization'],
                when: ['se envía GET /api/v1/recursos'],
                then: ['la API responde 401 con { success: false, error: "No autenticado" }'],
              },
              {
                name: 'Cuerpo con campos inválidos',
                type: 'validation',
                given: ['el sistema externo posee un token vigente'],
                when: ['envía POST /api/v1/recursos con un campo obligatorio ausente'],
                then: ['la API responde 422', 'el cuerpo indica el nombre del campo faltante'],
              },
              {
                name: 'Límite de 120 peticiones por minuto',
                type: 'boundary',
                given: ['el sistema externo realizó 120 peticiones en el último minuto'],
                when: ['envía la petición número 121'],
                then: ['la API responde 429', 'incluye la cabecera Retry-After con los segundos de espera'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // PLATAFORMA GENÉRICA (respaldo cuando no se detecta ningún dominio)
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'core_platform',
    name: 'Núcleo Funcional del Sistema',
    icon: '🧩',
    description: 'Registro, consulta y mantenimiento de la información principal descrita para el proyecto.',
    keywords: [],
    preferredActors: ['usuario'],
    templateCategory: 'crud',
    useCases: [
      {
        key: 'core_manage',
        name: 'Administrar la información principal de {PROJECT}',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite al {ACTOR} registrar, consultar, actualizar y dar de baja la información principal que gestiona {PROJECT}.',
        preconditions: ['El {ACTOR} tiene sesión iniciada', 'El módulo principal está disponible'],
        mainFlow: [
          'El {ACTOR} accede al módulo principal',
          'Registra un nuevo elemento completando los campos obligatorios',
          'El sistema valida los datos y guarda el registro con fecha y autor',
          'El {ACTOR} consulta el listado y abre el detalle del elemento',
          'Actualiza la información y el sistema conserva el historial del cambio',
        ],
        alternativeFlows: [
          {
            name: 'Baja lógica',
            condition: 'El {ACTOR} selecciona "Dar de baja"',
            steps: [
              'El sistema solicita confirmación',
              'Marca el elemento como inactivo sin eliminar su historial',
            ],
          },
        ],
        exceptionFlows: [
          {
            name: 'Datos obligatorios incompletos',
            trigger: 'Falta algún campo obligatorio',
            steps: ['El sistema resalta los campos faltantes y no guarda'],
            expectedError: 'Complete los campos obligatorios',
          },
        ],
        postconditions: ['La información queda persistida con trazabilidad de autor y fecha'],
        requirements: [
          {
            key: 'core_manage_req',
            title: 'Registro, consulta y actualización de la información principal',
            description:
              'El sistema debe permitir al {ACTOR} registrar elementos con nombre (2 a 120 caracteres) y descripción (hasta 500 caracteres), listarlos de forma paginada, actualizarlos conservando el historial y darlos de baja de forma lógica.',
            priority: 'high',
            templateCategory: 'crud',
            variables: [{ name: 'Longitud del nombre', type: 'string_length', min: 2, max: 120 }],
            scenarios: [
              {
                name: 'Registro exitoso de un elemento',
                type: 'positive',
                given: ['el {ACTOR} se encuentra en el formulario de registro'],
                when: [
                  'ingresa el nombre "Elemento de prueba" y una descripción válida',
                  'guarda el registro',
                ],
                then: ['el sistema crea el elemento', 'lo muestra en el listado con fecha y autor'],
              },
              {
                name: 'Rechazo por campos obligatorios vacíos',
                type: 'validation',
                given: ['el {ACTOR} se encuentra en el formulario de registro'],
                when: ['deja el nombre vacío e intenta guardar'],
                then: [
                  'el sistema resalta el campo nombre',
                  'muestra "Complete los campos obligatorios" y no guarda',
                ],
              },
              {
                name: 'Baja lógica conserva historial',
                type: 'alternative',
                given: ['existe un elemento activo con historial de cambios'],
                when: ['el {ACTOR} lo da de baja y confirma'],
                then: ['el elemento pasa a estado inactivo', 'su historial sigue disponible para consulta'],
              },
            ],
          },
        ],
      },
    ],
  },
];
