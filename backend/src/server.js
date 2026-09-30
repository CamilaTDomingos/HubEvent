import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rsvpRoutes from './routes/rsvp.routes.js'
import siteRoutes from './routes/site.routes.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/rsvp', rsvpRoutes)
app.use('/api/site', siteRoutes)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})