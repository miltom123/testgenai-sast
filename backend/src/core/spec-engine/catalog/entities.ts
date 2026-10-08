// ==========================================================================
// Catálogo Determinista: Entidades de Negocio
// Cada entidad detectada genera un caso de uso CRUD con requisitos y
// escenarios parametrizados por sus campos (longitudes, rangos, unicidad).
// ==========================================================================

import { EntityDefinition, EntityField } from '../spec-types';

// Helpers compactos para declarar campos
const text = (name: string, min: number, max: number, required = true, unique = false): EntityField => ({
  name,
  type: 'text',
  required,
  unique,
  min,
  max,
  unit: 'caracteres',
});
const integer = (name: string, min: number, max: number, unit?: string, required = true): EntityField => ({
  name,
  type: 'integer',
  required,
  min,
  max,
  unit,
});
const decimal = (name: string, min: number, max: number, unit?: string, required = true): EntityField => ({
  name,
  type: 'decimal',
  required,
  min,
  max,
  unit,
});
const email = (name = 'correo electrónico', required = true, unique = true): EntityField => ({
  name,
  type: 'email',
  required,
  unique,
  example: 'contacto@empresa.com',
});
const phone = (name = 'teléfono', required = false): EntityField => ({
  name,
  type: 'phone',
  required,
  min: 7,
  max: 15,
  unit: 'dígitos',
  example: '987654321',
});
const date = (name: string, required = true): EntityField => ({ name, type: 'date', required });
const enumField = (name: string, options: string[], required = true): EntityField => ({
  name,
  type: 'enum',
  required,
  options,
});
const code = (name: string, min: number, max: number): EntityField => ({
  name,
  type: 'text',
  required: true,
  unique: true,
  min,
  max,
  unit: 'caracteres',
});

const e = (
  key: string,
  singular: string,
  plural: string,
  gender: 'm' | 'f',
  keywords: string[],
  fields: EntityField[]
): EntityDefinition => ({ key, singular, plural, gender, keywords, fields });

export const ENTITY_CATALOG: EntityDefinition[] = [
  e(
    'producto',
    'producto',
    'productos',
    'm',
    ['producto', 'productos', 'articulo', 'articulos', 'item', 'items', 'mercaderia', 'mercancia'],
    [
      text('nombre', 2, 120),
      code('código SKU', 3, 30),
      decimal('precio', 0.01, 999999.99, 'USD'),
      integer('stock', 0, 1000000, 'unidades'),
      enumField('estado', ['activo', 'inactivo']),
    ]
  ),
  e(
    'categoria',
    'categoría',
    'categorías',
    'f',
    ['categoria', 'categorias', 'rubro', 'rubros', 'familia de productos'],
    [text('nombre', 2, 80, true, true), text('descripción', 0, 300, false)]
  ),
  e(
    'cliente',
    'cliente',
    'clientes',
    'm',
    ['cliente', 'clientes', 'comprador', 'compradores'],
    [
      text('nombre completo', 2, 120),
      code('documento de identidad', 8, 11),
      email(),
      phone(),
      text('dirección', 5, 200, false),
    ]
  ),
  e(
    'proveedor',
    'proveedor',
    'proveedores',
    'm',
    ['proveedor', 'proveedores'],
    [
      text('razón social', 2, 150),
      code('RUC', 11, 11),
      email('correo de contacto'),
      phone(),
      enumField('condición de pago', ['contado', 'crédito 30 días', 'crédito 60 días']),
    ]
  ),
  e(
    'pedido',
    'pedido',
    'pedidos',
    'm',
    ['pedido', 'pedidos', 'orden de venta', 'ordenes de venta'],
    [
      code('número de pedido', 6, 12),
      date('fecha'),
      decimal('total', 0.01, 1000000, 'USD'),
      enumField('estado', ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']),
    ]
  ),
  e(
    'factura',
    'factura',
    'facturas',
    'f',
    ['factura', 'facturas', 'boleta', 'boletas', 'comprobante', 'comprobantes', 'facturacion'],
    [
      code('serie y número', 6, 15),
      date('fecha de emisión'),
      decimal('monto total', 0.01, 10000000, 'USD'),
      decimal('impuesto', 0, 1000000, 'USD'),
    ]
  ),
  e(
    'cotizacion',
    'cotización',
    'cotizaciones',
    'f',
    ['cotizacion', 'cotizaciones', 'presupuesto de venta', 'propuesta comercial'],
    [
      code('número de cotización', 6, 12),
      date('fecha de vigencia'),
      decimal('monto', 0.01, 10000000, 'USD'),
      enumField('estado', ['borrador', 'enviada', 'aceptada', 'rechazada']),
    ]
  ),
  e(
    'empleado',
    'empleado',
    'empleados',
    'm',
    ['empleado', 'empleados', 'trabajador', 'trabajadores', 'colaborador', 'colaboradores'],
    [
      text('nombre completo', 2, 120),
      code('documento de identidad', 8, 11),
      email('correo corporativo'),
      date('fecha de ingreso'),
      decimal('salario', 1, 100000, 'USD'),
    ]
  ),
  e(
    'paciente',
    'paciente',
    'pacientes',
    'm',
    ['paciente', 'pacientes'],
    [
      text('nombre completo', 2, 120),
      code('documento de identidad', 8, 11),
      date('fecha de nacimiento'),
      integer('edad', 0, 120, 'años'),
      phone('teléfono de contacto', true),
      enumField('grupo sanguíneo', ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'], false),
    ]
  ),
  e(
    'medico',
    'médico',
    'médicos',
    'm',
    ['medico', 'medicos', 'doctor', 'doctores'],
    [
      text('nombre completo', 2, 120),
      code('número de colegiatura', 4, 10),
      text('especialidad', 3, 80),
      email('correo profesional'),
    ]
  ),
  e(
    'cita',
    'cita',
    'citas',
    'f',
    ['cita', 'citas', 'cita medica', 'citas medicas'],
    [
      date('fecha y hora'),
      integer('duración', 15, 180, 'minutos'),
      enumField('estado', ['programada', 'confirmada', 'atendida', 'cancelada']),
      text('motivo', 5, 300),
    ]
  ),
  e(
    'reserva',
    'reserva',
    'reservas',
    'f',
    ['reserva', 'reservas', 'reservacion', 'reservaciones'],
    [
      date('fecha de inicio'),
      date('fecha de fin'),
      integer('cantidad de personas', 1, 50, 'personas'),
      enumField('estado', ['pendiente', 'confirmada', 'cancelada', 'completada']),
    ]
  ),
  e(
    'habitacion',
    'habitación',
    'habitaciones',
    'f',
    ['habitacion', 'habitaciones', 'cuarto', 'cuartos', 'suite', 'suites'],
    [
      code('número de habitación', 1, 6),
      enumField('tipo', ['simple', 'doble', 'matrimonial', 'suite']),
      decimal('tarifa por noche', 1, 10000, 'USD'),
      integer('capacidad', 1, 10, 'personas'),
    ]
  ),
  e(
    'curso',
    'curso',
    'cursos',
    'm',
    ['curso', 'cursos', 'asignatura', 'asignaturas', 'materia', 'materias', 'taller', 'talleres'],
    [
      text('nombre', 3, 120),
      code('código de curso', 3, 15),
      integer('créditos', 1, 10, 'créditos'),
      integer('cupos', 1, 200, 'cupos'),
    ]
  ),
  e(
    'estudiante',
    'estudiante',
    'estudiantes',
    'm',
    ['estudiante', 'estudiantes', 'alumno', 'alumnos', 'alumna', 'alumnas'],
    [
      text('nombre completo', 2, 120),
      code('código de estudiante', 6, 12),
      email('correo institucional'),
      date('fecha de nacimiento'),
    ]
  ),
  e(
    'docente',
    'docente',
    'docentes',
    'm',
    ['docente', 'docentes', 'profesor', 'profesores'],
    [
      text('nombre completo', 2, 120),
      code('documento de identidad', 8, 11),
      text('especialidad', 3, 80),
      email('correo institucional'),
    ]
  ),
  e(
    'matricula',
    'matrícula',
    'matrículas',
    'f',
    ['matricula', 'matriculas', 'inscripcion', 'inscripciones'],
    [
      date('fecha de matrícula'),
      enumField('periodo académico', ['2026-I', '2026-II']),
      enumField('estado', ['activa', 'retirada', 'finalizada']),
    ]
  ),
  e(
    'vehiculo',
    'vehículo',
    'vehículos',
    'm',
    ['vehiculo', 'vehiculos', 'auto', 'autos', 'camion', 'camiones', 'moto', 'motos', 'flota'],
    [
      code('placa', 6, 8),
      text('marca', 2, 50),
      text('modelo', 1, 50),
      integer('año de fabricación', 1990, 2030),
      integer('capacidad de carga', 1, 50000, 'kg'),
    ]
  ),
  e(
    'ruta',
    'ruta',
    'rutas',
    'f',
    ['ruta', 'rutas', 'recorrido', 'recorridos', 'trayecto'],
    [
      text('nombre', 3, 100),
      text('origen', 3, 150),
      text('destino', 3, 150),
      decimal('distancia', 0.1, 10000, 'km'),
    ]
  ),
  e(
    'envio',
    'envío',
    'envíos',
    'm',
    ['envio', 'envios', 'despacho', 'despachos', 'entrega', 'entregas'],
    [
      code('número de guía', 8, 20),
      text('dirección de entrega', 5, 200),
      enumField('estado', ['pendiente', 'en camino', 'entregado', 'devuelto']),
      decimal('peso', 0.1, 1000, 'kg'),
    ]
  ),
  e(
    'ticket',
    'ticket',
    'tickets',
    'm',
    ['ticket', 'tickets', 'incidencia', 'incidencias', 'reclamo', 'reclamos', 'queja', 'quejas'],
    [
      code('número de ticket', 6, 12),
      text('asunto', 5, 150),
      text('descripción', 20, 2000),
      enumField('prioridad', ['baja', 'media', 'alta', 'crítica']),
      enumField('estado', ['abierto', 'en proceso', 'resuelto', 'cerrado']),
    ]
  ),
  e(
    'tarea',
    'tarea',
    'tareas',
    'f',
    ['tarea', 'tareas', 'actividad', 'actividades', 'pendiente', 'pendientes'],
    [
      text('título', 3, 150),
      text('descripción', 0, 2000, false),
      date('fecha límite'),
      enumField('estado', ['por hacer', 'en progreso', 'hecha']),
      enumField('prioridad', ['baja', 'media', 'alta']),
    ]
  ),
  e(
    'proyecto',
    'proyecto',
    'proyectos',
    'm',
    ['proyectos de clientes', 'proyectos internos', 'portafolio de proyectos'],
    [
      text('nombre', 3, 150),
      date('fecha de inicio'),
      date('fecha de fin'),
      decimal('presupuesto', 0, 100000000, 'USD'),
      enumField('estado', ['planificado', 'en ejecución', 'cerrado']),
    ]
  ),
  e(
    'evento',
    'evento',
    'eventos',
    'm',
    [
      'evento',
      'eventos',
      'conferencia',
      'conferencias',
      'concierto',
      'conciertos',
      'seminario',
      'seminarios',
    ],
    [
      text('nombre', 3, 150),
      date('fecha y hora'),
      text('lugar', 3, 150),
      integer('aforo', 1, 100000, 'personas'),
    ]
  ),
  e(
    'entrada',
    'entrada',
    'entradas',
    'f',
    ['entradas', 'boleto', 'boletos', 'tickets de evento', 'ticket de evento'],
    [
      code('código de entrada', 8, 20),
      enumField('tipo', ['general', 'vip', 'preferencial']),
      decimal('precio', 0, 10000, 'USD'),
      enumField('estado', ['disponible', 'vendida', 'usada', 'anulada']),
    ]
  ),
  e(
    'mesa',
    'mesa',
    'mesas',
    'f',
    ['mesa', 'mesas'],
    [
      code('número de mesa', 1, 4),
      integer('capacidad', 1, 20, 'personas'),
      enumField('estado', ['libre', 'ocupada', 'reservada']),
    ]
  ),
  e(
    'plato',
    'plato',
    'platos',
    'm',
    ['plato', 'platos', 'menu', 'menus', 'carta', 'bebida', 'bebidas', 'receta de cocina'],
    [
      text('nombre', 2, 100),
      text('descripción', 0, 300, false),
      decimal('precio', 0.5, 5000, 'USD'),
      enumField('categoría', ['entrada', 'fondo', 'postre', 'bebida']),
      enumField('disponibilidad', ['disponible', 'agotado']),
    ]
  ),
  e(
    'libro',
    'libro',
    'libros',
    'm',
    ['libro', 'libros', 'biblioteca', 'ejemplar', 'ejemplares'],
    [
      text('título', 1, 200),
      text('autor', 2, 120),
      code('ISBN', 10, 13),
      integer('año de publicación', 1450, 2030),
      integer('ejemplares disponibles', 0, 1000, 'unidades'),
    ]
  ),
  e(
    'prestamo',
    'préstamo',
    'préstamos',
    'm',
    ['prestamo', 'prestamos'],
    [
      date('fecha de préstamo'),
      date('fecha de devolución'),
      enumField('estado', ['vigente', 'devuelto', 'vencido']),
    ]
  ),
  e(
    'sucursal',
    'sucursal',
    'sucursales',
    'f',
    [
      'sucursal',
      'sucursales',
      'sede',
      'sedes',
      'local',
      'locales',
      'tienda',
      'tiendas',
      'agencia',
      'agencias',
    ],
    [
      text('nombre', 2, 100, true, true),
      text('dirección', 5, 200),
      phone(),
      enumField('estado', ['activa', 'inactiva']),
    ]
  ),
  e(
    'almacen',
    'almacén',
    'almacenes',
    'm',
    ['almacen', 'almacenes', 'bodega', 'bodegas', 'deposito', 'depositos'],
    [
      text('nombre', 2, 100, true, true),
      text('ubicación', 5, 200),
      integer('capacidad', 1, 1000000, 'unidades'),
    ]
  ),
  e(
    'contrato',
    'contrato',
    'contratos',
    'm',
    ['contrato', 'contratos', 'convenio', 'convenios'],
    [
      code('número de contrato', 4, 20),
      date('fecha de inicio'),
      date('fecha de fin'),
      decimal('monto', 0, 100000000, 'USD'),
      enumField('estado', ['vigente', 'vencido', 'rescindido']),
    ]
  ),
  e(
    'pago',
    'pago',
    'pagos',
    'm',
    ['pago', 'pagos', 'cobro', 'cobros', 'abono', 'abonos'],
    [
      decimal('monto', 0.01, 1000000, 'USD'),
      date('fecha de pago'),
      enumField('medio de pago', ['efectivo', 'tarjeta', 'transferencia', 'billetera digital']),
      code('número de operación', 6, 30),
    ]
  ),
  e(
    'gasto',
    'gasto',
    'gastos',
    'm',
    ['gasto', 'gastos', 'egreso', 'egresos'],
    [
      text('concepto', 3, 150),
      decimal('monto', 0.01, 1000000, 'USD'),
      date('fecha'),
      enumField('categoría', ['operativo', 'administrativo', 'logístico', 'otros']),
    ]
  ),
  e(
    'ingreso',
    'ingreso',
    'ingresos',
    'm',
    ['ingresos', 'ventas registradas', 'recaudacion'],
    [text('concepto', 3, 150), decimal('monto', 0.01, 1000000, 'USD'), date('fecha')]
  ),
  e(
    'presupuesto',
    'presupuesto',
    'presupuestos',
    'm',
    ['presupuesto', 'presupuestos', 'presupuestal'],
    [
      text('nombre', 3, 120),
      decimal('monto asignado', 1, 1000000000, 'USD'),
      enumField('periodo', ['mensual', 'trimestral', 'anual']),
    ]
  ),
  e(
    'campania',
    'campaña',
    'campañas',
    'f',
    [
      'campana',
      'campanas',
      'campaña',
      'campañas',
      'promocion',
      'promociones',
      'descuento',
      'descuentos',
      'cupon',
      'cupones',
    ],
    [
      text('nombre', 3, 120),
      date('fecha de inicio'),
      date('fecha de fin'),
      integer('porcentaje de descuento', 1, 100, '%'),
    ]
  ),
  e(
    'lead',
    'prospecto',
    'prospectos',
    'm',
    ['lead', 'leads', 'prospecto', 'prospectos', 'oportunidad', 'oportunidades', 'crm'],
    [
      text('nombre', 2, 120),
      email(),
      phone(),
      enumField('etapa', ['nuevo', 'contactado', 'calificado', 'ganado', 'perdido']),
      text('origen', 2, 60, false),
    ]
  ),
  e(
    'encuesta',
    'encuesta',
    'encuestas',
    'f',
    ['encuesta', 'encuestas', 'cuestionario', 'cuestionarios', 'formulario', 'formularios'],
    [
      text('título', 3, 150),
      integer('cantidad de preguntas', 1, 100, 'preguntas'),
      date('fecha de cierre'),
      enumField('estado', ['borrador', 'publicada', 'cerrada']),
    ]
  ),
  e(
    'noticia',
    'noticia',
    'noticias',
    'f',
    ['noticia', 'noticias', 'publicacion', 'publicaciones', 'blog', 'post', 'posts', 'articulo de blog'],
    [
      text('título', 5, 200),
      text('contenido', 50, 20000),
      date('fecha de publicación'),
      enumField('estado', ['borrador', 'publicada', 'archivada']),
    ]
  ),
  e(
    'comentario',
    'comentario',
    'comentarios',
    'm',
    [
      'comentario',
      'comentarios',
      'resena',
      'resenas',
      'reseña',
      'reseñas',
      'valoracion',
      'valoraciones',
      'calificacion de producto',
    ],
    [text('contenido', 1, 1000), integer('puntuación', 1, 5, 'estrellas', false), date('fecha')]
  ),
  e(
    'mensaje',
    'mensaje',
    'mensajes',
    'm',
    ['mensaje', 'mensajes', 'chat', 'mensajeria', 'conversacion', 'conversaciones'],
    [text('contenido', 1, 2000), date('fecha y hora'), enumField('estado', ['enviado', 'entregado', 'leído'])]
  ),
  e(
    'documento',
    'documento',
    'documentos',
    'm',
    ['documento', 'documentos', 'expediente', 'expedientes', 'archivo', 'archivos'],
    [
      text('nombre', 1, 200),
      enumField('tipo', ['PDF', 'imagen', 'hoja de cálculo', 'texto']),
      integer('tamaño', 1, 10240, 'KB'),
      date('fecha de carga'),
    ]
  ),
  e(
    'tramite',
    'trámite',
    'trámites',
    'm',
    ['tramite', 'tramites', 'solicitud', 'solicitudes', 'requerimiento', 'requerimientos'],
    [
      code('número de expediente', 6, 20),
      text('asunto', 5, 200),
      date('fecha de registro'),
      enumField('estado', ['recibido', 'en evaluación', 'aprobado', 'rechazado']),
    ]
  ),
  e(
    'membresia',
    'membresía',
    'membresías',
    'f',
    ['membresia', 'membresias', 'suscripcion', 'suscripciones', 'plan', 'planes'],
    [
      text('nombre del plan', 2, 80),
      decimal('precio', 0, 10000, 'USD'),
      integer('duración', 1, 36, 'meses'),
      enumField('estado', ['activa', 'vencida', 'cancelada']),
    ]
  ),
  e(
    'mascota',
    'mascota',
    'mascotas',
    'f',
    ['mascota', 'mascotas', 'animal', 'animales', 'veterinaria'],
    [
      text('nombre', 1, 60),
      enumField('especie', ['perro', 'gato', 'ave', 'otro']),
      text('raza', 2, 60, false),
      date('fecha de nacimiento', false),
      decimal('peso', 0.1, 200, 'kg'),
    ]
  ),
  e(
    'inmueble',
    'inmueble',
    'inmuebles',
    'm',
    [
      'inmueble',
      'inmuebles',
      'propiedad',
      'propiedades',
      'departamento en alquiler',
      'casa en venta',
      'inmobiliaria',
      'alquiler',
    ],
    [
      text('dirección', 5, 200),
      decimal('área', 10, 100000, 'm²'),
      decimal('precio', 1, 100000000, 'USD'),
      enumField('operación', ['venta', 'alquiler']),
      enumField('estado', ['disponible', 'reservado', 'vendido']),
    ]
  ),
  e(
    'area',
    'área',
    'áreas',
    'f',
    ['area', 'areas', 'departamento de la empresa', 'departamentos', 'unidad organizativa'],
    [text('nombre', 2, 100, true, true), text('responsable', 2, 120, false)]
  ),
  e(
    'cargo',
    'cargo',
    'cargos',
    'm',
    ['cargo', 'cargos', 'puesto', 'puestos'],
    [text('nombre', 2, 100, true, true), decimal('salario base', 1, 100000, 'USD')]
  ),
  e(
    'turno',
    'turno',
    'turnos',
    'm',
    ['turno', 'turnos', 'horario de trabajo', 'horarios de trabajo'],
    [
      text('nombre', 2, 60),
      text('hora de inicio', 5, 5),
      text('hora de fin', 5, 5),
      integer('duración', 1, 12, 'horas'),
    ]
  ),
  e(
    'asistencia',
    'asistencia',
    'asistencias',
    'f',
    ['asistencia', 'asistencias', 'marcacion', 'marcaciones', 'control de asistencia'],
    [
      date('fecha'),
      text('hora de entrada', 5, 5),
      text('hora de salida', 5, 5, false),
      enumField('estado', ['presente', 'tardanza', 'falta', 'justificado']),
    ]
  ),
  e(
    'examen',
    'examen',
    'exámenes',
    'm',
    ['examen', 'examenes', 'evaluacion', 'evaluaciones', 'prueba de laboratorio', 'analisis clinico'],
    [
      text('nombre', 3, 120),
      date('fecha'),
      decimal('resultado', 0, 100000, undefined, false),
      enumField('estado', ['pendiente', 'en proceso', 'completado']),
    ]
  ),
  e(
    'receta',
    'receta',
    'recetas',
    'f',
    ['receta', 'recetas', 'prescripcion', 'prescripciones', 'medicamento', 'medicamentos'],
    [
      text('medicamento', 2, 120),
      text('dosis', 1, 80),
      integer('duración del tratamiento', 1, 365, 'días'),
      date('fecha de emisión'),
    ]
  ),
  e(
    'socio',
    'socio',
    'socios',
    'm',
    ['socio', 'socios', 'afiliado', 'afiliados', 'miembro', 'miembros'],
    [
      text('nombre completo', 2, 120),
      code('documento de identidad', 8, 11),
      email(),
      date('fecha de afiliación'),
      enumField('estado', ['activo', 'suspendido', 'retirado']),
    ]
  ),
  e(
    'equipo',
    'equipo',
    'equipos',
    'm',
    [
      'equipo',
      'equipos',
      'maquina',
      'maquinas',
      'maquinaria',
      'activo fijo',
      'activos fijos',
      'herramienta',
      'herramientas',
    ],
    [
      text('nombre', 2, 120),
      code('código patrimonial', 4, 20),
      text('marca', 2, 60, false),
      date('fecha de adquisición'),
      enumField('estado', ['operativo', 'en mantenimiento', 'dado de baja']),
    ]
  ),
  e(
    'mantenimiento',
    'mantenimiento',
    'mantenimientos',
    'm',
    ['mantenimiento', 'mantenimientos', 'orden de trabajo', 'ordenes de trabajo'],
    [
      date('fecha programada'),
      enumField('tipo', ['preventivo', 'correctivo']),
      text('descripción', 10, 1000),
      decimal('costo', 0, 1000000, 'USD', false),
    ]
  ),
];

export function findEntity(key: string): EntityDefinition | undefined {
  return ENTITY_CATALOG.find((en) => en.key === key);
}
