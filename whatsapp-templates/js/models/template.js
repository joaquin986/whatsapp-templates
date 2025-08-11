/**
 * ===== CLASE TEMPLATE (HU1) =====
 * Clase para representar plantillas de WhatsApp
 * Implementa estado local con propiedades y métodos de renderización
 */
class Template {
    constructor(titulo, mensaje, hashtag, categoria, fechaCreacion = new Date()) {
        // Propiedades requeridas (HU1)
        this.titulo = titulo;
        this.mensaje = mensaje;
        this.hashtag = hashtag;
        
        // Propiedades adicionales elegidas por el desarrollador (HU1)
        this.categoria = categoria;
        this.fechaCreacion = fechaCreacion;
        
        // ID único para cada plantilla
        this.id = Date.now() + Math.random();
    }

    /**
     * Método render para mostrar estado local (HU3)
     * Renderiza la plantilla en formato de lista
     * @returns {string} HTML de la plantilla
     */
    render() {
        const fechaFormateada = this.fechaCreacion.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <div class="template-card" data-id="${this.id}">
                <div class="template-header">
                    <h4 class="template-title">${this.titulo}</h4>
                    <span class="template-category">${this.categoria}</span>
                </div>
                <div class="template-message">${this.mensaje}</div>
                <div class="template-footer">
                    <span class="template-hashtag">${this.hashtag}</span>
                    <button class="delete-btn" onclick="eliminarPlantilla('${this.id}')">🗑️ Eliminar</button>
                </div>
                <small style="color: #999; font-size: 12px;">Creado: ${fechaFormateada}</small>
            </div>
        `;
    }

    /**
     * Método render para vista grilla (HU4)
     * Renderiza la plantilla en formato de grilla
     * @returns {string} HTML de la plantilla en grilla
     */
    renderGrid() {
        const fechaFormateada = this.fechaCreacion.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <div class="grid-card" data-id="${this.id}">
                <div class="grid-header">
                    <h4 class="grid-title">${this.titulo}</h4>
                    <span class="grid-category">${this.categoria}</span>
                </div>
                <div class="grid-message">${this.mensaje}</div>
                <div class="grid-footer">
                    <span class="grid-hashtag">${this.hashtag}</span>
                    <button class="delete-btn" onclick="eliminarPlantilla('${this.id}')">🗑️</button>
                </div>
                <small style="color: #999; font-size: 11px; margin-top: 5px;">${fechaFormateada}</small>
            </div>
        `;
    }

    /**
     * Método para obtener información del estado local
     * Expone las propiedades internas de la plantilla
     * @returns {Object} Estado local de la plantilla
     */
    getEstadoLocal() {
        return {
            id: this.id,
            titulo: this.titulo,
            categoria: this.categoria,
            hashtag: this.hashtag,
            longitud: this.mensaje.length,
            fechaCreacion: this.fechaCreacion
        };
    }

    /**
     * Método para validar si la plantilla está completa
     * @returns {boolean} true si todos los campos requeridos están presentes
     */
    esValida() {
        return this.titulo && 
               this.mensaje && 
               this.hashtag && 
               this.categoria;
    }

    /**
     * Método para obtener un resumen de la plantilla
     * @returns {string} Resumen de la plantilla
     */
    getResumen() {
        const mensajeCorto = this.mensaje.length > 50 
            ? this.mensaje.substring(0, 50) + '...' 
            : this.mensaje;
        
        return `${this.titulo} - ${mensajeCorto}`;
    }

    /**
     * Método toString para debugging
     * @returns {string} Representación de string de la plantilla
     */
    toString() {
        return `Template: ${this.titulo} (${this.categoria}) - ${this.hashtag}`;
    }
}