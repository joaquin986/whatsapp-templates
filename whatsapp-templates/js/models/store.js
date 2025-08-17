/**
 * ===== STORE - GESTIÓN CENTRALIZADA DE ESTADO =====
 * Patrón Store para manejar el estado global de plantillas
 * Implementa inmutabilidad y notificaciones de cambios
 */

/**
 * Store principal de la aplicación
 * Gestiona el estado centralizado de las plantillas
 */
const Store = {
    // Estado interno - no acceder directamente
    _state: {
        plantillas: [
            // Plantillas de ejemplo precargadas (HU1)
            new Template(
                'Bienvenida VIP',
                '¡Hola {{NOMBRE}}! 🌟 Bienvenido/a a nuestro servicio premium. Tu cuenta VIP está lista. ¿En qué podemos ayudarte hoy?',
                '#bienvenidaVIP',
                'marketing'
            ),
            new Template(
                'Confirmación Exitosa',
                'Tu solicitud #{{ID}} ha sido procesada exitosamente ✅. Recibirás una notificación cuando esté lista. ¡Gracias por confiar en nosotros!',
                '#confirmacion',
                'soporte'
            )
        ],
        ultimaActualizacion: new Date()
    },

    // Suscriptores para notificaciones de cambios
    _suscriptores: [],

    /**
     * Obtener todas las plantillas (HU1)
     * @returns {Array} Copia del array de plantillas
     */
    getPlantillas() {
        // Retornamos una copia para evitar mutaciones externas
        return [...this._state.plantillas];
    },

    /**
     * Obtener una plantilla por ID
     * @param {string} id - ID de la plantilla
     * @returns {Template|null} La plantilla encontrada o null
     */
    getPlantillaPorId(id) {
        return this._state.plantillas.find(plantilla => plantilla.id === id) || null;
    },

    /**
     * Agregar nueva plantilla (HU2)
     * Usa inmutabilidad - no muta el array original
     * @param {Template} nuevaPlantilla - Plantilla a agregar
     * @returns {boolean} true si se agregó exitosamente
     */
    agregarPlantilla(nuevaPlantilla) {
        try {
            // Validar que es una instancia de Template
            if (!(nuevaPlantilla instanceof Template)) {
                throw new Error('Debe ser una instancia de Template');
            }

            // Validar que la plantilla es válida
            if (!nuevaPlantilla.esValida()) {
                throw new Error('La plantilla no tiene todos los campos requeridos');
            }

            // Crear nuevo array sin mutar el original (inmutabilidad)
            this._state.plantillas = [...this._state.plantillas, nuevaPlantilla];
            this._state.ultimaActualizacion = new Date();

            // Notificar cambios a los suscriptores
            this._notificarCambios('PLANTILLA_AGREGADA', {
                plantilla: nuevaPlantilla,
                total: this._state.plantillas.length
            });

            console.log('🟢 Store: Plantilla agregada exitosamente', nuevaPlantilla.getEstadoLocal());
            return true;

        } catch (error) {
            console.error('❌ Store: Error al agregar plantilla:', error.message);
            return false;
        }
    },

    /**
     * Eliminar plantilla por ID (HU3)
     * Usa inmutabilidad - no muta el array original
     * @param {string} id - ID de la plantilla a eliminar
     * @returns {boolean} true si se eliminó exitosamente
     */
    eliminarPlantilla(id) {
        try {
            const plantillaAEliminar = this.getPlantillaPorId(id);
            
            if (!plantillaAEliminar) {
                throw new Error('Plantilla no encontrada');
            }

            // Crear nuevo array filtrado sin mutar el original (inmutabilidad)
            this._state.plantillas = this._state.plantillas.filter(
                plantilla => plantilla.id !== id
            );
            this._state.ultimaActualizacion = new Date();

            // Notificar cambios a los suscriptores
            this._notificarCambios('PLANTILLA_ELIMINADA', {
                plantillaEliminada: plantillaAEliminar,
                total: this._state.plantillas.length
            });

            console.log('🔴 Store: Plantilla eliminada exitosamente', plantillaAEliminar.getEstadoLocal());
            return true;

        } catch (error) {
            console.error('❌ Store: Error al eliminar plantilla:', error.message);
            return false;
        }
    },

    /**
     * Obtener estadísticas del estado
     * @returns {Object} Estadísticas del store
     */
    getEstadisticas() {
        const plantillas = this._state.plantillas;
        const categorias = {};
        
        // Contar plantillas por categoría
        plantillas.forEach(plantilla => {
            categorias[plantilla.categoria] = (categorias[plantilla.categoria] || 0) + 1;
        });

        return {
            total: plantillas.length,
            categorias: categorias,
            ultimaActualizacion: this._state.ultimaActualizacion,
            estaVacio: plantillas.length === 0
        };
    },

    /**
     * Buscar plantillas por criterio
     * @param {string} criterio - Campo por el cual buscar
     * @param {string} valor - Valor a buscar
     * @returns {Array} Plantillas que coinciden
     */
    buscarPlantillas(criterio, valor) {
        if (!valor || !criterio) return this.getPlantillas();

        return this._state.plantillas.filter(plantilla => {
            const valorCampo = plantilla[criterio];
            if (typeof valorCampo === 'string') {
                return valorCampo.toLowerCase().includes(valor.toLowerCase());
            }
            return false;
        });
    },

    /**
     * Limpiar todas las plantillas
     * @returns {boolean} true si se limpiaron exitosamente
     */
    limpiarTodas() {
        const totalAnterior = this._state.plantillas.length;
        
        // Crear array vacío (inmutabilidad)
        this._state.plantillas = [];
        this._state.ultimaActualizacion = new Date();

        // Notificar cambios
        this._notificarCambios('TODAS_ELIMINADAS', {
            totalEliminadas: totalAnterior
        });

        console.log('🧹 Store: Todas las plantillas eliminadas');
        return true;
    },

    /**
     * Suscribirse a cambios en el store
     * @param {Function} callback - Función a ejecutar cuando haya cambios
     * @returns {Function} Función para cancelar la suscripción
     */
    suscribirse(callback) {
        if (typeof callback !== 'function') {
            throw new Error('El callback debe ser una función');
        }

        this._suscriptores.push(callback);

        // Retornar función para cancelar suscripción
        return () => {
            const index = this._suscriptores.indexOf(callback);
            if (index > -1) {
                this._suscriptores.splice(index, 1);
            }
        };
    },

    /**
     * Notificar cambios a todos los suscriptores
     * @private
     * @param {string} tipo - Tipo de cambio
     * @param {Object} datos - Datos del cambio
     */
    _notificarCambios(tipo, datos = {}) {
        const evento = {
            tipo,
            datos,
            estadisticas: this.getEstadisticas(),
            timestamp: new Date()
        };

        // Notificar a todos los suscriptores
        this._suscriptores.forEach(callback => {
            try {
                callback(evento);
            } catch (error) {
                console.error('❌ Error en suscriptor del Store:', error);
            }
        });
    },

    /**
     * Obtener estado completo (solo para debugging)
     * @returns {Object} Estado completo del store
     */
    _getEstadoCompleto() {
        return {
            plantillas: this.getPlantillas().map(p => p.getEstadoLocal()),
            estadisticas: this.getEstadisticas(),
            suscriptores: this._suscriptores.length
        };
    },

    /**
     * Resetear store a estado inicial
     */
    reset() {
        this._state.plantillas = [];
        this._state.ultimaActualizacion = new Date();
        this._suscriptores = [];
        
        console.log('🔄 Store: Reseteado a estado inicial');
    }
};

/**
 * Funciones helper para interactuar con el Store
 */

/**
 * Crear y agregar una nueva plantilla al store
 * @param {string} titulo - Título de la plantilla
 * @param {string} mensaje - Mensaje de la plantilla  
 * @param {string} hashtag - Hashtag de la plantilla
 * @param {string} categoria - Categoría de la plantilla
 * @returns {boolean} true si se creó exitosamente
 */
function crearYAgregarPlantilla(titulo, mensaje, hashtag, categoria) {
    try {
        const nuevaPlantilla = new Template(titulo, mensaje, hashtag, categoria);
        return Store.agregarPlantilla(nuevaPlantilla);
    } catch (error) {
        console.error('❌ Error al crear plantilla:', error.message);
        return false;
    }
}

/**
 * Obtener plantillas para renderizar
 * @returns {Array} Array de plantillas para mostrar
 */
function obtenerPlantillasParaRender() {
    return Store.getPlantillas();
}

/**
 * Verificar si el store está vacío
 * @returns {boolean} true si no hay plantillas
 */
function storeEstaVacio() {
    return Store.getEstadisticas().estaVacio;
}

// Hacer el Store disponible globalmente para debugging
if (typeof window !== 'undefined') {
    window.Store = Store;
    window.debugStore = {
        estado: () => Store._getEstadoCompleto(),
        plantillas: () => Store.getPlantillas(),
        estadisticas: () => Store.getEstadisticas(),
        limpiar: () => Store.limpiarTodas(),
        reset: () => Store.reset()
    };
    
    console.log('🔧 Store Debug disponible: window.debugStore');
}