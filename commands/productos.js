// commands/productos.js
import { productosDB, categoriasDB } from '../firebase-config.js';
import { formatearPrecioCLP, truncarTexto, crearMenuKeyboard } from '../utils/formatters.js';

// Estados para flujos conversacionales
const estadosProductos = new Map();

export function setupProductosCommands(bot) {
    
    // ========== MENÚ DE PRODUCTOS ==========
    bot.hears(['📦 Productos', '/productos'], async (ctx) => {
        const menuProductos = crearMenuKeyboard([
            '📥 Nuevo Producto', 
            '📋 Listar Productos',
            '🔍 Buscar Producto',
            '✏️ Editar Producto',
            '🗑️ Eliminar Producto',
            '📊 Estadísticas Productos',
            '🔙 Menú Principal'
        ], 2);
        
        await ctx.reply(
            '📦 *GESTIÓN DE PRODUCTOS*\n\n' +
            'Selecciona una opción:',
            {
                parse_mode: 'Markdown',
                reply_markup: { keyboard: menuProductos, resize_keyboard: true }
            }
        );
    });
    
    // ========== LISTAR PRODUCTOS ==========
    bot.hears('📋 Listar Productos', async (ctx) => {
        try {
            await ctx.reply('🔄 Cargando productos...');
            
            const productos = await productosDB.getAll();
            
            if (productos.length === 0) {
                await ctx.reply('📭 No hay productos registrados.');
                return;
            }
            
            let mensaje = `📦 *PRODUCTOS (${productos.length})*\n\n`;
            
            productos.forEach((producto, index) => {
                mensaje += `*${index + 1}. ${producto.nombre}*\n`;
                mensaje += `💰 ${formatearPrecioCLP(producto.precio)}\n`;
                mensaje += `📂 ${producto.categoria || 'Sin categoría'}\n`;
                mensaje += `📝 ${truncarTexto(producto.descripcion, 50)}\n`;
                mensaje += `🆔 \`${producto.id}\`\n\n`;
            });
            
            // Enviar en partes si es muy largo
            const partes = mensaje.match(/[\s\S]{1,4000}/g) || [mensaje];
            for (const parte of partes) {
                await ctx.reply(parte, { parse_mode: 'Markdown' });
            }
            
        } catch (error) {
            console.error('Error listando productos:', error);
            await ctx.reply('❌ Error al cargar productos.');
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
            'Ingresa el *NOMBRE* del producto:',
            { 
                parse_mode: 'Markdown',
                reply_markup: { force_reply: true }
            }
        );
    });
    
    // ========== FLUJO CONVERSACIONAL PARA NUEVO PRODUCTO ==========
    bot.on('text', async (ctx) => {
        const userId = ctx.from.id;
        const texto = ctx.message.text;
        
        if (!estadosProductos.has(userId)) return;
        
        const estado = estadosProductos.get(userId);
        
        try {
            switch (estado.paso) {
                case 'nombre':
                    estado.datos.nombre = texto;
                    estado.paso = 'descripcion';
                    await ctx.reply('📝 Ingresa la *DESCRIPCIÓN*:', {
                        parse_mode: 'Markdown',
                        reply_markup: { force_reply: true }
                    });
                    break;
                    
                case 'descripcion':
                    estado.datos.descripcion = texto;
                    estado.paso = 'precio';
                    await ctx.reply('💰 Ingresa el *PRECIO* (ej: 2990):', {
                        parse_mode: 'Markdown',
                        reply_markup: { force_reply: true }
                    });
                    break;
                    
                case 'precio':
                    const precio = parseFloat(texto.replace(/[^0-9.]/g, ''));
                    if (isNaN(precio)) {
                        await ctx.reply('❌ Precio inválido. Ingresa solo números:');
                        return;
                    }
                    estado.datos.precio = precio;
                    estado.paso = 'categoria';
                    
                    // Obtener categorías
                    const categorias = await categoriasDB.getAll();
                    
                    if (categorias.length === 0) {
                        estado.paso = 'categoria_manual';
                        await ctx.reply('📝 Ingresa el *NOMBRE* de la categoría:', {
                            parse_mode: 'Markdown',
                            reply_markup: { force_reply: true }
                        });
                        return;
                    }
                    
                    let categoriasTexto = '📂 Selecciona una *CATEGORÍA*:\n\n';
                    estado.categoriasLista = categorias.map(c => c.nombre);
                    
                    categorias.forEach((cat, index) => {
                        categoriasTexto += `${index + 1}. ${cat.nombre}\n`;
                    });
                    
                    categoriasTexto += '\nResponde con el *NÚMERO* o escribe una nueva categoría:';
                    
                    await ctx.reply(categoriasTexto, {
                        parse_mode: 'Markdown',
                        reply_markup: { force_reply: true }
                    });
                    break;
                    
                case 'categoria':
                case 'categoria_manual':
                    estado.datos.categoria = texto;
                    estado.paso = 'imagen';
                    await ctx.reply(
                        '🖼️ Ingresa la *URL DE LA IMAGEN*:\n\n' +
                        'Puedes usar:\n' +
                        '• https://via.placeholder.com/300x200?text=Producto\n' +
                        '• Cualquier URL de imagen pública\n' +
                        '• O escribe "skip" para imagen por defecto',
                        {
                            parse_mode: 'Markdown',
                            reply_markup: { force_reply: true }
                        }
                    );
                    break;
                    
                case 'imagen':
                    estado.datos.imagenUrl = texto.toLowerCase() === 'skip' 
                        ? 'https://via.placeholder.com/300x200?text=Sin+imagen'
                        : texto;
                    
                    // Mostrar resumen final
                    const resumen = `
*✅ RESUMEN DEL PRODUCTO:*

*📦 Nombre:* ${estado.datos.nombre}
*📝 Descripción:* ${estado.datos.descripcion}
*💰 Precio:* ${formatearPrecioCLP(estado.datos.precio)}
*📂 Categoría:* ${estado.datos.categoria}
*🖼️ Imagen:* ${estado.datos.imagenUrl.includes('placeholder') ? 'Por defecto' : 'Personalizada'}

*¿Confirmar y guardar?*
                    `;
                    
                    const keyboard = {
                        inline_keyboard: [
                            [
                                { text: '✅ SI, GUARDAR', callback_data: `producto_confirmar_si_${userId}` },
                                { text: '✏️ EDITAR', callback_data: `producto_editar_${userId}` }
                            ],
                            [
                                { text: '❌ CANCELAR', callback_data: `producto_cancelar_${userId}` }
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
    bot.action(/producto_confirmar_si_(.+)/, async (ctx) => {
        const userId = ctx.match[1];
        const estado = estadosProductos.get(userId);
        
        if (!estado) {
            await ctx.answerCbQuery('Sesión expirada');
            return;
        }
        
        try {
            await ctx.answerCbQuery('Guardando producto...');
            
            const producto = await productosDB.create(estado.datos);
            
            await ctx.editMessageText(
                `🎉 *¡PRODUCTO GUARDADO!*\n\n` +
                `✅ *${producto.nombre}* agregado exitosamente.\n\n` +
                `*Detalles:*\n` +
                `• ID: \`${producto.id}\`\n` +
                `• Precio: ${formatearPrecioCLP(producto.precio)}\n` +
                `• Categoría: ${producto.categoria}\n\n` +
                `El producto ya está disponible en el sitio web.`,
                { parse_mode: 'Markdown' }
            );
            
            estadosProductos.delete(userId);
            
        } catch (error) {
            console.error('Error guardando producto:', error);
            await ctx.editMessageText('❌ Error al guardar: ' + error.message);
        }
    });
    
    bot.action(/producto_cancelar_(.+)/, async (ctx) => {
        const userId = ctx.match[1];
        estadosProductos.delete(userId);
        await ctx.answerCbQuery('Cancelado');
        await ctx.editMessageText('❌ Creación de producto cancelada.');
    });
    
    // ========== ELIMINAR PRODUCTO ==========
    bot.hears('🗑️ Eliminar Producto', async (ctx) => {
        try {
            const productos = await productosDB.getAll();
            
            if (productos.length === 0) {
                await ctx.reply('📭 No hay productos para eliminar.');
                return;
            }
            
            let mensaje = '🗑️ *SELECCIONA PRODUCTO A ELIMINAR:*\n\n';
            const keyboard = { inline_keyboard: [] };
            
            productos.forEach((producto, index) => {
                mensaje += `${index + 1}. *${producto.nombre}* - ${formatearPrecioCLP(producto.precio)}\n`;
                mensaje += `   ID: \`${producto.id}\`\n\n`;
                
                keyboard.inline_keyboard.push([
                    { 
                        text: `🗑️ Eliminar: ${producto.nombre.substring(0, 20)}...`, 
                        callback_data: `producto_eliminar_${producto.id}` 
                    }
                ]);
            });
            
            keyboard.inline_keyboard.push([
                { text: '❌ Cancelar', callback_data: 'producto_eliminar_cancelar' }
            ]);
            
            await ctx.reply(mensaje, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
            
        } catch (error) {
            console.error('Error mostrando productos para eliminar:', error);
            await ctx.reply('❌ Error al cargar productos.');
        }
    });
    
    // Manejar eliminación
    bot.action(/producto_eliminar_(.+)/, async (ctx) => {
        const productoId = ctx.match[1];
        
        if (productoId === 'cancelar') {
            await ctx.answerCbQuery('Cancelado');
            await ctx.editMessageText('❌ Eliminación cancelada.');
            return;
        }
        
        try {
            await ctx.answerCbQuery('Eliminando producto...');
            await productosDB.delete(productoId);
            
            await ctx.editMessageText(
                `✅ *PRODUCTO ELIMINADO*\n\n` +
                `El producto con ID \`${productoId}\` ha sido eliminado exitosamente.`,
                { parse_mode: 'Markdown' }
            );
            
        } catch (error) {
            console.error('Error eliminando producto:', error);
            await ctx.editMessageText('❌ Error al eliminar producto.');
        }
    });
    
    // ========== ESTADÍSTICAS ==========
    bot.hears('📊 Estadísticas Productos', async (ctx) => {
        try {
            const productos = await productosDB.getAll();
            const categorias = await categoriasDB.getAll();
            
            // Calcular estadísticas
            const totalProductos = productos.length;
            const totalCategorias = categorias.length;
            const precioPromedio = productos.reduce((sum, p) => sum + (p.precio || 0), 0) / (totalProductos || 1);
            
            // Productos por categoría
            const productosPorCategoria = {};
            productos.forEach(p => {
                const cat = p.categoria || 'Sin categoría';
                productosPorCategoria[cat] = (productosPorCategoria[cat] || 0) + 1;
            });
            
            let mensaje = `📊 *ESTADÍSTICAS DE PRODUCTOS*\n\n`;
            mensaje += `📦 *Total Productos:* ${totalProductos}\n`;
            mensaje += `📂 *Total Categorías:* ${totalCategorias}\n`;
            mensaje += `💰 *Precio Promedio:* ${formatearPrecioCLP(precioPromedio)}\n\n`;
            
            mensaje += `*Distribución por Categoría:*\n`;
            Object.entries(productosPorCategoria).forEach(([categoria, cantidad]) => {
                const porcentaje = ((cantidad / totalProductos) * 100).toFixed(1);
                mensaje += `• ${categoria}: ${cantidad} (${porcentaje}%)\n`;
            });
            
            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
            
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            await ctx.reply('❌ Error al cargar estadísticas.');
        }
    });
}
