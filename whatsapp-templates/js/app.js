/**
 * ===== APLICACIÓN PRINCIPAL CON STORE =====
 * Interfaz de usuario que consume el Store centralizado
 * Implementa las HU1, HU2, HU3 con patrón Store
 */

// ===== VARIABLES DE APLICACIÓN =====
let vistaActual = 'list'; // Estado de vista (lista/grilla)
let cancelarSuscripcionStore = null; // Para cancelar suscripción al Store

// ===== RENDERIZACIÓN DE UI (HU1) =====

/**
 * Renderizar todas las plantillas desde el Store (HU1)
 * Lee desde el estado centralizado y actualiza el DOM
 */
function renderizarPlantillasDesdeStore() {
    const contenedor = document.getElementById('templatesDisplay');
    const plantillas = obtenerPlantillasParaRender(); // Leer desde Store
    
    // Verificar si está vacío (Logro Adicional 1)
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
 * Mostrar estado vacío con mensaje dinámico (Logro Adicional 1)
 * @param {HTMLElement} contenedor - Contenedor donde mostrar el mensaje
 */
function mostrarEstadoVacio(contenedor) {
    contenedor.innerHTML = `
        <div class="empty-state">
            <div class="icon">📝</div>
            <h4>No hay plantillas guardadas</h4>
            <p>El Store está vacío. Crea tu primera plantilla usando el formulario de arriba</p>
            <small style="color: #999; margin-top: 10px;">Estado centralizado: 0 plantillas</small>
        </div>
    `;
}

/**
 * Actualizar estadísticas en la UI
 */
function actualizarEstadisticasUI() {
    const contador = document.getElementById('templateCount');
    const estadisticas = Store.getEstadisticas();
    
    contador.textContent = `${estadisticas.total} plantilla${estadisticas.total !== 1 ? 's' : ''} en Store`;
    
    // Mostrar categorías si hay plantillas
    if (estadisticas.total > 0) {
        const categoriasInfo = Object.entries(estadisticas.categorias)
            .map(([cat, num]) => `${cat}: ${num}`)
            .join(', ');
        
        contador.title = `Categorías: ${categoriasInfo}`;
    }
}

/**
 * Actualizar toda la interfaz
 */
function actualizarInterfazCompleta() {
    renderizarPlantillasDesdeStore();
    actualizarEstadisticasUI();
}

// ===== MANEJO DE FORMULARIO (HU2) =====

/**
 * Manejar envío del formulario para agregar plantilla (HU2)
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
        mostrarMensajeError('Por favor, completa todos los campos requeridos');
        return;
    }
    
    // Formatear hashtag
    const hashtagFormateado = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    
    // Agregar al Store (HU2)
    const exito = crearYAgregarPlantilla(titulo, mensaje, hashtagFormateado, categoria);
    
    if (exito) {
        // Limpiar formulario
        e.target.reset();
        
        // Mostrar mensaje de éxito
        mostrarMensajeExito('Plantilla agregada exitosamente al Store');
        
        console.log('✅ Plantilla agregada desde UI al Store');
    } else {
        mostrarMensajeError('Error al agregar la plantilla al Store');
    }
}

// ===== MANEJO DE ELIMINACIÓN (HU3) =====

/**
 * Eliminar plantilla desde la UI (HU3)
 * @param {string} id - ID de la plantilla a eliminar
 */
function eliminarPlantillaDesdeUI(id) {
    // Confirmar eliminación
    if (!confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
        return;
    }
    
    // Eliminar del Store (HU3)
    const exito = Store.eliminarPlantilla(id);
    
    if (exito) {
        // Mostrar mensaje temporal de éxito (Logro Adicional 2)
        mostrarMensajeExitoTemporal('Plantilla eliminada con éxito', 3000);
        
        console.log('✅ Plantilla eliminada desde UI del Store');
    } else {
        mostrarMensajeError('Error al eliminar la plantilla del Store');
    }
}

// Hacer función global para uso en onclick
window.eliminarPlantilla = eliminarPlantillaDesdeUI;

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
 * Mostrar mensaje de éxito
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarMensajeExito(mensaje) {
    mostrarNotificacion(mensaje, 'success');
}

/**
 * Mostrar mensaje de éxito temporal (Logro Adicional 2)
 * @param {string} mensaje - Mensaje a mostrar
 * @param {number} duracion - Duración en milisegundos
 */
function mostrarMensajeExitoTemporal(mensaje, duracion = 3000) {
    const notificacion = mostrarNotificacion(mensaje, 'success');
    
    // Auto-remover después de la duración especificada
    setTimeout(() => {
        if (notificacion && notificacion.parentElement) {
            notificacion.remove();
        }
    }, duracion);
}

/**
 * Mostrar mensaje de error
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarMensajeError(mensaje) {
    mostrarNotificacion(mensaje, 'error');
}

/**
 * Mostrar notificación en la UI
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de notificación ('success' | 'error')
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
    
    // Estilos inline para la notificación
    Object.assign(notificacion.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        zIndex: '1000',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        minWidth: '300px',
        backgroundColor: tipo === 'success' ? '#25d366' : '#dc3545',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'slideInRight 0.3s ease'
    });
    
    // Estilo del botón de cierre
    const botonCerrar = notificacion.querySelector('.notification-close');
    Object.assign(botonCerrar.style, {
        background: 'rgba(255,255,255,0.2)',
        border: 'none',
        color: 'white',
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
    
    return notificacion;
}

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
        
        // Manejar eventos específicos si es necesario
        switch (evento.tipo) {
            case 'PLANTILLA_AGREGADA':
                console.log('🟢 UI: Nueva plantilla detectada en Store');
                break;
            case 'PLANTILLA_ELIMINADA':
                console.log('🔴 UI: Plantilla eliminada detectada en Store');
                break;
            case 'TODAS_ELIMINADAS':
                console.log('🧹 UI: Todas las plantillas eliminadas del Store');
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
    // Formulario de nueva plantilla (HU2)
    const formulario = document.getElementById('templateForm');
    if (formulario) {
        formulario.addEventListener('submit', manejarAgregarPlantilla);
    }
    
    // Botones de cambio de vista
    const botonesVista = document.querySelectorAll('.view-btn');
    botonesVista.forEach(btn => {
        btn.addEventListener('click', manejarCambioVista);
    });
}

/**
 * Inicializar aplicación
 */
function inicializarAplicacion() {
    console.log('🚀 Inicializando aplicación con Store...');
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Configurar suscripción al Store
    configurarSuscripcionStore();
    
    // Renderización inicial desde Store (HU1)
    actualizarInterfazCompleta();
    
    // Log del estado inicial
    console.log('📊 Estado inicial del Store:', Store.getEstadisticas());
    console.log('🎯 Aplicación lista - usando patrón Store para gestión de estado');
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
document.addEventListener('DOMContentLoaded', inicializarAplicacion);

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
    mostrarExito: (msg) => mostrarMensajeExito(msg),
    mostrarError: (msg) => mostrarMensajeError(msg),
    estadoVista: () => ({ vistaActual, suscrito: !!cancelarSuscripcionStore })
};

console.log('🔧 UI Debug disponible: window.debugUI');