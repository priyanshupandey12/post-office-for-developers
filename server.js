require('dotenv').config();
const express=require('express');
const {clerkMiddleware}=require('@clerk/express');
const cors=require('cors');
const app=express();


app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

const userRouter=require('./src/routers/user.router');


app.use('/api/v1/users',userRouter)

app.listen(process.env.PORT, () => {
  console.log(`server listening at http://localhost:${process.env.PORT}`)
})