'use client'

import { useState, useEffect } from 'react'

type Carona = {
  id: string
  motorista: string
  origem: string
  destino: string
  tipo_trajeto?: string
  data_ida: string
  hora_ida: string
  data_volta: string
  hora_volta: string
  vagas_totais: number
  vagas_disponiveis: number
  whatsapp: string
  passageiros: string[]
  pin?: string
}

type VooLogistica = {
  id: string
  amigo_nome: string
  trecho_ida_voo: string
  cia_aerea_ida: string
  data_hora_chegada: string
  hotel: string
  trecho_volta_voo: string
  data_hora_volta: string
  observacoes: string
}

const CIDADES_OPCOES = [
  'BRASÍLIA',
  'GOIÂNIA',
  'RIO VERDE',
  'UBERABA',
  'UBERLÂNDIA',
  'OUTRA'
]

const HORAS_DISPONIVEIS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTOS_DISPONIVEIS = ['00', '15', '30', '45']
const SENHA_MASTER = '1987'

function formatarDataBR(dataIso: string) {
  if (!dataIso) return ''
  if (dataIso.includes('/')) return dataIso
  const partes = dataIso.split('-')
  if (partes.length === 3) {
    const [ano, mes, dia] = partes
    return `${dia}/${mes}/${ano}`
  }
  return dataIso
}

export default function PainelLogistica() {
  const [mounted, setMounted] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<'caronas' | 'voos'>('caronas')
  const [filtroOrigem, setFiltroOrigem] = useState<string>('TODAS')
  const [filtroData, setFiltroData] = useState<string>('TODAS')

  const [caronas, setCaronas] = useState<Carona[]>([])
  const [modalCarona, setModalCarona] = useState(false)
  const [caronaEmEdicao, setCaronaEmEdicao] = useState<Carona | null>(null)

  const [modalReserva, setModalReserva] = useState<Carona | null>(null)
  const [nomePassageiro, setNomePassageiro] = useState('')

  const [formCarona, setFormCarona] = useState({
    motorista: '',
    origemSelect: 'GOIÂNIA',
    origemOutra: '',
    destinoSelect: 'RIO VERDE',
    destinoOutro: '',
    tipo_trajeto: 'ida_volta',
    data_ida: '',
    hora_ida_h: '07',
    hora_ida_m: '00',
    data_volta: '',
    hora_volta_h: '17',
    hora_volta_m: '00',
    vagas_totais: 3,
    vagas_disponiveis: 3,
    whatsapp: '',
    pin: '',
  })

  const [voos, setVoos] = useState<VooLogistica[]>([])
  const [modalVoo, setModalVoo] = useState(false)
  const [vooEmEdicao, setVooEmEdicao] = useState<VooLogistica | null>(null)

  const [formVoo, setFormVoo] = useState({
    amigo_nome: '',
    trecho_ida_voo: '',
    cia_aerea_ida: '',
    data_chegada: '',
    hora_chegada_h: '07',
    hora_chegada_m: '00',
    hotel: '',
    trecho_volta_voo: '',
    data_volta: '',
    hora_volta_h: '17',
    hora_volta_m: '00',
    observacoes: '',
  })

  useEffect(() => {
    setMounted(true)
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      const resCaronas = await fetch('/api/caronas')
      const dadosC = await resCaronas.json()
      if (Array.isArray(dadosC)) setCaronas(dadosC)

      const resVoos = await fetch('/api/voos')
      const dadosV = await resVoos.json()
      if (Array.isArray(dadosV)) setVoos(dadosV)
    } catch (e) {
      console.error('Erro ao carregar dados', e)
    }
  }

  function validarPermissao(pinSalvo?: string) {
    const senhaInformada = prompt('Digite o PIN de 4 dígitos deste anúncio (ou a senha master):')
    if (!senhaInformada) return false
    if (senhaInformada === SENHA_MASTER || senhaInformada === pinSalvo) {
      return true
    }
    alert('PIN incorreto!')
    return false
  }

  const handleSalvarCarona = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formCarona.pin || formCarona.pin.length !== 4 || isNaN(Number(formCarona.pin))) {
      alert('Atenção: É obrigatório definir um PIN de exatamente 4 números para proteger seu anúncio.')
      return
    }

    const origemFinal = formCarona.origemSelect === 'OUTRA' ? formCarona.origemOutra : formCarona.origemSelect
    const destinoFinal = formCarona.destinoSelect === 'OUTRA' ? formCarona.destinoOutro : formCarona.destinoSelect

    let vagasDisponiveisFinal = formCarona.vagas_disponiveis
    if (caronaEmEdicao) {
      const diffVagas = formCarona.vagas_totais - caronaEmEdicao.vagas_totais
      vagasDisponiveisFinal = Math.max(0, caronaEmEdicao.vagas_disponiveis + diffVagas)
    } else {
      vagasDisponiveisFinal = formCarona.vagas_totais
    }

    const payload = {
      id: caronaEmEdicao ? caronaEmEdicao.id : undefined,
      motorista: formCarona.motorista,
      origem: origemFinal.toUpperCase(),
      destino: destinoFinal.toUpperCase(),
      tipo_trajeto: formCarona.tipo_trajeto,
      data_ida: formatarDataBR(formCarona.data_ida),
      hora_ida: `${formCarona.hora_ida_h}:${formCarona.hora_ida_m}`,
      data_volta: formCarona.tipo_trajeto === 'ida_volta' ? formatarDataBR(formCarona.data_volta) : '',
      hora_volta: formCarona.tipo_trajeto === 'ida_volta' ? `${formCarona.hora_volta_h}:${formCarona.hora_volta_m}` : '',
      vagas_totais: formCarona.vagas_totais,
      vagas_disponiveis: vagasDisponiveisFinal,
      whatsapp: formCarona.whatsapp,
      pin: formCarona.pin,
      passageiros: caronaEmEdicao ? (caronaEmEdicao.passageiros || []) : []
    }

    const metodo = caronaEmEdicao ? 'PUT' : 'POST'
    const res = await fetch('/api/caronas', {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setModalCarona(false)
      setCaronaEmEdicao(null)
      setFormCarona({
        motorista: '',
        origemSelect: 'GOIÂNIA',
        origemOutra: '',
        destinoSelect: 'RIO VERDE',
        destinoOutro: '',
        tipo_trajeto: 'ida_volta',
        data_ida: '',
        hora_ida_h: '07',
        hora_ida_m: '00',
        data_volta: '',
        hora_volta_h: '17',
        hora_volta_m: '00',
        vagas_totais: 3,
        vagas_disponiveis: 3,
        whatsapp: '',
        pin: '',
      })
      carregarDados()
    } else {
      alert('Erro ao salvar carona.')
    }
  }

  const abrirEdicaoCarona = (carona: Carona) => {
    if (!validarPermissao(carona.pin)) return

    setCaronaEmEdicao(carona)
    const origemPadrao = CIDADES_OPCOES.includes(carona.origem) ? carona.origem : 'OUTRA'
    const destinoPadrao = CIDADES_OPCOES.includes(carona.destino) ? carona.destino : 'OUTRA'
    const [hIda, mIda] = carona.hora_ida ? carona.hora_ida.split(':') : ['07', '00']
    const [hVolta, mVolta] = carona.hora_volta ? carona.hora_volta.split(':') : ['17', '00']

    function converterParaIso(dataBr: string) {
      if (!dataBr || !dataBr.includes('/')) return dataBr
      const [dia, mes, ano] = dataBr.split('/')
      return `${ano}-${mes}-${dia}`
    }

    setFormCarona({
      motorista: carona.motorista,
      origemSelect: origemPadrao,
      origemOutra: origemPadrao === 'OUTRA' ? carona.origem : '',
      destinoSelect: destinoPadrao,
      destinoOutro: destinoPadrao === 'OUTRA' ? carona.destino : '',
      tipo_trajeto: carona.tipo_trajeto || 'ida_volta',
      data_ida: converterParaIso(carona.data_ida),
      hora_ida_h: hIda || '07',
      hora_ida_m: mIda || '00',
      data_volta: converterParaIso(carona.data_volta),
      hora_volta_h: hVolta || '17',
      hora_volta_m: mVolta || '00',
      vagas_totais: carona.vagas_totais || 3,
      vagas_disponiveis: carona.vagas_disponiveis || 3,
      whatsapp: carona.whatsapp,
      pin: '',
    })
    setModalCarona(true)
  }

  const handleRemoverPassageiro = async (carona: Carona, passageiroRemover: string) => {
    if (!validarPermissao(carona.pin)) return
    if (!confirm(`Deseja remover ${passageiroRemover} desta carona e liberar a vaga?`)) return

    const novosPassageiros = (carona.passageiros || []).filter(p => p !== passageiroRemover)
    const novasVagas = Math.min(carona.vagas_totais, carona.vagas_disponiveis + 1)

    const payload = {
      id: carona.id,
      motorista: carona.motorista,
      origem: carona.origem,
      destino: carona.destino,
      tipo_trajeto: carona.tipo_trajeto,
      data_ida: carona.data_ida,
      hora_ida: carona.hora_ida,
      data_volta: carona.data_volta,
      hora_volta: carona.hora_volta,
      vagas_totais: carona.vagas_totais,
      vagas_disponiveis: novasVagas,
      whatsapp: carona.whatsapp,
      passageiros: novosPassageiros
    }

    const res = await fetch('/api/caronas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      carregarDados()
    } else {
      alert('Erro ao remover passageiro.')
    }
  }

  const handleExcluirCarona = async (carona: Carona) => {
    if (!validarPermissao(carona.pin)) return
    if (!confirm('Tem certeza que deseja excluir esta carona?')) return

    const res = await fetch(`/api/caronas?id=${carona.id}`, { method: 'DELETE' })
    if (res.ok) carregarDados()
    else alert('Erro ao excluir carona.')
  }

  const handleSalvarVoo = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      id: vooEmEdicao ? vooEmEdicao.id : undefined,
      ...formVoo,
      data_hora_chegada: `${formatarDataBR(formVoo.data_chegada)} às ${formVoo.hora_chegada_h}:${formVoo.hora_chegada_m}`,
      data_hora_volta: `${formatarDataBR(formVoo.data_volta)} às ${formVoo.hora_volta_h}:${formVoo.hora_volta_m}`
    }

    const metodo = vooEmEdicao ? 'PUT' : 'POST'
    const res = await fetch('/api/voos', {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setModalVoo(false)
      setVooEmEdicao(null)
      setFormVoo({
        amigo_nome: '',
        trecho_ida_voo: '',
        cia_aerea_ida: '',
        data_chegada: '',
        hora_chegada_h: '07',
        hora_chegada_m: '00',
        hotel: '',
        trecho_volta_voo: '',
        data_volta: '',
        hora_volta_h: '17',
        hora_volta_m: '00',
        observacoes: '',
      })
      carregarDados()
    } else {
      alert('Erro ao salvar voo.')
    }
  }

  const abrirEdicaoVoo = (voo: VooLogistica) => {
    setVooEmEdicao(voo)
    setFormVoo({
      amigo_nome: voo.amigo_nome,
      trecho_ida_voo: voo.trecho_ida_voo,
      cia_aerea_ida: voo.cia_aerea_ida,
      data_chegada: '',
      hora_chegada_h: '07',
      hora_chegada_m: '00',
      hotel: voo.hotel,
      trecho_volta_voo: voo.trecho_volta_voo,
      data_volta: '',
      hora_volta_h: '17',
      hora_volta_m: '00',
      observacoes: voo.observacoes || '',
    })
    setModalVoo(true)
  }

  const handleExcluirVoo = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro de voo/hotel?')) return
    const res = await fetch(`/api/voos?id=${id}`, { method: 'DELETE' })
    if (res.ok) carregarDados()
    else alert('Erro ao excluir voo.')
  }

  // Obter lista única de datas disponíveis para o filtro de pesquisa
  const todasAsDatas = Array.from(new Set(caronas.map(c => c.data_ida).filter(Boolean)))

  // Filtragem combinada por Cidade e por Data selecionada
  const caronasFiltradas = caronas.filter(carona => {
    const matchOrigem = filtroOrigem === 'TODAS' || carona.origem.toUpperCase() === filtroOrigem.toUpperCase()
    const matchData = filtroData === 'TODAS' || carona.data_ida === filtroData
    return matchOrigem && matchData
  })

  // Agrupar caronas por Data da Viagem
  const caronasPorData: { [data: string]: Carona[] } = {}
  caronasFiltradas.forEach(carona => {
    const dataKey = carona.data_ida || 'Data não definida'
    if (!caronasPorData[dataKey]) {
      caronasPorData[dataKey] = []
    }
    caronasPorData[dataKey].push(carona)
  })

  // Ordenar as caronas dentro de cada dia por horário (hora_ida)
  Object.keys(caronasPorData).forEach(data => {
    caronasPorData[data].sort((a, b) => (a.hora_ida || '').localeCompare(b.hora_ida || ''))
  })

  const datasOrdenadas = Object.keys(caronasPorData).sort((a, b) => {
    if (a.includes('/') && b.includes('/')) {
      const [diaA, mesA, anoA] = a.split('/')
      const [diaB, mesB, anoB] = b.split('/')
      return `${anoA}-${mesA}-${diaA}`.localeCompare(`${anoB}-${mesB}-${diaB}`)
    }
    return a.localeCompare(b)
  })

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Cabeçalho */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-emerald-400">✈️🚗 Central de Logística & Caronas</h1>
            <p className="text-xs font-semibold text-emerald-300 mt-0.5">PV - Regional Goiânia</p>
            <p className="text-xs text-slate-400">Gestão de transporte terrestre e recepção</p>
          </div>
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 w-full sm:w-auto">
            <button
              onClick={() => setAbaAtiva('caronas')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${abaAtiva === 'caronas' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              🚗 Caronas
            </button>
            <button
              onClick={() => setAbaAtiva('voos')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${abaAtiva === 'voos' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              🛫 Voos & Hotéis
            </button>
          </div>
        </div>

        {/* ABA CARONAS */}
        {abaAtiva === 'caronas' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Calendário de Caronas Terrestres</h2>
                  <p className="text-[11px] text-slate-400">Filtre por cidade de origem e por data:</p>
                </div>
                <button
                  onClick={() => {
                    setCaronaEmEdicao(null)
                    setFormCarona({
                      motorista: '',
                      origemSelect: 'GOIÂNIA',
                      origemOutra: '',
                      destinoSelect: 'RIO VERDE',
                      destinoOutro: '',
                      tipo_trajeto: 'ida_volta',
                      data_ida: '',
                      hora_ida_h: '07',
                      hora_ida_m: '00',
                      data_volta: '',
                      hora_volta_h: '17',
                      hora_volta_m: '00',
                      vagas_totais: 3,
                      vagas_disponiveis: 3,
                      whatsapp: '',
                      pin: '',
                    })
                    setModalCarona(true)
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow cursor-pointer whitespace-nowrap w-full sm:w-auto text-center"
                >
                  + Oferecer Carona
                </button>
              </div>

              {/* Barra de Filtros (Cidade e Data) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-700/60">
                <select
                  value={filtroOrigem}
                  onChange={e => setFiltroOrigem(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white cursor-pointer"
                >
                  <option value="TODAS">📍 Todas as Cidades de Origem</option>
                  {CIDADES_OPCOES.filter(c => c !== 'OUTRA').map(c => (
                    <option key={c} value={c}>Saindo de {c}</option>
                  ))}
                </select>

                <select
                  value={filtroData}
                  onChange={e => setFiltroData(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white cursor-pointer"
                >
                  <option value="TODAS">📅 Filtrar por Data (Todas)</option>
                  {todasAsDatas.map(data => (
                    <option key={data} value={data}>Data: {data}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* GRADE POR DATA (CALENDÁRIO DE VIAGENS) */}
            <div className="space-y-6">
              {datasOrdenadas.length === 0 && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center text-xs text-slate-400">
                  Nenhuma carona encontrada para este filtro. Clique em "+ Oferecer Carona" para começar!
                </div>
              )}

              {datasOrdenadas.map((dataViagem) => (
                <div key={dataViagem} className="space-y-3">
                  <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 rounded-lg">
                    <span className="text-emerald-400 font-bold text-sm">📅 Data: {dataViagem}</span>
                    <span className="text-[11px] text-slate-400">({caronasPorData[dataViagem].length} {caronasPorData[dataViagem].length === 1 ? 'carona disponível' : 'caronas disponíveis'})</span>
                  </div>

                  <div className="grid gap-3">
                    {caronasPorData[dataViagem].map((carona) => (
                      <div key={carona.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-bl-xl font-medium border-l border-b border-emerald-500/25">
                          {carona.vagas_disponiveis} {carona.vagas_disponiveis === 1 ? 'vaga livre' : 'vagas livres'}
                        </div>

                        <div className="text-sm font-bold text-slate-200">
                          <span>Motorista: {carona.motorista}</span>
                          <span className="ml-2 text-[10px] bg-slate-700 text-emerald-300 px-2 py-0.5 rounded uppercase">
                            {carona.tipo_trajeto === 'somente_ida' ? '🛬 Ida' : carona.tipo_trajeto === 'somente_volta' ? '🛫 Volta' : '🚗 Viagem'}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                          <a
                            href={`https://wa.me/${carona.whatsapp}?text=${encodeURIComponent(`Olá ${carona.motorista}, vi sua carona de ${carona.origem} para ${carona.destino} no dia ${carona.data_ida}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] px-3 py-1 rounded-lg flex items-center gap-1.5 transition font-medium"
                          >
                            💬 Chamar no WhatsApp
                          </a>
                          <button
                            onClick={() => abrirEdicaoCarona(carona)}
                            className="bg-amber-600/80 hover:bg-amber-500 text-white text-[11px] px-3 py-1 rounded-lg transition cursor-pointer font-medium"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleExcluirCarona(carona)}
                            className="bg-red-900/60 hover:bg-red-700 text-red-200 text-[11px] px-3 py-1 rounded-lg transition cursor-pointer font-medium"
                          >
                            🗑️ Excluir
                          </button>
                        </div>

                        <div className="bg-slate-900/50 p-2.5 rounded-lg text-xs space-y-1">
                          <div className="font-semibold text-emerald-300">🚗 Rota: {carona.origem} → {carona.destino}</div>
                          <div>⏰ Horário de Saída: {carona.hora_ida}</div>
                        </div>

                        {carona.passageiros && carona.passageiros.length > 0 && (
                          <div className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded space-y-1.5">
                            <span className="font-semibold text-slate-300">Passageiros confirmados:</span>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {carona.passageiros.map((passageiro, idx) => (
                                <span key={idx} className="bg-slate-800 border border-slate-700 px-2 py-1 rounded flex items-center gap-2 text-slate-200">
                                  👤 {passageiro}
                                  <button
                                    onClick={() => handleRemoverPassageiro(carona, passageiro)}
                                    className="text-red-400 hover:text-red-200 font-bold text-[10px] cursor-pointer"
                                    title="Remover passageiro"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setModalReserva(carona)}
                            disabled={carona.vagas_disponiveis <= 0}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${carona.vagas_disponiveis > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                          >
                            {carona.vagas_disponiveis > 0 ? 'Quero Vaga (Reservar)' : 'Carona Lotada'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA VOOS & HOTÉIS */}
        {abaAtiva === 'voos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Logística de Chegada (Voos e Hospedagem)</h2>
              <button
                onClick={() => {
                  setVooEmEdicao(null)
                  setFormVoo({
                    amigo_nome: '',
                    trecho_ida_voo: '',
                    cia_aerea_ida: '',
                    data_chegada: '',
                    hora_chegada_h: '07',
                    hora_chegada_m: '00',
                    hotel: '',
                    trecho_volta_voo: '',
                    data_volta: '',
                    hora_volta_h: '17',
                    hora_volta_m: '00',
                    observacoes: '',
                  })
                  setModalVoo(true)
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow cursor-pointer"
              >
                + Informar Voo/Hotel
              </button>
            </div>

            <div className="space-y-3">
              {voos.length === 0 && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center text-xs text-slate-400">
                  Nenhum voo ou hotel cadastrado ainda.
                </div>
              )}
              {voos.map((voo) => (
                <div key={voo.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow space-y-2 text-xs relative">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-emerald-400 text-sm">Amigo(a): {voo.amigo_nome}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirEdicaoVoo(voo)}
                        className="bg-amber-600/80 hover:bg-amber-500 text-white text-[11px] px-3 py-1 rounded-lg transition cursor-pointer font-medium"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleExcluirVoo(voo.id)}
                        className="bg-red-900/60 hover:bg-red-700 text-red-200 text-[11px] px-3 py-1 rounded-lg transition cursor-pointer font-medium"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-slate-400">Chegada:</span> {voo.data_hora_chegada}
                      <br /><span className="text-slate-400">Voo Ida:</span> {voo.trecho_ida_voo} ({voo.cia_aerea_ida})
                    </div>
                    <div>
                      <span className="text-slate-400">Retorno:</span> {voo.data_hora_volta}
                      <br /><span className="text-slate-400">Voo Volta:</span> {voo.trecho_volta_voo}
                    </div>
                  </div>
                  <div className="text-slate-300">🏨 <strong>Hotel:</strong> {voo.hotel}</div>
                  {voo.observacoes && <div className="text-slate-400 italic">Obs: {voo.observacoes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL CADASTRAR/EDITAR CARONA */}
        {modalCarona && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-base font-bold text-emerald-400">
                {caronaEmEdicao ? 'Editar Carona' : 'Cadastrar Nova Carona'}
              </h2>
              <form onSubmit={handleSalvarCarona} className="space-y-3 text-xs" autoComplete="off">
                <div>
                  <label className="text-slate-400 block mb-1">Nome do Motorista</label>
                  <input type="text" required autoComplete="off" value={formCarona.motorista} onChange={e => setFormCarona({ ...formCarona, motorista: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Tipo de Trajeto</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setFormCarona({ ...formCarona, tipo_trajeto: 'ida_volta' })}
                      className={`py-1.5 px-2 rounded text-[11px] font-semibold transition cursor-pointer ${formCarona.tipo_trajeto === 'ida_volta' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      🔄 Ida e Volta
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormCarona({ ...formCarona, tipo_trajeto: 'somente_ida' })}
                      className={`py-1.5 px-2 rounded text-[11px] font-semibold transition cursor-pointer ${formCarona.tipo_trajeto === 'somente_ida' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      🛬 Somente Ida
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Cidade de Origem (Ida)</label>
                    <select
                      value={formCarona.origemSelect}
                      onChange={e => setFormCarona({ ...formCarona, origemSelect: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white cursor-pointer"
                    >
                      {CIDADES_OPCOES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Destino</label>
                    <select
                      value={formCarona.destinoSelect}
                      onChange={e => setFormCarona({ ...formCarona, destinoSelect: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white cursor-pointer"
                    >
                      {CIDADES_OPCOES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {formCarona.origemSelect === 'OUTRA' && (
                  <div>
                    <label className="text-slate-400 block mb-1">Digite a Cidade de Origem</label>
                    <input type="text" required autoComplete="off" placeholder="Ex: Anápolis" value={formCarona.origemOutra} onChange={e => setFormCarona({ ...formCarona, origemOutra: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                  </div>
                )}

                {formCarona.destinoSelect === 'OUTRA' && (
                  <div>
                    <label className="text-slate-400 block mb-1">Digite a Cidade de Destino</label>
                    <input type="text" required autoComplete="off" placeholder="Ex: Goiânia" value={formCarona.destinoOutro} onChange={e => setFormCarona({ ...formCarona, destinoOutro: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/50">
                  <div>
                    <label className="text-slate-400 block mb-1">Data Ida</label>
                    <input
                      type="date"
                      required
                      value={formCarona.data_ida}
                      onChange={e => setFormCarona({ ...formCarona, data_ida: e.target.value })}
                      onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Horário de Saída</label>
                    <div className="flex gap-1">
                      <select value={formCarona.hora_ida_h} onChange={e => setFormCarona({ ...formCarona, hora_ida_h: e.target.value })} className="bg-slate-900 border border-slate-700 rounded p-2 text-white flex-1 cursor-pointer">
                        {HORAS_DISPONIVEIS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span className="text-white self-center">:</span>
                      <select value={formCarona.hora_ida_m} onChange={e => setFormCarona({ ...formCarona, hora_ida_m: e.target.value })} className="bg-slate-900 border border-slate-700 rounded p-2 text-white flex-1 cursor-pointer">
                        {MINUTOS_DISPONIVEIS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {formCarona.tipo_trajeto === 'ida_volta' && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/50">
                    <div>
                      <label className="text-slate-400 block mb-1">Data Retorno</label>
                      <input
                        type="date"
                        required
                        value={formCarona.data_volta}
                        onChange={e => setFormCarona({ ...formCarona, data_volta: e.target.value })}
                        onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Horário Retorno</label>
                      <div className="flex gap-1">
                        <select value={formCarona.hora_volta_h} onChange={e => setFormCarona({ ...formCarona, hora_volta_h: e.target.value })} className="bg-slate-900 border border-slate-700 rounded p-2 text-white flex-1 cursor-pointer">
                          {HORAS_DISPONIVEIS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="text-white self-center">:</span>
                        <select value={formCarona.hora_volta_m} onChange={e => setFormCarona({ ...formCarona, hora_volta_m: e.target.value })} className="bg-slate-900 border border-slate-700 rounded p-2 text-white flex-1 cursor-pointer">
                          {MINUTOS_DISPONIVEIS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Vagas Totais</label>
                    <input type="number" min={1} max={8} required value={formCarona.vagas_totais} onChange={e => setFormCarona({ ...formCarona, vagas_totais: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">WhatsApp (com DDD)</label>
                    <input type="text" required autoComplete="off" name="no-autofill-whatsapp" placeholder="5562999999999" value={formCarona.whatsapp} onChange={e => setFormCarona({ ...formCarona, whatsapp: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">PIN de Segurança (Obrigatório - 4 números)</label>
                  <input type="password" maxLength={4} required autoComplete="new-password" name="no-autofill-pin" placeholder="Ex: 1234" value={formCarona.pin} onChange={e => setFormCarona({ ...formCarona, pin: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded font-semibold text-white cursor-pointer">Salvar</button>
                  <button type="button" onClick={() => { setModalCarona(false); setCaronaEmEdicao(null); }} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-slate-300 cursor-pointer">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL RESERVAR VAGA */}
        {modalReserva && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm space-y-4 text-xs shadow-2xl">
              <h2 className="text-sm font-bold text-blue-400">Reservar Vaga com {modalReserva.motorista}</h2>
              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!modalReserva || !nomePassageiro) return

                const res = await fetch('/api/caronas/reservar', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: modalReserva.id, passageiro: nomePassageiro }),
                })

                if (res.ok) {
                  const infoTrecho = modalReserva.tipo_trajeto === 'somente_ida' ? `para o dia (${formatarDataBR(modalReserva.data_ida)})` :
                    `de ${modalReserva.origem} para ${modalReserva.destino} (${formatarDataBR(modalReserva.data_ida)})`

                  const mensagem = encodeURIComponent(
                    `Olá ${modalReserva.motorista}, reservei minha vaga na sua carona ${infoTrecho}. Meu nome é ${nomePassageiro}!`
                  )
                  window.open(`https://wa.me/${modalReserva.whatsapp}?text=${mensagem}`, '_blank')
                  setModalReserva(null)
                  setNomePassageiro('')
                  carregarDados()
                } else {
                  alert('Erro ao reservar vaga ou carona lotada.')
                }
              }} className="space-y-3">
                <div>
                  <label className="text-slate-400 block mb-1">Seu Nome Completo</label>
                  <input type="text" required placeholder="Digite seu nome" value={nomePassageiro} onChange={e => setNomePassageiro(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                </div>
                <p className="text-[11px] text-slate-400">Ao confirmar, a vaga será debitada automaticamente e você será direcionado ao WhatsApp do motorista.</p>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded font-semibold text-white cursor-pointer">Confirmar no WhatsApp</button>
                  <button type="button" onClick={() => setModalReserva(null)} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-slate-300 cursor-pointer">Voltar</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}