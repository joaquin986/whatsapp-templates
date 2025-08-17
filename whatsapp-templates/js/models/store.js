/**
 * store.js - Store actualizado con persistencia automática
 * Manejo del estado de las plantillas con guardado automático
 */

const Store = {
    plantillas: [],
    contadorId: 1,
    
    /**
     * Obtener todas las plantillas
     */
    obtenerTodas() {
        return this.plantillas;
    },
    
    /**
     * Obtener plantilla por ID
     */
    obtenerPorId(id) {
        return this.plantillas.find(plantilla => plantilla.id == id);
    },
    
    /**
     * Agregar nueva plantilla con persistencia automática
     */
    agregar(template) {
        template.id = this.contadorId++;
        template.fechaCreacion = new Date().toISOString();
        template.fechaModificacion = template.fechaCreacion;
        
        this.plantillas.push(template);
        
        // Guardar automáticamente en LocalStorage
        if (typeof guardarPlantillas === 'function') {
            guardarPlantillas();
        }
        
        return template;
    },
    
    /**
     * Actualizar plantilla existente con persistencia automática
     */
    actualizar(id, datosActualizados) {
        const indice = this.plantillas.findIndex(plantilla => plantilla.id == id);
        
        if (indice !== -1) {
            // Mantener datos originales y actualizar solo los campos modificados
            this.plantillas[indice] = {
                ...this.plantillas[indice],
                ...datosActualizados,
                id: this.plantillas[indice].id, // Asegurar que el ID no cambie
                fechaModificacion: new Date().toISOString()
            };
            
            // Guardar automáticamente en LocalStorage
            if (typeof guardarPlantillas === 'function') {
                guardarPlantillas();
            }
            
            return this.plantillas[indice];
        }
        
        return null;
    },
    
    /**
     * Eliminar plantilla con persistencia automática
     */
    eliminar(id) {
        const indice = this.plantillas.findIndex(plantilla => plantilla.id == id);
        
        if (indice !== -1) {
            const plantillaEliminada = this.plantillas.splice(indice, 1)[0];
            
            // Guardar automáticamente en LocalStorage
            if (typeof guardarPlantillas === 'function') {
                guardarPlantillas();
            }
            
            return plantillaEliminada;
        }
        
        return null;
    },
    
    /**
     * Cargar plantillas desde array (usado por persistencia)
     */
    cargarPlantillas(plantillas) {
        this.plantillas = plantillas || [];
        
        // Actualizar contador ID para evitar conflictos
        if (this.plantillas.length > 0) {
            const maxId = Math.max(...this.plantillas.map(p => p.id || 0));
            this.contadorId = maxId + 1;
        } else {
            this.contadorId = 1;
        }
    },
    
    /**
     * Limpiar todas las plantillas
     */
    limpiarTodas() {
        this.plantillas = [];
        this.contadorId = 1;
    },
    
    /**
     * Obtener estadísticas del store
     */
    obtenerEstadisticas() {
        return {
            total: this.plantillas.length,
            ultimaModificacion: this.plantillas.length > 0 
                ? Math.max(...this.plantillas.map(p => new Date(p.fechaModificacion || p.fechaCreacion).getTime()))
                : null
        };
    },
    
    /**
     * Buscar plantillas por término
     */
    buscar(termino) {
        const terminoLower = termino.toLowerCase();
        return this.plantillas.filter(plantilla => 
            plantilla.nombre.toLowerCase().includes(terminoLower) ||
            plantilla.contenido.toLowerCase().includes(terminoLower) ||
            (plantilla.categoria && plantilla.categoria.toLowerCase().includes(terminoLower))
        );
    }
};