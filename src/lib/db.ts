import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!

// Configuração do cliente Postgres para o Neon
const sql = postgres(connectionString, {
  ssl: 'require',
  prepare: false
})

export default sql