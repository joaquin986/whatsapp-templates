/**
 * persistence.js - Manejo de persistencia con LocalStorage
 * Funciones para guardar, cargar y limpiar plantillas en LocalStorage
 */

const STORAGE_KEY = 'whatsapp_templates';

/**
 * HU1: Guardar plantillas en LocalStorage
 * Serializa las plantillas del Store y las guarda en LocalStorage
 */
function guardarPlantillas() {
    try {
        const plantillas = Store.obtenerTodas();
        const plantillasJSON = JSON.stringify(plantillas);
        localStorage.setItem(STORAGE_KEY, plantillasJSON);
        
        // Mostrar mensaje de confirmación
        mostrarMensajePersistencia('✅ Plantillas guardadas correctamente', 'success');
        return true;
    } catch (error) {
        console.error('Error al guardar plantillas:', error);
        mostrarMensajePersistencia('❌ Error al guardar plantillas', 'error');
        return false;
    }
}

/**
 * HU2: Cargar plantillas desde LocalStorage
 * Lee los datos desde LocalStorage, los deserializa y actualiza el Store
 */
function cargarPlantillas() {
    try {
        const plantillasJSON = localStorage.getItem(STORAGE_KEY);
        
        // Usar operador ternario para manejar LocalStorage vacío
        const plantillas = plantillasJSON ? JSON.parse(plantillasJSON) : [];
        
        // Validación robusta de JSON (Logro 2)
        if (Array.isArray(plantillas)) {
            // Validar que cada plantilla tenga la estructura correcta
            const plantillasValidas = plantillas.filter(plantilla => 
                plantilla && 
                typeof plantilla.id !== 'undefined' &&
                typeof plantilla.nombre === 'string' &&
                typeof plantilla.contenido === 'string'
            );
            
            Store.cargarPlantillas(plantillasValidas);
            mostrarMensajePersistencia(`📥 ${plantillasValidas.length} plantillas cargadas`, 'info');
            return plantillasValidas;
        } else {
            console.warn('Datos corruptos en LocalStorage, inicializando vacío');
            Store.cargarPlantillas([]);
            return [];
        }
    } catch (error) {
        console.error('Error al cargar plantillas:', error);
        mostrarMensajePersistencia('⚠️ Error al cargar plantillas guardadas', 'warning');
        Store.cargarPlantillas([]);
        return [];
    }
}

/**
 * HU3: Resetear todas las plantillas
 * Elimina todas las plantillas del Store y LocalStorage
 */
function resetearPlantillas() {
    try {
        // Confirmar acción con el usuario
        const confirmacion = confirm(
            '¿Estás seguro de que deseas eliminar TODAS las plantillas?\n\n' +
            'Esta acción no se puede deshacer.'
        );
        
        if (confirmacion) {
            // Limpiar LocalStorage
            localStorage.removeItem(STORAGE_KEY);
            
            // Limpiar Store
            Store.limpiarTodas();
            
            // Actualizar interfaz
            actualizarInterfaz();
            
            mostrarMensajePersistencia('🗑️ Todas las plantillas eliminadas', 'info');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al resetear plantillas:', error);
        mostrarMensajePersistencia('❌ Error al eliminar plantillas', 'error');
        return false;
    }
}

/**
 * Logro 1: Mensajes de retroalimentación visual (Toast notifications)
 * Muestra mensajes dinámicos confirmando acciones de persistencia
 */
function mostrarMensajePersistencia(mensaje, tipo = 'info') {
    // Crear elemento del toast si no existe
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    toast.style.cssText = `
        background: ${getToastColor(tipo)};
        color: white;
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        font-size: 14px;
        max-width: 300px;
    `;
    
    toastContainer.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

/**
 * Obtener color del toast según el tipo
 */
function getToastColor(tipo) {
    const colores = {
        'success': '#22c55e',
        'error': '#ef4444',
        'warning': '#f59e0b',
        'info': '#3b82f6'
    };
    return colores[tipo] || colores.info;
}

/**
 * Verificar soporte de LocalStorage
 */
function verificarSoporteLocalStorage() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, 'test');
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        console.error('LocalStorage no disponible:', error);
        mostrarMensajePersistencia('⚠️ Almacenamiento local no disponible', 'warning');
        return false;
    }
}

/**
 * Inicializar persistencia al cargar la página
 */
function inicializarPersistencia() {
    if (verificarSoporteLocalStorage()) {
        cargarPlantillas();
        console.log('💾 Sistema de persistencia inicializado');
    } else {
        console.warn('📝 Funcionando solo en memoria (sin persistencia)');
    }
}