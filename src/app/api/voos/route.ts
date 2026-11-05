import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
    try {
        const voos = await sql`SELECT * FROM logistica_voos ORDER BY created_at DESC`
        return NextResponse.json(voos)
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar voos' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { amigo_nome, trecho_ida_voo, cia_aerea_ida, data_hora_chegada, hotel, trecho_volta_voo, data_hora_volta, observacoes } = body

        const [novo] = await sql`
      INSERT INTO logistica_voos (amigo_nome, trecho_ida_voo, cia_aerea_ida, data_hora_chegada, hotel, trecho_volta_voo, data_hora_volta, observacoes)
      VALUES (${amigo_nome}, ${trecho_ida_voo}, ${cia_aerea_ida}, ${data_hora_chegada}, ${hotel}, ${trecho_volta_voo}, ${data_hora_volta}, ${observacoes || ''})
      RETURNING *
    `
        return NextResponse.json(novo, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao cadastrar voo' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 })

        await sql`DELETE FROM logistica_voos WHERE id = ${id}`
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao excluir voo' }, { status: 500 })
    }
}