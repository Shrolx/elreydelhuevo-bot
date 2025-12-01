// commands/publicaciones.js
import { publicacionesDB } from '../firebase-config.js';
import { formatearFecha, truncarTexto, crearMenuKeyboard } from '../utils/formatters.js';

const estadosPublicaciones = new Map();

export function setupPublicacionesCommands(bot) {
    
    // ========== MENÚ DE PUBLICACIONES ==========
    bot.hears(['📰 Publicaciones', '/publicaciones'], async (ctx) => {
        const menuPublicaciones = crearMenuKeyboard([
            '🆕 Nueva Publicación', 
            '📋 Listar Publicaciones',
            '✏️ Editar Publicación',
            '🗑️ Eliminar Publicación',
            '📊 Estadísticas Publicaciones',
            '🔙 Menú Principal'
        ], 2);
        
        await ctx.reply(
            '📰 *GESTIÓN DE PUBLICACIONES*\n\n' +
            'Selecciona una opción:',
            {
                parse_mode: 'Markdown',
                reply_markup: { keyboard: menuPublicaciones, resize_keyboard: true }
            }
        );
    });
    
    // ========== LISTAR PUBLICACIONES ==========
    bot.hears('📋 Listar Publicaciones', async (ctx) => {
        try {
            await ctx.reply('🔄 Cargando publicaciones...');
            
            const publicaciones = await publicacionesDB.getAll();
            
            if (publicaciones.length === 0) {
                await ctx.reply('📭 No hay publicaciones registradas.');
                return;
            }
            
            let mensaje = `📰 *PUBLICACIONES (${publicaciones.length})*\n\n`;
            
            publicaciones.forEach((publicacion, index) => {
                const fecha = formatearFecha(publicacion.fechaCreacion || publicacion.fechaActualizacion);
                mensaje += `*${index + 1}. ${publicacion.titulo}*\n`;
                mensaje += `📅 ${fecha}\n`;
                mensaje += `📝 ${truncarTexto(publicacion.contenido, 60)}\n`;
                if (publicacion.imagenUrl && !publicacion.imagenUrl.includes('placeholder')) {
                    mensaje += `🖼️ Con imagen\n`;
                }
                mensaje += `🆔 \`${publicacion.id}\`\n\n`;
            });
            
            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
            
        } catch (error) {
            console.error('Error listando publicaciones:', error);
            await ctx.reply('❌ Error al cargar publicaciones.');
        }
    });
    
    // ========== NUEVA PUBLICACIÓN ==========
    bot.hears('🆕 Nueva Publicación', async (ctx) => {
        const userId = ctx.from.id;
        estadosPublicaciones.set(userId, {
            paso: 'titulo',
            datos: {}
        });
        
        await ctx.reply(
            '🆕 *CREAR NUEVA PUBLICACIÓN*\n\n' +
            'Ideal para:\n' +
            '• Noticias del negocio\n' +
            '• Ofertas especiales\n' +
            '• Novedades de productos\n' +
            '• Eventos\n\n' +
            'Ingresa el *TÍTULO* de la publicación:',
            { 
                parse_mode: 'Markdown',
                reply_markup: { force_reply: true }
            }
        );
    });
    
    // ========== FLUJO CONVERSACIONAL PUBLICACIÓN ==========
    bot.on('text', async (ctx) => {
        const userId = ctx.from.id;
        const texto = ctx.message.text;
        
        if (!estadosPublicaciones.has(userId)) return;
        
        const estado = estadosPublicaciones.get(userId);
        
        try {
            switch (estado.paso) {
                case 'titulo':
                    estado.datos.titulo = texto;
                    estado.paso = 'contenido';
                    await ctx.reply(
                        '📝 Ingresa el *CONTENIDO* de la publicación:\n\n' +
                        'Puedes incluir:\n' +
                        '• Descripción detallada\n' +
                        '• Información importante\n' +
                        '• Formato simple (sin HTML)',
                        {
                            parse_mode: 'Markdown',
                            reply_markup: { force_reply: true }
                        }
                    );
                    break;
                    
                case 'contenido':
                    estado.datos.contenido = texto;
                    estado.paso = 'imagen';
                    await ctx.reply(
                        '🖼️ Ingresa la *URL DE LA IMAGEN* (opcional):\n\n' +
                        'Puedes usar:\n' +
                        '• https://via.placeholder.com/400x200?text=Publicación\n' +
                        '• Cualquier URL de imagen pública\n' +
                        '• O escribe "skip" para imagen por defecto\n\n' +
                        'Tip: Usa servicios como Imgur o PostImage para subir imágenes.',
                        {
                            parse_mode: 'Markdown',
                            reply_markup: { force_reply: true }
                        }
                    );
                    break;
                    
                case 'imagen':
                    estado.datos.imagenUrl = texto.toLowerCase() === 'skip' 
                        ? 'https://via.placeholder.com/400x200?text=Publicación+El+Rey+del+Huevo'
                        : texto;
                    
                    // Mostrar resumen final
                    const resumen = `
*✅ RESUMEN DE LA PUBLICACIÓN:*

*📰 Título:* ${estado.datos.titulo}
*📝 Contenido:* ${truncarTexto(estado.datos.contenido, 100)}
*🖼️ Imagen:* ${estado.datos.imagenUrl.includes('placeholder') ? 'Por defecto' : 'Personalizada'}

*¿Confirmar y publicar?*
                    `;
                    
                    const keyboard = {
                        inline_keyboard: [
                            [
                                { text: '✅ PUBLICAR AHORA', callback_data: `publicacion_confirmar_si_${userId}` },
                                { text: '🕐 PROGRAMAR', callback_data: `publicacion_programar_${userId}` }
                            ],
                            [
                                { text: '✏️ EDITAR', callback_data: `publicacion_editar_${userId}` },
                                { text: '❌ CANCELAR', callback_data: `publicacion_cancelar_${userId}` }
                            ]
                        ]
                    };
                    
                    await ctx.reply(resumen, {
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    });
                    break;
            }
            
            estadosPublicaciones.set(userId, estado);
            
        } catch (error) {
            console.error('Error en flujo publicación:', error);
            await ctx.reply('❌ Error: ' + error.message);
            estadosPublicaciones.delete(userId);
        }
    });
    
    // ========== MANEJAR CONFIRMACIONES PUBLICACIÓN ==========
    bot.action(/publicacion_confirmar_si_(.+)/, async (ctx) => {
        const userId = ctx.match[1];
        const estado = estadosPublicaciones.get(userId);
        
        if (!estado) {
            await ctx.answerCbQuery('Sesión expirada');
            return;
        }
        
        try {
            await ctx.answerCbQuery('Publicando...');
            
            const publicacion = await publicacionesDB.create(estado.datos);
            const fecha = formatearFecha(new Date());
            
            await ctx.editMessageText(
                `🎉 *¡PUBLICACIÓN CREADA!*\n\n` +
                `✅ *${publicacion.titulo}* publicada exitosamente.\n\n` +
                `*Detalles:*\n` +
                `• ID: \`${publicacion.id}\`\n` +
                `• Fecha: ${fecha}\n` +
                `• Contenido: ${truncarTexto(publicacion.contenido, 80)}\n\n` +
                `La publicación ya está visible en el sitio web.`,
                { parse_mode: 'Markdown' }
            );
            
            estadosPublicaciones.delete(userId);
            
        } catch (error) {
            console.error('Error guardando publicación:', error);
            await ctx.editMessageText('❌ Error al publicar: ' + error.message);
        }
    });
    
    bot.action(/publicacion_cancelar_(.+)/, async (ctx) => {
        const userId = ctx.match[1];
        estadosPublicaciones.delete(userId);
        await ctx.answerCbQuery('Cancelado');
        await ctx.editMessageText('❌ Creación de publicación cancelada.');
    });
    
    // ========== ELIMINAR PUBLICACIÓN ==========
    bot.hears('🗑️ Eliminar Publicación', async (ctx) => {
        try {
            const publicaciones = await publicacionesDB.getAll();
            
            if (publicaciones.length === 0) {
                await ctx.reply('📭 No hay publicaciones para eliminar.');
                return;
            }
            
            let mensaje = '🗑️ *SELECCIONA PUBLICACIÓN A ELIMINAR:*\n\n';
            const keyboard = { inline_keyboard: [] };
            
            publicaciones.forEach((publicacion, index) => {
                const fecha = formatearFecha(publicacion.fechaCreacion || publicacion.fechaActualizacion);
                mensaje += `${index + 1}. *${publicacion.titulo}*\n`;
                mensaje += `   📅 ${fecha}\n`;
                mensaje += `   📝 ${truncarTexto(publicacion.contenido, 40)}...\n\n`;
                
                keyboard.inline_keyboard.push([
                    { 
                        text: `🗑️ Eliminar: ${publicacion.titulo.substring(0, 20)}...`, 
                        callback_data: `publicacion_eliminar_${publicacion.id}` 
                    }
                ]);
            });
            
            keyboard.inline_keyboard.push([
                { text: '❌ Cancelar', callback_data: 'publicacion_eliminar_cancelar' }
            ]);
            
            await ctx.reply(mensaje, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
            
        } catch (error) {
            console.error('Error mostrando publicaciones para eliminar:', error);
            await ctx.reply('❌ Error al cargar publicaciones.');
        }
    });
    
    // Manejar eliminación de publicación
    bot.action(/publicacion_eliminar_(.+)/, async (ctx) => {
        const publicacionId = ctx.match[1];
        
        if (publicacionId === 'cancelar') {
            await ctx.answerCbQuery('Cancelado');
            await ctx.editMessageText('❌ Eliminación cancelada.');
            return;
        }
        
        try {
            await ctx.answerCbQuery('Eliminando publicación...');
            await publicacionesDB.delete(publicacionId);
            
            await ctx.editMessageText(
                `✅ *PUBLICACIÓN ELIMINADA*\n\n` +
                `La publicación ha sido eliminada exitosamente.\n\n` +
                `ID: \`${publicacionId}\``,
                { parse_mode: 'Markdown' }
            );
            
        } catch (error) {
            console.error('Error eliminando publicación:', error);
            await ctx.editMessageText('❌ Error al eliminar publicación.');
        }
    });
    
    // ========== ESTADÍSTICAS PUBLICACIONES ==========
    bot.hears('📊 Estadísticas Publicaciones', async (ctx) => {
        try {
            const publicaciones = await publicacionesDB.getAll();
            
            if (publicaciones.length === 0) {
                await ctx.reply('📭 No hay publicaciones registradas.');
                return;
            }
            
            // Calcular estadísticas
            const totalPublicaciones = publicaciones.length;
            
            // Agrupar por mes (últimos 6 meses)
            const ahora = new Date();
            const ultimos6Meses = {};
            
            for (let i = 0; i < 6; i++) {
                const mes = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
                const clave = mes.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });
                ultimos6Meses[clave] = 0;
            }
            
            publicaciones.forEach(pub => {
                const fecha = pub.fechaCreacion?.toDate?.() || new Date();
                const clave = fecha.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });
                if (ultimos6Meses[clave] !== undefined) {
                    ultimos6Meses[clave]++;
                }
            });
            
            let mensaje = `📊 *ESTADÍSTICAS DE PUBLICACIONES*\n\n`;
            mensaje += `📰 *Total Publicaciones:* ${totalPublicaciones}\n`;
            mensaje += `📅 *Última publicación:* ${formatearFecha(publicaciones[0]?.fechaCreacion)}\n\n`;
            
            mensaje += `*Actividad últimos 6 meses:*\n`;
            Object.entries(ultimos6Meses).forEach(([mes, cantidad]) => {
                const barras = '█'.repeat(Math.min(Math.floor(cantidad / 2), 10));
                mensaje += `• ${mes}: ${barras} ${cantidad}\n`;
            });
            
            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
            
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            await ctx.reply('❌ Error al cargar estadísticas.');
        }
    });
    
    // ========== EDITAR PUBLICACIÓN ==========
    bot.hears('✏️ Editar Publicación', async (ctx) => {
        try {
            const publicaciones = await publicacionesDB.getAll();
            
            if (publicaciones.length === 0) {
                await ctx.reply('📭 No hay publicaciones para editar.');
                return;
            }
            
            let mensaje = '✏️ *SELECCIONA PUBLICACIÓN A EDITAR:*\n\n';
            const keyboard = { inline_keyboard: [] };
            
            publicaciones.forEach((publicacion, index) => {
                const fecha = formatearFecha(publicacion.fechaCreacion || publicacion.fechaActualizacion);
                mensaje += `${index + 1}. *${publicacion.titulo}*\n`;
                mensaje += `   📅 ${fecha}\n\n`;
                
                keyboard.inline_keyboard.push([
                    { 
                        text: `✏️ Editar: ${publicacion.titulo.substring(0, 20)}...`, 
                        callback_data: `publicacion_editar_seleccionar_${publicacion.id}` 
                    }
                ]);
            });
            
            keyboard.inline_keyboard.push([
                { text: '❌ Cancelar', callback_data: 'publicacion_editar_cancelar' }
            ]);
            
            await ctx.reply(mensaje, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
            
        } catch (error) {
            console.error('Error mostrando publicaciones para editar:', error);
            await ctx.reply('❌ Error al cargar publicaciones.');
        }
    });
}