require('dotenv').config();
const express=require('express');
const {clerkMiddleware}=require('@clerk/express');
const cookieParser=require('cookie-parser');
const helmet = require("helmet");
const morgan = require('morgan');
const http = require('http');
const {globalLimiter} = require('./src/middleware/ratelimiter.middleware')
const logger=require('./src/middleware/logger.middleware')
const cors=require('cors');
const connectDb=require('./src/config/db')
const app=express();


app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true
}));

app.use(express.json());
app.use(helmet());
app.use(globalLimiter);
const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};
app.use(morgan('dev', { stream: morganStream }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

const userRouter=require('./src/routers/user.router');
const problemRouter=require('./src/routers/problem.router')
const submissionRouter = require('./src/routers/submisson.router');


app.use('/api/v1/users',userRouter)
app.use('/api/v1/problems',problemRouter)
app.use('/api/v1/submissions', submissionRouter);

const startServer = async () => {
  try {
    await connectDb();
    require('./src/cron/problemdeadline')
    app.listen(process.env.PORT, () => {
      console.log(`Server listening at http://localhost:${process.env.PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

