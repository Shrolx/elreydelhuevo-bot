// commands/estadisticas.js
import { productosDB, categoriasDB, publicacionesDB } from '../firebase-config.js';
import { formatearPrecioCLP, formatearFecha } from '../utils/formatters.js';

export function setupEstadisticasCommands(bot) {
    
    // ========== ESTADÍSTICAS COMPLETAS ==========
    bot.hears(['📊 Estadísticas', '/estadisticas'], async (ctx) => {
        try {
            await ctx.reply('📊 Calculando estadísticas...');
            
            const [productos, categorias, publicaciones] = await Promise.all([
                productosDB.getAll(),
                categoriasDB.getAll(),
                publicacionesDB.getAll()
            ]);
            
            // Calcular estadísticas de productos
            const totalProductos = productos.length;
            const precioPromedio = productos.reduce((sum, p) => sum + (p.precio || 0), 0) / (totalProductos || 1);
            const precioMax = Math.max(...productos.map(p => p.precio || 0));
            const precioMin = Math.min(...productos.map(p => p.precio || 0));
            
            // Productos por categoría
            const productosPorCategoria = {};
            productos.forEach(p => {
                const cat = p.categoria || 'Sin categoría';
                productosPorCategoria[cat] = (productosPorCategoria[cat] || 0) + 1;
            });
            
            // Estadísticas de publicaciones
            const totalPublicaciones = publicaciones.length;
            const publicacionesRecientes = publicaciones
                .filter(p => {
                    const fecha = p.fechaCreacion?.toDate?.() || new Date();
                    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    return fecha > hace30Dias;
                })
                .length;
            
            let mensaje = `📊 *ESTADÍSTICAS COMPLETAS - EL REY DEL HUEVO*\n\n`;
            
            mensaje += `📦 *PRODUCTOS:*\n`;
            mensaje += `• Total: ${totalProductos}\n`;
            mensaje += `• Precio promedio: ${formatearPrecioCLP(precioPromedio)}\n`;
            mensaje += `• Rango: ${formatearPrecioCLP(precioMin)} - ${formatearPrecioCLP(precioMax)}\n\n`;
            
            mensaje += `📂 *CATEGORÍAS:*\n`;
            mensaje += `• Total: ${categorias.length}\n`;
            
            if (Object.keys(productosPorCategoria).length > 0) {
                mensaje += `• Distribución:\n`;
                Object.entries(productosPorCategoria)
                    .sort(([,a], [,b]) => b - a)
                    .forEach(([cat, cant]) => {
                        const porcentaje = ((cant / totalProductos) * 100).toFixed(1);
                        mensaje += `  ${cat}: ${cant} (${porcentaje}%)\n`;
                    });
            }
            mensaje += `\n`;
            
            mensaje += `📰 *PUBLICACIONES:*\n`;
            mensaje += `• Total: ${totalPublicaciones}\n`;
            mensaje += `• Últimos 30 días: ${publicacionesRecientes}\n\n`;
            
            mensaje += `📈 *RESUMEN:*\n`;
            mensaje += `• Inventario total: ${totalProductos} productos\n`;
            mensaje += `• Categorías activas: ${categorias.length}\n`;
            mensaje += `• Contenido publicado: ${totalPublicaciones} posts\n\n`;
            
            mensaje += `🕐 *Actualizado:* ${formatearFecha(new Date())}`;
            
            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
            
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            await ctx.reply('❌ Error al cargar estadísticas.');
        }
    });
    
    // ========== REPORTE DETALLADO ==========
    bot.hears(['📈 Reporte Detallado', '/reporte'], async (ctx) => {
        try {
            await ctx.reply('📈 Generando reporte detallado...');
            
            const productos = await productosDB.getAll();
            
            if (productos.length === 0) {
                await ctx.reply('📭 No hay datos para generar reporte.');
                return;
            }
            
            // Calcular métricas avanzadas
            const valoresProductos = productos.map(p => p.precio || 0);
            const valorTotalInventario = valoresProductos.reduce((a, b) => a + b, 0);
            const valorPromedio = valorTotalInventario / productos.length;
            
            // Ordenar productos por precio
            const productosOrdenados = [...productos].sort((a, b) => (b.precio || 0) - (a.precio || 0));
            
            let mensaje = `📈 *REPORTE DETALLADO DE INVENTARIO*\n\n`;
            
            mensaje += `💰 *VALOR DEL INVENTARIO:*\n`;
            mensaje += `• Valor total: ${formatearPrecioCLP(valorTotalInventario)}\n`;
            mensaje += `• Valor promedio por producto: ${formatearPrecioCLP(valorPromedio)}\n\n`;
            
            mensaje += `🏆 *PRODUCTOS MÁS VALIOSOS:*\n`;
            productosOrdenados.slice(0, 5).forEach((p, index) => {
                mensaje += `${index + 1}. ${p.nombre} - ${formatearPrecioCLP(p.precio || 0)}\n`;
            });
            mensaje += `\n`;
            
            mensaje += `📊 *DISTRIBUCIÓN DE PRECIOS:*\n`;
            const rangos = {
                'Menos de $1.000': 0,
                '$1.000 - $5.000': 0,
                '$5.000 - $10.000': 0,
                '$10.000 - $20.000': 0,
                'Más de $20.000': 0
            };
            
            productos.forEach(p => {
                const precio = p.precio || 0;
                if (precio < 1000) rangos['Menos de $1.000']++;
                else if (precio < 5000) rangos['$1.000 - $5.000']++;
                else if (precio < 10000) rangos['$5.000 - $10.000']++;
                else if (precio < 20000) rangos['$10.000 - $20.000']++;
                else rangos['Más de $20.000']++;
            });
            
            Object.entries(rangos).forEach(([rango, cantidad]) => {
                if (cantidad > 0) {
                    const porcentaje = ((cantidad / productos.length) * 100).toFixed(1);
                    const barras = '▰'.repeat(Math.floor((cantidad / productos.length) * 10));
                    mensaje += `${rango}: ${barras} ${cantidad} (${porcentaje}%)\n`;
                }
            });
            
            mensaje += `\n📅 *Fecha del reporte:* ${formatearFecha(new Date())}`;
            
            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
            
        } catch (error) {
            console.error('Error generando reporte:', error);
            await ctx.reply('❌ Error al generar reporte.');
        }
    });
}
