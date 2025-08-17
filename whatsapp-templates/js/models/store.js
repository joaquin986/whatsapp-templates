/**
 * ===== STORE - GESTIÓN CENTRALIZADA DE ESTADO CON PERSISTENCIA =====
 * Patrón Store mejorado con integración a LocalStorage
 * Implementa inmutabilidad y notificaciones de cambios
 */

/**
 * Store principal de la aplicación
 * Gestiona el estado centralizado de las plantillas con persistencia
 */
const Store = {
    // Estado interno - no acceder directamente
    _state: {
        plantillas: [], // Se inicializará desde persistencia
        ultimaActualizacion: new Date(),
        persistenciaHabilitada: true
    },

    // Suscriptores para notificaciones de cambios
    _suscriptores: [],

    /**
     * Inicializar Store con datos de persistencia
     * Se llama al cargar la aplicación
     */
    inicializar() {
        try {
            // Verificar si persistence.js está disponible
            if (typeof Persistence !== 'undefined') {
                console.log('🔗 Store: Inicializando con persistencia...');
                
                // Cargar plantillas desde LocalStorage
                const plantillasGuardadas = Persistence.cargarPlantillas();
                
                // Establecer plantillas sin disparar notificaciones aún
                this._state.plantillas = plantillasGuardadas;
                this._state.ultimaActualizacion = new Date();
                
                console.log('✅ Store inicializado con persistencia:', {
                    total: plantillasGuardadas.length,
                    tieneDatosGuardados: Persistence.tieneDatosGuardados()
                });
                
                // Notificar inicialización completa
                this._notificarCambios('STORE_INICIALIZADO', {
                    plantillas: plantillasGuardadas.length,
                    fuente: Persistence.tieneDatosGuardados() ? 'localStorage' : 'default'
                });
                
            } else {
                console.warn('⚠️ Persistencia no disponible, usando plantillas por defecto');
                this._cargarPlantillasDefault();
            }
            
        } catch (error) {
            console.error('❌ Error al inicializar Store:', error.message);
            this._cargarPlantillasDefault();
        }
    },

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
     * Usa inmutabilidad y dispara auto-guardado
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

            // Notificar cambios a los suscriptores (incluyendo persistencia)
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
     * Usa inmutabilidad y dispara auto-guardado
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

            // Notificar cambios a los suscriptores (incluyendo persistencia)
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
     * Limpiar todas las plantillas (HU3)
     * Resetea el Store y dispara limpieza de persistencia
     * @returns {boolean} true si se limpiaron exitosamente
     */
    limpiarTodas() {
        try {
            const totalAnterior = this._state.plantillas.length;
            
            // Crear array vacío (inmutabilidad)
            this._state.plantillas = [];
            this._state.ultimaActualizacion = new Date();

            // Notificar cambios (esto disparará la limpieza de LocalStorage)
            this._notificarCambios('TODAS_ELIMINADAS', {
                totalEliminadas: totalAnterior
            });

            console.log('🧹 Store: Todas las plantillas eliminadas');
            return true;

        } catch (error) {
            console.error('❌ Store: Error al limpiar plantillas:', error.message);
            return false;
        }
    },

    /**
     * Resetear Store a estado inicial
     * Útil para reinicialización completa
     */
    reset() {
        this._state.plantillas = [];
        this._state.ultimaActualizacion = new Date();
        // No limpiar suscriptores para mantener la conexión con persistencia
        
        console.log('🔄 Store: Reseteado a estado inicial');
    },

    /**
     * Recargar desde persistencia
     * Forzar recarga desde LocalStorage
     * @returns {boolean} true si se recargó exitosamente
     */
    recargarDesdePersistencia() {
        try {
            if (typeof Persistence !== 'undefined') {
                const plantillasGuardadas = Persistence.cargarPlantillas();
                
                // Reemplazar plantillas actuales
                this._state.plantillas = plantillasGuardadas;
                this._state.ultimaActualizacion = new Date();
                
                // Notificar recarga
                this._notificarCambios('RECARGADO_DESDE_PERSISTENCIA', {
                    total: plantillasGuardadas.length
                });
                
                console.log('🔄 Store: Recargado desde persistencia');
                return true;
            } else {
                throw new Error('Persistencia no disponible');
            }
        } catch (error) {
            console.error('❌ Error al recargar desde persistencia:', error.message);
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
            estaVacio: plantillas.length === 0,
            persistenciaHabilitada: this._state.persistenciaHabilitada,
            infoLocalStorage: typeof Persistence !== 'undefined' ? Persistence.getInfoStorage() : null
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
     * Obtener estado completo (solo para debugging)
     * @returns {Object} Estado completo del store
     */
    _getEstadoCompleto() {
        return {
            plantillas: this.getPlantillas().map(p => p.getEstadoLocal()),
            estadisticas: this.getEstadisticas(),
            suscriptores: this._suscriptores.length,
            persistencia: typeof Persistence !== 'undefined' ? Persistence.getInfoStorage() : 'No disponible'
        };
    },

    /**
     * Cargar plantillas por defecto
     * @private
     */
    _cargarPlantillasDefault() {
        this._state.plantillas = [
            new Template(
                'Bienvenida por Defecto',
                '¡Hola! 👋 Bienvenido/a. Estamos aquí para ayudarte. ¿En qué podemos asistirte?',
                '#bienvenida',
                'soporte'
            ),
            new Template(
                'Confirmación Estándar',
                'Tu solicitud ha sido recibida ✅. Te contactaremos pronto. ¡Gracias!',
                '#confirmacion',
                'soporte'
            )
        ];
        
        this._state.ultimaActualizacion = new Date();
        console.log('📝 Store: Plantillas por defecto cargadas');
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

/**
 * Configurar Store con persistencia automática
 * Conecta el Store con el sistema de persistencia
 */
function configurarStoreConPersistencia() {
    // Suscribirse a cambios para auto-guardar
    if (typeof Persistence !== 'undefined') {
        Store.suscribirse((evento) => {
            // Auto-guardar después de cambios que afecten las plantillas
            if (['PLANTILLA_AGREGADA', 'PLANTILLA_ELIMINADA', 'TODAS_ELIMINADAS'].includes(evento.tipo)) {
                console.log('💾 Auto-guardado disparado por:', evento.tipo);
                
                // Pequeño delay para asegurar que el Store esté actualizado
                setTimeout(() => {
                    const plantillas = Store.getPlantillas();
                    Persistence.guardarPlantillas(plantillas);
                }, 10);
            }
        });
        
        console.log('🔗 Store configurado con persistencia automática');
    } else {
        console.warn('⚠️ Persistencia no disponible para configuración automática');
    }
}

// Hacer el Store disponible globalmente para debugging
if (typeof window !== 'undefined') {
    window.Store = Store;
    window.crearYAgregarPlantilla = crearYAgregarPlantilla;
    window.obtenerPlantillasParaRender = obtenerPlantillasParaRender;
    window.storeEstaVacio = storeEstaVacio;
    window.configurarStoreConPersistencia = configurarStoreConPersistencia;
    
    window.debugStore = {
        estado: () => Store._getEstadoCompleto(),
        plantillas: () => Store.getPlantillas(),
        estadisticas: () => Store.getEstadisticas(),
        limpiar: () => Store.limpiarTodas(),
        reset: () => Store.reset(),
        recargar: () => Store.recargarDesdePersistencia(),
        inicializar: () => Store.inicializar()
    };
    
    console.log('🔧 Store Debug disponible: window.debugStore');
}