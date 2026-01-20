import pino from "pino";

export const devLogger = pino({
    transport: {
        target: 'pino-roll',
        options: {
            file: 'logs/dev.log',
            singleLine: false,
            mkdir: true,
            maxSize: '10MB',
            maxFiles: 5,
        }
    }
})
