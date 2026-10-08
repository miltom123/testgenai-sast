// ==========================================================================
// Catálogo Determinista: Registro Central
// Une módulos core y de negocio, requisitos no funcionales transversales y
// el generador de casos de uso CRUD por entidad detectada.
// ==========================================================================

import {
  DomainModule,
  EntityField,
  EntitySpec,
  RequirementTemplate,
  ScenarioTemplate,
  UseCaseTemplate,
} from '../spec-types';
import { BvaVariableInput } from '../../test-design/bva-engine';
import { TextNormalizer } from '../text-normalizer';
import { CORE_MODULES } from './modules-core';
import { BUSINESS_MODULES } from './modules-business';
import { ACTOR_CATALOG } from './actors';
import { ENTITY_CATALOG } from './entities';

export { CORE_MODULES } from './modules-core';
export { BUSINESS_MODULES } from './modules-business';
export { ACTOR_CATALOG, DEFAULT_ADMIN_ACTOR_KEY, DEFAULT_PRIMARY_ACTOR_KEY, findActor } from './actors';
export { ENTITY_CATALOG, findEntity } from './entities';

export const FALLBACK_MODULE_KEY = 'core_platform';
export const ENTITY_MODULE_KEY = 'entity_crud';
export const NON_FUNCTIONAL_MODULE_KEY = 'non_functional';

export const ALL_MODULES: DomainModule[] = [...CORE_MODULES, ...BUSINESS_MODULES];

export function findModule(key: string): DomainModule | undefined {
  return ALL_MODULES.find((m) => m.key === key);
}

// ---------------------------------------------------------------------------
// Requisitos No Funcionales transversales
// ---------------------------------------------------------------------------

export interface NonFunctionalTemplate {
  /** Solo se incluye si alguno de estos módulos fue detectado (vacío = siempre). */
  requiresModules?: string[];
  template: RequirementTemplate;
}

export const NON_FUNCTIONAL_TEMPLATES: NonFunctionalTemplate[] = [
  {
    requiresModules: ['authentication'],
    template: {
      key: 'nfr_security',
      title: '[RNF] Seguridad de credenciales, sesiones y datos',
      description:
        'El sistema debe almacenar las contraseñas con un hash adaptativo (bcrypt con costo mínimo 12), expirar las sesiones tras 60 minutos de inactividad, transmitir todo el tráfico por HTTPS y responder 404 ante identificadores de recursos que pertenezcan a otros usuarios sin revelar su existencia.',
      priority: 'high',
      kind: 'non_functional',
      templateCategory: 'defensive_security',
      variables: [
        {
          name: 'Minutos de inactividad antes de expirar la sesión',
          type: 'integer',
          min: 1,
          max: 60,
          unit: 'minutos',
        },
      ],
      scenarios: [
        {
          name: 'Contraseñas almacenadas con hash y no en texto plano',
          type: 'positive',
          given: ['existe una cuenta registrada con contraseña "Clave2026Segura"'],
          when: ['se consulta el registro de la cuenta en la base de datos'],
          then: [
            'el campo de contraseña contiene un hash bcrypt',
            'no aparece la cadena "Clave2026Segura" en ningún campo',
          ],
        },
        {
          name: 'Sesión expirada a los 60 minutos de inactividad',
          type: 'boundary',
          given: ['el {ACTOR} inició sesión y no realiza acciones durante 60 minutos'],
          when: ['intenta realizar una acción protegida'],
          then: ['el sistema responde 401 y redirige al inicio de sesión'],
        },
        {
          name: 'Acceso a recurso ajeno por identificador',
          type: 'negative',
          given: ['el {ACTOR} conoce el identificador de un registro de otro usuario'],
          when: ['solicita el registro directamente por su identificador'],
          then: ['el sistema responde 404 sin revelar ningún dato del registro'],
        },
      ],
    },
  },
  {
    template: {
      key: 'nfr_performance',
      title: '[RNF] Tiempos de respuesta y capacidad concurrente',
      description:
        'Las consultas y listados deben responder en menos de 2 segundos en el percentil 95 con 100 usuarios concurrentes y las operaciones de guardado en menos de 3 segundos; ante una carga superior el sistema debe degradarse con respuestas controladas (503 con mensaje) sin pérdida ni corrupción de datos.',
      priority: 'medium',
      kind: 'non_functional',
      templateCategory: 'performance_limits',
      variables: [
        { name: 'Usuarios concurrentes soportados', type: 'integer', min: 1, max: 100, unit: 'usuarios' },
      ],
      scenarios: [
        {
          name: 'Listado principal responde en menos de 2 segundos con carga nominal',
          type: 'positive',
          given: ['50 usuarios concurrentes utilizan el sistema'],
          when: ['se mide el tiempo de respuesta del listado principal durante 5 minutos'],
          then: ['el percentil 95 del tiempo de respuesta es menor a 2 segundos'],
        },
        {
          name: 'Capacidad en el límite de 100 usuarios concurrentes',
          type: 'boundary',
          given: ['100 usuarios concurrentes ejecutan consultas y guardados'],
          when: ['se mide el tiempo de respuesta durante 5 minutos'],
          then: [
            'las consultas responden en menos de 2 segundos y los guardados en menos de 3 segundos en el percentil 95',
            'no se registran errores 500',
          ],
        },
        {
          name: 'Degradación controlada por sobrecarga',
          type: 'negative',
          given: ['150 usuarios concurrentes superan la capacidad configurada'],
          when: ['se ejecutan operaciones de guardado'],
          then: [
            'el sistema responde 503 con un mensaje claro a las peticiones excedentes',
            'ninguna operación queda guardada de forma parcial',
          ],
        },
      ],
    },
  },
  {
    template: {
      key: 'nfr_usability',
      title: '[RNF] Usabilidad, accesibilidad y diseño responsivo',
      description:
        'La interfaz debe ser utilizable en pantallas desde 375 píxeles de ancho sin desplazamiento horizontal, navegable completamente por teclado, mostrar mensajes de error específicos junto al campo afectado y cumplir un contraste mínimo de 4.5:1 según WCAG 2.1 nivel AA.',
      priority: 'medium',
      kind: 'non_functional',
      templateCategory: 'form_validation',
      variables: [
        { name: 'Ancho mínimo de pantalla soportado', type: 'integer', min: 375, max: 1920, unit: 'px' },
      ],
      scenarios: [
        {
          name: 'Pantalla principal en móvil de 375 píxeles',
          type: 'boundary',
          given: ['el {ACTOR} abre el sistema en un dispositivo con 375 píxeles de ancho'],
          when: ['navega por la pantalla principal y el formulario de registro'],
          then: [
            'todo el contenido es visible sin desplazamiento horizontal',
            'los botones principales son accesibles con el pulgar',
          ],
        },
        {
          name: 'Navegación completa por teclado',
          type: 'positive',
          given: ['el {ACTOR} utiliza únicamente el teclado'],
          when: ['recorre el formulario principal con Tab y confirma con Enter'],
          then: [
            'el foco visible recorre todos los campos en orden lógico',
            'el formulario se envía correctamente',
          ],
        },
        {
          name: 'Mensajes de error junto al campo afectado',
          type: 'validation',
          given: ['el {ACTOR} envía un formulario con dos campos inválidos'],
          when: ['el sistema valida los datos'],
          then: [
            'cada campo inválido muestra su mensaje específico debajo del campo',
            'el foco se posiciona en el primer campo con error',
          ],
        },
      ],
    },
  },
  {
    template: {
      key: 'nfr_integrity',
      title: '[RNF] Integridad transaccional y respaldo de datos',
      description:
        'Toda operación que afecte a más de una tabla debe ejecutarse en una transacción atómica; el sistema debe generar un respaldo automático diario de la base de datos, conservar al menos 30 copias y permitir restaurar un respaldo en menos de 4 horas.',
      priority: 'medium',
      kind: 'non_functional',
      templateCategory: 'resilience_offline',
      variables: [
        { name: 'Copias de respaldo conservadas', type: 'integer', min: 1, max: 30, unit: 'copias' },
      ],
      scenarios: [
        {
          name: 'Respaldo diario generado automáticamente',
          type: 'positive',
          given: ['el sistema está en operación normal'],
          when: ['transcurre un día calendario'],
          then: [
            'existe un nuevo archivo de respaldo con la fecha del día',
            'el respaldo puede abrirse y verificarse',
          ],
        },
        {
          name: 'Fallo a mitad de una operación compuesta',
          type: 'negative',
          given: ['una operación debe actualizar dos tablas relacionadas'],
          when: ['la segunda actualización falla por un error de base de datos'],
          then: [
            'la primera actualización se revierte',
            'los datos quedan en el estado previo a la operación',
          ],
        },
        {
          name: 'Restauración de un respaldo',
          type: 'positive',
          given: ['existe un respaldo del día anterior'],
          when: ['el {ADMIN} ejecuta el procedimiento de restauración en un entorno de prueba'],
          then: [
            'la base de datos restaurada contiene los datos del respaldo',
            'el proceso tarda menos de 4 horas',
          ],
        },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Generador de Caso de Uso CRUD por Entidad
// ---------------------------------------------------------------------------

interface EntityWords {
  singular: string;
  plural: string;
  singularCap: string;
  pluralCap: string;
  art: string;
  arts: string;
  un: string;
  nuevo: string;
  registrado: string;
  lo: string;
}

function entityWords(entity: EntitySpec): EntityWords {
  const f = entity.gender === 'f';
  return {
    singular: entity.singular,
    plural: entity.plural,
    singularCap: TextNormalizer.capitalize(entity.singular),
    pluralCap: TextNormalizer.capitalize(entity.plural),
    art: f ? 'la' : 'el',
    arts: f ? 'las' : 'los',
    un: f ? 'una' : 'un',
    nuevo: f ? 'nueva' : 'nuevo',
    registrado: f ? 'registrada' : 'registrado',
    lo: f ? 'la' : 'lo',
  };
}

function sampleValue(field: EntityField, words: EntityWords): string {
  switch (field.type) {
    case 'text':
      return field.unique
        ? `"${words.singularCap.slice(0, 3).toUpperCase()}-0001"`
        : `"${words.singularCap} de prueba"`;
    case 'integer':
      return String(Math.floor(((field.min ?? 0) + (field.max ?? 100)) / 2));
    case 'decimal':
      return (((field.min ?? 0) + (field.max ?? 100)) / 2).toFixed(2);
    case 'date':
      return '"15/03/2026"';
    case 'email':
      return `"${field.example || 'contacto@empresa.com'}"`;
    case 'phone':
      return `"${field.example || '987654321'}"`;
    case 'enum':
      return `"${(field.options && field.options[0]) || 'valor'}"`;
    case 'boolean':
      return '"sí"';
    default:
      return '"valor"';
  }
}

function fieldConstraint(field: EntityField): string {
  if (field.type === 'text' || field.type === 'phone') {
    return `${field.name} de ${field.min ?? 1} a ${field.max ?? 255} ${field.unit || 'caracteres'}`;
  }
  if (field.type === 'integer' || field.type === 'decimal') {
    return `${field.name} entre ${field.min ?? 0} y ${field.max ?? 0}${field.unit ? ` ${field.unit}` : ''}`;
  }
  if (field.type === 'email') return `${field.name} con formato válido`;
  if (field.type === 'enum') return `${field.name} con valores ${(field.options || []).join(', ')}`;
  if (field.type === 'date') return `${field.name} con formato de fecha válido`;
  return field.name;
}

function toVariable(field: EntityField): BvaVariableInput | null {
  if (field.type === 'text' && field.min !== undefined && field.max !== undefined && field.min < field.max) {
    return { name: `Longitud de ${field.name}`, type: 'string_length', min: field.min, max: field.max };
  }
  if (
    (field.type === 'integer' || field.type === 'decimal') &&
    field.min !== undefined &&
    field.max !== undefined &&
    field.min < field.max
  ) {
    return {
      name: TextNormalizer.capitalize(field.name),
      type: field.type,
      min: field.min,
      max: field.max,
      unit: field.unit,
    };
  }
  return null;
}

export function buildEntityCrudUseCase(entity: EntitySpec): UseCaseTemplate {
  const w = entityWords(entity);
  const fields =
    entity.fields.length > 0
      ? entity.fields
      : [
          {
            name: 'nombre',
            type: 'text',
            required: true,
            unique: true,
            min: 2,
            max: 120,
            unit: 'caracteres',
          } as EntityField,
        ];
  const nameField = fields.find((f) => f.type === 'text' && f.required) ?? fields[0];
  const uniqueField = fields.find((f) => f.unique);
  const numericField = fields.find((f) => f.type === 'integer' || f.type === 'decimal');
  const emailField = fields.find((f) => f.type === 'email');
  const enumField = fields.find((f) => f.type === 'enum');
  const requiredFields = fields.filter((f) => f.required).map((f) => f.name);
  const constraints = fields.map(fieldConstraint).join('; ');
  const sampleInput = fields.map((f) => `${f.name} ${sampleValue(f, w)}`).join(', ');

  const registerScenarios: ScenarioTemplate[] = [
    {
      name: `Registro exitoso de ${w.singular}`,
      type: 'positive',
      given: [`el {ACTOR} se encuentra en el formulario de ${w.plural}`],
      when: [`ingresa ${sampleInput}`, 'guarda el registro'],
      then: [
        `el sistema crea ${w.art} ${w.singular} y ${w.lo} muestra en el listado`,
        'registra la fecha y el usuario de creación',
      ],
    },
    {
      name: `Campos obligatorios vacíos al registrar ${w.singular}`,
      type: 'validation',
      given: [`el {ACTOR} se encuentra en el formulario de ${w.plural}`],
      when: [`deja vacío el campo "${nameField.name}" e intenta guardar`],
      then: ['el sistema resalta los campos obligatorios faltantes', 'no guarda el registro'],
    },
    {
      name: `${TextNormalizer.capitalize(nameField.name)} con longitud máxima de ${nameField.max ?? 120} caracteres`,
      type: 'boundary',
      given: [`el {ACTOR} se encuentra en el formulario de ${w.plural}`],
      when: [
        `ingresa un valor de exactamente ${nameField.max ?? 120} caracteres en "${nameField.name}" y completa el resto de campos`,
      ],
      then: ['el sistema acepta el valor y guarda el registro'],
    },
  ];
  if (uniqueField) {
    registerScenarios.push({
      name: `Rechazo de ${uniqueField.name} duplicado`,
      type: 'negative',
      given: [`existe ${w.un} ${w.singular} con ${uniqueField.name} ${sampleValue(uniqueField, w)}`],
      when: [
        `el {ACTOR} intenta registrar ${w.un} ${w.nuevo} ${w.singular} con el mismo ${uniqueField.name}`,
      ],
      then: [`el sistema rechaza el registro indicando que ${uniqueField.name} ya existe`],
    });
  }
  if (emailField) {
    registerScenarios.push({
      name: `Formato inválido de ${emailField.name}`,
      type: 'validation',
      given: [`el {ACTOR} se encuentra en el formulario de ${w.plural}`],
      when: [`ingresa "correo-invalido.com" en "${emailField.name}"`],
      then: [`el sistema muestra "Ingrese un ${emailField.name} válido" y no guarda`],
    });
  }

  const registerVariables: BvaVariableInput[] = [];
  const nameVar = toVariable(nameField);
  if (nameVar) registerVariables.push(nameVar);
  if (numericField) {
    const numVar = toVariable(numericField);
    if (numVar) registerVariables.push(numVar);
  }

  const queryScenarios: ScenarioTemplate[] = [
    {
      name: `Listado paginado de ${w.plural}`,
      type: 'positive',
      given: [`existen 25 ${w.plural} ${w.registrado}s`],
      when: [`el {ACTOR} abre el listado de ${w.plural}`],
      then: [
        `el sistema muestra 20 ${w.plural} en la primera página`,
        'indica el total de 25 y permite navegar a la página 2',
      ],
    },
    {
      name: `Búsqueda de ${w.singular} por ${nameField.name}`,
      type: 'positive',
      given: [`existe ${w.un} ${w.singular} con ${nameField.name} ${sampleValue(nameField, w)}`],
      when: [`el {ACTOR} busca por parte de ese ${nameField.name}`],
      then: [`el sistema muestra ${w.art} ${w.singular} entre los resultados`],
    },
    {
      name: 'Búsqueda sin coincidencias',
      type: 'alternative',
      given: [`ningún ${w.singular} coincide con el texto "zzzz"`],
      when: ['el {ACTOR} busca "zzzz"'],
      then: ['el sistema muestra "No se encontraron resultados"', 'ofrece limpiar la búsqueda'],
    },
  ];
  if (enumField && enumField.options && enumField.options.length > 1) {
    queryScenarios.push({
      name: `Filtro de ${w.plural} por ${enumField.name}`,
      type: 'positive',
      given: [
        `existen ${w.plural} con ${enumField.name} "${enumField.options[0]}" y "${enumField.options[1]}"`,
      ],
      when: [`el {ACTOR} filtra por ${enumField.name} "${enumField.options[0]}"`],
      then: [`el sistema muestra solo ${w.arts} ${w.plural} con ${enumField.name} "${enumField.options[0]}"`],
    });
  }

  const invalidNumericWhen = numericField
    ? `cambia "${numericField.name}" a ${(numericField.min ?? 0) - 1} e intenta guardar`
    : `borra el contenido de "${nameField.name}" e intenta guardar`;

  const updateScenarios: ScenarioTemplate[] = [
    {
      name: `Actualización exitosa de ${w.singular}`,
      type: 'positive',
      given: [`existe ${w.un} ${w.singular} ${w.registrado}`],
      when: [`el {ACTOR} modifica "${nameField.name}" con un valor válido y guarda`],
      then: [
        'el sistema actualiza el registro',
        'conserva el valor anterior en el historial de cambios con fecha y usuario',
      ],
    },
    {
      name: `Actualización con datos inválidos de ${w.singular}`,
      type: 'validation',
      given: [`el {ACTOR} está editando ${w.un} ${w.singular}`],
      when: [invalidNumericWhen],
      then: [
        'el sistema rechaza el cambio y resalta el campo inválido',
        'el registro conserva sus valores anteriores',
      ],
    },
    {
      name: `Edición simultánea de ${w.singular} por dos usuarios`,
      type: 'negative',
      given: [`dos usuarios abren ${w.art} mism${w.art === 'la' ? 'a' : 'o'} ${w.singular} para editar`],
      when: ['el primero guarda sus cambios y luego el segundo intenta guardar sobre la versión anterior'],
      then: [
        'el sistema rechaza el segundo guardado con un aviso de conflicto de versión',
        'solicita recargar el registro antes de volver a guardar',
      ],
    },
  ];

  const deleteScenarios: ScenarioTemplate[] = [
    {
      name: `Eliminación de ${w.singular} con confirmación`,
      type: 'positive',
      given: [`existe ${w.un} ${w.singular} sin registros asociados`],
      when: ['el {ACTOR} selecciona "Eliminar" y confirma la acción'],
      then: [
        `el sistema elimina ${w.art} ${w.singular}`,
        'desaparece del listado y la acción queda registrada en auditoría',
      ],
    },
    {
      name: `Cancelación de la eliminación de ${w.singular}`,
      type: 'alternative',
      given: [`existe ${w.un} ${w.singular} ${w.registrado}`],
      when: ['el {ACTOR} selecciona "Eliminar" y cancela en el cuadro de confirmación'],
      then: [`${TextNormalizer.capitalize(w.art)} ${w.singular} permanece sin cambios`],
    },
    {
      name: `Bloqueo de eliminación de ${w.singular} con registros asociados`,
      type: 'negative',
      given: [`existe ${w.un} ${w.singular} con registros dependientes`],
      when: ['el {ACTOR} intenta eliminarl' + (w.art === 'la' ? 'a' : 'o')],
      then: [
        'el sistema impide la eliminación e indica los registros asociados',
        'ofrece la opción de desactivar en su lugar',
      ],
    },
    {
      name: `Eliminación de ${w.singular} sin permisos`,
      type: 'negative',
      given: ['el {ACTOR} tiene un rol sin permiso de eliminación'],
      when: [`intenta eliminar ${w.un} ${w.singular}`],
      then: ['el sistema responde 403 y no elimina el registro'],
    },
  ];

  const requirements: RequirementTemplate[] = [
    {
      key: `entity_${entity.key}_create`,
      title: `Registro de ${w.singular}`,
      description: `El sistema debe permitir al {ACTOR} registrar ${w.un} ${w.nuevo} ${w.singular} con los campos obligatorios ${requiredFields.join(', ')}, validando: ${constraints}.`,
      priority: 'high',
      templateCategory: 'crud',
      variables: registerVariables,
      scenarios: registerScenarios,
    },
    {
      key: `entity_${entity.key}_read`,
      title: `Consulta y búsqueda de ${w.plural}`,
      description: `El sistema debe listar ${w.arts} ${w.plural} de forma paginada (20 por página), permitir buscar por ${nameField.name}${enumField ? ` y filtrar por ${enumField.name}` : ''} y mostrar el detalle completo de cada ${w.singular}.`,
      priority: 'medium',
      templateCategory: 'search_filter',
      variables: [{ name: `${w.pluralCap} por página`, type: 'integer', min: 1, max: 20, unit: 'registros' }],
      scenarios: queryScenarios,
    },
    {
      key: `entity_${entity.key}_update`,
      title: `Actualización de ${w.singular}`,
      description: `El sistema debe permitir al {ACTOR} modificar los datos de ${w.un} ${w.singular} aplicando las mismas validaciones del registro, conservar el historial de cambios con fecha y usuario y detectar ediciones simultáneas mediante control de versión.`,
      priority: 'medium',
      templateCategory: 'crud',
      scenarios: updateScenarios,
    },
    {
      key: `entity_${entity.key}_delete`,
      title: `Eliminación de ${w.singular}`,
      description: `El sistema debe permitir eliminar ${w.un} ${w.singular} previa confirmación, impedirlo cuando existan registros asociados (ofreciendo la desactivación), exigir el permiso correspondiente y registrar la acción en auditoría.`,
      priority: 'medium',
      templateCategory: 'permissions',
      scenarios: deleteScenarios,
    },
  ];

  return {
    key: `entity_${entity.key}_crud`,
    name: `Gestionar ${w.plural}`,
    actor: 'primary',
    priority: 'high',
    description: `Permite al {ACTOR} registrar, consultar, actualizar y eliminar ${w.plural} manteniendo la integridad y la trazabilidad de la información.`,
    preconditions: [
      'El {ACTOR} tiene sesión iniciada',
      `El {ACTOR} tiene permisos sobre el módulo de ${w.plural}`,
    ],
    mainFlow: [
      `El {ACTOR} accede al módulo de ${w.plural}`,
      `Registra ${w.un} ${w.nuevo} ${w.singular} completando ${requiredFields.join(', ')}`,
      'El sistema valida los datos y guarda el registro con fecha y autor',
      `El {ACTOR} busca y consulta ${w.art} ${w.singular} desde el listado paginado`,
      'Actualiza sus datos y el sistema conserva el historial del cambio',
    ],
    alternativeFlows: [
      {
        name: `Eliminación de ${w.singular}`,
        condition: `El {ACTOR} selecciona "Eliminar" sobre ${w.un} ${w.singular} sin registros asociados`,
        steps: ['El sistema solicita confirmación', `Elimina ${w.art} ${w.singular} y actualiza el listado`],
      },
    ],
    exceptionFlows: [
      {
        name: 'Datos inválidos',
        trigger: 'Algún campo obligatorio falta o incumple su formato o rango',
        steps: ['El sistema resalta los campos con error y no guarda'],
        expectedError: 'Revise los campos marcados',
      },
      ...(uniqueField
        ? [
            {
              name: `${TextNormalizer.capitalize(uniqueField.name)} duplicado`,
              trigger: `Ya existe ${w.un} ${w.singular} con el mismo ${uniqueField.name}`,
              steps: ['El sistema rechaza el registro'],
              expectedError: `${TextNormalizer.capitalize(uniqueField.name)} ya registrado`,
            },
          ]
        : []),
    ],
    postconditions: [
      `${TextNormalizer.capitalize(w.art)} ${w.singular} queda persistid${w.art === 'la' ? 'a' : 'o'} con trazabilidad de autor y fecha`,
    ],
    requirements,
  };
}

// ---------------------------------------------------------------------------
// Estadísticas del catálogo (para la pantalla de configuración y la API)
// ---------------------------------------------------------------------------

export function getCatalogStats() {
  const useCaseTemplates = ALL_MODULES.reduce((acc, m) => acc + m.useCases.length, 0);
  const requirementTemplates = ALL_MODULES.reduce(
    (acc, m) => acc + m.useCases.reduce((a, uc) => a + uc.requirements.length, 0),
    0
  );
  const scenarioTemplates = ALL_MODULES.reduce(
    (acc, m) =>
      acc + m.useCases.reduce((a, uc) => a + uc.requirements.reduce((b, r) => b + r.scenarios.length, 0), 0),
    0
  );
  const keywordRules = ALL_MODULES.reduce((acc, m) => acc + m.keywords.length, 0);

  return {
    modules: ALL_MODULES.length,
    useCaseTemplates,
    requirementTemplates,
    scenarioTemplates,
    nonFunctionalTemplates: NON_FUNCTIONAL_TEMPLATES.length,
    actors: ACTOR_CATALOG.length,
    entities: ENTITY_CATALOG.length,
    keywordRules,
  };
}
