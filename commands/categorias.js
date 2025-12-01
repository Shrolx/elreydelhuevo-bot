// commands/categorias.js
import { categoriasDB, productosDB } from '../firebase-config.js';
import { crearMenuKeyboard } from '../utils/formatters.js';

const estadosCategorias = new Map();

export function setupCategoriasCommands(bot) {
    
    // ========== MENÚ DE CATEGORÍAS ==========
    bot.hears(['📂 Categorías', '/categorias'], async (ctx) => {
        const menuCategorias = crearMenuKeyboard([
            '🆕 Nueva Categoría', 
            '📋 Listar Categorías',
            '✏️ Editar Categoría',
            '🗑️ Eliminar Categoría',
            '📊 Productos por Categoría',
            '🔙 Menú Principal'
        ], 2);
        
        await ctx.reply(
            '📂 *GESTIÓN DE CATEGORÍAS*\n\n' +
            'Selecciona una opción:',
            {
                parse_mode: 'Markdown',
                reply_markup: { keyboard: menuCategorias, resize_keyboard: true }
            }
        );
    });
    
    // ========== LISTAR CATEGORÍAS ==========
    bot.hears('📋 Listar Categorías', async (ctx) => {
        try {
            await ctx.reply('🔄 Cargando categorías...');
            
            const categorias = await categoriasDB.getAll();
            
            if (categorias.length === 0) {
                await ctx.reply('📭 No hay categorías registradas.');
                return;
            }
            
            let mensaje = `📂 *CATEGORÍAS (${categorias.length})*\n\n`;
            
            categorias.forEach((categoria, index) => {
                mensaje += `*${index + 1}. ${categoria.nombre}*\n`;
                mensaje += `📝 ${categoria.descripcion || 'Sin descripción'}\n`;
                mensaje += `🆔 \`${categoria.id}\`\n`;
                mensaje += `📅 ${categoria.fechaCreacion ? 'Creada recientemente' : ''}\n\n`;
            });
            
            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
            
        } catch (error) {
            console.error('Error listando categorías:', error);
            await ctx.reply('❌ Error al cargar categorías.');
        }
    });
    
    // ========== NUEVA CATEGORÍA ==========
    bot.hears('🆕 Nueva Categoría', async (ctx) => {
        const userId = ctx.from.id;
        estadosCategorias.set(userId, {
            paso: 'nombre',
            datos: {}
        });
        
        await ctx.reply(
            '🆕 *CREAR NUEVA CATEGORÍA*\n\n' +
            'Ingresa el *NOMBRE* de la categoría:\n\n' +
            'Ejemplos:\n' +
            '• Aseo\n' +
            '• Alimentos\n' +
            '• Limpieza\n' +
            '• Bebidas',
            { 
                parse_mode: 'Markdown',
                reply_markup: { force_reply: true }
            }
        );
    });
    
    // ========== FLUJO CONVERSACIONAL CATEGORÍA ==========
    bot.on('text', async (ctx) => {
        const userId = ctx.from.id;
        const texto = ctx.message.text;
        
        if (!estadosCategorias.has(userId)) return;
        
        const estado = estadosCategorias.get(userId);
        
        try {
            switch (estado.paso) {
                case 'nombre':
                    // Verificar si ya existe la categoría
                    const categorias = await categoriasDB.getAll();
                    const existe = categorias.some(cat => 
                        cat.nombre.toLowerCase() === texto.toLowerCase()
                    );
                    
                    if (existe) {
                        await ctx.reply(
                            '⚠️ *CATEGORÍA YA EXISTE*\n\n' +
                            `La categoría "${texto}" ya está registrada.\n\n` +
                            '¿Deseas usar esta categoría existente o ingresar otro nombre?\n\n' +
                            'Responde con el nuevo nombre o "usar_existente":',
                            {
                                parse_mode: 'Markdown',
                                reply_markup: { force_reply: true }
                            }
                        );
                        estado.paso = 'nombre_duplicado';
                        estado.datos.nombre = texto;
                    } else {
                        estado.datos.nombre = texto;
                        estado.paso = 'descripcion';
                        await ctx.reply(
                            '📝 Ingresa la *DESCRIPCIÓN* de la categoría:\n\n' +
                            'Ejemplo: "Productos de limpieza para el hogar"',
                            {
                                parse_mode: 'Markdown',
                                reply_markup: { force_reply: true }
                            }
                        );
                    }
                    break;
                    
                case 'nombre_duplicado':
                    if (texto.toLowerCase() === 'usar_existente') {
                        await ctx.reply(
                            '✅ Usando categoría existente.\n\n' +
                            'Operación completada.',
                            { parse_mode: 'Markdown' }
                        );
                        estadosCategorias.delete(userId);
                        return;
                    } else {
                        estado.datos.nombre = texto;
                        estado.paso = 'descripcion';
                        await ctx.reply(
                            '📝 Ingresa la *DESCRIPCIÓN* de la categoría:',
                            {
                                parse_mode: 'Markdown',
                                reply_markup: { force_reply: true }
                            }
                        );
                    }
                    break;
                    
                case 'descripcion':
                    estado.datos.descripcion = texto;
                    
                    // Mostrar resumen
                    const resumen = `
*✅ RESUMEN DE LA CATEGORÍA:*

*📂 Nombre:* ${estado.datos.nombre}
*📝 Descripción:* ${estado.datos.descripcion}

*¿Confirmar y guardar?*
                    `;
                    
                    const keyboard = {
                        inline_keyboard: [
                            [
                                { text: '✅ SI, GUARDAR', callback_data: `categoria_confirmar_si_${userId}` },
                                { text: '✏️ EDITAR', callback_data: `categoria_editar_${userId}` }
                            ],
                            [
                                { text: '❌ CANCELAR', callback_data: `categoria_cancelar_${userId}` }
                            ]
                        ]
                    };
                    
                    await ctx.reply(resumen, {
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    });
                    break;
            }
            
            estadosCategorias.set(userId, estado);
            
        } catch (error) {
            console.error('Error en flujo categoría:', error);
            await ctx.reply('❌ Error: ' + error.message);
            estadosCategorias.delete(userId);
        }
    });
    
    // ========== MANEJAR CONFIRMACIONES CATEGORÍA ==========
    bot.action(/categoria_confirmar_si_(.+)/, async (ctx) => {
        const userId = ctx.match[1];
        const estado = estadosCategorias.get(userId);
        
        if (!estado) {
            await ctx.answerCbQuery('Sesión expirada');
            return;
        }
        
        try {
            await ctx.answerCbQuery('Guardando categoría...');
            
            const categoria = await categoriasDB.create(estado.datos);
            
            await ctx.editMessageText(
                `🎉 *¡CATEGORÍA CREADA!*\n\n` +
                `✅ *${categoria.nombre}* agregada exitosamente.\n\n` +
                `*Detalles:*\n` +
                `• ID: \`${categoria.id}\`\n` +
                `• Descripción: ${categoria.descripcion}\n\n` +
                `Ahora puedes asignar productos a esta categoría.`,
                { parse_mode: 'Markdown' }
            );
            
            estadosCategorias.delete(userId);
            
        } catch (error) {
            console.error('Error guardando categoría:', error);
            await ctx.editMessageText('❌ Error al guardar: ' + error.message);
        }
    });
    
    bot.action(/categoria_cancelar_(.+)/, async (ctx) => {
        const userId = ctx.match[1];
        estadosCategorias.delete(userId);
        await ctx.answerCbQuery('Cancelado');
        await ctx.editMessageText('❌ Creación de categoría cancelada.');
    });
    
    // ========== ELIMINAR CATEGORÍA ==========
    bot.hears('🗑️ Eliminar Categoría', async (ctx) => {
        try {
            const categorias = await categoriasDB.getAll();
            
            if (categorias.length === 0) {
                await ctx.reply('📭 No hay categorías para eliminar.');
                return;
            }
            
            let mensaje = '🗑️ *SELECCIONA CATEGORÍA A ELIMINAR:*\n\n';
            mensaje += '⚠️ *ADVERTENCIA:* Al eliminar una categoría, los productos asignados quedarán sin categoría.\n\n';
            
            const keyboard = { inline_keyboard: [] };
            
            categorias.forEach((categoria, index) => {
                mensaje += `${index + 1}. *${categoria.nombre}*\n`;
                mensaje += `   📝 ${categoria.descripcion?.substring(0, 50)}...\n`;
                mensaje += `   🆔 \`${categoria.id}\`\n\n`;
                
                keyboard.inline_keyboard.push([
                    { 
                        text: `🗑️ Eliminar: ${categoria.nombre}`, 
                        callback_data: `categoria_eliminar_${categoria.id}` 
                    }
                ]);
            });
            
            keyboard.inline_keyboard.push([
                { text: '❌ Cancelar', callback_data: 'categoria_eliminar_cancelar' }
            ]);
            
            await ctx.reply(mensaje, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
            
        } catch (error) {
            console.error('Error mostrando categorías para eliminar:', error);
            await ctx.reply('❌ Error al cargar categorías.');
        }
    });
    
    // Manejar eliminación de categoría
    bot.action(/categoria_eliminar_(.+)/, async (ctx) => {
        const categoriaId = ctx.match[1];
        
        if (categoriaId === 'cancelar') {
            await ctx.answerCbQuery('Cancelado');
            await ctx.editMessageText('❌ Eliminación cancelada.');
            return;
        }
        
        try {
            await ctx.answerCbQuery('Verificando y eliminando...');
            
            // Verificar si hay productos en esta categoría
            const productos = await productosDB.getAll();
            const productosEnCategoria = productos.filter(p => p.categoriaId === categoriaId);
            
            if (productosEnCategoria.length > 0) {
                const keyboard = {
                    inline_keyboard: [
                        [
                            { 
                                text: '✅ Sí, eliminar igual', 
                                callback_data: `categoria_eliminar_forzar_${categoriaId}` 
                            }
                        ],
                        [
                            { 
                                text: '✏️ Reasignar productos primero', 
                                callback_data: 'categoria_eliminar_cancelar' 
                            }
                        ]
                    ]
                };
                
                await ctx.editMessageText(
                    `⚠️ *ADVERTENCIA*\n\n` +
                    `Hay *${productosEnCategoria.length} productos* en esta categoría.\n\n` +
                    `*Productos afectados:*\n` +
                    `${productosEnCategoria.map(p => `• ${p.nombre}`).join('\n')}\n\n` +
                    `¿Deseas eliminar la categoría de todas formas?\n` +
                    `Los productos quedarán sin categoría asignada.`,
                    {
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    }
                );
                return;
            }
            
            // Si no hay productos, eliminar directamente
            await categoriasDB.delete(categoriaId);
            
            await ctx.editMessageText(
                `✅ *CATEGORÍA ELIMINADA*\n\n` +
                `La categoría ha sido eliminada exitosamente.\n\n` +
                `ID: \`${categoriaId}\``,
                { parse_mode: 'Markdown' }
            );
            
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            await ctx.editMessageText('❌ Error al eliminar categoría.');
        }
    });
    
    // Eliminación forzada
    bot.action(/categoria_eliminar_forzar_(.+)/, async (ctx) => {
        const categoriaId = ctx.match[1];
        
        try {
            await ctx.answerCbQuery('Eliminando categoría...');
            
            // TODO: Opcionalmente, quitar categoría de productos
            // Por ahora solo eliminamos la categoría
            
            await categoriasDB.delete(categoriaId);
            
            await ctx.editMessageText(
                `✅ *CATEGORÍA ELIMINADA*\n\n` +
                `La categoría ha sido eliminada.\n` +
                `Recuerda actualizar los productos que tenían esta categoría.`,
                { parse_mode: 'Markdown' }
            );
            
        } catch (error) {
            console.error('Error eliminando categoría forzada:', error);
            await ctx.editMessageText('❌ Error al eliminar categoría.');
        }
    });
    
    // ========== PRODUCTOS POR CATEGORÍA ==========
    bot.hears('📊 Productos por Categoría', async (ctx) => {
        try {
            const [categorias, productos] = await Promise.all([
                categoriasDB.getAll(),
                productosDB.getAll()
            ]);
            
            if (categorias.length === 0) {
                await ctx.reply('📭 No hay categorías registradas.');
                return;
            }
            
            let mensaje = `📊 *PRODUCTOS POR CATEGORÍA*\n\n`;
            
            // Contar productos por categoría
            const conteoPorCategoria = {};
            productos.forEach(producto => {
                const categoria = producto.categoria || 'Sin categoría';
                conteoPorCategoria[categoria] = (conteoPorCategoria[categoria] || 0) + 1;
            });
            
            // Mostrar resultados
            Object.entries(conteoPorCategoria).forEach(([categoria, cantidad]) => {
                const porcentaje = ((cantidad / productos.length) * 100).toFixed(1);
                mensaje += `*${categoria}:* ${cantidad} producto${cantidad !== 1 ? 's' : ''} (${porcentaje}%)\n`;
            });
            
            mensaje += `\n*Total productos:* ${productos.length}`;
            mensaje += `\n*Total categorías:* ${categorias.length}`;
            
            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
            
        } catch (error) {
            console.error('Error obteniendo productos por categoría:', error);
            await ctx.reply('❌ Error al cargar la información.');
        }
    });
    
    // ========== EDITAR CATEGORÍA ==========
    bot.hears('✏️ Editar Categoría', async (ctx) => {
        try {
            const categorias = await categoriasDB.getAll();
            
            if (categorias.length === 0) {
                await ctx.reply('📭 No hay categorías para editar.');
                return;
            }
            
            let mensaje = '✏️ *SELECCIONA CATEGORÍA A EDITAR:*\n\n';
            const keyboard = { inline_keyboard: [] };
            
            categorias.forEach((categoria, index) => {
                mensaje += `${index + 1}. *${categoria.nombre}*\n`;
                mensaje += `   📝 ${categoria.descripcion?.substring(0, 50)}...\n\n`;
                
                keyboard.inline_keyboard.push([
                    { 
                        text: `✏️ Editar: ${categoria.nombre}`, 
                        callback_data: `categoria_editar_seleccionar_${categoria.id}` 
                    }
                ]);
            });
            
            keyboard.inline_keyboard.push([
                { text: '❌ Cancelar', callback_data: 'categoria_editar_cancelar' }
            ]);
            
            await ctx.reply(mensaje, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
            
        } catch (error) {
            console.error('Error mostrando categorías para editar:', error);
            await ctx.reply('❌ Error al cargar categorías.');
        }
    });
    
    // Manejar selección para editar categoría
    bot.action(/categoria_editar_seleccionar_(.+)/, async (ctx) => {
        const categoriaId = ctx.match[1];
        
        try {
            const categoria = await categoriasDB.getById(categoriaId);
            
            if (!categoria) {
                await ctx.answerCbQuery('Categoría no encontrada');
                return;
            }
            
            // Guardar estado para edición
            const userId = ctx.from.id;
            estadosCategorias.set(userId, {
                paso: 'editar_nombre',
                datos: { ...categoria },
                editando: true,
                categoriaId
            });
            
            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '📝 Editar Nombre', callback_data: `categoria_editar_campo_nombre_${userId}` },
                        { text: '📋 Editar Descripción', callback_data: `categoria_editar_campo_desc_${userId}` }
                    ],
                    [
                        { text: '✅ Guardar Cambios', callback_data: `categoria_editar_guardar_${userId}` },
                        { text: '❌ Cancelar', callback_data: `categoria_editar_cancelar_${userId}` }
                    ]
                ]
            };
            
            await ctx.editMessageText(
                `✏️ *EDITANDO CATEGORÍA*\n\n` +
                `*Nombre actual:* ${categoria.nombre}\n` +
                `*Descripción actual:* ${categoria.descripcion || 'Sin descripción'}\n\n` +
                `Selecciona qué deseas editar:`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                }
            );
            
        } catch (error) {
            console.error('Error preparando edición:', error);
            await ctx.editMessageText('❌ Error al cargar categoría.');
        }
    });
}
