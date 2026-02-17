require('dotenv').config();
const express=require('express');
const {clerkMiddleware}=require('@clerk/express');
const cors=require('cors');
const connectDb=require('./src/config/db')
const app=express();


app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

const userRouter=require('./src/routers/user.router');
const problemRouter=require('./src/routers/problem.router')

app.use('/api/v1/users',userRouter)
app.use('/api/v1/problems',problemRouter)

const startServer = async () => {
  try {
    await connectDb();

    app.listen(process.env.PORT, () => {
      console.log(`Server listening at http://localhost:${process.env.PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

