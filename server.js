require('dotenv').config()
const express=require('express')
const {clerkMiddleware}=require('@clerk/express')

const app=express()
const PORT=3000

app.use(clerkMiddleware())


app.listen(PORT, () => {
  console.log(`server listening at http://localhost:${PORT}`)
})