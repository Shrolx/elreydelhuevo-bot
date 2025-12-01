// utils/formatters.js
export function formatearPrecioCLP(precio) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

export function formatearFecha(fecha) {
    if (!fecha) return 'Fecha no disponible';
    try {
        const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
        return date.toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Fecha no disponible';
    }
}

export function truncarTexto(texto, longitud = 100) {
    if (!texto) return '';
    return texto.length > longitud ? texto.substring(0, longitud) + '...' : texto;
}

export function crearMenuKeyboard(buttons, columns = 2) {
    const keyboard = [];
    for (let i = 0; i < buttons.length; i += columns) {
        keyboard.push(buttons.slice(i, i + columns));
    }
    return keyboard;
}