/**
 * app.js - Aplicación principal con persistencia y sincronización
 * Manejo de la interfaz con guardado automático y confirmaciones
 */

// Variables globales
let plantillaEditandoId = null;
let ultimaPlantillaEliminada = null; // Para el Logro 2

/**
 * Inicializar aplicación
 */
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar persistencia
    inicializarPersistencia();
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Actualizar interfaz inicial
    actualizarInterfaz();
    
    // Mostrar estado de almacenamiento (Logro 1)
    mostrarEstadoAlmacenamiento();
    
    console.log('🚀 Aplicación WhatsApp Templates iniciada');
});

/**
 * Configurar todos los event listeners
 */
function configurarEventListeners() {
    // Formulario de plantillas
    const form = document.getElementById('template-form');
    if (form) {
        form.addEventListener('submit', manejarEnvioFormulario);
    }
    
    // Botón cancelar edición
    const btnCancelar = document.getElementById('btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarEdicion);
    }
    
    // Botón eliminar todo (HU3)
    const btnEliminarTodo = document.getElementById('btn-eliminar-todo');
    if (btnEliminarTodo) {
        btnEliminarTodo.addEventListener('click', resetearPlantillas);
    }
    
    // Botón recuperar última eliminada (Logro 2)
    const btnRecuperar = document.getElementById('btn-recuperar');
    if (btnRecuperar) {
        btnRecuperar.addEventListener('click', recuperarUltimaEliminada);
    }
    
    // Guardado automático en campos del formulario (HU1 Lab 16)
    const inputs = ['nombre', 'contenido', 'categoria'];
    inputs.forEach(campo => {
        const input = document.getElementById(campo);
        if (input) {
            input.addEventListener('input', manejarCambioAutomatico);
            input.addEventListener('blur', manejarCambioAutomatico);
        }
    });
}

/**
 * HU1 Lab 16: Guardado automático al editar plantillas
 */
function manejarCambioAutomatico(event) {
    if (plantillaEditandoId) {
        // Debounce para evitar guardado excesivo
        clearTimeout(window.autoSaveTimeout);
        window.autoSaveTimeout = setTimeout(() => {
            guardarEdicionAutomatica();
        }, 1000); // Esperar 1 segundo después del último cambio
    }
}

/**
 * Guardar automáticamente los cambios durante la edición
 */
function guardarEdicionAutomatica() {
    if (!plantillaEditandoId) return;
    
    const nombre = document.getElementById('nombre').value.trim();
    const contenido = document.getElementById('contenido').value.trim();
    const categoria = document.getElementById('categoria').value.trim();
    
    if (nombre && contenido) {
        const plantillaActualizada = Store.actualizar(plantillaEditandoId, {
            nombre,
            contenido,
            categoria
        });
        
        if (plantillaActualizada) {
            // HU2 Lab 16: Sincronización instantánea del Store y UI
            actualizarInterfaz();
            mostrarMensajePersistencia('💾 Guardado automático', 'info');
        }
    }
}

/**
 * Manejar envío del formulario
 */
function manejarEnvioFormulario(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const contenido = document.getElementById('contenido').value.trim();
    const categoria = document.getElementById('categoria').value.trim();
    
    if (!nombre || !contenido) {
        mostrarMensajePersistencia('⚠️ Nombre y contenido son obligatorios', 'warning');
        return;
    }
    
    if (plantillaEditandoId) {
        // Actualizar plantilla existente
        const plantillaActualizada = Store.actualizar(plantillaEditandoId, {
            nombre,
            contenido,
            categoria
        });
        
        if (plantillaActualizada) {
            mostrarMensajePersistencia('✅ Plantilla actualizada', 'success');
        }
    } else {
        // Crear nueva plantilla
        const nuevaPlantilla = new Template(nombre, contenido, categoria);
        Store.agregar(nuevaPlantilla);
        mostrarMensajePersistencia('✅ Plantilla creada', 'success');
    }
    
    // HU2 Lab 16: Sincronización instantánea
    limpiarFormulario();
    actualizarInterfaz();
    mostrarEstadoAlmacenamiento();
}

/**
 * HU2: Actualizar interfaz sincronizada con el Store
 */
function actualizarInterfaz() {
    const lista = document.getElementById('templates-list');
    if (!lista) return;
    
    const plantillas = Store.obtenerTodas();
    
    if (plantillas.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                <p>📝 No hay plantillas guardadas</p>
                <p class="text-muted">Crea tu primera plantilla usando el formulario</p>
            </div>
        `;
        return;
    }
    
    lista.innerHTML = plantillas.map(plantilla => `
        <div class="template-item" data-id="${plantilla.id}">
            <div class="template-header">
                <h3>${escapeHtml(plantilla.nombre)}</h3>
                <div class="template-actions">
                    <button onclick="editarPlantilla(${plantilla.id})" class="btn-edit" title="Editar">
                        ✏️
                    </button>
                    <button onclick="confirmarEliminarPlantilla(${plantilla.id})" class="btn-delete" title="Eliminar">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="template-content">
                <p>${escapeHtml(plantilla.contenido)}</p>
                ${plantilla.categoria ? `<span class="template-category">${escapeHtml(plantilla.categoria)}</span>` : ''}
            </div>
            <div class="template-meta">
                <small>Creada: ${formatearFecha(plantilla.fechaCreacion)}</small>
                ${plantilla.fechaModificacion !== plantilla.fechaCreacion ? 
                    `<small>Modificada: ${formatearFecha(plantilla.fechaModificacion)}</small>` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * HU3 Lab 16: Confirmación previa al eliminar plantilla
 */
function confirmarEliminarPlantilla(id) {
    const plantilla = Store.obtenerPorId(id);
    if (!plantilla) return;
    
    const confirmacion = confirm(
        `¿Estás seguro de que deseas eliminar la plantilla "${plantilla.nombre}"?\n\n` +
        'Esta acción no se puede deshacer.'
    );
    
    if (confirmacion) {
        ultimaPlantillaEliminada = plantilla; // Para recuperación (Logro 2)
        const eliminada = Store.eliminar(id);
        
        if (eliminada) {
            // HU2 Lab 16: Sincronización instantánea
            actualizarInterfaz();
            mostrarEstadoAlmacenamiento();
            mostrarMensajePersistencia('🗑️ Plantilla eliminada', 'info');
            
            // Mostrar botón de recuperación
            mostrarBotonRecuperacion();
        }
    }
}

/**
 * Editar plantilla
 */
function editarPlantilla(id) {
    const plantilla = Store.obtenerPorId(id);
    if (!plantilla) return;
    
    plantillaEditandoId = id;
    
    // Llenar formulario
    document.getElementById('nombre').value = plantilla.nombre;
    document.getElementById('contenido').value = plantilla.contenido;
    document.getElementById('categoria').value = plantilla.categoria || '';
    
    // Cambiar texto del botón
    const btnSubmit = document.querySelector('#template-form button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.textContent = 'Actualizar Plantilla';
    }
    
    // Mostrar botón cancelar
    const btnCancelar = document.getElementById('btn-cancelar');
    if (btnCancelar) {
        btnCancelar.style.display = 'inline-block';
    }
    
    // Scroll al formulario
    document.getElementById('template-form').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Cancelar edición
 */
function cancelarEdicion() {
    limpiarFormulario();
    mostrarMensajePersistencia('❌ Edición cancelada', 'info');
}

/**
 * Limpiar formulario
 */
function limpiarFormulario() {
    plantillaEditandoId = null;
    
    document.getElementById('nombre').value = '';
    document.getElementById('contenido').value = '';
    document.getElementById('categoria').value = '';
    
    const btnSubmit = document.querySelector('#template-form button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.textContent = 'Agregar Plantilla';
    }
    
    const btnCancelar = document.getElementById('btn-cancelar');
    if (btnCancelar) {
        btnCancelar.style.display = 'none';
    }
    
    // Limpiar timeout de guardado automático
    clearTimeout(window.autoSaveTimeout);
}

/**
 * Logro 1: Mostrar estado de almacenamiento
 */
function mostrarEstadoAlmacenamiento() {
    const estadoContainer = document.getElementById('storage-status');
    if (!estadoContainer) return;
    
    const stats = Store.obtenerEstadisticas();
    const fechaUltimaModificacion = stats.ultimaModificacion 
        ? new Date(stats.ultimaModificacion).toLocaleString()
        : 'Nunca';
    
    estadoContainer.innerHTML = `
        <div class="storage-info">
            📊 ${stats.total} plantillas guardadas | 
            💾 Última actualización: ${fechaUltimaModificacion}
        </div>
    `;
}

/**
 * Logro 2: Recuperar última plantilla eliminada
 */
function recuperarUltimaEliminada() {
    if (!ultimaPlantillaEliminada) {
        mostrarMensajePersistencia('ℹ️ No hay plantillas para recuperar', 'info');
        return;
    }
    
    // Crear nueva plantilla con los datos de la eliminada
    const plantillaRecuperada = new Template(
        ultimaPlantillaEliminada.nombre + ' (Recuperada)',
        ultimaPlantillaEliminada.contenido,
        ultimaPlantillaEliminada.categoria
    );
    
    Store.agregar(plantillaRecuperada);
    ultimaPlantillaEliminada = null; // Limpiar referencia
    
    // Sincronización instantánea
    actualizarInterfaz();
    mostrarEstadoAlmacenamiento();
    ocultarBotonRecuperacion();
    
    mostrarMensajePersistencia('🔄 Plantilla recuperada', 'success');
}

/**
 * Mostrar botón de recuperación
 */
function mostrarBotonRecuperacion() {
    const btnRecuperar = document.getElementById('btn-recuperar');
    if (btnRecuperar && ultimaPlantillaEliminada) {
        btnRecuperar.style.display = 'inline-block';
        btnRecuperar.textContent = `🔄 Recuperar "${ultimaPlantillaEliminada.nombre}"`;
    }
}

/**
 * Ocultar botón de recuperación
 */
function ocultarBotonRecuperacion() {
    const btnRecuperar = document.getElementById('btn-recuperar');
    if (btnRecuperar) {
        btnRecuperar.style.display = 'none';
    }
}

/**
 * Utilidades
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}