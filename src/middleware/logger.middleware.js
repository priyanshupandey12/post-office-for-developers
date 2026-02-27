const { createLogger, transports, format } = require('winston');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';


const myTransports = [

  new transports.Console({
    format: format.combine(
      format.colorize(),
      format.printf(info => 
        `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
      )
    )
  })
];


if (process.env.NODE_ENV === 'development') {
  myTransports.push(
    new transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, 
      maxFiles: 5
    })
  );

  myTransports.push(
    new transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, 
      maxFiles: 5
    })
  );
}


const logger = createLogger({
  level,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }), 
    format.splat(), 
    format.json() 
  ),

  transports: myTransports, 

  exceptionHandlers: [
    new transports.File({ filename: path.join(logsDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(logsDir, 'rejections.log') })
  ]
});


if (process.env.NODE_ENV !== 'development') {
  logger.exceptions.handle(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple())
    })
  );
  logger.rejections.handle(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple())
    })
  );
}

module.exports = logger;