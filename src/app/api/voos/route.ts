import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
    try {
        const voos = await sql`SELECT * FROM voos ORDER BY created_at DESC`
        return NextResponse.json(voos)
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar voos' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            amigo_nome, data_ida, n_voo_ida, cia_aerea_ida, aeroporto_origem,
            aeroporto_destino, partida_ida, chegada_ida, data_volta, n_voo_volta,
            cia_aerea_volta, aeroporto_origem_volta, aeroporto_destino_volta,
            partida_volta, hotel, observacoes
        } = body

        const [novoVoo] = await sql`
      INSERT INTO voos (
        amigo_nome, data_ida, n_voo_ida, cia_aerea_ida, aeroporto_origem, 
        aeroporto_destino, partida_ida, chegada_ida, data_volta, n_voo_volta, 
        cia_aerea_volta, aeroporto_origem_volta, aeroporto_destino_volta, 
        partida_volta, hotel, observacoes
      )
      VALUES (
        ${amigo_nome || ''}, ${data_ida || ''}, ${n_voo_ida || ''}, ${cia_aerea_ida || ''}, ${aeroporto_origem || ''}, 
        ${aeroporto_destino || ''}, ${partida_ida || ''}, ${chegada_ida || ''}, ${data_volta || ''}, ${n_voo_volta || ''}, 
        ${cia_aerea_volta || ''}, ${aeroporto_origem_volta || ''}, ${aeroporto_destino_volta || ''}, 
        ${partida_volta || ''}, ${hotel || ''}, ${observacoes || ''}
      )
      RETURNING *
    `
        return NextResponse.json(novoVoo, { status: 201 })
    } catch (error) {
        console.error('Erro ao criar voo:', error)
        return NextResponse.json({ error: 'Erro ao criar voo' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const {
            id, amigo_nome, data_ida, n_voo_ida, cia_aerea_ida, aeroporto_origem,
            aeroporto_destino, partida_ida, chegada_ida, data_volta, n_voo_volta,
            cia_aerea_volta, aeroporto_origem_volta, aeroporto_destino_volta,
            partida_volta, hotel, observacoes
        } = body

        const [atualizado] = await sql`
      UPDATE voos 
      SET amigo_nome = ${amigo_nome || ''},
          data_ida = ${data_ida || ''},
          n_voo_ida = ${n_voo_ida || ''},
          cia_aerea_ida = ${cia_aerea_ida || ''},
          aeroporto_origem = ${aeroporto_origem || ''},
          aeroporto_destino = ${aeroporto_destino || ''},
          partida_ida = ${partida_ida || ''},
          chegada_ida = ${chegada_ida || ''},
          data_volta = ${data_volta || ''},
          n_voo_volta = ${n_voo_volta || ''},
          cia_aerea_volta = ${cia_aerea_volta || ''},
          aeroporto_origem_volta = ${aeroporto_origem_volta || ''},
          aeroporto_destino_volta = ${aeroporto_destino_volta || ''},
          partida_volta = ${partida_volta || ''},
          hotel = ${hotel || ''},
          observacoes = ${observacoes || ''}
      WHERE id = ${id}
      RETURNING *
    `
        return NextResponse.json(atualizado)
    } catch (error) {
        console.error('Erro no PUT voos:', error)
        return NextResponse.json({ error: 'Erro ao atualizar voo' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 })

        await sql`DELETE FROM voos WHERE id = ${id}`
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao excluir voo' }, { status: 500 })
    }
}