// ==========================================================================
// Catálogo Determinista: Módulos de Negocio por Industria
// Comercio, inventario, reservas, logística, soporte, finanzas, RR. HH.,
// educación, salud y restaurantes.
// Placeholders: {ACTOR} {ACTOR_CAP} {ADMIN} {PROJECT}
// ==========================================================================

import { DomainModule } from '../spec-types';

export const BUSINESS_MODULES: DomainModule[] = [
  // ──────────────────────────────────────────────────────────────────
  // CATÁLOGO DE PRODUCTOS
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'catalog_products',
    name: 'Catálogo de Productos',
    icon: '🛍️',
    description:
      'Publicación, consulta y mantenimiento de productos con precios, categorías y disponibilidad.',
    keywords: [
      { term: 'producto', weight: 2 },
      { term: 'productos', weight: 3 },
      { term: 'catalogo', weight: 3 },
      { term: 'catalogo de productos', weight: 3 },
      { term: 'articulo', weight: 1 },
      { term: 'articulos', weight: 2 },
      { term: 'precio', weight: 2 },
      { term: 'precios', weight: 2 },
      { term: 'categoria', weight: 1 },
      { term: 'categorias', weight: 2 },
      { term: 'marca', weight: 1 },
      { term: 'sku', weight: 3 },
      { term: 'tienda', weight: 2 },
      { term: 'tienda virtual', weight: 3 },
      { term: 'ecommerce', weight: 3 },
      { term: 'e commerce', weight: 3 },
      { term: 'venta', weight: 1 },
      { term: 'ventas', weight: 1 },
    ],
    preferredActors: ['cliente', 'usuario', 'vendedor'],
    secondaryActors: ['administrador', 'vendedor'],
    coveredEntities: ['producto', 'categoria'],
    implies: ['authentication', 'search_filter'],
    templateCategory: 'crud',
    useCases: [
      {
        key: 'catalog_browse',
        name: 'Consultar catálogo de productos',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite al {ACTOR} explorar el catálogo, filtrar por categoría y precio y revisar el detalle de cada producto.',
        preconditions: ['Existen productos publicados en el catálogo'],
        mainFlow: [
          'El {ACTOR} accede al catálogo',
          'El sistema muestra los productos activos con imagen, nombre, precio y disponibilidad',
          'El {ACTOR} aplica filtros por categoría, rango de precio o disponibilidad',
          'El {ACTOR} abre el detalle de un producto y revisa su descripción completa',
        ],
        alternativeFlows: [
          {
            name: 'Catálogo sin productos en la categoría',
            condition: 'La categoría seleccionada no tiene productos activos',
            steps: [
              'El sistema muestra "No hay productos disponibles en esta categoría"',
              'Sugiere limpiar los filtros',
            ],
          },
        ],
        exceptionFlows: [
          {
            name: 'Producto despublicado',
            trigger: 'El {ACTOR} abre un enlace a un producto inactivo',
            steps: ['El sistema muestra "Producto no disponible" y ofrece productos relacionados'],
            expectedError: 'Producto no disponible',
          },
        ],
        postconditions: ['El {ACTOR} conoce precio y disponibilidad vigentes del producto'],
        requirements: [
          {
            key: 'catalog_list_req',
            title: 'Listado y detalle de productos publicados',
            description:
              'El sistema debe mostrar al {ACTOR} únicamente los productos activos, paginados de 20 en 20, con nombre, precio con dos decimales, imagen principal y disponibilidad, y permitir abrir el detalle completo de cada uno.',
            priority: 'high',
            templateCategory: 'crud',
            variables: [
              { name: 'Productos por página', type: 'integer', min: 1, max: 20, unit: 'productos' },
            ],
            scenarios: [
              {
                name: 'Listado de productos activos',
                type: 'positive',
                given: ['existen 25 productos activos y 3 inactivos'],
                when: ['el {ACTOR} abre el catálogo'],
                then: [
                  'el sistema muestra 20 productos activos en la primera página',
                  'ningún producto inactivo aparece en el listado',
                ],
              },
              {
                name: 'Detalle completo de un producto',
                type: 'positive',
                given: ['existe el producto "Laptop Pro 14" con precio 3499.90 y stock 5'],
                when: ['el {ACTOR} abre su detalle'],
                then: [
                  'el sistema muestra nombre, descripción, precio "3499.90", imágenes y disponibilidad "5 unidades"',
                ],
              },
              {
                name: 'Categoría sin productos',
                type: 'alternative',
                given: ['la categoría "Accesorios" no tiene productos activos'],
                when: ['el {ACTOR} filtra por "Accesorios"'],
                then: ['el sistema muestra "No hay productos disponibles en esta categoría"'],
              },
            ],
          },
          {
            key: 'catalog_filter_req',
            title: 'Filtrado de productos por categoría y rango de precio',
            description:
              'El sistema debe permitir filtrar el catálogo por una o varias categorías y por un rango de precio mínimo y máximo (0.01 a 999999.99), combinando los filtros y mostrando el total de coincidencias.',
            priority: 'medium',
            templateCategory: 'search_filter',
            variables: [
              { name: 'Precio máximo del filtro', type: 'decimal', min: 0.01, max: 999999.99, unit: 'USD' },
            ],
            scenarios: [
              {
                name: 'Filtro combinado de categoría y precio',
                type: 'positive',
                given: ['existen 4 productos de "Tecnología" con precio entre 100 y 500'],
                when: ['el {ACTOR} filtra por categoría "Tecnología" y precio de 100 a 500'],
                then: ['el sistema muestra exactamente esos 4 productos', 'indica "4 resultados"'],
              },
              {
                name: 'Precio mínimo mayor que el máximo',
                type: 'negative',
                given: ['el {ACTOR} se encuentra en el catálogo'],
                when: ['ingresa precio mínimo 500 y máximo 100'],
                then: [
                  'el sistema muestra "El precio mínimo no puede superar al máximo"',
                  'no aplica el filtro',
                ],
              },
              {
                name: 'Producto con precio exactamente en el límite del filtro',
                type: 'boundary',
                given: ['existe un producto con precio 500.00'],
                when: ['el {ACTOR} filtra por precio de 100 a 500'],
                then: ['el producto de 500.00 aparece en los resultados'],
              },
            ],
          },
        ],
      },
      {
        key: 'catalog_admin',
        name: 'Administrar productos del catálogo',
        actor: 'secondary',
        priority: 'high',
        description:
          'Permite al {ADMIN} crear, actualizar, publicar y despublicar productos con control de precio y stock.',
        preconditions: ['El {ADMIN} tiene permisos de gestión de catálogo'],
        mainFlow: [
          'El {ADMIN} accede a la administración de productos',
          'Registra un producto con nombre, SKU único, categoría, precio y stock inicial',
          'El sistema valida unicidad del SKU y que el precio sea mayor a cero',
          'El sistema guarda el producto en estado activo y lo publica en el catálogo',
        ],
        alternativeFlows: [
          {
            name: 'Despublicar producto',
            condition: 'El {ADMIN} marca el producto como inactivo',
            steps: ['El sistema lo oculta del catálogo', 'Conserva su historial de ventas'],
          },
        ],
        exceptionFlows: [
          {
            name: 'SKU duplicado',
            trigger: 'Ya existe un producto con el mismo SKU',
            steps: ['El sistema rechaza el registro'],
            expectedError: 'El SKU ya está registrado',
          },
        ],
        postconditions: ['El producto queda disponible o retirado del catálogo según su estado'],
        requirements: [
          {
            key: 'catalog_manage_req',
            title: 'Registro y mantenimiento de productos',
            description:
              'El sistema debe permitir al {ADMIN} registrar productos con nombre (2 a 120 caracteres), SKU único, categoría, precio entre 0.01 y 999999.99 y stock entero mayor o igual a cero, así como editar y despublicar productos existentes.',
            priority: 'high',
            templateCategory: 'crud',
            variables: [
              { name: 'Precio del producto', type: 'decimal', min: 0.01, max: 999999.99, unit: 'USD' },
            ],
            scenarios: [
              {
                name: 'Registro exitoso de producto',
                type: 'positive',
                given: ['el {ADMIN} se encuentra en el formulario de producto'],
                when: [
                  'ingresa nombre "Mouse inalámbrico", SKU "MOU-001", categoría "Accesorios", precio 59.90 y stock 100',
                  'guarda el producto',
                ],
                then: [
                  'el sistema crea el producto en estado activo',
                  'el producto aparece en el catálogo público',
                ],
              },
              {
                name: 'Rechazo de precio igual a cero',
                type: 'validation',
                given: ['el {ADMIN} se encuentra en el formulario de producto'],
                when: ['ingresa precio 0.00 y guarda'],
                then: ['el sistema muestra "El precio debe ser mayor a 0.00"', 'no guarda el producto'],
              },
              {
                name: 'Rechazo de SKU duplicado',
                type: 'negative',
                given: ['existe un producto con SKU "MOU-001"'],
                when: ['el {ADMIN} intenta registrar otro producto con SKU "MOU-001"'],
                then: ['el sistema rechaza el registro con "El SKU ya está registrado"'],
              },
              {
                name: 'Despublicación conserva historial',
                type: 'alternative',
                given: ['el producto "Mouse inalámbrico" tiene ventas registradas'],
                when: ['el {ADMIN} lo marca como inactivo'],
                then: [
                  'el producto desaparece del catálogo público',
                  'sus ventas históricas siguen disponibles en reportes',
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // CARRITO DE COMPRAS
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'shopping_cart',
    name: 'Carrito de Compras',
    icon: '🛒',
    description:
      'Agregar, modificar y eliminar productos del carrito con cálculo de totales y validación de stock.',
    keywords: [
      { term: 'carrito', weight: 3 },
      { term: 'carrito de compras', weight: 3 },
      { term: 'cesta', weight: 3 },
      { term: 'agregar al carrito', weight: 3 },
      { term: 'compra en linea', weight: 2 },
      { term: 'comprar', weight: 1 },
      { term: 'compras', weight: 1 },
      { term: 'tienda virtual', weight: 2 },
      { term: 'ecommerce', weight: 2 },
    ],
    preferredActors: ['cliente', 'usuario'],
    implies: ['catalog_products', 'checkout_payments'],
    templateCategory: 'form_validation',
    useCases: [
      {
        key: 'cart_manage',
        name: 'Gestionar el carrito de compras',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite al {ACTOR} agregar productos, ajustar cantidades y revisar el total antes de pagar.',
        preconditions: ['Existen productos activos con stock disponible'],
        mainFlow: [
          'El {ACTOR} selecciona "Agregar al carrito" en un producto',
          'El sistema valida el stock disponible y agrega una unidad',
          'El {ACTOR} ajusta la cantidad o elimina productos',
          'El sistema recalcula subtotal, impuestos y total en cada cambio',
          'El {ACTOR} continúa al proceso de pago',
        ],
        alternativeFlows: [
          {
            name: 'Carrito persistente',
            condition: 'El {ACTOR} cierra sesión con productos en el carrito',
            steps: ['El sistema conserva el carrito', 'Lo restaura al iniciar sesión nuevamente'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Stock insuficiente',
            trigger: 'La cantidad solicitada supera el stock',
            steps: ['El sistema limita la cantidad al stock disponible y lo informa'],
            expectedError: 'Stock insuficiente',
          },
        ],
        postconditions: ['El carrito refleja productos, cantidades y total actualizados'],
        requirements: [
          {
            key: 'cart_items_req',
            title: 'Agregar, modificar y eliminar productos del carrito',
            description:
              'El sistema debe permitir al {ACTOR} agregar productos al carrito con cantidades de 1 a 99 unidades sin superar el stock disponible, actualizar o eliminar líneas y recalcular el total con impuestos en cada cambio.',
            priority: 'high',
            templateCategory: 'form_validation',
            variables: [
              {
                name: 'Cantidad por producto en el carrito',
                type: 'integer',
                min: 1,
                max: 99,
                unit: 'unidades',
              },
            ],
            scenarios: [
              {
                name: 'Agregar producto con stock disponible',
                type: 'positive',
                given: [
                  'el producto "Mouse inalámbrico" cuesta 59.90 y tiene stock 10',
                  'el carrito del {ACTOR} está vacío',
                ],
                when: ['el {ACTOR} agrega el producto al carrito'],
                then: ['el carrito muestra 1 unidad de "Mouse inalámbrico"', 'el subtotal es 59.90'],
              },
              {
                name: 'Cantidad en el límite máximo de 99 unidades',
                type: 'boundary',
                given: ['el producto tiene stock 150'],
                when: ['el {ACTOR} establece la cantidad en 99'],
                then: ['el sistema acepta la cantidad', 'recalcula el total multiplicando por 99'],
              },
              {
                name: 'Rechazo por stock insuficiente',
                type: 'negative',
                given: ['el producto tiene stock 3'],
                when: ['el {ACTOR} intenta establecer la cantidad en 5'],
                then: [
                  'el sistema limita la cantidad a 3',
                  'muestra "Stock insuficiente: solo quedan 3 unidades"',
                ],
              },
              {
                name: 'Eliminar producto recalcula el total',
                type: 'alternative',
                given: ['el carrito contiene dos productos con total 159.80'],
                when: ['el {ACTOR} elimina el producto de 59.90'],
                then: ['el carrito muestra un solo producto', 'el total es 99.90'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // PEDIDOS Y PAGOS
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'checkout_payments',
    name: 'Pedidos y Pagos',
    icon: '💳',
    description:
      'Confirmación de pedidos, procesamiento de pagos con tarjeta u otros medios y consulta del historial.',
    keywords: [
      { term: 'pago', weight: 2 },
      { term: 'pagos', weight: 3 },
      { term: 'pagar', weight: 2 },
      { term: 'tarjeta', weight: 2 },
      { term: 'tarjeta de credito', weight: 3 },
      { term: 'pasarela', weight: 3 },
      { term: 'pasarela de pago', weight: 3 },
      { term: 'checkout', weight: 3 },
      { term: 'pedido', weight: 2 },
      { term: 'pedidos', weight: 3 },
      { term: 'orden de compra', weight: 2 },
      { term: 'ordenes', weight: 1 },
      { term: 'cobro', weight: 2 },
      { term: 'cobros', weight: 2 },
      { term: 'transaccion', weight: 2 },
      { term: 'comprobante', weight: 2 },
      { term: 'boleta', weight: 2 },
      { term: 'factura', weight: 1 },
      { term: 'yape', weight: 3 },
      { term: 'plin', weight: 3 },
      { term: 'paypal', weight: 3 },
      { term: 'stripe', weight: 3 },
    ],
    preferredActors: ['cliente', 'usuario', 'cajero'],
    coveredEntities: ['pedido', 'pago'],
    implies: ['authentication', 'notifications'],
    templateCategory: 'form_validation',
    useCases: [
      {
        key: 'checkout_order',
        name: 'Realizar pedido y pago',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite al {ACTOR} confirmar su pedido, elegir el medio de pago y recibir el comprobante.',
        preconditions: [
          'El {ACTOR} tiene sesión iniciada',
          'El carrito contiene al menos un producto con stock',
        ],
        mainFlow: [
          'El {ACTOR} revisa el resumen del pedido y la dirección de entrega',
          'Selecciona el medio de pago (tarjeta, transferencia o billetera digital)',
          'Ingresa los datos de pago en el formulario seguro',
          'El sistema valida los datos y envía la transacción a la pasarela',
          'La pasarela aprueba el pago y el sistema crea el pedido con número correlativo',
          'El sistema descuenta el stock, emite el comprobante y envía la confirmación por correo',
        ],
        alternativeFlows: [
          {
            name: 'Pago contra entrega',
            condition: 'El {ACTOR} elige pagar al recibir',
            steps: [
              'El sistema crea el pedido en estado "pendiente de pago"',
              'Reserva el stock por 24 horas',
            ],
          },
        ],
        exceptionFlows: [
          {
            name: 'Tarjeta rechazada',
            trigger: 'La pasarela rechaza la transacción',
            steps: ['El sistema muestra el motivo genérico', 'Conserva el carrito para reintentar'],
            expectedError: 'El pago fue rechazado por la entidad emisora',
          },
          {
            name: 'Tiempo de espera de la pasarela',
            trigger: 'La pasarela no responde en 30 segundos',
            steps: ['El sistema consulta el estado de la transacción antes de crear o descartar el pedido'],
            expectedError: 'No se pudo confirmar el pago, intente nuevamente',
          },
        ],
        postconditions: [
          'Existe un pedido con estado y comprobante asociados',
          'El stock de los productos se redujo según las cantidades compradas',
        ],
        requirements: [
          {
            key: 'checkout_confirm_req',
            title: 'Confirmación de pedido con número correlativo',
            description:
              'El sistema debe crear el pedido con un número correlativo único, dirección de entrega completa (calle, número, distrito y referencia), detalle de productos con precios congelados al momento de la compra y total calculado con impuestos.',
            priority: 'high',
            templateCategory: 'form_validation',
            scenarios: [
              {
                name: 'Pedido confirmado con datos completos',
                type: 'positive',
                given: [
                  'el carrito contiene 2 productos por un total de 159.80',
                  'el {ACTOR} completó la dirección de entrega',
                ],
                when: ['confirma el pedido y el pago es aprobado'],
                then: [
                  'el sistema crea el pedido con un número correlativo',
                  'el pedido conserva los precios vigentes al momento de la compra',
                ],
              },
              {
                name: 'Dirección de entrega incompleta',
                type: 'validation',
                given: ['el {ACTOR} se encuentra en el resumen del pedido'],
                when: ['deja vacío el campo distrito y confirma'],
                then: ['el sistema resalta el campo distrito', 'no crea el pedido'],
              },
              {
                name: 'Precio congelado ante cambio posterior',
                type: 'positive',
                given: ['el {ACTOR} confirmó un pedido con un producto a 59.90'],
                when: ['el {ADMIN} cambia el precio del producto a 69.90'],
                then: ['el pedido confirmado mantiene el precio 59.90'],
              },
            ],
          },
          {
            key: 'checkout_payment_req',
            title: 'Procesamiento de pago con tarjeta y otros medios',
            description:
              'El sistema debe procesar pagos con tarjeta validando el número con el algoritmo de Luhn, fecha de vencimiento futura y CVV de 3 o 4 dígitos, aceptar montos entre 1.00 y 10000.00 por transacción y ofrecer pago contra entrega como alternativa.',
            priority: 'high',
            templateCategory: 'form_validation',
            variables: [
              { name: 'Monto de la transacción', type: 'decimal', min: 1, max: 10000, unit: 'USD' },
            ],
            scenarios: [
              {
                name: 'Pago aprobado con tarjeta válida',
                type: 'positive',
                given: ['el total del pedido es 159.80'],
                when: [
                  'el {ACTOR} paga con la tarjeta de prueba 4111 1111 1111 1111, vencimiento 12/28 y CVV 123',
                ],
                then: [
                  'la pasarela aprueba la transacción',
                  'el pedido pasa a estado "pagado" y se emite el comprobante',
                ],
              },
              {
                name: 'Rechazo de tarjeta con número inválido',
                type: 'validation',
                given: ['el {ACTOR} se encuentra en el formulario de pago'],
                when: ['ingresa el número de tarjeta 4111 1111 1111 1112'],
                then: ['el sistema indica "Número de tarjeta inválido" antes de enviar a la pasarela'],
              },
              {
                name: 'Pago rechazado por la entidad emisora',
                type: 'negative',
                given: ['la pasarela responde "fondos insuficientes"'],
                when: ['el {ACTOR} confirma el pago'],
                then: [
                  'el sistema muestra "El pago fue rechazado por la entidad emisora"',
                  'el carrito se conserva para reintentar',
                ],
              },
              {
                name: 'Monto superior al límite por transacción',
                type: 'boundary',
                given: ['el total del pedido es 10000.01'],
                when: ['el {ACTOR} intenta pagar con tarjeta'],
                then: [
                  'el sistema indica que el monto máximo por transacción es 10000.00',
                  'sugiere dividir el pedido o usar otro medio',
                ],
              },
              {
                name: 'Pago contra entrega reserva stock',
                type: 'alternative',
                given: ['el {ACTOR} elige "Pago contra entrega"'],
                when: ['confirma el pedido'],
                then: [
                  'el pedido se crea en estado "pendiente de pago"',
                  'el stock queda reservado por 24 horas',
                ],
              },
            ],
          },
        ],
      },
      {
        key: 'checkout_history',
        name: 'Consultar historial y estado de pedidos',
        actor: 'primary',
        priority: 'medium',
        description:
          'Permite al {ACTOR} revisar sus pedidos anteriores, su estado actual y descargar comprobantes.',
        preconditions: ['El {ACTOR} tiene sesión iniciada'],
        mainFlow: [
          'El {ACTOR} accede a "Mis pedidos"',
          'El sistema lista sus pedidos del más reciente al más antiguo con número, fecha, total y estado',
          'El {ACTOR} abre un pedido y revisa productos, dirección, pagos y seguimiento',
          'Descarga el comprobante en PDF',
        ],
        alternativeFlows: [
          {
            name: 'Sin pedidos',
            condition: 'El {ACTOR} no ha realizado compras',
            steps: ['El sistema muestra "Aún no tienes pedidos" con acceso al catálogo'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Pedido de otro cliente',
            trigger: 'El {ACTOR} manipula la URL con el número de otro pedido',
            steps: ['El sistema responde 404 sin revelar datos'],
            expectedError: 'Pedido no encontrado',
          },
        ],
        postconditions: ['El {ACTOR} conoce el estado actualizado de cada pedido'],
        requirements: [
          {
            key: 'checkout_history_req',
            title: 'Historial de pedidos con estados y comprobantes',
            description:
              'El sistema debe mostrar al {ACTOR} solo sus propios pedidos, ordenados por fecha descendente, con los estados pendiente, pagado, enviado, entregado y cancelado, y permitir descargar el comprobante de cada pedido pagado.',
            priority: 'medium',
            templateCategory: 'permissions',
            scenarios: [
              {
                name: 'Listado de pedidos propios',
                type: 'positive',
                given: ['el {ACTOR} tiene 3 pedidos y existen pedidos de otros clientes'],
                when: ['accede a "Mis pedidos"'],
                then: [
                  'el sistema muestra exactamente sus 3 pedidos ordenados del más reciente al más antiguo',
                ],
              },
              {
                name: 'Acceso a pedido ajeno por URL',
                type: 'negative',
                given: ['existe el pedido 000045 de otro cliente'],
                when: ['el {ACTOR} abre la URL del pedido 000045'],
                then: [
                  'el sistema responde 404 con "Pedido no encontrado"',
                  'no muestra ningún dato del pedido',
                ],
              },
              {
                name: 'Descarga de comprobante de pedido pagado',
                type: 'positive',
                given: ['el pedido 000012 del {ACTOR} está en estado pagado'],
                when: ['selecciona "Descargar comprobante"'],
                then: ['el sistema entrega un PDF con el detalle del pedido y el número de comprobante'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // INVENTARIO Y ALMACÉN
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'inventory',
    name: 'Inventario y Almacén',
    icon: '📦',
    description: 'Control de existencias, movimientos de entrada y salida, kardex y alertas de stock mínimo.',
    keywords: [
      { term: 'inventario', weight: 3 },
      { term: 'inventarios', weight: 3 },
      { term: 'stock', weight: 3 },
      { term: 'almacen', weight: 3 },
      { term: 'almacenes', weight: 3 },
      { term: 'existencias', weight: 3 },
      { term: 'kardex', weight: 3 },
      { term: 'entradas y salidas', weight: 3 },
      { term: 'lote', weight: 2 },
      { term: 'lotes', weight: 2 },
      { term: 'reposicion', weight: 2 },
      { term: 'bodega', weight: 3 },
      { term: 'insumos', weight: 2 },
      { term: 'materiales', weight: 1 },
      { term: 'mercaderia', weight: 2 },
    ],
    preferredActors: ['almacenero', 'operador', 'administrador', 'usuario'],
    coveredEntities: ['almacen'],
    implies: ['authentication', 'reporting'],
    templateCategory: 'crud',
    useCases: [
      {
        key: 'inventory_movements',
        name: 'Registrar movimientos de inventario',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite al {ACTOR} registrar entradas y salidas de productos manteniendo el stock exacto y el kardex histórico.',
        preconditions: [
          'El producto existe en el catálogo del almacén',
          'El {ACTOR} tiene permiso sobre el almacén',
        ],
        mainFlow: [
          'El {ACTOR} selecciona el tipo de movimiento (entrada o salida)',
          'Indica producto, cantidad, motivo y documento de respaldo',
          'El sistema valida que una salida no supere el stock disponible',
          'El sistema actualiza el stock y registra el movimiento en el kardex con fecha y usuario',
        ],
        alternativeFlows: [
          {
            name: 'Transferencia entre almacenes',
            condition: 'El {ACTOR} elige "Transferencia"',
            steps: [
              'El sistema registra una salida en el origen y una entrada en el destino en la misma transacción',
            ],
          },
        ],
        exceptionFlows: [
          {
            name: 'Salida mayor al stock',
            trigger: 'La cantidad de salida supera las existencias',
            steps: ['El sistema rechaza el movimiento e indica el stock actual'],
            expectedError: 'Stock insuficiente para la salida',
          },
        ],
        postconditions: ['El stock refleja el movimiento y el kardex conserva la trazabilidad completa'],
        requirements: [
          {
            key: 'inventory_io_req',
            title: 'Entradas y salidas de stock con validación de existencias',
            description:
              'El sistema debe registrar entradas y salidas con cantidades enteras de 1 a 100000 unidades, impedir salidas que superen el stock disponible, actualizar el saldo de inmediato y conservar cada movimiento en el kardex con fecha, usuario y motivo.',
            priority: 'high',
            templateCategory: 'crud',
            variables: [
              { name: 'Cantidad del movimiento', type: 'integer', min: 1, max: 100000, unit: 'unidades' },
            ],
            scenarios: [
              {
                name: 'Entrada incrementa el stock',
                type: 'positive',
                given: ['el producto "Tornillo M6" tiene stock 100'],
                when: ['el {ACTOR} registra una entrada de 50 unidades con motivo "compra"'],
                then: ['el stock pasa a 150', 'el kardex muestra el movimiento con fecha y usuario'],
              },
              {
                name: 'Salida reduce el stock',
                type: 'positive',
                given: ['el producto "Tornillo M6" tiene stock 150'],
                when: ['el {ACTOR} registra una salida de 30 unidades con motivo "producción"'],
                then: ['el stock pasa a 120'],
              },
              {
                name: 'Salida mayor al stock disponible',
                type: 'negative',
                given: ['el producto "Tornillo M6" tiene stock 120'],
                when: ['el {ACTOR} intenta registrar una salida de 121 unidades'],
                then: [
                  'el sistema rechaza el movimiento con "Stock insuficiente para la salida: disponible 120"',
                ],
              },
              {
                name: 'Salida que deja el stock en cero',
                type: 'boundary',
                given: ['el producto "Tornillo M6" tiene stock 120'],
                when: ['el {ACTOR} registra una salida de exactamente 120 unidades'],
                then: ['el stock queda en 0', 'el producto se marca como agotado'],
              },
            ],
          },
          {
            key: 'inventory_alert_req',
            title: 'Alertas de stock mínimo por producto',
            description:
              'El sistema debe permitir configurar un stock mínimo por producto (0 a 100000 unidades) y generar una alerta visible y una notificación cuando el saldo sea menor o igual al mínimo configurado.',
            priority: 'medium',
            templateCategory: 'crud',
            variables: [
              { name: 'Stock mínimo configurado', type: 'integer', min: 0, max: 100000, unit: 'unidades' },
            ],
            scenarios: [
              {
                name: 'Alerta al caer por debajo del mínimo',
                type: 'positive',
                given: ['el producto tiene stock mínimo 20 y saldo 25'],
                when: ['se registra una salida de 10 unidades'],
                then: ['el sistema genera la alerta "Stock bajo: 15 unidades (mínimo 20)"'],
              },
              {
                name: 'Saldo exactamente igual al mínimo',
                type: 'boundary',
                given: ['el producto tiene stock mínimo 20 y saldo 21'],
                when: ['se registra una salida de 1 unidad'],
                then: ['el sistema genera la alerta por saldo igual al mínimo'],
              },
              {
                name: 'Producto sin stock mínimo configurado',
                type: 'alternative',
                given: ['el producto no tiene stock mínimo configurado'],
                when: ['su saldo llega a 0'],
                then: ['el sistema marca el producto como agotado sin generar alerta de mínimo'],
              },
            ],
          },
        ],
      },
      {
        key: 'inventory_query',
        name: 'Consultar existencias y kardex',
        actor: 'primary',
        priority: 'medium',
        description:
          'Permite al {ACTOR} consultar el stock actual por producto y almacén y revisar el historial de movimientos.',
        preconditions: ['Existen productos con movimientos registrados'],
        mainFlow: [
          'El {ACTOR} accede a la consulta de existencias',
          'Filtra por almacén, categoría o producto',
          'El sistema muestra el saldo actual y el valor del inventario',
          'El {ACTOR} abre el kardex de un producto y revisa sus movimientos en orden cronológico',
        ],
        alternativeFlows: [
          {
            name: 'Exportar existencias',
            condition: 'El {ACTOR} selecciona "Exportar"',
            steps: ['El sistema genera un archivo Excel con el inventario filtrado'],
          },
        ],
        exceptionFlows: [],
        postconditions: ['El {ACTOR} dispone del saldo exacto por producto y almacén'],
        requirements: [
          {
            key: 'inventory_query_req',
            title: 'Consulta de existencias y kardex por producto',
            description:
              'El sistema debe mostrar el saldo actual de cada producto por almacén, el valor total del inventario a costo promedio y el kardex con todos los movimientos ordenados cronológicamente, con filtros por almacén, categoría y rango de fechas.',
            priority: 'medium',
            templateCategory: 'search_filter',
            scenarios: [
              {
                name: 'Saldo por almacén',
                type: 'positive',
                given: [
                  'el producto "Tornillo M6" tiene 120 unidades en "Almacén Central" y 30 en "Sucursal Norte"',
                ],
                when: ['el {ACTOR} consulta las existencias del producto'],
                then: [
                  'el sistema muestra 120 en "Almacén Central", 30 en "Sucursal Norte" y un total de 150',
                ],
              },
              {
                name: 'Kardex cronológico',
                type: 'positive',
                given: ['el producto tiene una entrada de 50 y una salida de 30 registradas'],
                when: ['el {ACTOR} abre el kardex'],
                then: ['los movimientos aparecen en orden cronológico con saldo acumulado tras cada uno'],
              },
              {
                name: 'Filtro sin movimientos en el rango',
                type: 'alternative',
                given: ['no existen movimientos en enero de 2020'],
                when: ['el {ACTOR} filtra el kardex por enero de 2020'],
                then: ['el sistema muestra "Sin movimientos en el periodo"'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // RESERVAS Y CITAS
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'booking',
    name: 'Reservas y Agenda de Citas',
    icon: '📅',
    description:
      'Reserva de citas, servicios o recursos en horarios disponibles, con cancelación, reprogramación y recordatorios.',
    keywords: [
      { term: 'reserva', weight: 3 },
      { term: 'reservas', weight: 3 },
      { term: 'reservar', weight: 3 },
      { term: 'reservacion', weight: 3 },
      { term: 'cita', weight: 3 },
      { term: 'citas', weight: 3 },
      { term: 'agenda', weight: 2 },
      { term: 'agendar', weight: 3 },
      { term: 'turno', weight: 2 },
      { term: 'turnos', weight: 2 },
      { term: 'horario', weight: 1 },
      { term: 'horarios', weight: 2 },
      { term: 'disponibilidad', weight: 2 },
      { term: 'calendario', weight: 2 },
      { term: 'habitacion', weight: 2 },
      { term: 'habitaciones', weight: 2 },
      { term: 'hotel', weight: 3 },
      { term: 'hospedaje', weight: 3 },
      { term: 'cancha', weight: 3 },
      { term: 'canchas', weight: 3 },
      { term: 'evento', weight: 1 },
      { term: 'eventos', weight: 1 },
      { term: 'entradas', weight: 1 },
    ],
    preferredActors: ['cliente', 'paciente', 'usuario', 'socio'],
    secondaryActors: ['recepcionista', 'administrador'],
    coveredEntities: ['reserva', 'cita'],
    implies: ['authentication', 'notifications'],
    templateCategory: 'state_flow',
    useCases: [
      {
        key: 'booking_create',
        name: 'Reservar una cita o servicio',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite al {ACTOR} elegir fecha y hora disponibles y confirmar una reserva sin solaparse con otras.',
        preconditions: ['El {ACTOR} tiene sesión iniciada', 'Existen horarios de atención configurados'],
        mainFlow: [
          'El {ACTOR} selecciona el servicio o recurso a reservar',
          'El sistema muestra el calendario con los horarios disponibles',
          'El {ACTOR} elige fecha y hora e ingresa el motivo',
          'El sistema verifica que el horario siga libre y crea la reserva en estado "confirmada"',
          'El sistema envía la confirmación y programa el recordatorio 24 horas antes',
        ],
        alternativeFlows: [
          {
            name: 'Lista de espera',
            condition: 'No hay horarios disponibles en la fecha deseada',
            steps: [
              'El {ACTOR} se registra en lista de espera',
              'El sistema lo notifica si se libera un cupo',
            ],
          },
        ],
        exceptionFlows: [
          {
            name: 'Horario ocupado en concurrencia',
            trigger: 'Otro {ACTOR} tomó el mismo horario segundos antes',
            steps: ['El sistema rechaza la reserva y actualiza el calendario'],
            expectedError: 'El horario ya no está disponible',
          },
          {
            name: 'Fecha en el pasado',
            trigger: 'El {ACTOR} selecciona una fecha u hora anterior al momento actual',
            steps: ['El sistema bloquea la selección'],
            expectedError: 'No es posible reservar en fechas pasadas',
          },
        ],
        postconditions: [
          'La reserva ocupa el horario y figura en la agenda del recurso',
          'El {ACTOR} recibió la confirmación',
        ],
        requirements: [
          {
            key: 'booking_create_req',
            title: 'Creación de reserva en horario disponible',
            description:
              'El sistema debe permitir reservar únicamente horarios futuros y libres, con una anticipación mínima de 1 hora y máxima de 90 días, impedir dobles reservas sobre el mismo recurso y horario, y confirmar la reserva por correo.',
            priority: 'high',
            templateCategory: 'state_flow',
            variables: [
              { name: 'Días de anticipación de la reserva', type: 'integer', min: 1, max: 90, unit: 'días' },
            ],
            scenarios: [
              {
                name: 'Reserva confirmada en horario libre',
                type: 'positive',
                given: ['el horario del 20/03/2026 a las 10:00 está libre'],
                when: ['el {ACTOR} reserva ese horario e ingresa el motivo'],
                then: [
                  'el sistema crea la reserva en estado "confirmada"',
                  'envía el correo de confirmación',
                ],
              },
              {
                name: 'Rechazo por horario ocupado',
                type: 'negative',
                given: ['el horario del 20/03/2026 a las 10:00 ya está reservado'],
                when: ['el {ACTOR} intenta reservar el mismo horario'],
                then: ['el sistema rechaza la reserva con "El horario ya no está disponible"'],
              },
              {
                name: 'Fecha anterior al momento actual',
                type: 'validation',
                given: ['la fecha actual es 15/03/2026'],
                when: ['el {ACTOR} intenta reservar el 14/03/2026'],
                then: ['el sistema bloquea la selección con "No es posible reservar en fechas pasadas"'],
              },
              {
                name: 'Reserva en el límite máximo de 90 días',
                type: 'boundary',
                given: ['la fecha actual es 15/03/2026'],
                when: ['el {ACTOR} reserva para el 13/06/2026 (90 días después)'],
                then: ['el sistema acepta la reserva'],
              },
            ],
          },
          {
            key: 'booking_cancel_req',
            title: 'Cancelación y reprogramación de reservas',
            description:
              'El sistema debe permitir cancelar o reprogramar una reserva con al menos 24 horas de anticipación, liberar el horario original de inmediato y notificar el cambio al {ACTOR} y al recurso asignado.',
            priority: 'medium',
            templateCategory: 'state_flow',
            variables: [
              {
                name: 'Horas de anticipación para cancelar',
                type: 'integer',
                min: 1,
                max: 24,
                unit: 'horas',
              },
            ],
            scenarios: [
              {
                name: 'Cancelación con anticipación suficiente',
                type: 'positive',
                given: ['la reserva es para dentro de 48 horas'],
                when: ['el {ACTOR} la cancela'],
                then: ['la reserva pasa a estado "cancelada"', 'el horario queda disponible para otros'],
              },
              {
                name: 'Cancelación fuera de plazo',
                type: 'negative',
                given: ['la reserva es para dentro de 12 horas'],
                when: ['el {ACTOR} intenta cancelarla'],
                then: [
                  'el sistema rechaza la cancelación indicando que se requieren 24 horas de anticipación',
                ],
              },
              {
                name: 'Reprogramación a otro horario libre',
                type: 'alternative',
                given: ['la reserva es para dentro de 48 horas y existe otro horario libre'],
                when: ['el {ACTOR} la reprograma al nuevo horario'],
                then: [
                  'el horario original se libera',
                  'la reserva queda confirmada en el nuevo horario y se notifica el cambio',
                ],
              },
            ],
          },
        ],
      },
      {
        key: 'booking_schedule',
        name: 'Configurar horarios de atención',
        actor: 'secondary',
        priority: 'medium',
        description:
          'Permite al {ADMIN} definir días, franjas horarias y duración de las citas para cada recurso.',
        preconditions: ['El {ADMIN} tiene permisos de configuración'],
        mainFlow: [
          'El {ADMIN} selecciona el recurso o profesional',
          'Define los días de atención y las franjas horarias',
          'Indica la duración de cada cita y los descansos',
          'El sistema valida que las franjas no se solapen y genera los cupos disponibles',
        ],
        alternativeFlows: [
          {
            name: 'Bloqueo de fechas',
            condition: 'El {ADMIN} registra un feriado o ausencia',
            steps: [
              'El sistema bloquea los cupos de esas fechas',
              'Notifica a quienes tenían reservas para reprogramar',
            ],
          },
        ],
        exceptionFlows: [
          {
            name: 'Franjas solapadas',
            trigger: 'Dos franjas del mismo día se cruzan',
            steps: ['El sistema rechaza la configuración'],
            expectedError: 'Las franjas horarias no pueden solaparse',
          },
        ],
        postconditions: ['El calendario público refleja los cupos configurados'],
        requirements: [
          {
            key: 'booking_schedule_req',
            title: 'Gestión de horarios de atención sin solapamientos',
            description:
              'El sistema debe permitir al {ADMIN} definir franjas horarias por día con duración de cita entre 15 y 180 minutos, rechazar franjas que se solapen y regenerar los cupos disponibles al guardar la configuración.',
            priority: 'medium',
            templateCategory: 'form_validation',
            variables: [{ name: 'Duración de la cita', type: 'integer', min: 15, max: 180, unit: 'minutos' }],
            scenarios: [
              {
                name: 'Franja horaria válida genera cupos',
                type: 'positive',
                given: ['el {ADMIN} configura el recurso "Consultorio 1"'],
                when: ['define la franja de 09:00 a 13:00 con citas de 30 minutos'],
                then: ['el sistema genera 8 cupos disponibles para ese día'],
              },
              {
                name: 'Franjas solapadas rechazadas',
                type: 'negative',
                given: ['existe la franja de 09:00 a 13:00'],
                when: ['el {ADMIN} agrega la franja de 12:00 a 15:00 el mismo día'],
                then: ['el sistema rechaza la configuración con "Las franjas horarias no pueden solaparse"'],
              },
              {
                name: 'Duración mínima de 15 minutos',
                type: 'boundary',
                given: ['el {ADMIN} configura una franja de 09:00 a 10:00'],
                when: ['define citas de 15 minutos'],
                then: ['el sistema acepta y genera 4 cupos'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // LOGÍSTICA Y ENTREGAS
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'logistics_delivery',
    name: 'Logística y Entregas',
    icon: '🚚',
    description: 'Programación de entregas, asignación de repartidores y seguimiento de envíos por estados.',
    keywords: [
      { term: 'envio', weight: 2 },
      { term: 'envios', weight: 3 },
      { term: 'delivery', weight: 3 },
      { term: 'reparto', weight: 3 },
      { term: 'repartidor', weight: 3 },
      { term: 'repartidores', weight: 3 },
      { term: 'entrega', weight: 2 },
      { term: 'entregas', weight: 3 },
      { term: 'ruta', weight: 2 },
      { term: 'rutas', weight: 3 },
      { term: 'transporte', weight: 2 },
      { term: 'vehiculo', weight: 2 },
      { term: 'vehiculos', weight: 2 },
      { term: 'flota', weight: 3 },
      { term: 'seguimiento', weight: 2 },
      { term: 'tracking', weight: 3 },
      { term: 'courier', weight: 3 },
      { term: 'despacho', weight: 2 },
      { term: 'despachos', weight: 2 },
      { term: 'logistica', weight: 3 },
    ],
    preferredActors: ['repartidor', 'operador', 'supervisor', 'usuario'],
    secondaryActors: ['cliente'],
    coveredEntities: ['envio', 'ruta'],
    implies: ['authentication', 'notifications'],
    templateCategory: 'state_flow',
    useCases: [
      {
        key: 'logistics_assign',
        name: 'Programar y asignar entregas',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite programar envíos, asignarlos a un repartidor disponible y organizarlos en rutas.',
        preconditions: ['Existen pedidos listos para despacho', 'Existen repartidores registrados'],
        mainFlow: [
          'El {ACTOR} selecciona los pedidos listos para despacho',
          'Agrupa los pedidos en una ruta por zona',
          'Asigna la ruta a un repartidor disponible',
          'El sistema genera la hoja de ruta y notifica al repartidor y a los clientes',
        ],
        alternativeFlows: [
          {
            name: 'Reasignación',
            condition: 'El repartidor asignado no está disponible',
            steps: ['El {ACTOR} reasigna la ruta a otro repartidor', 'El sistema notifica el cambio'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Repartidor sin disponibilidad',
            trigger: 'El repartidor ya tiene una ruta activa en el mismo horario',
            steps: ['El sistema impide la asignación'],
            expectedError: 'El repartidor no está disponible en ese horario',
          },
        ],
        postconditions: ['Cada envío tiene repartidor, ruta y hora estimada de entrega'],
        requirements: [
          {
            key: 'logistics_assign_req',
            title: 'Asignación de repartidor y ruta de entrega',
            description:
              'El sistema debe permitir agrupar hasta 30 envíos por ruta, asignar la ruta a un repartidor sin otra ruta activa en el mismo turno, calcular la hora estimada de cada entrega y notificar al repartidor y a los clientes.',
            priority: 'high',
            templateCategory: 'state_flow',
            variables: [{ name: 'Envíos por ruta', type: 'integer', min: 1, max: 30, unit: 'envíos' }],
            scenarios: [
              {
                name: 'Asignación exitosa de ruta',
                type: 'positive',
                given: ['existen 5 pedidos listos y el repartidor "Luis" está disponible'],
                when: ['el {ACTOR} crea la ruta con los 5 pedidos y la asigna a "Luis"'],
                then: [
                  'el sistema genera la hoja de ruta',
                  'notifica a "Luis" y a los 5 clientes con la hora estimada',
                ],
              },
              {
                name: 'Repartidor con ruta activa',
                type: 'negative',
                given: ['el repartidor "Luis" tiene una ruta activa en el turno mañana'],
                when: ['el {ACTOR} intenta asignarle otra ruta del turno mañana'],
                then: [
                  'el sistema rechaza la asignación con "El repartidor no está disponible en ese horario"',
                ],
              },
              {
                name: 'Ruta con el máximo de 30 envíos',
                type: 'boundary',
                given: ['existen 31 pedidos listos para despacho'],
                when: ['el {ACTOR} intenta agrupar los 31 en una sola ruta'],
                then: ['el sistema acepta hasta 30 envíos', 'indica que el pedido 31 debe ir en otra ruta'],
              },
            ],
          },
        ],
      },
      {
        key: 'logistics_track',
        name: 'Seguir el estado de un envío',
        actor: 'secondary',
        priority: 'medium',
        description:
          'Permite al {ACTOR} consultar en qué estado se encuentra su envío y recibir avisos de cada cambio.',
        preconditions: ['El envío tiene un número de guía asignado'],
        mainFlow: [
          'El repartidor actualiza el estado del envío desde su dispositivo',
          'El sistema valida que la transición de estado sea permitida',
          'El sistema registra fecha, hora y ubicación del cambio',
          'El {ACTOR} consulta el seguimiento con el número de guía y recibe la notificación',
        ],
        alternativeFlows: [
          {
            name: 'Entrega fallida',
            condition: 'El cliente no se encuentra en la dirección',
            steps: [
              'El repartidor registra el intento fallido con foto',
              'El sistema programa un segundo intento',
            ],
          },
        ],
        exceptionFlows: [
          {
            name: 'Transición ilegal',
            trigger: 'Se intenta pasar de "entregado" a "en camino"',
            steps: ['El sistema rechaza el cambio'],
            expectedError: 'Transición de estado no permitida',
          },
        ],
        postconditions: ['El historial del envío refleja todos los cambios con fecha y hora'],
        requirements: [
          {
            key: 'logistics_track_req',
            title: 'Estados de envío y seguimiento por número de guía',
            description:
              'El sistema debe gestionar los estados pendiente, en camino, entregado y devuelto con transiciones controladas (pendiente → en camino → entregado o devuelto), registrar fecha, hora y evidencia de cada cambio y notificar al cliente en cada transición.',
            priority: 'medium',
            templateCategory: 'state_flow',
            scenarios: [
              {
                name: 'Transición válida a entregado',
                type: 'positive',
                given: ['el envío está en estado "en camino"'],
                when: ['el repartidor lo marca como "entregado" con foto de evidencia'],
                then: [
                  'el envío pasa a "entregado" con fecha y hora',
                  'el cliente recibe la notificación de entrega',
                ],
              },
              {
                name: 'Transición ilegal desde entregado',
                type: 'negative',
                given: ['el envío está en estado "entregado"'],
                when: ['se intenta cambiarlo a "en camino"'],
                then: ['el sistema rechaza el cambio con "Transición de estado no permitida"'],
              },
              {
                name: 'Intento de entrega fallido',
                type: 'alternative',
                given: ['el envío está en estado "en camino"'],
                when: ['el repartidor registra "cliente ausente" con foto'],
                then: [
                  'el envío permanece "en camino" con el intento registrado',
                  'el sistema programa un segundo intento y avisa al cliente',
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // SOPORTE E INCIDENCIAS
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'support_tickets',
    name: 'Soporte, Tickets e Incidencias',
    icon: '🎫',
    description: 'Registro de tickets, asignación, atención con SLA, escalamiento y cierre con conformidad.',
    keywords: [
      { term: 'ticket', weight: 3 },
      { term: 'tickets', weight: 3 },
      { term: 'incidencia', weight: 3 },
      { term: 'incidencias', weight: 3 },
      { term: 'soporte', weight: 3 },
      { term: 'reclamo', weight: 3 },
      { term: 'reclamos', weight: 3 },
      { term: 'queja', weight: 2 },
      { term: 'quejas', weight: 3 },
      { term: 'mesa de ayuda', weight: 3 },
      { term: 'helpdesk', weight: 3 },
      { term: 'sla', weight: 3 },
      { term: 'atencion al cliente', weight: 2 },
      { term: 'libro de reclamaciones', weight: 3 },
    ],
    preferredActors: ['cliente', 'usuario', 'empleado'],
    secondaryActors: ['agente_soporte', 'supervisor'],
    coveredEntities: ['ticket'],
    implies: ['authentication', 'notifications'],
    templateCategory: 'state_flow',
    useCases: [
      {
        key: 'ticket_create',
        name: 'Registrar un ticket de soporte',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite al {ACTOR} reportar una incidencia con prioridad, adjuntos y recibir un número de seguimiento.',
        preconditions: ['El {ACTOR} tiene sesión iniciada'],
        mainFlow: [
          'El {ACTOR} selecciona "Nuevo ticket"',
          'Ingresa asunto, descripción detallada, categoría y prioridad',
          'Adjunta evidencias opcionales',
          'El sistema genera el número de ticket correlativo y lo asigna a la cola correspondiente',
          'El {ACTOR} recibe la confirmación con el número y el tiempo de respuesta comprometido',
        ],
        alternativeFlows: [
          {
            name: 'Ticket desde correo',
            condition: 'El {ACTOR} escribe al correo de soporte',
            steps: ['El sistema crea el ticket automáticamente con el contenido del correo'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Descripción insuficiente',
            trigger: 'La descripción tiene menos de 20 caracteres',
            steps: ['El sistema solicita más detalle'],
            expectedError: 'Describa la incidencia con al menos 20 caracteres',
          },
        ],
        postconditions: ['El ticket queda en estado "abierto" con SLA calculado según su prioridad'],
        requirements: [
          {
            key: 'ticket_create_req',
            title: 'Creación de ticket con prioridad y número correlativo',
            description:
              'El sistema debe crear tickets con asunto (5 a 150 caracteres), descripción (20 a 2000 caracteres), categoría y prioridad baja, media, alta o crítica, asignar un número correlativo único y calcular el plazo de atención según la prioridad.',
            priority: 'high',
            templateCategory: 'form_validation',
            variables: [
              { name: 'Longitud de la descripción del ticket', type: 'string_length', min: 20, max: 2000 },
            ],
            scenarios: [
              {
                name: 'Ticket creado con prioridad alta',
                type: 'positive',
                given: ['el {ACTOR} se encuentra en "Nuevo ticket"'],
                when: [
                  'ingresa asunto "Error al pagar", una descripción de 80 caracteres y prioridad alta',
                  'envía el ticket',
                ],
                then: [
                  'el sistema crea el ticket en estado "abierto" con número correlativo',
                  'muestra el plazo de atención de 8 horas',
                ],
              },
              {
                name: 'Descripción menor a 20 caracteres',
                type: 'validation',
                given: ['el {ACTOR} se encuentra en "Nuevo ticket"'],
                when: ['ingresa la descripción "No funciona" y envía'],
                then: [
                  'el sistema muestra "Describa la incidencia con al menos 20 caracteres"',
                  'no crea el ticket',
                ],
              },
              {
                name: 'Números de ticket consecutivos',
                type: 'positive',
                given: ['el último ticket creado es el 000120'],
                when: ['el {ACTOR} crea un nuevo ticket'],
                then: ['el nuevo ticket recibe el número 000121'],
              },
            ],
          },
        ],
      },
      {
        key: 'ticket_attend',
        name: 'Atender y cerrar tickets con SLA',
        actor: 'secondary',
        priority: 'high',
        description:
          'Permite al agente tomar tickets, registrar la solución, cumplir el SLA y cerrar con conformidad del solicitante.',
        preconditions: ['Existen tickets abiertos asignados a la cola del agente'],
        mainFlow: [
          'El agente toma el ticket y pasa a estado "en proceso"',
          'Registra avances y se comunica con el solicitante',
          'Registra la solución y marca el ticket como "resuelto"',
          'El solicitante confirma la solución y el ticket se cierra',
        ],
        alternativeFlows: [
          {
            name: 'Reapertura',
            condition: 'El solicitante indica que el problema persiste',
            steps: ['El ticket vuelve a "en proceso"', 'Se conserva el historial completo'],
          },
          {
            name: 'Escalamiento',
            condition: 'El SLA está por vencer',
            steps: ['El sistema alerta al supervisor', 'Permite reasignar a otro agente'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Cierre sin solución',
            trigger: 'El agente intenta cerrar sin registrar la solución',
            steps: ['El sistema impide el cierre'],
            expectedError: 'Registre la solución antes de cerrar el ticket',
          },
        ],
        postconditions: ['El ticket cerrado conserva historial, tiempos de atención y cumplimiento de SLA'],
        requirements: [
          {
            key: 'ticket_sla_req',
            title: 'Atención y cierre de tickets con control de SLA',
            description:
              'El sistema debe controlar las transiciones abierto → en proceso → resuelto → cerrado, exigir una solución registrada antes de resolver, alertar al supervisor cuando falte 1 hora para vencer el SLA (de 1 a 72 horas según prioridad) y permitir la reapertura dentro de los 7 días posteriores al cierre.',
            priority: 'high',
            templateCategory: 'state_flow',
            variables: [
              { name: 'Horas de SLA por prioridad', type: 'integer', min: 1, max: 72, unit: 'horas' },
            ],
            scenarios: [
              {
                name: 'Resolución y cierre con conformidad',
                type: 'positive',
                given: ['el ticket 000121 está en proceso'],
                when: [
                  'el agente registra la solución y lo marca como resuelto',
                  'el solicitante confirma la solución',
                ],
                then: [
                  'el ticket pasa a "cerrado"',
                  'registra los tiempos de atención y el cumplimiento del SLA',
                ],
              },
              {
                name: 'Cierre sin solución registrada',
                type: 'negative',
                given: ['el ticket 000121 está en proceso sin solución registrada'],
                when: ['el agente intenta marcarlo como resuelto'],
                then: ['el sistema impide la acción con "Registre la solución antes de cerrar el ticket"'],
              },
              {
                name: 'Alerta una hora antes de vencer el SLA',
                type: 'boundary',
                given: ['el ticket tiene SLA de 8 horas y han transcurrido 7'],
                when: ['se evalúa el vencimiento'],
                then: ['el sistema envía la alerta de escalamiento al supervisor'],
              },
              {
                name: 'Reapertura dentro del plazo',
                type: 'alternative',
                given: ['el ticket fue cerrado hace 3 días'],
                when: ['el solicitante indica que el problema persiste'],
                then: ['el ticket vuelve a "en proceso" conservando todo el historial'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // FINANZAS Y CONTABILIDAD
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'finance_accounting',
    name: 'Finanzas, Caja y Contabilidad',
    icon: '💰',
    description:
      'Registro de ingresos y gastos, transferencias con validación de saldo, cierres de periodo y conciliación.',
    keywords: [
      { term: 'contabilidad', weight: 3 },
      { term: 'contable', weight: 3 },
      { term: 'asiento', weight: 3 },
      { term: 'asientos', weight: 3 },
      { term: 'cuentas por cobrar', weight: 3 },
      { term: 'cuentas por pagar', weight: 3 },
      { term: 'presupuesto', weight: 2 },
      { term: 'gasto', weight: 2 },
      { term: 'gastos', weight: 3 },
      { term: 'ingreso', weight: 1 },
      { term: 'ingresos', weight: 2 },
      { term: 'caja', weight: 2 },
      { term: 'arqueo', weight: 3 },
      { term: 'prestamo', weight: 3 },
      { term: 'prestamos', weight: 3 },
      { term: 'credito', weight: 2 },
      { term: 'cuota', weight: 2 },
      { term: 'cuotas', weight: 2 },
      { term: 'interes', weight: 2 },
      { term: 'banco', weight: 2 },
      { term: 'bancario', weight: 3 },
      { term: 'transferencia', weight: 2 },
      { term: 'transferencias', weight: 3 },
      { term: 'saldo', weight: 2 },
      { term: 'finanzas', weight: 3 },
      { term: 'financiero', weight: 3 },
      { term: 'tesoreria', weight: 3 },
    ],
    preferredActors: ['contador', 'cajero', 'administrador', 'usuario'],
    coveredEntities: ['gasto', 'ingreso', 'pago'],
    implies: ['authentication', 'reporting', 'audit_log'],
    templateCategory: 'form_validation',
    useCases: [
      {
        key: 'finance_movements',
        name: 'Registrar ingresos y gastos',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite al {ACTOR} registrar movimientos financieros con comprobante, categoría y afectación al saldo de caja.',
        preconditions: [
          'Existe un periodo contable abierto',
          'El {ACTOR} tiene permiso sobre la caja o cuenta',
        ],
        mainFlow: [
          'El {ACTOR} selecciona el tipo de movimiento (ingreso o gasto)',
          'Ingresa concepto, monto, fecha, categoría y adjunta el comprobante',
          'El sistema valida el monto y que la fecha pertenezca a un periodo abierto',
          'El sistema registra el movimiento y actualiza el saldo de la caja o cuenta',
        ],
        alternativeFlows: [
          {
            name: 'Movimiento recurrente',
            condition: 'El {ACTOR} marca el gasto como mensual',
            steps: ['El sistema programa el registro automático cada mes hasta la fecha indicada'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Periodo cerrado',
            trigger: 'La fecha pertenece a un periodo contable cerrado',
            steps: ['El sistema rechaza el registro'],
            expectedError: 'El periodo contable está cerrado',
          },
        ],
        postconditions: ['El saldo y los reportes reflejan el movimiento con su comprobante'],
        requirements: [
          {
            key: 'finance_record_req',
            title: 'Registro de movimientos financieros con comprobante',
            description:
              'El sistema debe registrar ingresos y gastos con monto entre 0.01 y 1000000.00, concepto de 3 a 150 caracteres, categoría, fecha dentro de un periodo abierto y comprobante adjunto obligatorio para gastos mayores a 100.00.',
            priority: 'high',
            templateCategory: 'form_validation',
            variables: [
              { name: 'Monto del movimiento', type: 'decimal', min: 0.01, max: 1000000, unit: 'USD' },
            ],
            scenarios: [
              {
                name: 'Gasto registrado con comprobante',
                type: 'positive',
                given: ['el periodo de marzo de 2026 está abierto y la caja tiene saldo 5000.00'],
                when: [
                  'el {ACTOR} registra un gasto de 350.00 con concepto "Servicio de internet" y adjunta la factura',
                ],
                then: ['el sistema registra el gasto', 'el saldo de caja pasa a 4650.00'],
              },
              {
                name: 'Monto cero o negativo',
                type: 'validation',
                given: ['el {ACTOR} se encuentra en el formulario de movimientos'],
                when: ['ingresa el monto 0.00'],
                then: ['el sistema muestra "El monto debe ser mayor a 0.00"', 'no registra el movimiento'],
              },
              {
                name: 'Gasto mayor a 100 sin comprobante',
                type: 'negative',
                given: ['el {ACTOR} registra un gasto de 250.00'],
                when: ['intenta guardar sin adjuntar comprobante'],
                then: ['el sistema exige el comprobante para gastos mayores a 100.00'],
              },
              {
                name: 'Registro en periodo cerrado',
                type: 'negative',
                given: ['el periodo de febrero de 2026 está cerrado'],
                when: ['el {ACTOR} intenta registrar un gasto con fecha 15/02/2026'],
                then: ['el sistema rechaza el registro con "El periodo contable está cerrado"'],
              },
            ],
          },
        ],
      },
      {
        key: 'finance_transfer',
        name: 'Transferir fondos entre cuentas o cajas',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite mover fondos entre cuentas internas validando el saldo disponible y registrando ambos asientos.',
        preconditions: ['Existen al menos dos cuentas activas', 'La cuenta origen tiene saldo'],
        mainFlow: [
          'El {ACTOR} selecciona cuenta origen, cuenta destino y monto',
          'El sistema valida que el monto no supere el saldo disponible del origen',
          'El sistema registra la salida en el origen y la entrada en el destino en una sola transacción',
          'El sistema muestra los saldos actualizados de ambas cuentas',
        ],
        alternativeFlows: [
          {
            name: 'Transferencia con aprobación',
            condition: 'El monto supera el límite del {ACTOR}',
            steps: ['El sistema la deja pendiente de aprobación del supervisor'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Saldo insuficiente',
            trigger: 'El monto supera el saldo del origen',
            steps: ['El sistema rechaza la transferencia e indica el saldo disponible'],
            expectedError: 'Saldo insuficiente en la cuenta origen',
          },
        ],
        postconditions: ['La suma de saldos de ambas cuentas no cambia y ambos asientos quedan vinculados'],
        requirements: [
          {
            key: 'finance_transfer_req',
            title: 'Transferencia con validación de saldo disponible',
            description:
              'El sistema debe permitir transferir montos entre 0.01 y el saldo disponible de la cuenta origen, impedir montos superiores al saldo, registrar los dos asientos en una única transacción atómica y mantener la igualdad de la suma de saldos antes y después.',
            priority: 'high',
            templateCategory: 'form_validation',
            scenarios: [
              {
                name: 'Transferencia exitosa',
                type: 'positive',
                given: ['la cuenta "Caja Principal" tiene 1000.00 y "Caja Chica" tiene 200.00'],
                when: ['el {ACTOR} transfiere 300.00 de "Caja Principal" a "Caja Chica"'],
                then: [
                  '"Caja Principal" queda en 700.00 y "Caja Chica" en 500.00',
                  'ambos asientos quedan vinculados con el mismo número de operación',
                ],
              },
              {
                name: 'Saldo insuficiente',
                type: 'negative',
                given: ['la cuenta "Caja Principal" tiene 700.00'],
                when: ['el {ACTOR} intenta transferir 700.01'],
                then: [
                  'el sistema rechaza la operación con "Saldo insuficiente en la cuenta origen: disponible 700.00"',
                ],
              },
              {
                name: 'Transferencia por el saldo exacto',
                type: 'boundary',
                given: ['la cuenta "Caja Principal" tiene 700.00'],
                when: ['el {ACTOR} transfiere exactamente 700.00'],
                then: ['la operación se completa y "Caja Principal" queda en 0.00'],
              },
            ],
          },
          {
            key: 'finance_close_req',
            title: 'Cierre de periodo y conciliación',
            description:
              'El sistema debe permitir cerrar un periodo mensual cuando todos los movimientos estén conciliados, bloquear cualquier registro o edición con fecha dentro del periodo cerrado y generar el reporte de cierre con saldos iniciales, movimientos y saldos finales.',
            priority: 'medium',
            templateCategory: 'state_flow',
            scenarios: [
              {
                name: 'Cierre mensual con movimientos conciliados',
                type: 'positive',
                given: ['todos los movimientos de marzo de 2026 están conciliados'],
                when: ['el {ACTOR} cierra el periodo de marzo'],
                then: [
                  'el periodo pasa a estado "cerrado"',
                  'el sistema genera el reporte de cierre con saldos iniciales y finales',
                ],
              },
              {
                name: 'Cierre con movimientos pendientes de conciliar',
                type: 'negative',
                given: ['existen 2 movimientos de marzo sin conciliar'],
                when: ['el {ACTOR} intenta cerrar el periodo'],
                then: ['el sistema impide el cierre e indica los 2 movimientos pendientes'],
              },
              {
                name: 'Edición bloqueada en periodo cerrado',
                type: 'negative',
                given: ['el periodo de febrero de 2026 está cerrado'],
                when: ['el {ACTOR} intenta editar un gasto del 10/02/2026'],
                then: ['el sistema rechaza la edición con "El periodo contable está cerrado"'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // RECURSOS HUMANOS Y PLANILLA
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'hr_payroll',
    name: 'Recursos Humanos y Planilla',
    icon: '🧑‍💼',
    description: 'Gestión de empleados y contratos, control de asistencia, vacaciones y cálculo de planilla.',
    keywords: [
      { term: 'empleado', weight: 2 },
      { term: 'empleados', weight: 3 },
      { term: 'trabajador', weight: 2 },
      { term: 'trabajadores', weight: 3 },
      { term: 'planilla', weight: 3 },
      { term: 'planillas', weight: 3 },
      { term: 'nomina', weight: 3 },
      { term: 'sueldo', weight: 3 },
      { term: 'sueldos', weight: 3 },
      { term: 'salario', weight: 3 },
      { term: 'vacaciones', weight: 3 },
      { term: 'contrato', weight: 1 },
      { term: 'contratos', weight: 2 },
      { term: 'rrhh', weight: 3 },
      { term: 'recursos humanos', weight: 3 },
      { term: 'asistencia', weight: 2 },
      { term: 'marcacion', weight: 3 },
      { term: 'personal', weight: 1 },
      { term: 'colaboradores', weight: 2 },
      { term: 'talento humano', weight: 3 },
    ],
    preferredActors: ['rrhh', 'administrador', 'supervisor'],
    secondaryActors: ['empleado'],
    coveredEntities: ['empleado', 'contrato', 'asistencia'],
    implies: ['authentication', 'reporting'],
    templateCategory: 'crud',
    useCases: [
      {
        key: 'hr_employee',
        name: 'Gestionar empleados y contratos',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite al {ACTOR} registrar empleados con sus datos personales, cargo, salario y contrato vigente.',
        preconditions: ['El {ACTOR} tiene permisos de recursos humanos'],
        mainFlow: [
          'El {ACTOR} registra al empleado con documento de identidad, datos de contacto y fecha de ingreso',
          'Asigna cargo, área y salario',
          'Registra el contrato con fechas de inicio y fin',
          'El sistema valida los datos y crea el legajo del empleado',
        ],
        alternativeFlows: [
          {
            name: 'Renovación de contrato',
            condition: 'El contrato está por vencer',
            steps: [
              'El sistema alerta 30 días antes',
              'El {ACTOR} registra el nuevo contrato conservando el anterior',
            ],
          },
        ],
        exceptionFlows: [
          {
            name: 'Documento duplicado',
            trigger: 'Ya existe un empleado con el mismo documento',
            steps: ['El sistema rechaza el registro'],
            expectedError: 'El documento de identidad ya está registrado',
          },
        ],
        postconditions: ['El empleado figura activo con contrato vigente y salario definido'],
        requirements: [
          {
            key: 'hr_employee_req',
            title: 'Registro de empleado con contrato y salario',
            description:
              'El sistema debe registrar empleados con documento de identidad único de 8 a 11 dígitos, correo corporativo válido, fecha de ingreso no futura, salario entre 1.00 y 100000.00 y contrato con fecha de fin posterior a la de inicio.',
            priority: 'high',
            templateCategory: 'crud',
            variables: [{ name: 'Salario mensual', type: 'decimal', min: 1, max: 100000, unit: 'USD' }],
            scenarios: [
              {
                name: 'Registro exitoso de empleado',
                type: 'positive',
                given: ['el {ACTOR} se encuentra en el formulario de empleados'],
                when: [
                  'ingresa documento 45678912, correo "jperez@empresa.com", ingreso 01/03/2026, salario 2500.00 y contrato hasta 31/12/2026',
                ],
                then: ['el sistema crea el legajo del empleado en estado activo'],
              },
              {
                name: 'Documento de identidad duplicado',
                type: 'negative',
                given: ['existe un empleado con documento 45678912'],
                when: ['el {ACTOR} intenta registrar otro con el mismo documento'],
                then: ['el sistema rechaza el registro con "El documento de identidad ya está registrado"'],
              },
              {
                name: 'Contrato con fecha de fin anterior al inicio',
                type: 'validation',
                given: ['el {ACTOR} registra un contrato con inicio 01/03/2026'],
                when: ['ingresa fecha de fin 28/02/2026'],
                then: ['el sistema muestra "La fecha de fin debe ser posterior a la de inicio"'],
              },
            ],
          },
        ],
      },
      {
        key: 'hr_payroll',
        name: 'Calcular la planilla mensual',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite al {ACTOR} calcular remuneraciones, descuentos y aportes del periodo y cerrar la planilla.',
        preconditions: [
          'Existen empleados activos con salario definido',
          'El periodo de planilla está abierto',
        ],
        mainFlow: [
          'El {ACTOR} selecciona el periodo mensual',
          'El sistema calcula el salario proporcional según días laborados, horas extra, descuentos y aportes',
          'El {ACTOR} revisa el detalle por empleado y registra ajustes',
          'El sistema cierra la planilla y genera las boletas de pago',
        ],
        alternativeFlows: [
          {
            name: 'Recalcular antes del cierre',
            condition: 'El {ACTOR} corrige asistencia o ajustes',
            steps: ['El sistema recalcula la planilla completa'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Periodo ya cerrado',
            trigger: 'Se intenta modificar una planilla cerrada',
            steps: ['El sistema rechaza el cambio'],
            expectedError: 'La planilla del periodo ya fue cerrada',
          },
        ],
        postconditions: ['Cada empleado tiene su boleta con el neto a pagar del periodo'],
        requirements: [
          {
            key: 'hr_payroll_req',
            title: 'Cálculo y cierre de planilla mensual',
            description:
              'El sistema debe calcular para cada empleado activo el salario proporcional a los días laborados (1 a 30), sumar horas extra, aplicar descuentos y aportes configurados, generar la boleta de pago y bloquear modificaciones una vez cerrado el periodo.',
            priority: 'high',
            templateCategory: 'crud',
            variables: [
              { name: 'Días laborados en el periodo', type: 'integer', min: 1, max: 30, unit: 'días' },
            ],
            scenarios: [
              {
                name: 'Cálculo con mes completo',
                type: 'positive',
                given: ['el empleado tiene salario 3000.00 y laboró 30 días sin descuentos'],
                when: ['el {ACTOR} calcula la planilla de marzo'],
                then: [
                  'el neto del empleado es 3000.00 menos los aportes configurados',
                  'se genera su boleta de pago',
                ],
              },
              {
                name: 'Salario proporcional por ingreso a mitad de mes',
                type: 'boundary',
                given: ['el empleado ingresó el 16/03/2026 con salario 3000.00'],
                when: ['el {ACTOR} calcula la planilla de marzo'],
                then: ['el sistema calcula 15 días laborados', 'el salario bruto es 1500.00'],
              },
              {
                name: 'Modificación de planilla cerrada',
                type: 'negative',
                given: ['la planilla de febrero está cerrada'],
                when: ['el {ACTOR} intenta registrar un ajuste en febrero'],
                then: ['el sistema rechaza el cambio con "La planilla del periodo ya fue cerrada"'],
              },
            ],
          },
          {
            key: 'hr_vacation_req',
            title: 'Solicitud y aprobación de vacaciones',
            description:
              'El sistema debe permitir al empleado solicitar entre 1 y 30 días de vacaciones sin superar su saldo disponible, enviar la solicitud a su supervisor para aprobación y descontar los días del saldo solo cuando sea aprobada.',
            priority: 'medium',
            templateCategory: 'state_flow',
            variables: [
              { name: 'Días de vacaciones solicitados', type: 'integer', min: 1, max: 30, unit: 'días' },
            ],
            scenarios: [
              {
                name: 'Solicitud aprobada descuenta el saldo',
                type: 'positive',
                given: ['el empleado tiene 20 días de saldo'],
                when: ['solicita 10 días y el supervisor aprueba'],
                then: ['la solicitud pasa a "aprobada"', 'el saldo del empleado queda en 10 días'],
              },
              {
                name: 'Solicitud mayor al saldo disponible',
                type: 'negative',
                given: ['el empleado tiene 5 días de saldo'],
                when: ['solicita 10 días'],
                then: ['el sistema rechaza la solicitud indicando el saldo disponible de 5 días'],
              },
              {
                name: 'Solicitud rechazada no afecta el saldo',
                type: 'alternative',
                given: ['el empleado tiene 20 días de saldo y solicitó 10'],
                when: ['el supervisor rechaza la solicitud'],
                then: ['el saldo permanece en 20 días', 'el empleado recibe la notificación con el motivo'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // GESTIÓN ACADÉMICA
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'academic',
    name: 'Gestión Académica',
    icon: '🎓',
    description: 'Matrícula con control de cupos, registro de calificaciones y control de asistencia.',
    keywords: [
      { term: 'estudiante', weight: 2 },
      { term: 'estudiantes', weight: 3 },
      { term: 'alumno', weight: 2 },
      { term: 'alumnos', weight: 3 },
      { term: 'docente', weight: 2 },
      { term: 'docentes', weight: 3 },
      { term: 'profesor', weight: 2 },
      { term: 'profesores', weight: 3 },
      { term: 'curso', weight: 2 },
      { term: 'cursos', weight: 3 },
      { term: 'matricula', weight: 3 },
      { term: 'matriculas', weight: 3 },
      { term: 'nota', weight: 1 },
      { term: 'notas', weight: 2 },
      { term: 'calificacion', weight: 2 },
      { term: 'calificaciones', weight: 3 },
      { term: 'asistencia', weight: 1 },
      { term: 'colegio', weight: 3 },
      { term: 'universidad', weight: 3 },
      { term: 'academia', weight: 3 },
      { term: 'instituto', weight: 3 },
      { term: 'aula', weight: 2 },
      { term: 'aulas', weight: 2 },
      { term: 'educativo', weight: 3 },
      { term: 'educacion', weight: 2 },
      { term: 'escolar', weight: 3 },
    ],
    preferredActors: ['estudiante', 'usuario'],
    secondaryActors: ['docente', 'administrador', 'recepcionista'],
    coveredEntities: ['curso', 'matricula', 'estudiante', 'docente'],
    implies: ['authentication', 'notifications', 'reporting'],
    templateCategory: 'crud',
    useCases: [
      {
        key: 'academic_enroll',
        name: 'Matricular estudiante en un curso',
        actor: 'secondary',
        priority: 'high',
        description:
          'Permite matricular a un estudiante en cursos con cupo disponible dentro del periodo académico vigente.',
        preconditions: ['El periodo de matrícula está abierto', 'El estudiante está registrado'],
        mainFlow: [
          'El {ACTOR} busca al estudiante por código',
          'Selecciona el periodo académico y los cursos a matricular',
          'El sistema valida cupos disponibles y ausencia de cruces de horario',
          'El sistema registra la matrícula y genera la constancia',
        ],
        alternativeFlows: [
          {
            name: 'Retiro de curso',
            condition: 'El estudiante solicita retirarse dentro del plazo',
            steps: ['El sistema marca la matrícula como retirada', 'Libera el cupo'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Cupo agotado',
            trigger: 'El curso no tiene vacantes',
            steps: ['El sistema impide la matrícula y ofrece lista de espera'],
            expectedError: 'El curso no tiene cupos disponibles',
          },
          {
            name: 'Cruce de horario',
            trigger: 'Dos cursos seleccionados comparten horario',
            steps: ['El sistema impide la matrícula e indica el cruce'],
            expectedError: 'Cruce de horario entre cursos',
          },
        ],
        postconditions: ['El estudiante figura matriculado y el cupo del curso disminuye'],
        requirements: [
          {
            key: 'academic_enroll_req',
            title: 'Matrícula con control de cupos y cruces de horario',
            description:
              'El sistema debe matricular estudiantes solo en cursos con cupos disponibles (1 a 200 por curso), impedir la doble matrícula en el mismo curso y periodo, detectar cruces de horario y generar la constancia de matrícula.',
            priority: 'high',
            templateCategory: 'crud',
            variables: [{ name: 'Cupos del curso', type: 'integer', min: 1, max: 200, unit: 'cupos' }],
            scenarios: [
              {
                name: 'Matrícula exitosa con cupo disponible',
                type: 'positive',
                given: ['el curso "Matemática I" tiene 5 cupos disponibles'],
                when: ['el {ACTOR} matricula al estudiante en "Matemática I"'],
                then: [
                  'el sistema registra la matrícula y genera la constancia',
                  'los cupos disponibles pasan a 4',
                ],
              },
              {
                name: 'Curso sin cupos',
                type: 'negative',
                given: ['el curso "Matemática I" tiene 0 cupos disponibles'],
                when: ['el {ACTOR} intenta matricular a un estudiante'],
                then: [
                  'el sistema rechaza la matrícula con "El curso no tiene cupos disponibles"',
                  'ofrece la lista de espera',
                ],
              },
              {
                name: 'Último cupo disponible',
                type: 'boundary',
                given: ['el curso tiene exactamente 1 cupo disponible'],
                when: ['el {ACTOR} matricula a un estudiante'],
                then: ['la matrícula se registra', 'el curso queda con 0 cupos y se marca como completo'],
              },
              {
                name: 'Doble matrícula en el mismo curso',
                type: 'negative',
                given: ['el estudiante ya está matriculado en "Matemática I" en el periodo 2026-I'],
                when: ['el {ACTOR} intenta matricularlo nuevamente en el mismo curso y periodo'],
                then: ['el sistema rechaza la operación indicando que ya está matriculado'],
              },
            ],
          },
        ],
      },
      {
        key: 'academic_grades',
        name: 'Registrar calificaciones y asistencia',
        actor: 'secondary',
        priority: 'high',
        description:
          'Permite al docente registrar notas por evaluación y la asistencia de cada sesión, con cálculo automático de promedios.',
        preconditions: ['El docente tiene el curso asignado', 'Existen estudiantes matriculados'],
        mainFlow: [
          'El docente selecciona el curso y la evaluación',
          'Ingresa la nota de cada estudiante en la escala configurada',
          'El sistema valida el rango y calcula el promedio ponderado',
          'El sistema publica las notas y notifica a los estudiantes',
        ],
        alternativeFlows: [
          {
            name: 'Corrección de nota',
            condition: 'El docente detecta un error después de publicar',
            steps: [
              'Registra la corrección con motivo',
              'El sistema conserva la nota anterior en el historial',
            ],
          },
        ],
        exceptionFlows: [
          {
            name: 'Nota fuera de rango',
            trigger: 'La nota ingresada es menor a 0 o mayor a 20',
            steps: ['El sistema rechaza el valor'],
            expectedError: 'La nota debe estar entre 0 y 20',
          },
        ],
        postconditions: ['Cada estudiante visualiza sus notas, asistencia y promedio actualizado'],
        requirements: [
          {
            key: 'academic_grades_req',
            title: 'Registro de notas por evaluación con cálculo de promedio',
            description:
              'El sistema debe aceptar notas enteras o con un decimal entre 0 y 20 por evaluación, calcular el promedio ponderado según los pesos configurados, publicar las notas a los estudiantes y conservar el historial de correcciones con motivo.',
            priority: 'high',
            templateCategory: 'form_validation',
            variables: [{ name: 'Nota de la evaluación', type: 'integer', min: 0, max: 20, unit: 'puntos' }],
            scenarios: [
              {
                name: 'Registro de notas y promedio ponderado',
                type: 'positive',
                given: ['el curso tiene dos evaluaciones con pesos 40% y 60%'],
                when: ['el docente registra 14 en la primera y 16 en la segunda para un estudiante'],
                then: ['el sistema calcula el promedio 15.2', 'el estudiante visualiza sus notas y promedio'],
              },
              {
                name: 'Nota en los límites 0 y 20',
                type: 'boundary',
                given: ['el docente registra notas de una evaluación'],
                when: ['ingresa 0 para un estudiante y 20 para otro'],
                then: ['el sistema acepta ambos valores'],
              },
              {
                name: 'Nota fuera de rango',
                type: 'negative',
                given: ['el docente registra notas de una evaluación'],
                when: ['ingresa 21'],
                then: ['el sistema rechaza el valor con "La nota debe estar entre 0 y 20"'],
              },
              {
                name: 'Corrección de nota con historial',
                type: 'alternative',
                given: ['la nota publicada del estudiante es 14'],
                when: ['el docente la corrige a 15 con motivo "error de digitación"'],
                then: ['la nota vigente es 15', 'el historial conserva la nota 14 con fecha y motivo'],
              },
            ],
          },
          {
            key: 'academic_attendance_req',
            title: 'Control de asistencia por sesión',
            description:
              'El sistema debe permitir al docente registrar la asistencia de cada estudiante por sesión (presente, tardanza, falta o justificado), calcular el porcentaje de asistencia acumulado y alertar cuando sea menor al 70%.',
            priority: 'medium',
            templateCategory: 'crud',
            variables: [
              { name: 'Porcentaje mínimo de asistencia', type: 'integer', min: 0, max: 100, unit: '%' },
            ],
            scenarios: [
              {
                name: 'Registro de asistencia de una sesión',
                type: 'positive',
                given: ['el curso tiene 25 estudiantes matriculados'],
                when: ['el docente marca 23 presentes y 2 faltas en la sesión del 15/03/2026'],
                then: [
                  'el sistema guarda la asistencia de los 25 estudiantes',
                  'actualiza el porcentaje acumulado de cada uno',
                ],
              },
              {
                name: 'Alerta por asistencia menor al 70%',
                type: 'boundary',
                given: ['el estudiante tiene 6 asistencias de 10 sesiones (60%)'],
                when: ['se registra la décima sesión'],
                then: ['el sistema genera la alerta de baja asistencia para el estudiante y el docente'],
              },
              {
                name: 'Justificación de inasistencia',
                type: 'alternative',
                given: ['el estudiante tiene una falta registrada'],
                when: ['presenta un justificante y el docente lo registra'],
                then: ['la falta cambia a "justificado"', 'no afecta el porcentaje de asistencia'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // GESTIÓN CLÍNICA
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'healthcare',
    name: 'Gestión Clínica y Pacientes',
    icon: '🏥',
    description: 'Registro de pacientes, historia clínica, atenciones médicas y emisión de recetas.',
    keywords: [
      { term: 'paciente', weight: 3 },
      { term: 'pacientes', weight: 3 },
      { term: 'medico', weight: 2 },
      { term: 'medicos', weight: 3 },
      { term: 'doctor', weight: 2 },
      { term: 'consulta medica', weight: 3 },
      { term: 'historia clinica', weight: 3 },
      { term: 'historias clinicas', weight: 3 },
      { term: 'clinica', weight: 3 },
      { term: 'hospital', weight: 3 },
      { term: 'diagnostico', weight: 3 },
      { term: 'receta', weight: 2 },
      { term: 'recetas', weight: 3 },
      { term: 'tratamiento', weight: 2 },
      { term: 'enfermeria', weight: 3 },
      { term: 'farmacia', weight: 2 },
      { term: 'laboratorio clinico', weight: 3 },
      { term: 'salud', weight: 2 },
      { term: 'veterinaria', weight: 3 },
      { term: 'odontologia', weight: 3 },
      { term: 'consultorio', weight: 3 },
    ],
    preferredActors: ['medico', 'enfermera', 'recepcionista'],
    secondaryActors: ['paciente'],
    coveredEntities: ['paciente', 'medico', 'receta', 'examen'],
    implies: ['authentication', 'booking', 'audit_log'],
    templateCategory: 'crud',
    useCases: [
      {
        key: 'health_patient',
        name: 'Registrar paciente y abrir historia clínica',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite registrar al paciente con sus datos de identificación y crear su historia clínica única.',
        preconditions: ['El {ACTOR} tiene sesión iniciada con permisos clínicos'],
        mainFlow: [
          'El {ACTOR} ingresa documento de identidad, nombres, fecha de nacimiento y contacto',
          'El sistema verifica que el documento no esté registrado',
          'Registra alergias, antecedentes y grupo sanguíneo',
          'El sistema crea la historia clínica con número único',
        ],
        alternativeFlows: [
          {
            name: 'Paciente menor de edad',
            condition: 'La edad es menor a 18 años',
            steps: ['El sistema exige los datos del apoderado responsable'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Documento duplicado',
            trigger: 'Ya existe un paciente con el documento',
            steps: ['El sistema muestra el paciente existente y evita el duplicado'],
            expectedError: 'El paciente ya está registrado',
          },
        ],
        postconditions: ['El paciente posee una historia clínica única y consultable'],
        requirements: [
          {
            key: 'health_patient_req',
            title: 'Registro de paciente con historia clínica única',
            description:
              'El sistema debe registrar pacientes con documento de identidad único de 8 dígitos, fecha de nacimiento que implique una edad entre 0 y 120 años, teléfono de contacto obligatorio y datos del apoderado cuando el paciente sea menor de 18 años, generando un número de historia clínica único.',
            priority: 'high',
            templateCategory: 'crud',
            variables: [{ name: 'Edad del paciente', type: 'integer', min: 0, max: 120, unit: 'años' }],
            scenarios: [
              {
                name: 'Registro exitoso de paciente adulto',
                type: 'positive',
                given: ['el documento 45678912 no está registrado'],
                when: [
                  'el {ACTOR} registra al paciente con fecha de nacimiento 10/05/1990 y teléfono 987654321',
                ],
                then: [
                  'el sistema crea la historia clínica con número único',
                  'calcula la edad automáticamente',
                ],
              },
              {
                name: 'Documento duplicado',
                type: 'negative',
                given: ['existe un paciente con documento 45678912'],
                when: ['el {ACTOR} intenta registrar otro con el mismo documento'],
                then: ['el sistema muestra "El paciente ya está registrado" y el enlace a su historia'],
              },
              {
                name: 'Documento con menos de 8 dígitos',
                type: 'validation',
                given: ['el {ACTOR} se encuentra en el formulario de pacientes'],
                when: ['ingresa el documento 4567891'],
                then: ['el sistema muestra "El documento debe tener 8 dígitos"'],
              },
              {
                name: 'Paciente menor de edad requiere apoderado',
                type: 'alternative',
                given: ['la fecha de nacimiento indica 12 años'],
                when: ['el {ACTOR} intenta guardar sin datos del apoderado'],
                then: ['el sistema exige nombre y teléfono del apoderado antes de guardar'],
              },
            ],
          },
        ],
      },
      {
        key: 'health_attention',
        name: 'Registrar atención médica y receta',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite al médico registrar la consulta, el diagnóstico, el tratamiento y emitir la receta en la historia clínica.',
        preconditions: ['El paciente tiene historia clínica', 'La cita está en estado confirmada'],
        mainFlow: [
          'El médico abre la historia clínica del paciente desde la cita',
          'Registra motivo de consulta, signos vitales y examen físico',
          'Registra el diagnóstico con código CIE-10 y el plan de tratamiento',
          'Emite la receta con medicamentos, dosis y duración',
          'El sistema firma la atención con fecha, hora y médico responsable',
        ],
        alternativeFlows: [
          {
            name: 'Orden de exámenes',
            condition: 'El diagnóstico requiere exámenes auxiliares',
            steps: ['El médico registra la orden', 'El sistema la envía al laboratorio'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Diagnóstico ausente',
            trigger: 'Se intenta cerrar la atención sin diagnóstico',
            steps: ['El sistema impide el cierre'],
            expectedError: 'El diagnóstico es obligatorio',
          },
        ],
        postconditions: ['La atención queda registrada de forma inmutable en la historia clínica'],
        requirements: [
          {
            key: 'health_attention_req',
            title: 'Registro de consulta con diagnóstico obligatorio',
            description:
              'El sistema debe registrar cada atención con motivo de consulta, signos vitales (temperatura entre 30.0 y 45.0 °C, presión arterial y frecuencia cardíaca), diagnóstico obligatorio codificado y plan de tratamiento, dejando la atención firmada e inmutable al cerrarla.',
            priority: 'high',
            templateCategory: 'form_validation',
            variables: [
              { name: 'Temperatura corporal', type: 'decimal', min: 30, max: 45, unit: '°C', decimals: 1 },
            ],
            scenarios: [
              {
                name: 'Atención registrada y firmada',
                type: 'positive',
                given: ['el paciente tiene una cita confirmada con el médico'],
                when: [
                  'el médico registra signos vitales, diagnóstico "J00 Rinofaringitis aguda" y tratamiento',
                  'cierra la atención',
                ],
                then: [
                  'la atención queda firmada con fecha, hora y médico',
                  'aparece en la historia clínica en orden cronológico',
                ],
              },
              {
                name: 'Cierre sin diagnóstico',
                type: 'negative',
                given: ['el médico registró signos vitales pero no diagnóstico'],
                when: ['intenta cerrar la atención'],
                then: ['el sistema impide el cierre con "El diagnóstico es obligatorio"'],
              },
              {
                name: 'Temperatura fuera de rango fisiológico',
                type: 'validation',
                given: ['el médico registra signos vitales'],
                when: ['ingresa temperatura 48.0'],
                then: ['el sistema rechaza el valor indicando el rango permitido de 30.0 a 45.0 °C'],
              },
            ],
          },
          {
            key: 'health_prescription_req',
            title: 'Emisión de receta médica',
            description:
              'El sistema debe emitir recetas asociadas a una atención con uno o más medicamentos, cada uno con dosis, frecuencia y duración de 1 a 365 días, generar el documento en PDF con firma del médico y permitir enviarlo al correo del paciente.',
            priority: 'medium',
            templateCategory: 'form_validation',
            variables: [
              { name: 'Duración del tratamiento', type: 'integer', min: 1, max: 365, unit: 'días' },
            ],
            scenarios: [
              {
                name: 'Receta emitida con dos medicamentos',
                type: 'positive',
                given: ['la atención tiene diagnóstico registrado'],
                when: [
                  'el médico agrega "Paracetamol 500 mg cada 8 horas por 5 días" y "Loratadina 10 mg cada 24 horas por 7 días" y emite la receta',
                ],
                then: [
                  'el sistema genera el PDF de la receta con firma del médico',
                  'la receta queda vinculada a la atención',
                ],
              },
              {
                name: 'Medicamento sin dosis',
                type: 'negative',
                given: ['el médico agrega un medicamento a la receta'],
                when: ['deja la dosis vacía e intenta emitir'],
                then: ['el sistema exige dosis, frecuencia y duración para cada medicamento'],
              },
              {
                name: 'Envío de receta digital al paciente',
                type: 'alternative',
                given: ['la receta fue emitida y el paciente tiene correo registrado'],
                when: ['el médico selecciona "Enviar al paciente"'],
                then: ['el sistema envía el PDF al correo del paciente y registra el envío'],
              },
            ],
          },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────
  // RESTAURANTE
  // ──────────────────────────────────────────────────────────────────
  {
    key: 'restaurant',
    name: 'Restaurante y Pedidos en Mesa',
    icon: '🍽️',
    description: 'Gestión de carta, toma de pedidos por mesa, envío a cocina y cierre de cuenta.',
    keywords: [
      { term: 'restaurante', weight: 3 },
      { term: 'restaurant', weight: 3 },
      { term: 'menu', weight: 2 },
      { term: 'carta', weight: 2 },
      { term: 'plato', weight: 2 },
      { term: 'platos', weight: 3 },
      { term: 'mesa', weight: 2 },
      { term: 'mesas', weight: 3 },
      { term: 'mozo', weight: 3 },
      { term: 'mesero', weight: 3 },
      { term: 'cocina', weight: 2 },
      { term: 'comanda', weight: 3 },
      { term: 'comandas', weight: 3 },
      { term: 'bebidas', weight: 2 },
      { term: 'cafeteria', weight: 3 },
      { term: 'pizzeria', weight: 3 },
      { term: 'polleria', weight: 3 },
      { term: 'cevicheria', weight: 3 },
    ],
    preferredActors: ['mesero', 'cajero', 'usuario'],
    secondaryActors: ['administrador', 'cocinero'],
    coveredEntities: ['plato', 'mesa'],
    implies: ['authentication', 'checkout_payments'],
    templateCategory: 'state_flow',
    useCases: [
      {
        key: 'restaurant_order',
        name: 'Tomar pedido en mesa y enviarlo a cocina',
        actor: 'primary',
        priority: 'high',
        description:
          'Permite al {ACTOR} registrar la comanda de una mesa, enviarla a cocina y cerrar la cuenta.',
        preconditions: ['La mesa está ocupada y asignada al {ACTOR}', 'La carta tiene platos disponibles'],
        mainFlow: [
          'El {ACTOR} selecciona la mesa y abre una nueva comanda',
          'Agrega platos y bebidas con cantidades y observaciones',
          'Envía la comanda a cocina',
          'Cocina marca los platos como preparados y el {ACTOR} los sirve',
          'El {ACTOR} solicita la cuenta y el cajero registra el pago',
        ],
        alternativeFlows: [
          {
            name: 'Dividir la cuenta',
            condition: 'Los comensales pagan por separado',
            steps: ['El sistema divide la cuenta por platos o en partes iguales', 'Registra cada pago'],
          },
          {
            name: 'Modificar antes de preparar',
            condition: 'El comensal cambia de opinión antes de que cocina inicie',
            steps: ['El {ACTOR} modifica la comanda', 'Cocina recibe la actualización'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Plato agotado',
            trigger: 'El plato seleccionado está marcado como agotado',
            steps: ['El sistema impide agregarlo y sugiere alternativas'],
            expectedError: 'Plato no disponible',
          },
        ],
        postconditions: ['La mesa queda libre tras el pago y la venta registrada en caja'],
        requirements: [
          {
            key: 'restaurant_order_req',
            title: 'Registro de comanda por mesa con envío a cocina',
            description:
              'El sistema debe registrar comandas por mesa con platos disponibles, cantidades de 1 a 50 por línea y observaciones, enviarlas a cocina con hora de envío, impedir agregar platos agotados y permitir modificar la comanda solo mientras cocina no haya iniciado la preparación.',
            priority: 'high',
            templateCategory: 'state_flow',
            variables: [
              { name: 'Cantidad por línea de comanda', type: 'integer', min: 1, max: 50, unit: 'unidades' },
            ],
            scenarios: [
              {
                name: 'Comanda enviada a cocina',
                type: 'positive',
                given: ['la mesa 5 está ocupada y el plato "Lomo saltado" está disponible'],
                when: ['el {ACTOR} agrega 2 "Lomo saltado" con observación "sin cebolla" y envía la comanda'],
                then: [
                  'cocina recibe la comanda con la hora de envío',
                  'la mesa muestra el estado "en preparación"',
                ],
              },
              {
                name: 'Plato agotado',
                type: 'negative',
                given: ['el plato "Ceviche" está marcado como agotado'],
                when: ['el {ACTOR} intenta agregarlo a la comanda'],
                then: [
                  'el sistema impide agregarlo con "Plato no disponible"',
                  'sugiere platos alternativos de la misma categoría',
                ],
              },
              {
                name: 'Modificación bloqueada tras iniciar preparación',
                type: 'negative',
                given: ['cocina inició la preparación de la comanda de la mesa 5'],
                when: ['el {ACTOR} intenta quitar un plato'],
                then: ['el sistema impide la modificación indicando que la preparación ya inició'],
              },
              {
                name: 'Cuenta dividida en partes iguales',
                type: 'alternative',
                given: ['la cuenta de la mesa 5 suma 120.00 y hay 3 comensales'],
                when: ['el {ACTOR} divide la cuenta en partes iguales'],
                then: ['el sistema genera 3 cobros de 40.00', 'la mesa se libera cuando los 3 se registran'],
              },
            ],
          },
        ],
      },
      {
        key: 'restaurant_menu',
        name: 'Administrar la carta del restaurante',
        actor: 'secondary',
        priority: 'medium',
        description: 'Permite al {ADMIN} mantener platos, precios, categorías y disponibilidad diaria.',
        preconditions: ['El {ADMIN} tiene permisos de gestión de carta'],
        mainFlow: [
          'El {ADMIN} registra un plato con nombre, categoría, descripción y precio',
          'Define los insumos asociados para control de inventario',
          'Publica el plato en la carta',
          'Actualiza la disponibilidad diaria marcando platos agotados',
        ],
        alternativeFlows: [
          {
            name: 'Menú del día',
            condition: 'El {ADMIN} configura una promoción diaria',
            steps: ['El sistema publica el menú con precio especial y vigencia de un día'],
          },
        ],
        exceptionFlows: [
          {
            name: 'Precio inválido',
            trigger: 'El precio es cero o negativo',
            steps: ['El sistema rechaza el guardado'],
            expectedError: 'El precio debe ser mayor a 0.00',
          },
        ],
        postconditions: ['La carta refleja platos, precios y disponibilidad vigentes'],
        requirements: [
          {
            key: 'restaurant_menu_req',
            title: 'Mantenimiento de platos, precios y disponibilidad',
            description:
              'El sistema debe permitir registrar platos con nombre (2 a 100 caracteres), categoría, precio entre 0.50 y 5000.00 y estado disponible o agotado, reflejando los cambios de disponibilidad de inmediato en la toma de pedidos.',
            priority: 'medium',
            templateCategory: 'crud',
            variables: [{ name: 'Precio del plato', type: 'decimal', min: 0.5, max: 5000, unit: 'USD' }],
            scenarios: [
              {
                name: 'Registro de plato en la carta',
                type: 'positive',
                given: ['el {ADMIN} se encuentra en la gestión de carta'],
                when: ['registra "Ají de gallina", categoría "fondo", precio 28.00 y lo publica'],
                then: ['el plato aparece disponible en la toma de pedidos'],
              },
              {
                name: 'Precio cero rechazado',
                type: 'validation',
                given: ['el {ADMIN} registra un plato'],
                when: ['ingresa precio 0.00'],
                then: ['el sistema muestra "El precio debe ser mayor a 0.00"'],
              },
              {
                name: 'Marcar plato como agotado',
                type: 'alternative',
                given: ['el plato "Ceviche" está disponible'],
                when: ['el {ADMIN} lo marca como agotado'],
                then: ['el plato deja de poder agregarse a nuevas comandas de inmediato'],
              },
            ],
          },
        ],
      },
    ],
  },
];
