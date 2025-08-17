/**
 * ===== MÓDULO DE PERSISTENCIA =====
 * Manejo de LocalStorage para WhatsApp Templates
 * Implementa serialización/deserialización y validación robusta
 */

/**
 * Configuración de persistencia
 */
const PERSISTENCE_CONFIG = {
    STORAGE_KEY: 'whatsapp_templates_data',
    VERSION: '1.0',
    MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB límite estimado
    BACKUP_KEY: 'whatsapp_templates_backup'
};

/**
 * Módulo de Persistencia
 */
const Persistence = {
    
    /**
     * Guardar plantillas en LocalStorage (HU1)
     * Serializa las plantillas del Store y las guarda
     * @param {Array} plantillas - Array de plantillas a guardar
     * @returns {boolean} true si se guardó exitosamente
     */
    guardarPlantillas(plantillas = []) {
        try {
            // Preparar datos para serialización
            const datosParaGuardar = {
                version: PERSISTENCE_CONFIG.VERSION,
                timestamp: new Date().toISOString(),
                plantillas: plantillas.map(plantilla => this._serializarPlantilla(plantilla)),
                metadata: {
                    total: plantillas.length,
                    categorias: this._obtenerCategorias(plantillas)
                }
            };

            // Convertir a JSON
            const jsonString = JSON.stringify(datosParaGuardar);
            
            // Verificar tamaño
            if (this._verificarTamañoStorage(jsonString)) {
                
                // Crear backup antes de guardar
                this._crearBackup();
                
                // Guardar en LocalStorage
                localStorage.setItem(PERSISTENCE_CONFIG.STORAGE_KEY, jsonString);
                
                console.log('💾 Persistencia: Plantillas guardadas exitosamente', {
                    total: plantillas.length,
                    tamaño: `${(jsonString.length / 1024).toFixed(2)} KB`
                });

                // Mostrar notificación de éxito (Logro 1)
                this._mostrarNotificacionPersistencia('Plantillas guardadas en LocalStorage', 'success');
                
                return true;
            } else {
                throw new Error('Datos demasiado grandes para LocalStorage');
            }

        } catch (error) {
            console.error('❌ Error al guardar plantillas:', error.message);
            this._mostrarNotificacionPersistencia('Error al guardar plantillas', 'error');
            return false;
        }
    },

    /**
     * Cargar plantillas desde LocalStorage (HU2)
     * Deserializa y valida los datos guardados
     * @returns {Array} Array de plantillas cargadas o array vacío
     */
    cargarPlantillas() {
        try {
            // Intentar leer desde LocalStorage
            const datosGuardados = localStorage.getItem(PERSISTENCE_CONFIG.STORAGE_KEY);
            
            // Usar operador ternario para manejar caso vacío (HU2)
            const plantillasIniciales = datosGuardados 
                ? this._procesarDatosGuardados(datosGuardados)
                : this._obtenerPlantillasDefault();

            console.log('📂 Persistencia: Plantillas cargadas', {
                total: plantillasIniciales.length,
                fuente: datosGuardados ? 'LocalStorage' : 'Default'
            });

            // Mostrar notificación de carga (Logro 1)
            if (datosGuardados && plantillasIniciales.length > 0) {
                this._mostrarNotificacionPersistencia(
                    `${plantillasIniciales.length} plantillas cargadas desde LocalStorage`, 
                    'info'
                );
            }

            return plantillasIniciales;

        } catch (error) {
            console.error('❌ Error al cargar plantillas:', error.message);
            this._mostrarNotificacionPersistencia('Error al cargar plantillas, usando datos por defecto', 'warning');
            
            // En caso de error, intentar cargar backup o usar default
            return this._intentarRecuperacion();
        }
    },

    /**
     * Resetear todas las plantillas (HU3)
     * Limpia tanto Store como LocalStorage
     * @returns {boolean} true si se reseteó exitosamente
     */
    resetearPlantillas() {
        try {
            // Crear backup final antes del reset
            this._crearBackup();
            
            // Limpiar LocalStorage
            localStorage.removeItem(PERSISTENCE_CONFIG.STORAGE_KEY);
            localStorage.removeItem(PERSISTENCE_CONFIG.BACKUP_KEY);
            
            console.log('🧹 Persistencia: Todas las plantillas eliminadas de LocalStorage');
            
            // Mostrar notificación de reset (HU3)
            this._mostrarNotificacionPersistencia('Todas las plantillas eliminadas correctamente', 'success');
            
            return true;

        } catch (error) {
            console.error('❌ Error al resetear plantillas:', error.message);
            this._mostrarNotificacionPersistencia('Error al eliminar plantillas', 'error');
            return false;
        }
    },

    /**
     * Verificar si hay datos guardados en LocalStorage
     * @returns {boolean} true si hay datos guardados
     */
    tieneDatosGuardados() {
        return localStorage.getItem(PERSISTENCE_CONFIG.STORAGE_KEY) !== null;
    },

    /**
     * Obtener información del almacenamiento
     * @returns {Object} Información del storage
     */
    getInfoStorage() {
        try {
            const datos = localStorage.getItem(PERSISTENCE_CONFIG.STORAGE_KEY);
            
            if (!datos) {
                return { existe: false, tamaño: 0, plantillas: 0 };
            }

            const parsed = JSON.parse(datos);
            
            return {
                existe: true,
                tamaño: `${(datos.length / 1024).toFixed(2)} KB`,
                plantillas: parsed.metadata?.total || 0,
                version: parsed.version,
                ultimaActualizacion: parsed.timestamp
            };

        } catch (error) {
            return { existe: false, error: error.message };
        }
    },

    // ===== MÉTODOS PRIVADOS =====

    /**
     * Serializar una plantilla para almacenamiento
     * @private
     * @param {Template} plantilla - Plantilla a serializar
     * @returns {Object} Objeto serializado
     */
    _serializarPlantilla(plantilla) {
        return {
            id: plantilla.id,
            titulo: plantilla.titulo,
            mensaje: plantilla.mensaje,
            hashtag: plantilla.hashtag,
            categoria: plantilla.categoria,
            fechaCreacion: plantilla.fechaCreacion.toISOString()
        };
    },

    /**
     * Deserializar plantilla desde almacenamiento
     * @private
     * @param {Object} datos - Datos serializados
     * @returns {Template} Instancia de Template
     */
    _deserializarPlantilla(datos) {
        return new Template(
            datos.titulo,
            datos.mensaje,
            datos.hashtag,
            datos.categoria,
            new Date(datos.fechaCreacion)
        );
    },

    /**
     * Procesar datos guardados con validación robusta (Logro 2)
     * @private
     * @param {string} datosString - String JSON de LocalStorage
     * @returns {Array} Array de plantillas validadas
     */
    _procesarDatosGuardados(datosString) {
        try {
            // Parsear JSON
            const datos = JSON.parse(datosString);
            
            // Validación robusta de estructura (Logro 2)
            if (!this._validarEstructuraDatos(datos)) {
                throw new Error('Estructura de datos inválida');
            }

            // Deserializar plantillas con validación individual
            const plantillas = datos.plantillas
                .map(datoPlantilla => {
                    try {
                        return this._deserializarPlantilla(datoPlantilla);
                    } catch (error) {
                        console.warn('⚠️ Plantilla corrupta ignorada:', error.message);
                        return null;
                    }
                })
                .filter(plantilla => plantilla !== null); // Filtrar plantillas inválidas

            console.log('✅ Datos validados correctamente:', {
                version: datos.version,
                plantillasOriginales: datos.plantillas.length,
                plantillasVálidas: plantillas.length
            });

            return plantillas;

        } catch (error) {
            console.error('❌ Error al procesar datos guardados:', error.message);
            throw new Error(`Datos corruptos en LocalStorage: ${error.message}`);
        }
    },

    /**
     * Validar estructura de datos (Logro 2)
     * @private
     * @param {Object} datos - Datos a validar
     * @returns {boolean} true si la estructura es válida
     */
    _validarEstructuraDatos(datos) {
        // Verificar propiedades básicas
        if (!datos || typeof datos !== 'object') return false;
        if (!datos.version || !datos.plantillas || !Array.isArray(datos.plantillas)) return false;
        
        // Verificar versión compatible
        if (datos.version !== PERSISTENCE_CONFIG.VERSION) {
            console.warn('⚠️ Versión de datos diferente, intentando migración automática');
        }

        // Validar estructura de plantillas
        return datos.plantillas.every(plantilla => 
            plantilla && 
            typeof plantilla === 'object' && 
            plantilla.titulo && 
            plantilla.mensaje && 
            plantilla.hashtag && 
            plantilla.categoria
        );
    },

    /**
     * Obtener plantillas por defecto cuando LocalStorage está vacío
     * @private
     * @returns {Array} Array de plantillas por defecto
     */
    _obtenerPlantillasDefault() {
        return [
            new Template(
                'Bienvenida Automática',
                '¡Hola! 👋 Gracias por contactarnos. Te responderemos en breve. ¿En qué podemos ayudarte?',
                '#bienvenida',
                'soporte'
            ),
            new Template(
                'Confirmación de Pedido',
                'Tu pedido #{{NUMERO}} ha sido recibido ✅. Te notificaremos cuando esté listo para entrega.',
                '#confirmacion',
                'ventas'
            )
        ];
    },

    /**
     * Intentar recuperación desde backup
     * @private
     * @returns {Array} Plantillas recuperadas o default
     */
    _intentarRecuperacion() {
        try {
            const backup = localStorage.getItem(PERSISTENCE_CONFIG.BACKUP_KEY);
            if (backup) {
                console.log('🔄 Intentando recuperación desde backup...');
                const plantillasBackup = this._procesarDatosGuardados(backup);
                this._mostrarNotificacionPersistencia('Datos recuperados desde backup', 'warning');
                return plantillasBackup;
            }
        } catch (error) {
            console.error('❌ Error en recuperación de backup:', error.message);
        }
        
        // Si todo falla, usar plantillas por defecto
        return this._obtenerPlantillasDefault();
    },

    /**
     * Crear backup de datos actuales
     * @private
     */
    _crearBackup() {
        try {
            const datosActuales = localStorage.getItem(PERSISTENCE_CONFIG.STORAGE_KEY);
            if (datosActuales) {
                localStorage.setItem(PERSISTENCE_CONFIG.BACKUP_KEY, datosActuales);
                console.log('💾 Backup creado exitosamente');
            }
        } catch (error) {
            console.warn('⚠️ No se pudo crear backup:', error.message);
        }
    },

    /**
     * Verificar tamaño de storage
     * @private
     * @param {string} datos - Datos a verificar
     * @returns {boolean} true si el tamaño es aceptable
     */
    _verificarTamañoStorage(datos) {
        return datos.length < PERSISTENCE_CONFIG.MAX_STORAGE_SIZE;
    },

    /**
     * Obtener categorías de plantillas
     * @private
     * @param {Array} plantillas - Array de plantillas
     * @returns {Object} Objeto con conteo de categorías
     */
    _obtenerCategorias(plantillas) {
        return plantillas.reduce((acc, plantilla) => {
            acc[plantilla.categoria] = (acc[plantilla.categoria] || 0) + 1;
            return acc;
        }, {});
    },

    /**
     * Mostrar notificación de persistencia (Logro 1)
     * @private
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} tipo - Tipo de notificación
     */
    _mostrarNotificacionPersistencia(mensaje, tipo = 'info') {
        // Verificar si la función de notificación existe (desde app.js)
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion(`💾 ${mensaje}`, tipo);
        } else {
            // Fallback si no existe la función
            console.log(`📢 Persistencia: ${mensaje}`);
        }
    }
};

/**
 * Funciones helper para integración con Store
 */

/**
 * Conectar Store con Persistencia
 * Configurar auto-guardado después de operaciones CRUD
 */
function conectarPersistenciaConStore() {
    if (typeof Store !== 'undefined' && Store.suscribirse) {
        
        // Suscribirse a cambios del Store para auto-guardar (HU1)
        Store.suscribirse((evento) => {
            console.log('🔔 Persistencia: Detectado cambio en Store:', evento.tipo);
            
            // Auto-guardar después de cada operación CRUD
            const plantillas = Store.getPlantillas();
            Persistence.guardarPlantillas(plantillas);
        });

        console.log('🔗 Persistencia conectada con Store - Auto-guardado activado');
    } else {
        console.error('❌ No se pudo conectar con Store - Verificar que store.js esté cargado');
    }
}

/**
 * Inicializar Store con datos de LocalStorage
 * @returns {Array} Plantillas cargadas
 */
function inicializarStoreConPersistencia() {
    try {
        // Cargar plantillas desde LocalStorage (HU2)
        const plantillasCargadas = Persistence.cargarPlantillas();
        
        // Si hay Store disponible, inicializarlo
        if (typeof Store !== 'undefined') {
            // Limpiar Store actual
            Store.reset();
            
            // Agregar plantillas cargadas una por una
            plantillasCargadas.forEach(plantilla => {
                Store.agregarPlantilla(plantilla);
            });
            
            console.log('🚀 Store inicializado con persistencia:', {
                plantillas: plantillasCargadas.length,
                fuente: Persistence.tieneDatosGuardados() ? 'LocalStorage' : 'Default'
            });
        }
        
        return plantillasCargadas;

    } catch (error) {
        console.error('❌ Error al inicializar Store con persistencia:', error.message);
        return [];
    }
}

/**
 * Resetear completamente la aplicación (HU3)
 * @returns {boolean} true si se reseteó exitosamente
 */
function resetearAplicacionCompleta() {
    try {
        // Confirmar acción
        const confirmacion = confirm(
            '⚠️ ¿Estás seguro de que deseas eliminar TODAS las plantillas?\n\n' +
            'Esta acción no se puede deshacer.'
        );

        if (!confirmacion) {
            return false;
        }

        // Resetear persistencia (HU3)
        const persistenciaOk = Persistence.resetearPlantillas();
        
        // Resetear Store si está disponible
        if (typeof Store !== 'undefined') {
            Store.reset();
        }

        // Notificar éxito
        if (persistenciaOk) {
            console.log('🧹 Aplicación reseteada completamente');
            
            // Recargar plantillas por defecto
            setTimeout(() => {
                inicializarStoreConPersistencia();
            }, 100);
        }

        return persistenciaOk;

    } catch (error) {
        console.error('❌ Error al resetear aplicación:', error.message);
        return false;
    }
}

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.Persistence = Persistence;
    window.conectarPersistenciaConStore = conectarPersistenciaConStore;
    window.inicializarStoreConPersistencia = inicializarStoreConPersistencia;
    window.resetearAplicacionCompleta = resetearAplicacionCompleta;
    
    // Herramientas de debug para persistencia
    window.debugPersistence = {
        info: () => Persistence.getInfoStorage(),
        guardar: (plantillas) => Persistence.guardarPlantillas(plantillas || []),
        cargar: () => Persistence.cargarPlantillas(),
        resetear: () => Persistence.resetearPlantillas(),
        tieneDatos: () => Persistence.tieneDatosGuardados(),
        limpiarTodo: () => {
            localStorage.removeItem(PERSISTENCE_CONFIG.STORAGE_KEY);
            localStorage.removeItem(PERSISTENCE_CONFIG.BACKUP_KEY);
            console.log('🧹 LocalStorage limpiado manualmente');
        }
    };
    
    console.log('🔧 Persistencia Debug disponible: window.debugPersistence');
}