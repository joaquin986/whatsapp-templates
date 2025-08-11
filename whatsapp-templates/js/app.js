/**
 * ===== APLICACIÓN PRINCIPAL =====
 * Gestión de Estados Local vs Global
 * WhatsApp Templates con JavaScript Moderno
 */

// ===== ESTADO GLOBAL (HU2) =====
let plantillasGlobales = []; // Array global para almacenar plantillas
let vistaActual = 'list'; // Estado adicional para la vista (HU4)

/**
 * Función para añadir plantilla al estado global (HU2)
 * @param {string} titulo - Título de la plantilla
 * @param {string} mensaje - Mensaje de la plantilla
 * @param {string} hashtag - Hashtag de la plantilla
 * @param {string} categoria - Categoría de la plantilla
 * @returns {Template} La plantilla creada
 */
function añadirPlantilla(titulo, mensaje, hashtag, categoria) {
    const nuevaPlantilla = new Template(titulo, mensaje, hashtag, categoria);
    plantillasGlobales.push(nuevaPlantilla);
    
    console.log('🟢 Plantilla añadida al estado global:', nuevaPlantilla.getEstadoLocal());
    actualizarVista();
    return nuevaPlantilla;
}

/**
 * Función para eliminar plantilla del estado global (HU2)
 * @param {string} id - ID de la plantilla a eliminar
 * @returns {Template|null} La plantilla eliminada o null si no se encontró
 */
function eliminarPlantilla(id) {
    const index = plantillasGlobales.findIndex(template => template.id == id);
    if (index !== -1) {
        const plantillaEliminada = plantillasGlobales.splice(index, 1)[0];
        console.log('🔴 Plantilla eliminada del estado global:', plantillaEliminada.getEstadoLocal());
        actualizarVista();
        return plantillaEliminada;
    }
    return null;
}

/**
 * Función para obtener el estado global completo (HU2)
 * @returns {Object} Estado completo de la aplicación
 */
function getEstadoGlobal() {
    return {
        totalPlantillas: plantillasGlobales.length,
        plantillas: plantillasGlobales.map(template => template.getEstadoLocal()),
        vistaActual: vistaActual,
        categorias: [...new Set(plantillasGlobales.map(t => t.categoria))],
        ultimaActualizacion: new Date()
    };
}

/**
 * Función para buscar plantillas por criterio
 * @param {string} criterio - Criterio de búsqueda
 * @param {string} valor - Valor a buscar
 * @returns {Array} Plantillas que coinciden con el criterio
 */
function buscarPlantillas(criterio, valor) {
    return plantillasGlobales.filter(template => {
        switch(criterio) {
            case 'titulo':
                return template.titulo.toLowerCase().includes(valor.toLowerCase());
            case 'categoria':
                return template.categoria.toLowerCase() === valor.toLowerCase();
            case 'hashtag':
                return template.hashtag.toLowerCase().includes(valor.toLowerCase());
            default:
                return false;
        }
    });
}

// ===== RENDERIZACIÓN (HU3) =====

/**
 * Función para renderizar todas las plantillas (HU3)
 * Muestra el estado global de todas las plantillas
 */
function renderizarTodasLasPlantillas() {
    const contenedor = document.getElementById('templatesDisplay');
    
    if (plantillasGlobales.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <div class="icon">📝</div>
                <h4>No hay plantillas creadas</h4>
                <p>Crea tu primera plantilla usando el formulario de arriba</p>
            </div>
        `;
        return;
    }

    // Renderizar según la vista actual (HU4)
    if (vistaActual === 'list') {
        contenedor.innerHTML = `
            <div class="templates-list">
                ${plantillasGlobales.map(template => template.render()).join('')}
            </div>
        `;
    } else {
        contenedor.innerHTML = `
            <div class="templates-grid">
                ${plantillasGlobales.map(template => template.renderGrid()).join('')}
            </div>
        `;
    }
}

/**
 * Función para actualizar toda la vista (estado global + local) (HU3)
 */
function actualizarVista() {
    renderizarTodasLasPlantillas();
    actualizarEstadisticas();
    
    // Log del estado global para debugging
    console.log('📊 Estado Global Actualizado:', getEstadoGlobal());
}

/**
 * Función para actualizar estadísticas del estado global
 */
function actualizarEstadisticas() {
    const contador = document.getElementById('templateCount');
    const total = plantillasGlobales.length;
    contador.textContent = `${total} plantilla${total !== 1 ? 's' : ''} creada${total !== 1 ? 's' : ''}`;
}

// ===== MANEJO DE EVENTOS =====

/**
 * Configurar event listeners cuando el DOM esté listo
 */
function configurarEventListeners() {
    // Manejo del formulario
    const formulario = document.getElementById('templateForm');
    formulario.addEventListener('submit', manejarSubmitFormulario);
    
    // Manejo de botones de vista (HU4)
    const botonesVista = document.querySelectorAll('.view-btn');
    botonesVista.forEach(btn => {
        btn.addEventListener('click', manejarCambioVista);
    });
}

/**
 * Manejar submit del formulario de creación
 * @param {Event} e - Evento del formulario
 */
function manejarSubmitFormulario(e) {
    e.preventDefault();
    
    const titulo = document.getElementById('titulo').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();
    const hashtag = document.getElementById('hashtag').value.trim();
    const categoria = document.getElementById('categoria').value;
    
    if (titulo && mensaje && hashtag && categoria) {
        // Añadir # al hashtag si no lo tiene
        const hashtagFormateado = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
        
        añadirPlantilla(titulo, mensaje, hashtagFormateado, categoria);
        
        // Limpiar formulario
        e.target.reset();
        
        console.log('✅ Nueva plantilla creada exitosamente');
    } else {
        console.log('❌ Error: Faltan campos requeridos');
        alert('Por favor, completa todos los campos requeridos');
    }
}

/**
 * Manejar cambio de vista (HU4)
 * @param {Event} e - Evento del botón de vista
 */
function manejarCambioVista(e) {
    // Remover clase active de todos los botones
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    
    // Añadir clase active al botón clickeado
    e.target.classList.add('active');
    
    // Cambiar vista actual
    vistaActual = e.target.dataset.view;
    
    // Renderizar con la nueva vista
    renderizarTodasLasPlantillas();
    
    console.log('👁️ Vista cambiada a:', vistaActual);
}

// ===== INICIALIZACIÓN =====

/**
 * Función de inicialización de