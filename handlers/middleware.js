// handlers/middleware.js
export function authMiddleware(adminUsers) {
    return async (ctx, next) => {
        const userId = ctx.from?.id?.toString();
        const username = ctx.from?.username;
        
        if (!adminUsers.includes(userId)) {
            console.log(`⚠️  Intento de acceso no autorizado: ${userId} (@${username})`);
            await ctx.reply(
                '❌ *ACCESO DENEGADO*\n\n' +
                'No tienes permisos para usar este bot de administración.\n\n' +
                'Si crees que esto es un error, contacta al administrador.',
                { parse_mode: 'Markdown' }
            );
            return;
        }
        
        console.log(`✅ Usuario autorizado: ${ctx.from.first_name} (${userId})`);
        await next();
    };
}

export function loggingMiddleware() {
    return async (ctx, next) => {
        const logInfo = {
            userId: ctx.from?.id,
            username: ctx.from?.username,
            chatId: ctx.chat?.id,
            message: ctx.message?.text,
            command: ctx.message?.entities?.[0]?.type === 'bot_command' ? ctx.message.text : null,
            timestamp: new Date().toISOString()
        };
        
        console.log('📨 Mensaje recibido:', logInfo);
        await next();
    };
}
