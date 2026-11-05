import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function POST(request: Request) {
    try {
        const { id, passageiro } = await request.json()

        const [carona] = await sql`SELECT * FROM caronas WHERE id = ${id}`
        if (!carona || carona.vagas_disponiveis <= 0) {
            return NextResponse.json({ error: 'Carona esgotada ou não encontrada' }, { status: 400 })
        }

        const novasVagas = carona.vagas_disponiveis - 1
        const novosPassageiros = [...carona.passageiros, passageiro]

        const [atualizada] = await sql`
      UPDATE caronas 
      SET vagas_disponiveis = ${novasVagas}, passageiros = ${novosPassageiros}
      WHERE id = ${id}
      RETURNING *
    `

        return NextResponse.json(atualizada)
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao reservar vaga' }, { status: 500 })
    }
}