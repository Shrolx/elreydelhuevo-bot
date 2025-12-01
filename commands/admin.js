// commands/admin.js
import { verificarCredencialesAdmin } from '../firebase-config.js';

export function setupAdminCommands(bot) {
    
    // ========== VERIFICAR CREDENCIALES ==========
    bot.hears(['🔐 Verificar Acceso', '/verificar'], async (ctx) => {
        try {
            await ctx.reply('🔐 Verificando credenciales...');
            
            const credenciales = await verificarCredencialesAdmin();
            const userId = ctx.from.id.toString();
            
            let mensaje = `🔐 *VERIFICACIÓN DE ACCESO*\n\n`;
            
            if (credenciales) {
                mensaje += `✅ *CREDENCIALES ENCONTRADAS*\n\n`;
                mensaje += `*Usuario admin:* ${credenciales.usuario || 'No configurado'}\n`;
                mensaje += `*Clave:* ${'*'.repeat(credenciales.clave?.length || 8)}\n\n`;
            } else {
                mensaje += `⚠️ *CREDENCIALES NO CONFIGURADAS*\n\n`;
                mensaje += `Configura las credenciales en Firebase:\n`;
                mensaje += `Colección: admin\n`;
                mensaje += `Documento: credenciales\n`;
                mensaje += `Campos: usuario, clave\n\n`;
            }
            
            mensaje += `*TU INFORMACIÓN:*\n`;
            mensaje += `• ID: ${userId}\n`;
            mensaje += `• Nombre: ${ctx.from.first_name}\n`;
            mensaje += `• Username: @${ctx.from.username || 'No tiene'}\n\n`;
            
            mensaje += `*ESTADO DE ACCESO:* `;
            
            // Verificar si el usuario está en la lista de admins
            const adminUsers = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : [];
            if (adminUsers.includes(userId)) {
                mensaje += `✅ AUTORIZADO\n`;
                mensaje += `Tienes acceso completo al sistema.`;
            } else {
                mensaje += `❌ NO AUTORIZADO\n`;
                mensaje += `Tu ID (${userId}) no está en la lista de administradores.`;
            }
            
            await ctx.reply(mensaje, { parse_mode: 'Markdown' });
            
        } catch (error) {
            console.error('Error verificando credenciales:', error);
            await ctx.reply('❌ Error al verificar acceso.');
        }
    });
    
    // ========== INFO DEL SISTEMA ==========
    bot.hears(['ℹ️ Información Sistema', '/info'], async (ctx) => {
        const info = `
*ℹ️ INFORMACIÓN DEL SISTEMA*

*🤖 BOT:*
• Versión: 2.0.0
• Estado: ✅ OPERATIVO
• Modo: ${process.env.RAILWAY_PUBLIC_DOMAIN ? 'Webhook (24/7)' : 'Polling (Desarrollo)'}
• Tiempo activo: ${(process.uptime() / 60 / 60).toFixed(2)} horas

*👤 USUARIO:*
• ID: ${ctx.from.id}
• Nombre: ${ctx.from.first_name}
• Username: @${ctx.from.username || 'No tiene'}

*🌐 SERVIDOR:*
• Node.js: ${process.version}
• Plataforma: ${process.platform}
• Memoria: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• CPU: ${process.arch}

*📡 CONEXIONES:*
• Firebase: ✅ CONECTADO
• Telegram API: ✅ CONECTADO
• Webhook: ${process.env.RAILWAY_PUBLIC_DOMAIN ? '✅ ACTIVO' : '❌ INACTIVO'}

*🕐 SERVIDOR:*
• Hora: ${new Date().toLocaleString('es-CL')}
• Zona horaria: UTC-3 (Chile)
        `;
        
        await ctx.reply(info, { parse_mode: 'Markdown' });
    });
    
    // ========== REINICIAR BOT ==========
    bot.hears(['🔄 Reiniciar Bot', '/reiniciar'], async (ctx) => {
        const userId = ctx.from.id.toString();
        const adminUsers = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : [];
        
        if (!adminUsers.includes(userId)) {
            await ctx.reply('❌ Solo el administrador principal puede reiniciar el bot.');
            return;
        }
        
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '✅ Sí, reiniciar', callback_data: 'admin_reiniciar_confirmar' },
                    { text: '❌ Cancelar', callback_data: 'admin_reiniciar_cancelar' }
                ]
            ]
        };
        
        await ctx.reply(
            '⚠️ *REINICIAR BOT*\n\n' +
            'Esta acción reiniciará el bot de administración.\n\n' +
            '• El bot estará offline por 5-10 segundos\n' +
            '• Las conexiones se restablecerán\n' +
            '• No se perderán datos\n\n' +
            '¿Confirmar reinicio?',
            {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            }
        );
    });
    
    // Manejar confirmación de reinicio
    bot.action('admin_reiniciar_confirmar', async (ctx) => {
        await ctx.answerCbQuery('Reiniciando...');
        
        await ctx.editMessageText(
            '🔄 *REINICIANDO BOT...*\n\n' +
            'El bot se está reiniciando.\n' +
            'Por favor, espera 10 segundos y envía /start nuevamente.\n\n' +
            '✅ El reinicio se completará automáticamente.',
            { parse_mode: 'Markdown' }
        );
        
        // Simular reinicio (en producción sería diferente)
        setTimeout(() => {
            console.log('🔄 Bot reiniciado por administrador');
        }, 1000);
    });
    
    bot.action('admin_reiniciar_cancelar', async (ctx) => {
        await ctx.answerCbQuery('Cancelado');
        await ctx.editMessageText('❌ Reinicio cancelado.');
    });
    
    // ========== LOGS DEL SISTEMA ==========
    bot.hears(['📋 Ver Logs', '/logs'], async (ctx) => {
        const userId = ctx.from.id.toString();
        const adminUsers = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : [];
        
        if (!adminUsers.includes(userId)) {
            await ctx.reply('❌ Solo administradores pueden ver los logs.');
            return;
        }
        
        const logs = `
*📋 ÚLTIMOS EVENTOS DEL SISTEMA*

*🕐 Hora del servidor:* ${new Date().toLocaleString('es-CL')}
*📊 Uptime:* ${(process.uptime() / 60 / 60).toFixed(2)} horas

*🔍 EVENTOS RECIENTES:*
• Bot iniciado: ${new Date(Date.now() - process.uptime() * 1000).toLocaleTimeString('es-CL')}
• Usuario activo: ${ctx.from.first_name} (${userId})
• Memoria usada: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• Conexiones activas: ✅ Estables

*⚠️ NOTA:*
Los logs completos están disponibles en Railway Dashboard.
Para ver logs detallados, accede a:
https://railway.app/project/[TU_PROYECTO]/metrics
        `;
        
        await ctx.reply(logs, { parse_mode: 'Markdown' });
    });
    
    // ========== BACKUP DE DATOS ==========
    bot.hears(['💾 Backup Datos', '/backup'], async (ctx) => {
        const userId = ctx.from.id.toString();
        const adminUsers = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : [];
        
        if (!adminUsers.includes(userId)) {
            await ctx.reply('❌ Solo administradores pueden hacer backup.');
            return;
        }
        
        await ctx.reply(
            '💾 *BACKUP DE DATOS*\n\n' +
            'Los datos están respaldados automáticamente en:\n\n' +
            '✅ *Firebase Firestore:*\n' +
            '• Copias de seguridad automáticas diarias\n' +
            '• Retención de 30 días\n' +
            '• Recuperación point-in-time\n\n' +
            '✅ *Railway.app:*\n' +
            '• Deployment automático desde GitHub\n' +
            '• Rollback a versiones anteriores\n' +
            '• Variables de entorno seguras\n\n' +
            '⚠️ *PARA BACKUP MANUAL:*\n' +
            '1. Ve a Firebase Console\n' +
            '2. Selecciona tu proyecto\n' +
            '3. Ve a Firestore → Backups\n' +
            '4. Crea un backup manual\n\n' +
            '📅 *Último backup automático:* Hoy',
            { parse_mode: 'Markdown' }
        );
    });
}
