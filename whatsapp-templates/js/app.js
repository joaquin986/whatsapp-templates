/**
 * ===== APLICACIÓN PRINCIPAL CON PERSISTENCIA =====
 * Interfaz de usuario que consume el Store con LocalStorage
 * Implementa las HU1, HU2, HU3 con persistencia automática
 */

// ===== VARIABLES DE APLICACIÓN =====
let vistaActual = 'list'; // Estado de vista (lista/grilla)
let cancelarSuscripcionStore = null; // Para cancelar suscripción al Store

// ===== RENDERIZACIÓN DE UI =====

/**
 * Renderizar todas las plantillas desde el Store
 * Lee desde el estado centralizado y actualiza el DOM
 */
function renderizarPlantillasDesdeStore() {
    const contenedor = document.getElementById('templatesDisplay');
    const plantillas = obtenerPlantillasParaRender(); // Leer desde Store
    
    // Verificar si está vacío
    if (storeEstaVacio()) {
        mostrarEstadoVacio(contenedor);
        return;
    }

    // Renderizar según la vista actual
    if (vistaActual === 'list') {
        contenedor.innerHTML = `
            <div class="templates-list">
                ${plantillas.map(template => template.render()).join('')}
            </div>
        `;
    } else {
        contenedor.innerHTML = `
            <div class="templates-grid">
                ${plantillas.map(template => template.renderGrid()).join('')}
            </div>
        `;
    }

    console.log('🔄 UI: Plantillas renderizadas desde Store');
}

/**
 * Mostrar estado vacío con mensaje dinámico
 * @param {HTMLElement} contenedor - Contenedor donde mostrar el mensaje
 */
function mostrarEstadoVacio(contenedor) {
    const infoStorage = Store.getEstadisticas().infoLocalStorage;
    const tieneStorage = infoStorage && infoStorage.existe;
    
    contenedor.innerHTML = `
        <div class="empty-state">
            <div class="icon">📝</div>
            <h4>No hay plantillas guardadas</h4>
            <p>El Store está vacío. Crea tu primera plantilla usando el formulario de arriba</p>
            <small style="color: #999; margin-top: 10px;">
                Estado: ${tieneStorage ? 'LocalStorage vacío' : 'Sin datos guardados'} | 0 plantillas
            </small>
        </div>
    `;
}

/**
 * Actualizar estadísticas en la UI
 */
function actualizarEstadisticasUI() {
    const contador = document.getElementById('templateCount');
    const estadisticas = Store.getEstadisticas();
    const infoStorage = estadisticas.infoLocalStorage;
    
    // Texto principal
    contador.textContent = `${estadisticas.total} plantilla${estadisticas.total !== 1 ? 's' : ''} en Store`;
    
    // Información adicional en tooltip
    if (estadisticas.total > 0) {
        const categoriasInfo = Object.entries(estadisticas.categorias)
            .map(([cat, num]) => `${cat}: ${num}`)
            .join(', ');
        
        const storageInfo = infoStorage && infoStorage.existe 
            ? `LocalStorage: ${infoStorage.tamaño}` 
            : 'Sin persistencia';
        
        contador.title = `Categorías: ${categoriasInfo}\n${storageInfo}`;
    }
    
    // Actualizar indicador de persistencia
    actualizarIndicadorPersistencia(infoStorage);
}

/**
 * Actualizar indicador visual de persistencia
 * @param {Object} infoStorage - Información del storage
 */
function actualizarIndicadorPersistencia(infoStorage) {
    const indicador = document.querySelector('.state-indicator');
    if (indicador) {
        if (infoStorage && infoStorage.existe) {
            indicador.textContent = `💾 ${infoStorage.plantillas} guardadas`;
            indicador.style.background = 'linear-gradient(45deg, #28a745, #20c997)';
        } else {
            indicador.textContent = 'Sin persistencia';
            indicador.style.background = 'linear-gradient(45deg, #ffc107, #fd7e14)';
        }
    }
}

/**
 * Actualizar toda la interfaz
 */
function actualizarInterfazCompleta() {
    renderizarPlantillasDesdeStore();
    actualizarEstadisticasUI();
}

// ===== MANEJO DE FORMULARIO =====

/**
 * Manejar envío del formulario para agregar plantilla
 * @param {Event} e - Evento del formulario
 */
function manejarAgregarPlantilla(e) {
    e.preventDefault();
    
    // Obtener datos del formulario
    const titulo = document.getElementById('titulo').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();
    const hashtag = document.getElementById('hashtag').value.trim();
    const categoria = document.getElementById('categoria').value;
    
    // Validar campos
    if (!titulo || !mensaje || !hashtag || !categoria) {
        mostrarNotificacion('Por favor, completa todos los campos requeridos', 'error');
        return;
    }
    
    // Formatear hashtag
    const hashtagFormateado = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    
    // Agregar al Store (auto-guardado se dispara automáticamente)
    const exito = crearYAgregarPlantilla(titulo, mensaje, hashtagFormateado, categoria);
    
    if (exito) {
        // Limpiar formulario
        e.target.reset();
        
        // El mensaje de éxito se mostrará desde el sistema de persistencia
        console.log('✅ Plantilla agregada desde UI al Store con persistencia');
    } else {
        mostrarNotificacion('Error al agregar la plantilla', 'error');
    }
}

// ===== MANEJO DE ELIMINACIÓN =====

/**
 * Eliminar plantilla desde la UI
 * @param {string} id - ID de la plantilla a eliminar
 */
function eliminarPlantillaDesdeUI(id) {
    // Confirmar eliminación
    if (!confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
        return;
    }
    
    // Eliminar del Store (auto-guardado se dispara automáticamente)
    const exito = Store.eliminarPlantilla(id);
    
    if (exito) {
        // El mensaje de éxito se mostrará desde el sistema de persistencia
        console.log('✅ Plantilla eliminada desde UI del Store con persistencia');
    } else {
        mostrarNotificacion('Error al eliminar la plantilla', 'error');
    }
}

// Hacer función global para uso en onclick
window.eliminarPlantilla = eliminarPlantillaDesdeUI;

// ===== FUNCIÓN RESET COMPLETA (HU3) =====

/**
 * Eliminar todas las plantillas (HU3)
 * Botón para reset completo de Store y LocalStorage
 */
function eliminarTodasLasPlantillas() {
    // Usar la función de reseteo completo de persistencia
    const exito = resetearAplicacionCompleta();
    
    if (exito) {
        console.log('🧹 Todas las plantillas eliminadas desde UI');
        
        // Actualizar interfaz después de un breve delay
        setTimeout(() => {
            actualizarInterfazCompleta();
        }, 100);
    }
}

// Hacer función global para uso en onclick
window.eliminarTodasLasPlantillas = eliminarTodasLasPlantillas;

// ===== MANEJO DE VISTAS =====

/**
 * Cambiar vista entre lista y grilla
 * @param {Event} e - Evento del botón
 */
function manejarCambioVista(e) {
    // Actualizar botones activos
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Cambiar vista
    vistaActual = e.target.dataset.view;
    
    // Re-renderizar con nueva vista
    renderizarPlantillasDesdeStore();
    
    console.log('👁️ Vista cambiada a:', vistaActual);
}

// ===== MENSAJES DE NOTIFICACIÓN =====

/**
 * Mostrar notificación en la UI
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de notificación ('success' | 'error' | 'info' | 'warning')
 * @returns {HTMLElement} Elemento de notificación creado
 */
function mostrarNotificacion(mensaje, tipo = 'success') {
    // Remover notificaciones anteriores
    const notificacionesAnteriores = document.querySelectorAll('.notification');
    notificacionesAnteriores.forEach(n => n.remove());
    
    // Crear nueva notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notification notification-${tipo}`;
    notificacion.innerHTML = `
        <span>${mensaje}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Colores según tipo
    const colores = {
        success: '#25d366',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    // Estilos inline para la notificación
    Object.assign(notificacion.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        color: tipo === 'warning' ? '#212529' : 'white',
        fontWeight: '600',
        zIndex: '1000',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        minWidth: '300px',
        backgroundColor: colores[tipo] || colores.info,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'slideInRight 0.3s ease'
    });
    
    // Estilo del botón de cierre
    const botonCerrar = notificacion.querySelector('.notification-close');
    Object.assign(botonCerrar.style, {
        background: 'rgba(255,255,255,0.2)',
        border: 'none',
        color: tipo === 'warning' ? '#212529' : 'white',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    });
    
    document.body.appendChild(notificacion);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notificacion && notificacion.parentElement) {
            notificacion.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notificacion.remove(), 300);
        }
    }, 5000);
    
    return notificacion;
}

// Hacer función disponible globalmente para persistencia
window.mostrarNotificacion = mostrarNotificacion;

// ===== SUSCRIPCIÓN AL STORE =====

/**
 * Configurar suscripción a cambios del Store
 * El Store notificará cuando haya cambios y actualizaremos la UI
 */
function configurarSuscripcionStore() {
    cancelarSuscripcionStore = Store.suscribirse((evento) => {
        console.log('📢 Store notificó cambio:', evento.tipo, evento.datos);
        
        // Actualizar interfaz cuando el Store cambie
        actualizarInterfazCompleta();
        
        // Manejar eventos específicos
        switch (evento.tipo) {
            case 'STORE_INICIALIZADO':
                console.log('🚀 UI: Store inicializado con persistencia');
                mostrarNotificacion(
                    `Store inicializado: ${evento.datos.plantillas} plantillas desde ${evento.datos.fuente}`,
                    'info'
                );
                break;
            case 'PLANTILLA_AGREGADA':
                console.log('🟢 UI: Nueva plantilla detectada en Store');
                break;
            case 'PLANTILLA_ELIMINADA':
                console.log('🔴 UI: Plantilla eliminada detectada en Store');
                break;
            case 'TODAS_ELIMINADAS':
                console.log('🧹 UI: Todas las plantillas eliminadas del Store');
                break;
            case 'RECARGADO_DESDE_PERSISTENCIA':
                console.log('🔄 UI: Store recargado desde persistencia');
                mostrarNotificacion('Datos recargados desde LocalStorage', 'info');
                break;
        }
    });
    
    console.log('🔔 Suscripción al Store configurada');
}

// ===== INICIALIZACIÓN =====

/**
 * Configurar todos los event listeners
 */
function configurarEventListeners() {
    // Formulario de nueva plantilla
    const formulario = document.getElementById('templateForm');
    if (formulario) {
        formulario.addEventListener('submit', manejarAgregarPlantilla);
    }
    
    // Botones de cambio de vista
    const botonesVista = document.querySelectorAll('.view-btn');
    botonesVista.forEach(btn => {
        btn.addEventListener('click', manejarCambioVista);
    });
    
    // Botón de eliminar todo (si existe)
    const botonEliminarTodo = document.getElementById('btnEliminarTodo');
    if (botonEliminarTodo) {
        botonEliminarTodo.addEventListener('click', eliminarTodasLasPlantillas);
    }
}

/**
 * Inicializar aplicación con persistencia
 */
function inicializarAplicacionConPersistencia() {
    console.log('🚀 Inicializando aplicación con Store y Persistencia...');
    
    try {
        // 1. Configurar event listeners
        configurarEventListeners();
        
        // 2. Inicializar Store con datos de persistencia
        Store.inicializar();
        
        // 3. Configurar Store con persistencia automática
        configurarStoreConPersistencia();
        
        // 4. Configurar suscripción al Store para UI
        configurarSuscripcionStore();
        
        // 5. Renderización inicial
        actualizarInterfazCompleta();
        
        // 6. Log del estado inicial
        const estadisticas = Store.getEstadisticas();
        console.log('📊 Estado inicial:', estadisticas);
        console.log('🎯 Aplicación lista con persistencia completa');
        
    } catch (error) {
        console.error('❌ Error al inicializar aplicación:', error.message);
        mostrarNotificacion('Error al inicializar la aplicación', 'error');
    }
}

/**
 * Limpiar recursos antes de cerrar
 */
function limpiarRecursos() {
    if (cancelarSuscripcionStore) {
        cancelarSuscripcionStore();
        console.log('🔌 Suscripción al Store cancelada');
    }
}

// ===== EVENTOS DE CICLO DE VIDA =====

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarAplicacionConPersistencia);

// Limpiar recursos antes de cerrar
window.addEventListener('beforeunload', limpiarRecursos);

// ===== FUNCIONES DE DEBUG =====

// Funciones globales para debugging
window.debugUI = {
    renderizar: actualizarInterfazCompleta,
    cambiarVista: (vista) => {
        vistaActual = vista;
        renderizarPlantillasDesdeStore();
    },
    mostrarNotificacion: mostrarNotificacion,
    eliminarTodas: eliminarTodasLasPlantillas,
    estadoVista: () => ({ 
        vistaActual, 
        suscrito: !!cancelarSuscripcionStore,
        persistenciaHabilitada: typeof Persistence !== 'undefined'
    }),
    recargarDesdePersistencia: () => {
        Store.recargarDesdePersistencia();
        actualizarInterfazCompleta();
    }
};

console.log('🔧 UI Debug disponible: window.debugUI');