import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
    try {
        const caronas = await sql`SELECT * FROM caronas ORDER BY created_at DESC`
        return NextResponse.json(caronas)
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar caronas' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { motorista, origem, destino, tipo_trajeto, data_ida, hora_ida, data_volta, hora_volta, vagas_totais, vagas_disponiveis, whatsapp, pin } = body

        // Se for ida e volta com data de retorno, criamos dois registros independentes
        if (tipo_trajeto === 'ida_volta' && data_volta) {
            const [ida] = await sql`
        INSERT INTO caronas (motorista, origem, destino, tipo_trajeto, data_ida, hora_ida, data_volta, hora_volta, vagas_totais, vagas_disponiveis, whatsapp, passageiros, pin)
        VALUES (${motorista}, ${origem}, ${destino}, 'somente_ida', ${data_ida}, ${hora_ida}, '', '', ${vagas_totais}, ${vagas_disponiveis}, ${whatsapp}, '{}', ${pin})
        RETURNING *
      `

            const [volta] = await sql`
        INSERT INTO caronas (motorista, origem, destino, tipo_trajeto, data_ida, hora_ida, data_volta, hora_volta, vagas_totais, vagas_disponiveis, whatsapp, passageiros, pin)
        VALUES (${motorista}, ${destino}, ${origem}, 'somente_volta', ${data_volta}, ${hora_volta}, '', '', ${vagas_totais}, ${vagas_disponiveis}, ${whatsapp}, '{}', ${pin})
        RETURNING *
      `

            return NextResponse.json({ ida, volta }, { status: 201 })
        } else {
            // Apenas Ida
            const [nova] = await sql`
        INSERT INTO caronas (motorista, origem, destino, tipo_trajeto, data_ida, hora_ida, data_volta, hora_volta, vagas_totais, vagas_disponiveis, whatsapp, passageiros, pin)
        VALUES (${motorista}, ${origem}, ${destino}, ${tipo_trajeto || 'somente_ida'}, ${data_ida}, ${hora_ida}, '', '', ${vagas_totais}, ${vagas_disponiveis}, ${whatsapp}, '{}', ${pin})
        RETURNING *
      `
            return NextResponse.json(nova, { status: 201 })
        }
    } catch (error) {
        console.error('Erro ao criar carona:', error)
        return NextResponse.json({ error: 'Erro ao criar carona' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, motorista, origem, destino, tipo_trajeto, data_ida, hora_ida, data_volta, hora_volta, vagas_totais, vagas_disponiveis, whatsapp, passageiros } = body

        const passageirosSql = passageiros && passageiros.length > 0
            ? `{${passageiros.map((p: string) => `"${p.replace(/"/g, '\\"')}"`).join(',')}}`
            : '{}'

        const [atualizada] = await sql`
      UPDATE caronas 
      SET motorista = ${motorista}, 
          origem = ${origem}, 
          destino = ${destino}, 
          tipo_trajeto = ${tipo_trajeto || 'somente_ida'},
          data_ida = ${data_ida}, 
          hora_ida = ${hora_ida}, 
          data_volta = ${data_volta || ''}, 
          hora_volta = ${hora_volta || ''}, 
          vagas_totais = ${vagas_totais},
          vagas_disponiveis = ${vagas_disponiveis}, 
          whatsapp = ${whatsapp},
          passageiros = ${passageirosSql}::text[]
      WHERE id = ${id}
      RETURNING *
    `
        return NextResponse.json(atualizada)
    } catch (error) {
        console.error('Erro no PUT caronas:', error)
        return NextResponse.json({ error: 'Erro ao atualizar carona' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID não informado' }, { status: 400 })

        await sql`DELETE FROM caronas WHERE id = ${id}`
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao excluir carona' }, { status: 500 })
    }
}