// commands/productos.js - VERSIÓN FUNCIONAL
import { productosDB, categoriasDB } from '../firebase-config.js';

// Estados para flujos conversacionales
const estadosProductos = new Map();

export function setupProductosCommands(bot) {
    
    // ========== LISTAR PRODUCTOS ==========
    bot.hears(['📦 Productos', '/productos'], async (ctx) => {
        const menuProductos = {
            reply_markup: {
                keyboard: [
                    ['📥 Nuevo Producto', '📋 Listar Productos'],
                    ['✏️ Editar Producto', '🗑️ Eliminar Producto'],
                    ['📊 Estadísticas', '🔙 Menú Principal']
                ],
                resize_keyboard: true
            }
        };
        
        await ctx.reply(
            '📦 *GESTIÓN DE PRODUCTOS*\n\n' +
            'Selecciona una opción:',
            {
                parse_mode: 'Markdown',
                ...menuProductos
            }
        );
    });
    
    // ========== LISTAR PRODUCTOS REALES ==========
    bot.hears('📋 Listar Productos', async (ctx) => {
        try {
            await ctx.reply('🔄 Buscando productos en la base de datos...');
            
            const productos = await productosDB.getAll();
            
            if (productos.length === 0) {
                await ctx.reply('📭 No hay productos registrados.\n\nUsa "📥 Nuevo Producto" para agregar el primero.');
                return;
            }
            
            let mensaje = `📦 *PRODUCTOS DISPONIBLES (${productos.length})*\n\n`;
            
            productos.forEach((producto, index) => {
                const precio = producto.precio ? `$${producto.precio.toLocaleString('es-CL')}` : 'Consultar precio';
                mensaje += `*${index + 1}. ${producto.nombre || 'Sin nombre'}*\n`;
                mensaje += `   💰 ${precio}\n`;
                mensaje += `   📂 ${producto.categoria || 'General'}\n`;
                if (producto.descripcion) {
                    mensaje += `   📝 ${producto.descripcion.substring(0, 40)}${producto.descripcion.length > 40 ? '...' : ''}\n`;
                }
                mensaje += `   🆔 \`${producto.id}\`\n\n`;
            });
            
            // Enviar en partes si es muy largo
            if (mensaje.length > 4000) {
                const partes = mensaje.match(/.{1,4000}/g);
                for (const parte of partes) {
                    await ctx.reply(parte, { parse_mode: 'Markdown' });
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            } else {
                await ctx.reply(mensaje, { parse_mode: 'Markdown' });
            }
            
            await ctx.reply(`✅ Mostrando ${productos.length} producto${productos.length !== 1 ? 's' : ''} de la base de datos.`);
            
        } catch (error) {
            console.error('Error listando productos:', error);
            await ctx.reply('❌ Error al conectar con la base de datos.\n\nVerifica la conexión a Firebase.');
        }
    });
    
    // ========== NUEVO PRODUCTO ==========
    bot.hears('📥 Nuevo Producto', async (ctx) => {
        const userId = ctx.from.id;
        
        estadosProductos.set(userId, {
            paso: 'nombre',
            datos: {}
        });
        
        await ctx.reply(
            '🆕 *CREAR NUEVO PRODUCTO*\n\n' +
            'Vamos paso a paso. Primero:\n\n' +
            '📝 Escribe el *NOMBRE* del producto:',
            { 
                parse_mode: 'Markdown',
                reply_markup: { force_reply: true }
            }
        );
    });
    
    // ========== FLUJO CONVERSACIONAL ==========
    bot.on('text', async (ctx) => {
        const userId = ctx.from.id;
        const texto = ctx.message.text;
        
        if (!estadosProductos.has(userId)) return;
        
        const estado = estadosProductos.get(userId);
        
        try {
            switch (estado.paso) {
                case 'nombre':
                    estado.datos.nombre = texto;
                    estado.paso = 'precio';
                    await ctx.reply(
                        `✅ Nombre: *${texto}*\n\n` +
                        '💰 Ahora escribe el *PRECIO* (solo números):\n' +
                        'Ejemplo: 1500',
                        {
                            parse_mode: 'Markdown',
                            reply_markup: { force_reply: true }
                        }
                    );
                    break;
                    
                case 'precio':
                    const precio = parseFloat(texto.replace(/[^0-9.]/g, ''));
                    if (isNaN(precio) || precio <= 0) {
                        await ctx.reply('❌ Precio inválido. Ingresa un número válido:');
                        return;
                    }
                    estado.datos.precio = precio;
                    estado.paso = 'categoria';
                    
                    // Mostrar categorías disponibles
                    const categorias = await categoriasDB.getAll();
                    let categoriasTexto = '📂 Selecciona una *CATEGORÍA*:\n\n';
                    
                    if (categorias.length > 0) {
                        categorias.forEach((cat, index) => {
                            categoriasTexto += `${index + 1}. ${cat.nombre}\n`;
                        });
                        categoriasTexto += '\nEscribe el *NÚMERO* o escribe una nueva categoría:';
                    } else {
                        categoriasTexto = '📂 Escribe el nombre de la *CATEGORÍA*:\n' +
                                        'Ejemplo: Alimentos, Limpieza, Bebidas';
                    }
                    
                    await ctx.reply(categoriasTexto, {
                        parse_mode: 'Markdown',
                        reply_markup: { force_reply: true }
                    });
                    break;
                    
                case 'categoria':
                    estado.datos.categoria = texto;
                    estado.paso = 'descripcion';
                    
                    await ctx.reply(
                        '📝 Escribe una *DESCRIPCIÓN* breve del producto:\n' +
                        '(O escribe "saltar" para omitir)',
                        {
                            reply_markup: { force_reply: true }
                        }
                    );
                    break;
                    
                case 'descripcion':
                    estado.datos.descripcion = texto.toLowerCase() === 'saltar' ? '' : texto;
                    
                    // Mostrar resumen
                    const resumen = `
*✅ RESUMEN DEL PRODUCTO:*

*📦 Nombre:* ${estado.datos.nombre}
*💰 Precio:* $${estado.datos.precio.toLocaleString('es-CL')}
*📂 Categoría:* ${estado.datos.categoria}
*📝 Descripción:* ${estado.datos.descripcion || 'No especificada'}

*¿Guardar producto en la base de datos?*
                    `;
                    
                    const keyboard = {
                        inline_keyboard: [
                            [
                                { text: '✅ SI, GUARDAR', callback_data: `guardar_producto_${userId}` },
                                { text: '✏️ EDITAR', callback_data: `editar_producto_${userId}` }
                            ],
                            [
                                { text: '❌ CANCELAR', callback_data: `cancelar_producto_${userId}` }
                            ]
                        ]
                    };
                    
                    await ctx.reply(resumen, {
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    });
                    break;
            }
            
            estadosProductos.set(userId, estado);
            
        } catch (error) {
            console.error('Error en flujo producto:', error);
            await ctx.reply('❌ Error: ' + error.message);
            estadosProductos.delete(userId);
        }
    });
    
    // ========== MANEJAR CONFIRMACIONES ==========
    bot.action(/guardar_producto_(.+)/, async (ctx) => {
        const userId = ctx.match[1];
        const estado = estadosProductos.get(userId);
        
        if (!estado) {
            await ctx.answerCbQuery('Sesión expirada');
            return;
        }
        
        try {
            await ctx.answerCbQuery('Guardando en Firebase...');
            
            const producto = await productosDB.create(estado.datos);
            
            await ctx.editMessageText(
                `🎉 *¡PRODUCTO GUARDADO EXITOSAMENTE!*\n\n` +
                `✅ *${producto.nombre}* agregado a la base de datos.\n\n` +
                `*Detalles:*\n` +
                `• ID: \`${producto.id}\`\n` +
                `• Precio: $${producto.precio.toLocaleString('es-CL')}\n` +
                `• Categoría: ${producto.categoria}\n\n` +
                `El producto ya está disponible.`,
                { parse_mode: 'Markdown' }
            );
            
            estadosProductos.delete(userId);
            
        } catch (error) {
            console.error('Error guardando producto:', error);
            await ctx.editMessageText(
                `❌ *ERROR AL GUARDAR*\n\n` +
                `No se pudo guardar en Firebase:\n` +
                `${error.message}\n\n` +
                `Verifica la conexión a la base de datos.`
            );
        }
    });
    
    bot.action(/cancelar_producto_(.+)/, async (ctx) => {
        const userId = ctx.match[1];
        estadosProductos.delete(userId);
        await ctx.answerCbQuery('Cancelado');
        await ctx.editMessageText('❌ Creación de producto cancelada.');
    });
    
    // ========== ESTADÍSTICAS SIMPLES ==========
    bot.hears('📊 Estadísticas', async (ctx) => {
        try {
            const productos = await productosDB.getAll();
            
            let mensaje = `📊 *ESTADÍSTICAS DE PRODUCTOS*\n\n`;
            mensaje += `📦 *Total Productos:* ${productos.length}\n`;
            
            if (productos.length > 0) {
                const precioTotal = productos.reduce((sum, p) => sum + (p.precio || 0), 0);
                const precioPromedio = precioTotal / productos.length;
                
                mensaje += `💰 *Precio promedio:* $${precioPromedio.toLocaleString('es-CL', {maximumFractionDigits: 0})}\n`;
                mensaje += `🏷️ *Producto más caro:* $${Math.max(...productos.map(p => p.precio || 0)).toLocaleString('es-CL')}\n`;
                mensaje += `🏷️ *Producto más barato:* $${Math.min(...productos.map(p => p.precio || 0)).toLocaleString('es-CL')}\n\n`;
                
                // Agrupar por categoría
                const categorias = {};
                productos.forEach(p => {
                    const cat = p.categoria || 'Sin categoría';
                    categorias[cat] = (categorias[cat] || 0) + 1;
                });
                
                mensaje += `*Distribución por categoría:*\n`;
                Object.entries(categorias).forEach(([cat, count]) => {
                    const porcentaje = ((count / productos.length) * 100).toFixed(1);
                    mensaje += `• ${cat}: ${count} (${porcentaje}%)\n`;
                });
            }
            
            mensaje += `\n🕐 *Actualizado:* ${new Date().toLocaleString('es-CL')}`;
            
            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
            
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            await ctx.reply('📊 *ESTADÍSTICAS*\n\nBase de datos: Conectada\nProductos: Cargando...\n\nPrueba de nuevo en unos momentos.');
        }
    });
}
