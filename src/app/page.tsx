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
  data_ida: string
  n_voo_ida: string
  cia_aerea_ida: string
  aeroporto_origem: string
  aeroporto_destino: string
  partida_ida: string
  chegada_ida: string
  data_volta: string
  n_voo_volta: string
  cia_aerea_volta: string
  aeroporto_origem_volta: string
  aeroporto_destino_volta: string
  partida_volta: string
  hotel: string
  observacoes: string
  responsavel?: string
}

const CIDADES_OPCOES = [
  'BRASÍLIA',
  'GOIÂNIA',
  'RIO VERDE',
  'UBERABA',
  'UBERLÂNDIA',
  'OUTRA',
]
const HOTEIS_OPCOES = ['WTC', 'Holiday Inn', 'Outro']
const CIA_AEREAS_OPCOES = ['LATAM', 'GOL', 'AZUL', 'Outra']
const AEROPORTOS_OPCOES = ['CGH', 'GRU', 'VCP', 'BSB', 'GYN', 'Outro']

const HORAS_DISPONIVEIS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, '0')
)
const MINUTOS_DISPONIVEIS = [
  '00',
  '05',
  '10',
  '15',
  '20',
  '25',
  '30',
  '35',
  '40',
  '45',
  '50',
  '55',
]
const SENHA_MASTER = '1987'
const SENHAS_LOGISTICA_6_DIGITOS = ['198700', '123456']

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

function dataBrParaChaveOrdenacao(dataBr: string) {
  if (!dataBr) return '9999-99-99'
  if (dataBr.includes('/')) {
    const [dia, mes, ano] = dataBr.split('/')
    if (ano && mes && dia) {
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    }
  }
  return dataBr
}

export default function PainelLogistica() {
  const [mounted, setMounted] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<'caronas' | 'voos' | 'logistica'>(
    'caronas'
  )
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
  const [vooEnviadoSucesso, setVooEnviadoSucesso] = useState(false)

  // Estados da Aba Equipe da Logística (senha de 6 dígitos)
  const [logisticaAutenticada, setLogisticaAutenticada] = useState(false)
  const [senhaLogisticaInput, setSenhaLogisticaInput] = useState('')
  const [erroSenhaLogistica, setErroSenhaLogistica] = useState('')
  const [filtroDataLogistica, setFiltroDataLogistica] =
    useState<string>('TODAS')
  const [filtroStatusResponsavel, setFiltroStatusResponsavel] =
    useState<string>('TODOS')
  const [responsaveisEdit, setResponsaveisEdit] = useState<{
    [id: string]: string
  }>({})
  const [salvandoResponsavelId, setSalvandoResponsavelId] = useState<
    string | null
  >(null)
  const [salvoResponsavelId, setSalvoResponsavelId] = useState<string | null>(
    null
  )

  const estadoInicialFormVoo = {
    amigo_nome: '',
    data_ida: '',
    n_voo_ida: '',
    ciaAereaIdaSelect: 'LATAM',
    ciaAereaIdaOutra: '',
    aeroportoOrigemSelect: 'GYN',
    aeroportoOrigemOutro: '',
    aeroportoDestinoSelect: 'CGH',
    aeroportoDestinoOutro: '',
    partida_ida_h: '08',
    partida_ida_m: '00',
    chegada_ida_h: '10',
    chegada_ida_m: '00',
    data_volta: '',
    n_voo_volta: '',
    ciaAereaVoltaSelect: 'LATAM',
    ciaAereaVoltaOutra: '',
    aeroportoOrigemVoltaSelect: 'CGH',
    aeroportoOrigemVoltaOutro: '',
    aeroportoDestinoVoltaSelect: 'GYN',
    aeroportoDestinoVoltaOutro: '',
    partida_volta_h: '17',
    partida_volta_m: '00',
    hotelSelect: 'WTC',
    hotelOutro: '',
    observacoes: '',
    responsavel: '',
  }

  const [formVoo, setFormVoo] = useState(estadoInicialFormVoo)

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
      if (Array.isArray(dadosV)) {
        setVoos(dadosV)
        const mapaResp: { [id: string]: string } = {}
        dadosV.forEach((v: VooLogistica) => {
          mapaResp[String(v.id)] = v.responsavel || ''
        })
        setResponsaveisEdit(mapaResp)
      }
    } catch (e) {
      console.error('Erro ao carregar dados', e)
    }
  }

  function validarPermissao(pinSalvo?: string) {
    const senhaInformada = prompt(
      'Digite o PIN de 4 dígitos deste anúncio (ou a senha master):'
    )
    if (!senhaInformada) return false
    if (senhaInformada === SENHA_MASTER || senhaInformada === pinSalvo) {
      return true
    }
    alert('PIN incorreto!')
    return false
  }

  const handleSalvarCarona = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formCarona.pin ||
      formCarona.pin.length !== 4 ||
      isNaN(Number(formCarona.pin))
    ) {
      alert(
        'Atenção: É obrigatório definir um PIN de exatamente 4 números para proteger seu anúncio.'
      )
      return
    }

    const origemFinal =
      formCarona.origemSelect === 'OUTRA'
        ? formCarona.origemOutra
        : formCarona.origemSelect
    const destinoFinal =
      formCarona.destinoSelect === 'OUTRA'
        ? formCarona.destinoOutro
        : formCarona.destinoSelect

    let vagasDisponiveisFinal = formCarona.vagas_disponiveis
    if (caronaEmEdicao) {
      const diffVagas = formCarona.vagas_totais - caronaEmEdicao.vagas_totais
      vagasDisponiveisFinal = Math.max(
        0,
        caronaEmEdicao.vagas_disponiveis + diffVagas
      )
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
      data_volta:
        formCarona.tipo_trajeto === 'ida_volta'
          ? formatarDataBR(formCarona.data_volta)
          : '',
      hora_volta:
        formCarona.tipo_trajeto === 'ida_volta'
          ? `${formCarona.hora_volta_h}:${formCarona.hora_volta_m}`
          : '',
      vagas_totais: formCarona.vagas_totais,
      vagas_disponiveis: vagasDisponiveisFinal,
      whatsapp: formCarona.whatsapp,
      pin: formCarona.pin,
      passageiros: caronaEmEdicao ? caronaEmEdicao.passageiros || [] : [],
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
    const origemPadrao = CIDADES_OPCOES.includes(carona.origem)
      ? carona.origem
      : 'OUTRA'
    const destinoPadrao = CIDADES_OPCOES.includes(carona.destino)
      ? carona.destino
      : 'OUTRA'
    const [hIda, mIda] = carona.hora_ida
      ? carona.hora_ida.split(':')
      : ['07', '00']
    const [hVolta, mVolta] = carona.hora_volta
      ? carona.hora_volta.split(':')
      : ['17', '00']

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

  const handleRemoverPassageiro = async (
    carona: Carona,
    passageiroRemover: string
  ) => {
    if (!validarPermissao(carona.pin)) return
    if (
      !confirm(
        `Deseja remover ${passageiroRemover} desta carona e liberar a vaga?`
      )
    )
      return

    const novosPassageiros = (carona.passageiros || []).filter(
      (p) => p !== passageiroRemover
    )
    const novasVagas = Math.min(
      carona.vagas_totais,
      carona.vagas_disponiveis + 1
    )

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
      passageiros: novosPassageiros,
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

    const res = await fetch(`/api/caronas?id=${carona.id}`, {
      method: 'DELETE',
    })
    if (res.ok) carregarDados()
    else alert('Erro ao excluir carona.')
  }

  const handleSalvarVoo = async (e: React.FormEvent) => {
    e.preventDefault()
    const ciaAereaIdaFinal =
      formVoo.ciaAereaIdaSelect === 'Outra'
        ? formVoo.ciaAereaIdaOutra || ''
        : formVoo.ciaAereaIdaSelect
    const aeroportoOrigemFinal =
      formVoo.aeroportoOrigemSelect === 'Outro'
        ? formVoo.aeroportoOrigemOutro || ''
        : formVoo.aeroportoOrigemSelect
    const aeroportoDestinoFinal =
      formVoo.aeroportoDestinoSelect === 'Outro'
        ? formVoo.aeroportoDestinoOutro || ''
        : formVoo.aeroportoDestinoSelect
    const ciaAereaVoltaFinal =
      formVoo.ciaAereaVoltaSelect === 'Outra'
        ? formVoo.ciaAereaVoltaOutra || ''
        : formVoo.ciaAereaVoltaSelect
    const aeroportoOrigemVoltaFinal =
      formVoo.aeroportoOrigemVoltaSelect === 'Outro'
        ? formVoo.aeroportoOrigemVoltaOutro || ''
        : formVoo.aeroportoOrigemVoltaSelect
    const aeroportoDestinoVoltaFinal =
      formVoo.aeroportoDestinoVoltaSelect === 'Outro'
        ? formVoo.aeroportoDestinoVoltaOutro || ''
        : formVoo.aeroportoDestinoVoltaSelect
    const hotelFinal =
      formVoo.hotelSelect === 'Outro'
        ? formVoo.hotelOutro || ''
        : formVoo.hotelSelect

    const payload = {
      id: vooEmEdicao ? vooEmEdicao.id : undefined,
      amigo_nome: formVoo.amigo_nome || '',
      data_ida: formatarDataBR(formVoo.data_ida),
      n_voo_ida: formVoo.n_voo_ida || '',
      cia_aerea_ida: ciaAereaIdaFinal,
      aeroporto_origem: aeroportoOrigemFinal,
      aeroporto_destino: aeroportoDestinoFinal,
      partida_ida: `${formVoo.partida_ida_h}:${formVoo.partida_ida_m}`,
      chegada_ida: `${formVoo.chegada_ida_h}:${formVoo.chegada_ida_m}`,
      data_volta: formatarDataBR(formVoo.data_volta),
      n_voo_volta: formVoo.n_voo_volta || '',
      cia_aerea_volta: ciaAereaVoltaFinal,
      aeroporto_origem_volta: aeroportoOrigemVoltaFinal,
      aeroporto_destino_volta: aeroportoDestinoVoltaFinal,
      partida_volta: `${formVoo.partida_volta_h}:${formVoo.partida_volta_m}`,
      hotel: hotelFinal,
      observacoes: formVoo.observacoes || '',
      responsavel: formVoo.responsavel || '',
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
      setFormVoo(estadoInicialFormVoo)
      if (!vooEmEdicao && abaAtiva === 'voos') {
        setVooEnviadoSucesso(true)
      }
      carregarDados()
    } else {
      alert('Erro ao salvar voo.')
    }
  }

  const handleSalvarResponsavel = async (vooId: string) => {
    setSalvandoResponsavelId(String(vooId))
    try {
      const responsavel = (responsaveisEdit[String(vooId)] || '').trim()
      const res = await fetch('/api/voos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vooId, responsavel }),
      })
      if (res.ok) {
        setSalvoResponsavelId(String(vooId))
        setTimeout(() => {
          setSalvoResponsavelId((atual) =>
            atual === String(vooId) ? null : atual
          )
        }, 2000)
        await carregarDados()
      } else {
        alert('Erro ao salvar responsável.')
      }
    } finally {
      setSalvandoResponsavelId(null)
    }
  }

  const handleAutenticarLogistica = (e: React.FormEvent) => {
    e.preventDefault()
    if (SENHAS_LOGISTICA_6_DIGITOS.includes(senhaLogisticaInput.trim())) {
      setLogisticaAutenticada(true)
      setErroSenhaLogistica('')
    } else {
      setErroSenhaLogistica(
        'Senha incorreta! Digite a senha de 6 dígitos da equipe de logística.'
      )
    }
  }

  const abrirEdicaoVoo = (voo: VooLogistica) => {
    setVooEmEdicao(voo)
    function converterParaIso(dataBr: string) {
      if (!dataBr || !dataBr.includes('/')) return dataBr
      const [dia, mes, ano] = dataBr.split('/')
      return `${ano}-${mes}-${dia}`
    }

    const [pH, pM] = voo.partida_ida
      ? voo.partida_ida.split(':')
      : ['08', '00']
    const [cH, cM] = voo.chegada_ida
      ? voo.chegada_ida.split(':')
      : ['10', '00']
    const [vH, vM] = voo.partida_volta
      ? voo.partida_volta.split(':')
      : ['17', '00']

    const ciaIda = voo.cia_aerea_ida || 'LATAM'
    const aepOrig = voo.aeroporto_origem || 'GYN'
    const aepDest = voo.aeroporto_destino || 'CGH'
    const ciaVolta = voo.cia_aerea_volta || 'LATAM'
    const aepOrigVolta = voo.aeroporto_origem_volta || 'CGH'
    const aepDestVolta = voo.aeroporto_destino_volta || 'GYN'
    const hotelVal = voo.hotel || 'WTC'

    const ciaIdaPadrao = CIA_AEREAS_OPCOES.includes(ciaIda) ? ciaIda : 'Outra'
    const aepOrigemPadrao = AEROPORTOS_OPCOES.includes(aepOrig)
      ? aepOrig
      : 'Outro'
    const aepDestinoPadrao = AEROPORTOS_OPCOES.includes(aepDest)
      ? aepDest
      : 'Outro'
    const ciaVoltaPadrao = CIA_AEREAS_OPCOES.includes(ciaVolta)
      ? ciaVolta
      : 'Outra'
    const aepOrigemVoltaPadrao = AEROPORTOS_OPCOES.includes(aepOrigVolta)
      ? aepOrigVolta
      : 'Outro'
    const aepDestinoVoltaPadrao = AEROPORTOS_OPCOES.includes(aepDestVolta)
      ? aepDestVolta
      : 'Outro'
    const hotelPadrao = HOTEIS_OPCOES.includes(hotelVal) ? hotelVal : 'Outro'

    setFormVoo({
      amigo_nome: voo.amigo_nome || '',
      data_ida: converterParaIso(voo.data_ida || ''),
      n_voo_ida: voo.n_voo_ida || '',
      ciaAereaIdaSelect: ciaIdaPadrao,
      ciaAereaIdaOutra: ciaIdaPadrao === 'Outra' ? ciaIda : '',
      aeroportoOrigemSelect: aepOrigemPadrao,
      aeroportoOrigemOutro: aepOrigemPadrao === 'Outro' ? aepOrig : '',
      aeroportoDestinoSelect: aepDestinoPadrao,
      aeroportoDestinoOutro: aepDestinoPadrao === 'Outro' ? aepDest : '',
      partida_ida_h: pH || '08',
      partida_ida_m: pM || '00',
      chegada_ida_h: cH || '10',
      chegada_ida_m: cM || '00',
      data_volta: converterParaIso(voo.data_volta || ''),
      n_voo_volta: voo.n_voo_volta || '',
      ciaAereaVoltaSelect: ciaVoltaPadrao,
      ciaAereaVoltaOutra: ciaVoltaPadrao === 'Outra' ? ciaVolta : '',
      aeroportoOrigemVoltaSelect: aepOrigemVoltaPadrao,
      aeroportoOrigemVoltaOutro:
        aepOrigemVoltaPadrao === 'Outro' ? aepOrigVolta : '',
      aeroportoDestinoVoltaSelect: aepDestinoVoltaPadrao,
      aeroportoDestinoVoltaOutro:
        aepDestinoVoltaPadrao === 'Outro' ? aepDestVolta : '',
      partida_volta_h: vH || '17',
      partida_volta_m: vM || '00',
      hotelSelect: hotelPadrao,
      hotelOutro: hotelPadrao === 'Outro' ? hotelVal : '',
      observacoes: voo.observacoes || '',
      responsavel: voo.responsavel || '',
    })
    setModalVoo(true)
  }

  const handleExcluirVoo = async (id: string) => {
    if (!confirm('Deseja excluir este registro?')) return
    const res = await fetch(`/api/voos?id=${id}`, { method: 'DELETE' })
    if (res.ok) carregarDados()
    else alert('Erro ao excluir voo.')
  }

  // Obter lista única de datas disponíveis para o filtro de pesquisa de caronas
  const todasAsDatas = Array.from(
    new Set(caronas.map((c) => c.data_ida).filter(Boolean))
  )

  // Filtragem combinada por Cidade e por Data selecionada
  const caronasFiltradas = caronas.filter((carona) => {
    const matchOrigem =
      filtroOrigem === 'TODAS' ||
      carona.origem.toUpperCase() === filtroOrigem.toUpperCase()
    const matchData = filtroData === 'TODAS' || carona.data_ida === filtroData
    return matchOrigem && matchData
  })

  // Agrupar caronas por Data da Viagem
  const caronasPorData: { [data: string]: Carona[] } = {}
  caronasFiltradas.forEach((carona) => {
    const dataKey = carona.data_ida || 'Data não definida'
    if (!caronasPorData[dataKey]) {
      caronasPorData[dataKey] = []
    }
    caronasPorData[dataKey].push(carona)
  })

  // Ordenar as caronas dentro de cada dia por horário (hora_ida)
  Object.keys(caronasPorData).forEach((data) => {
    caronasPorData[data].sort((a, b) =>
      (a.hora_ida || '').localeCompare(b.hora_ida || '')
    )
  })

  const datasOrdenadas = Object.keys(caronasPorData).sort((a, b) =>
    dataBrParaChaveOrdenacao(a).localeCompare(dataBrParaChaveOrdenacao(b))
  )

  // Ordenação dos voos para a Equipe da Logística (por Data de Chegada e Horário de Chegada)
  const datasChegadaVoos = Array.from(
    new Set(voos.map((v) => v.data_ida).filter(Boolean))
  ).sort((a, b) =>
    dataBrParaChaveOrdenacao(a).localeCompare(dataBrParaChaveOrdenacao(b))
  )

  const voosFiltradosLogistica = voos
    .filter((v) => {
      const matchData =
        filtroDataLogistica === 'TODAS' ||
        (v.data_ida || 'Data não informada') === filtroDataLogistica
      const temResp = Boolean(v.responsavel && v.responsavel.trim())
      const matchStatus =
        filtroStatusResponsavel === 'TODOS' ||
        (filtroStatusResponsavel === 'COM_RESPONSAVEL' && temResp) ||
        (filtroStatusResponsavel === 'SEM_RESPONSAVEL' && !temResp)
      return matchData && matchStatus
    })
    .sort((a, b) => {
      const cmpData = dataBrParaChaveOrdenacao(a.data_ida || '').localeCompare(
        dataBrParaChaveOrdenacao(b.data_ida || '')
      )
      if (cmpData !== 0) return cmpData
      const horaA = a.chegada_ida || a.partida_ida || '99:99'
      const horaB = b.chegada_ida || b.partida_ida || '99:99'
      return horaA.localeCompare(horaB)
    })

  const voosPorDataChegada: { [data: string]: VooLogistica[] } = {}
  voosFiltradosLogistica.forEach((v) => {
    const key = v.data_ida || 'Data não informada'
    if (!voosPorDataChegada[key]) {
      voosPorDataChegada[key] = []
    }
    voosPorDataChegada[key].push(v)
  })

  const datasLogisticaOrdenadas = Object.keys(voosPorDataChegada).sort((a, b) =>
    dataBrParaChaveOrdenacao(a).localeCompare(dataBrParaChaveOrdenacao(b))
  )

  const totalComResponsavel = voos.filter(
    (v) => v.responsavel && v.responsavel.trim()
  ).length
  const totalSemResponsavel = voos.length - totalComResponsavel

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-emerald-400">
              ✈️🚗 Central de Logística & Caronas
            </h1>
            <p className="text-xs font-semibold text-emerald-300 mt-0.5">
              PV - Regional Goiânia
            </p>
            <p className="text-xs text-slate-400">
              Gestão de transporte terrestre e recepção
            </p>
          </div>
          <div className="flex flex-wrap bg-slate-900 p-1 rounded-lg border border-slate-700 w-full sm:w-auto gap-1">
            <button
              onClick={() => setAbaAtiva('caronas')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                abaAtiva === 'caronas'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🚗 Caronas
            </button>
            <button
              onClick={() => setAbaAtiva('voos')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                abaAtiva === 'voos'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛫 Informar Voo/Hotel
            </button>
            <button
              onClick={() => setAbaAtiva('logistica')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                abaAtiva === 'logistica'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔒 Equipe Logística
            </button>
          </div>
        </div>

        {/* ABA CARONAS */}
        {abaAtiva === 'caronas' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Calendário de Caronas Terrestres
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Filtre por cidade de origem e por data:
                  </p>
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
                  onChange={(e) => setFiltroOrigem(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white cursor-pointer"
                >
                  <option value="TODAS">📍 Todas as Cidades de Origem</option>
                  {CIDADES_OPCOES.filter((c) => c !== 'OUTRA').map((c) => (
                    <option key={c} value={c}>
                      Saindo de {c}
                    </option>
                  ))}
                </select>

                <select
                  value={filtroData}
                  onChange={(e) => setFiltroData(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white cursor-pointer"
                >
                  <option value="TODAS">📅 Filtrar por Data (Todas)</option>
                  {todasAsDatas.map((data) => (
                    <option key={data} value={data}>
                      Data: {data}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* GRADE POR DATA (CALENDÁRIO DE VIAGENS) */}
            <div className="space-y-6">
              {datasOrdenadas.length === 0 && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center text-xs text-slate-400">
                  Nenhuma carona encontrada para este filtro. Clique em &quot;+
                  Oferecer Carona&quot; para começar!
                </div>
              )}

              {datasOrdenadas.map((dataViagem) => (
                <div key={dataViagem} className="space-y-3">
                  <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 rounded-lg">
                    <span className="text-emerald-400 font-bold text-sm">
                      📅 Data: {dataViagem}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({caronasPorData[dataViagem].length}{' '}
                      {caronasPorData[dataViagem].length === 1
                        ? 'carona disponível'
                        : 'caronas disponíveis'}
                      )
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {caronasPorData[dataViagem].map((carona) => {
                      const foneLimpo = (carona.whatsapp || '').replace(
                        /\D/g,
                        ''
                      )
                      const foneWa = foneLimpo.startsWith('55')
                        ? foneLimpo
                        : `55${foneLimpo}`

                      return (
                        <div
                          key={carona.id}
                          className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow space-y-3 relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-bl-xl font-medium border-l border-b border-emerald-500/25">
                            {carona.vagas_disponiveis} de {carona.vagas_totais}{' '}
                            {carona.vagas_disponiveis === 1
                              ? 'vaga livre'
                              : 'vagas livres'}
                          </div>

                          <div className="text-sm font-bold text-slate-200 pr-28">
                            <span>Motorista: {carona.motorista}</span>
                            <span className="ml-2 text-[10px] bg-slate-700 text-emerald-300 px-2 py-0.5 rounded uppercase">
                              {carona.tipo_trajeto === 'somente_ida'
                                ? '🛬 Ida'
                                : carona.tipo_trajeto === 'somente_volta'
                                ? '🛫 Volta'
                                : '🚗 Viagem'}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 items-center">
                            {foneLimpo && (
                              <a
                                href={`https://wa.me/${foneWa}?text=${encodeURIComponent(
                                  `Olá ${carona.motorista}, vi sua carona de ${carona.origem} para ${carona.destino} no dia ${carona.data_ida}.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] px-3 py-1 rounded-lg flex items-center gap-1.5 transition font-medium"
                              >
                                💬 Chamar no WhatsApp
                              </a>
                            )}
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
                            <div className="font-semibold text-emerald-300">
                              🚗 Rota: {carona.origem} → {carona.destino}
                            </div>
                            <div>⏰ Horário de Saída: {carona.hora_ida}</div>
                          </div>

                          {carona.passageiros &&
                            carona.passageiros.length > 0 && (
                              <div className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded space-y-1.5">
                                <span className="font-semibold text-slate-300">
                                  Passageiros confirmados:
                                </span>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {carona.passageiros.map((passageiro, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-slate-800 border border-slate-700 px-2 py-1 rounded flex items-center gap-2 text-slate-200"
                                    >
                                      👤 {passageiro}
                                      <button
                                        onClick={() =>
                                          handleRemoverPassageiro(
                                            carona,
                                            passageiro
                                          )
                                        }
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
                              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                                carona.vagas_disponiveis > 0
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              {carona.vagas_disponiveis > 0
                                ? 'Quero Vaga (Reservar)'
                                : 'Carona Lotada (Esgotado)'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA PÚBLICA: INFORMAR VOO & HOSPEDAGEM (SEM LISTAR OS DADOS DOS OUTROS) */}
        {abaAtiva === 'voos' && (
          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
              {vooEnviadoSucesso ? (
                <div className="py-8 text-center space-y-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl">
                    ✅
                  </div>
                  <h2 className="text-lg font-bold text-emerald-400">
                    Dados enviados com sucesso!
                  </h2>
                  <p className="text-sm text-slate-300 max-w-md mx-auto">
                    Seus dados de voo e hospedagem foram enviados para a{' '}
                    <strong className="text-emerald-300">
                      Equipe da Logística
                    </strong>
                    .
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Por privacidade, as informações preenchidas ficam visíveis
                    apenas para a equipe responsável pela recepção.
                  </p>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFormVoo(estadoInicialFormVoo)
                        setVooEnviadoSucesso(false)
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition cursor-pointer"
                    >
                      + Informar outro Voo / Hotel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-xl mx-auto space-y-4">
                  <div className="border-b border-slate-700 pb-3">
                    <h2 className="text-base font-bold text-emerald-400">
                      🛫 Informar Voo & Hospedagem
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Preencha os dados da sua chegada, retorno e hotel. Seus
                      dados serão enviados diretamente para a equipe da
                      Logística.
                    </p>
                  </div>

                  <form
                    onSubmit={handleSalvarVoo}
                    className="space-y-3 text-xs"
                    autoComplete="off"
                  >
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Nome do Amigo(a)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Digite seu nome (ou apelido)"
                        value={formVoo.amigo_nome}
                        onChange={(e) =>
                          setFormVoo({ ...formVoo, amigo_nome: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700 space-y-2">
                      <div className="font-semibold text-emerald-300">
                        🛫 Voo de IDA (Chegada)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1">
                            Data de Chegada (Ida)
                          </label>
                          <input
                            type="date"
                            required
                            value={formVoo.data_ida}
                            onChange={(e) =>
                              setFormVoo({
                                ...formVoo,
                                data_ida: e.target.value,
                              })
                            }
                            onClick={(e) =>
                              (
                                e.currentTarget as HTMLInputElement
                              ).showPicker?.()
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">
                            N° Voo (Ida)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 3106"
                            value={formVoo.n_voo_ida}
                            onChange={(e) =>
                              setFormVoo({
                                ...formVoo,
                                n_voo_ida: e.target.value,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1">
                            Cia Aérea
                          </label>
                          <select
                            value={formVoo.ciaAereaIdaSelect}
                            onChange={(e) =>
                              setFormVoo({
                                ...formVoo,
                                ciaAereaIdaSelect: e.target.value,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                          >
                            {CIA_AEREAS_OPCOES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">
                            Origem
                          </label>
                          <select
                            value={formVoo.aeroportoOrigemSelect}
                            onChange={(e) =>
                              setFormVoo({
                                ...formVoo,
                                aeroportoOrigemSelect: e.target.value,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                          >
                            {AEROPORTOS_OPCOES.map((a) => (
                              <option key={a} value={a}>
                                {a}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">
                            Destino
                          </label>
                          <select
                            value={formVoo.aeroportoDestinoSelect}
                            onChange={(e) =>
                              setFormVoo({
                                ...formVoo,
                                aeroportoDestinoSelect: e.target.value,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                          >
                            {AEROPORTOS_OPCOES.map((a) => (
                              <option key={a} value={a}>
                                {a}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {formVoo.ciaAereaIdaSelect === 'Outra' && (
                        <input
                          type="text"
                          placeholder="Outra Cia Ida"
                          value={formVoo.ciaAereaIdaOutra || ''}
                          onChange={(e) =>
                            setFormVoo({
                              ...formVoo,
                              ciaAereaIdaOutra: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                        />
                      )}
                      {formVoo.aeroportoOrigemSelect === 'Outro' && (
                        <input
                          type="text"
                          placeholder="Outro Aeroporto Origem"
                          value={formVoo.aeroportoOrigemOutro || ''}
                          onChange={(e) =>
                            setFormVoo({
                              ...formVoo,
                              aeroportoOrigemOutro: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                        />
                      )}
                      {formVoo.aeroportoDestinoSelect === 'Outro' && (
                        <input
                          type="text"
                          placeholder="Outro Aeroporto Destino"
                          value={formVoo.aeroportoDestinoOutro || ''}
                          onChange={(e) =>
                            setFormVoo({
                              ...formVoo,
                              aeroportoDestinoOutro: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                        />
                      )}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-slate-400 block mb-1">
                            Horário Partida
                          </label>
                          <div className="flex gap-1">
                            <select
                              value={formVoo.partida_ida_h}
                              onChange={(e) =>
                                setFormVoo({
                                  ...formVoo,
                                  partida_ida_h: e.target.value,
                                })
                              }
                              className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white flex-1"
                            >
                              {HORAS_DISPONIVEIS.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                            <span className="self-center">:</span>
                            <select
                              value={formVoo.partida_ida_m}
                              onChange={(e) =>
                                setFormVoo({
                                  ...formVoo,
                                  partida_ida_m: e.target.value,
                                })
                              }
                              className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white flex-1"
                            >
                              {MINUTOS_DISPONIVEIS.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">
                            Horário Chegada
                          </label>
                          <div className="flex gap-1">
                            <select
                              value={formVoo.chegada_ida_h}
                              onChange={(e) =>
                                setFormVoo({
                                  ...formVoo,
                                  chegada_ida_h: e.target.value,
                                })
                              }
                              className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white flex-1"
                            >
                              {HORAS_DISPONIVEIS.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                            <span className="self-center">:</span>
                            <select
                              value={formVoo.chegada_ida_m}
                              onChange={(e) =>
                                setFormVoo({
                                  ...formVoo,
                                  chegada_ida_m: e.target.value,
                                })
                              }
                              className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white flex-1"
                            >
                              {MINUTOS_DISPONIVEIS.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700 space-y-2">
                      <div className="font-semibold text-amber-300">
                        🛬 Voo de VOLTA (Retorno)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1">
                            Data Volta
                          </label>
                          <input
                            type="date"
                            value={formVoo.data_volta}
                            onChange={(e) =>
                              setFormVoo({
                                ...formVoo,
                                data_volta: e.target.value,
                              })
                            }
                            onClick={(e) =>
                              (
                                e.currentTarget as HTMLInputElement
                              ).showPicker?.()
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">
                            N° Voo (Volta)
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 3103"
                            value={formVoo.n_voo_volta}
                            onChange={(e) =>
                              setFormVoo({
                                ...formVoo,
                                n_voo_volta: e.target.value,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1">
                            Cia Aérea
                          </label>
                          <select
                            value={formVoo.ciaAereaVoltaSelect}
                            onChange={(e) =>
                              setFormVoo({
                                ...formVoo,
                                ciaAereaVoltaSelect: e.target.value,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                          >
                            {CIA_AEREAS_OPCOES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">
                            Origem (Volta)
                          </label>
                          <select
                            value={formVoo.aeroportoOrigemVoltaSelect}
                            onChange={(e) =>
                              setFormVoo({
                                ...formVoo,
                                aeroportoOrigemVoltaSelect: e.target.value,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                          >
                            {AEROPORTOS_OPCOES.map((a) => (
                              <option key={a} value={a}>
                                {a}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">
                            Destino (Volta)
                          </label>
                          <select
                            value={formVoo.aeroportoDestinoVoltaSelect}
                            onChange={(e) =>
                              setFormVoo({
                                ...formVoo,
                                aeroportoDestinoVoltaSelect: e.target.value,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                          >
                            {AEROPORTOS_OPCOES.map((a) => (
                              <option key={a} value={a}>
                                {a}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {formVoo.ciaAereaVoltaSelect === 'Outra' && (
                        <input
                          type="text"
                          placeholder="Outra Cia Volta"
                          value={formVoo.ciaAereaVoltaOutra || ''}
                          onChange={(e) =>
                            setFormVoo({
                              ...formVoo,
                              ciaAereaVoltaOutra: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                        />
                      )}
                      {formVoo.aeroportoOrigemVoltaSelect === 'Outro' && (
                        <input
                          type="text"
                          placeholder="Outro Aeroporto Origem Volta"
                          value={formVoo.aeroportoOrigemVoltaOutro || ''}
                          onChange={(e) =>
                            setFormVoo({
                              ...formVoo,
                              aeroportoOrigemVoltaOutro: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                        />
                      )}
                      {formVoo.aeroportoDestinoVoltaSelect === 'Outro' && (
                        <input
                          type="text"
                          placeholder="Outro Aeroporto Destino Volta"
                          value={formVoo.aeroportoDestinoVoltaOutro || ''}
                          onChange={(e) =>
                            setFormVoo({
                              ...formVoo,
                              aeroportoDestinoVoltaOutro: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                        />
                      )}
                      <div>
                        <label className="text-slate-400 block mb-1">
                          Horário Partida (Volta)
                        </label>
                        <div className="flex gap-1">
                          <select
                            value={formVoo.partida_volta_h}
                            onChange={(e) =>
                              setFormVoo({
                                ...formVoo,
                                partida_volta_h: e.target.value,
                              })
                            }
                            className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white flex-1"
                          >
                            {HORAS_DISPONIVEIS.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                          <span className="self-center">:</span>
                          <select
                            value={formVoo.partida_volta_m}
                            onChange={(e) =>
                              setFormVoo({
                                ...formVoo,
                                partida_volta_m: e.target.value,
                              })
                            }
                            className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white flex-1"
                          >
                            {MINUTOS_DISPONIVEIS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Hotel</label>
                      <select
                        value={formVoo.hotelSelect}
                        onChange={(e) =>
                          setFormVoo({
                            ...formVoo,
                            hotelSelect: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      >
                        {HOTEIS_OPCOES.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    {formVoo.hotelSelect === 'Outro' && (
                      <input
                        type="text"
                        placeholder="Digite o nome do Hotel"
                        value={formVoo.hotelOutro || ''}
                        onChange={(e) =>
                          setFormVoo({ ...formVoo, hotelOutro: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      />
                    )}

                    <div>
                      <label className="text-slate-400 block mb-1">
                        Observações
                      </label>
                      <input
                        type="text"
                        placeholder="Alguma observação sobre sua chegada ou bagagem?"
                        value={formVoo.observacoes}
                        onChange={(e) =>
                          setFormVoo({
                            ...formVoo,
                            observacoes: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-lg font-semibold text-white cursor-pointer shadow"
                      >
                        Enviar Dados para a Equipe da Logística
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA RESTRITA: EQUIPE DA LOGÍSTICA (SENHA DE 6 DÍGITOS) */}
        {abaAtiva === 'logistica' && (
          <div className="space-y-6">
            {!logisticaAutenticada ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md mx-auto shadow-lg space-y-4">
                <div className="text-center space-y-1">
                  <div className="text-2xl">🔒</div>
                  <h2 className="text-base font-bold text-emerald-400">
                    Acesso Restrito — Equipe da Logística
                  </h2>
                  <p className="text-xs text-slate-400">
                    Digite a senha de 6 dígitos para visualizar a lista ordenada
                    de chegadas e definir os responsáveis por cada amigo.
                  </p>
                </div>

                {erroSenhaLogistica && (
                  <div className="bg-red-950/60 border border-red-500/40 text-red-200 text-xs p-3 rounded-lg text-center">
                    {erroSenhaLogistica}
                  </div>
                )}

                <form
                  onSubmit={handleAutenticarLogistica}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Senha de 6 dígitos
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      inputMode="numeric"
                      required
                      placeholder="••••••"
                      value={senhaLogisticaInput}
                      onChange={(e) => setSenhaLogisticaInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-center text-base tracking-widest text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-lg transition cursor-pointer"
                  >
                    Acessar Painel da Logística
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Resumo + Controles */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                        📋 Painel da Equipe de Logística (Ordem de Chegada)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Lista ordenada por data e horário de chegada para
                        designação de responsáveis.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setVooEmEdicao(null)
                          setFormVoo(estadoInicialFormVoo)
                          setModalVoo(true)
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        + Cadastrar Voo
                      </button>
                      <button
                        onClick={() => {
                          setLogisticaAutenticada(false)
                          setSenhaLogisticaInput('')
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        🔒 Sair
                      </button>
                    </div>
                  </div>

                  {/* Indicadores */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900/70 border border-slate-700/70 rounded-lg p-2.5">
                      <div className="text-lg font-bold text-white">
                        {voos.length}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Total de Amigos
                      </div>
                    </div>
                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2.5">
                      <div className="text-lg font-bold text-emerald-400">
                        {totalComResponsavel}
                      </div>
                      <div className="text-[11px] text-emerald-300">
                        Com Responsável
                      </div>
                    </div>
                    <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2.5">
                      <div className="text-lg font-bold text-amber-400">
                        {totalSemResponsavel}
                      </div>
                      <div className="text-[11px] text-amber-300">
                        Sem Responsável
                      </div>
                    </div>
                  </div>

                  {/* Filtros da Equipe de Logística */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-700/60">
                    <select
                      value={filtroDataLogistica}
                      onChange={(e) => setFiltroDataLogistica(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white cursor-pointer"
                    >
                      <option value="TODAS">
                        📅 Todas as Datas de Chegada
                      </option>
                      {datasChegadaVoos.map((d) => (
                        <option key={d} value={d}>
                          Chegada em: {d}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filtroStatusResponsavel}
                      onChange={(e) =>
                        setFiltroStatusResponsavel(e.target.value)
                      }
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white cursor-pointer"
                    >
                      <option value="TODOS">
                        👥 Todos (Com e Sem Responsável)
                      </option>
                      <option value="SEM_RESPONSAVEL">
                        ⚠️ Pendentes (Sem Responsável)
                      </option>
                      <option value="COM_RESPONSAVEL">
                        ✅ Já atribuídos (Com Responsável)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Lista Ordenada por Data e Horário de Chegada */}
                {datasLogisticaOrdenadas.length === 0 ? (
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-center text-xs text-slate-400">
                    Nenhum registro de voo encontrado para este filtro.
                  </div>
                ) : (
                  datasLogisticaOrdenadas.map((dataChegada) => (
                    <div key={dataChegada} className="space-y-3">
                      <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 rounded-lg">
                        <span className="text-emerald-400 font-bold text-sm">
                          📅 Chegadas em: {dataChegada}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {voosPorDataChegada[dataChegada].length}{' '}
                          {voosPorDataChegada[dataChegada].length === 1
                            ? 'amigo chegando'
                            : 'amigos chegando'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {voosPorDataChegada[dataChegada].map((voo, index) => {
                          const temResponsavel = Boolean(
                            voo.responsavel && voo.responsavel.trim()
                          )
                          return (
                            <div
                              key={voo.id}
                              className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow space-y-3 text-xs"
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-700 pb-2.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[11px]">
                                    #{index + 1}
                                  </span>
                                  <span className="bg-slate-900 border border-emerald-500/40 text-emerald-300 font-bold px-2.5 py-0.5 rounded text-xs">
                                    🛬 Chegada: {voo.chegada_ida || '--:--'}
                                  </span>
                                  <span className="font-bold text-white text-sm">
                                    👤 {voo.amigo_nome}
                                  </span>
                                  {temResponsavel ? (
                                    <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                                      ✅ Resp: {voo.responsavel}
                                    </span>
                                  ) : (
                                    <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                                      ⚠️ Sem responsável
                                    </span>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => abrirEdicaoVoo(voo)}
                                    className="bg-amber-600/80 hover:bg-amber-500 text-white px-2.5 py-1 rounded cursor-pointer text-[11px]"
                                  >
                                    ✏️ Editar
                                  </button>
                                  <button
                                    onClick={() => handleExcluirVoo(voo.id)}
                                    className="bg-red-900/70 hover:bg-red-700 text-red-200 px-2.5 py-1 rounded cursor-pointer text-[11px]"
                                  >
                                    🗑️ Excluir
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 space-y-1">
                                  <div className="font-semibold text-emerald-300">
                                    🛫 Voo de IDA (Chegada)
                                  </div>
                                  <div>
                                    <strong>Data:</strong> {voo.data_ida || '-'}{' '}
                                    | <strong>Chegada:</strong>{' '}
                                    <span className="text-emerald-300 font-bold">
                                      {voo.chegada_ida || '-'}
                                    </span>{' '}
                                    (Partida: {voo.partida_ida || '-'})
                                  </div>
                                  <div>
                                    <strong>Cia / Voo:</strong>{' '}
                                    {voo.cia_aerea_ida || '-'} {voo.n_voo_ida}
                                  </div>
                                  <div>
                                    <strong>Rota:</strong>{' '}
                                    {voo.aeroporto_origem || '-'} →{' '}
                                    {voo.aeroporto_destino || '-'}
                                  </div>
                                </div>

                                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 space-y-1">
                                  <div className="font-semibold text-amber-300">
                                    🛬 Voo de VOLTA (Retorno)
                                  </div>
                                  <div>
                                    <strong>Data:</strong>{' '}
                                    {voo.data_volta || '-'} |{' '}
                                    <strong>Partida:</strong>{' '}
                                    {voo.partida_volta || '-'}
                                  </div>
                                  <div>
                                    <strong>Cia / Voo:</strong>{' '}
                                    {voo.cia_aerea_volta || '-'}{' '}
                                    {voo.n_voo_volta}
                                  </div>
                                  <div>
                                    <strong>Rota:</strong>{' '}
                                    {voo.aeroporto_origem_volta || '-'} →{' '}
                                    {voo.aeroporto_destino_volta || '-'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row justify-between gap-2 bg-slate-900/40 p-2.5 rounded-lg">
                                <div>
                                  🏨 <strong>Hotel:</strong>{' '}
                                  {voo.hotel || 'Não informado'}
                                </div>
                                {voo.observacoes && (
                                  <div className="text-slate-400 italic">
                                    📝 <strong>Obs:</strong> {voo.observacoes}
                                  </div>
                                )}
                              </div>

                              {/* Campo para escolher/salvar o Responsável */}
                              <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <label className="text-slate-300 font-semibold whitespace-nowrap">
                                  🤝 Responsável por cuidar/recepcionar:
                                </label>
                                <input
                                  type="text"
                                  placeholder="Digite o nome do responsável da equipe..."
                                  value={
                                    responsaveisEdit[String(voo.id)] ??
                                    voo.responsavel ??
                                    ''
                                  }
                                  onChange={(e) =>
                                    setResponsaveisEdit({
                                      ...responsaveisEdit,
                                      [String(voo.id)]: e.target.value,
                                    })
                                  }
                                  className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSalvarResponsavel(voo.id)
                                  }
                                  disabled={
                                    salvandoResponsavelId === String(voo.id)
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-1.5 rounded transition cursor-pointer whitespace-nowrap"
                                >
                                  {salvandoResponsavelId === String(voo.id)
                                    ? 'Salvando...'
                                    : salvoResponsavelId === String(voo.id)
                                    ? '✓ Salvo!'
                                    : 'Salvar Responsável'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* MODAL CADASTRAR/EDITAR CARONA */}
        {modalCarona && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-base font-bold text-emerald-400">
                {caronaEmEdicao ? 'Editar Carona' : 'Oferecer Carona'}
              </h2>
              <form
                onSubmit={handleSalvarCarona}
                className="space-y-3 text-xs"
                autoComplete="off"
              >
                <div>
                  <label className="text-slate-400 block mb-1">
                    Nome do Motorista
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Seu nome"
                    value={formCarona.motorista}
                    onChange={(e) =>
                      setFormCarona({
                        ...formCarona,
                        motorista: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    Tipo de Trajeto
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() =>
                        setFormCarona({
                          ...formCarona,
                          tipo_trajeto: 'ida_volta',
                        })
                      }
                      className={`py-1.5 px-2 rounded text-[11px] font-semibold transition cursor-pointer ${
                        formCarona.tipo_trajeto === 'ida_volta'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🔄 Ida e Volta
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormCarona({
                          ...formCarona,
                          tipo_trajeto: 'somente_ida',
                        })
                      }
                      className={`py-1.5 px-2 rounded text-[11px] font-semibold transition cursor-pointer ${
                        formCarona.tipo_trajeto === 'somente_ida'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🛬 Somente Ida
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Origem</label>
                    <select
                      value={formCarona.origemSelect}
                      onChange={(e) =>
                        setFormCarona({
                          ...formCarona,
                          origemSelect: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white cursor-pointer"
                    >
                      {CIDADES_OPCOES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Destino</label>
                    <select
                      value={formCarona.destinoSelect}
                      onChange={(e) =>
                        setFormCarona({
                          ...formCarona,
                          destinoSelect: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white cursor-pointer"
                    >
                      {CIDADES_OPCOES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formCarona.origemSelect === 'OUTRA' && (
                  <div>
                    <label className="text-slate-400 block mb-1">
                      Digite a Cidade de Origem
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Ex: Anápolis"
                      value={formCarona.origemOutra}
                      onChange={(e) =>
                        setFormCarona({
                          ...formCarona,
                          origemOutra: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>
                )}

                {formCarona.destinoSelect === 'OUTRA' && (
                  <div>
                    <label className="text-slate-400 block mb-1">
                      Digite a Cidade de Destino
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Ex: Goiânia"
                      value={formCarona.destinoOutro}
                      onChange={(e) =>
                        setFormCarona({
                          ...formCarona,
                          destinoOutro: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/50">
                  <div>
                    <label className="text-slate-400 block mb-1">
                      Data da Ida
                    </label>
                    <input
                      type="date"
                      required
                      value={formCarona.data_ida}
                      onChange={(e) =>
                        setFormCarona({
                          ...formCarona,
                          data_ida: e.target.value,
                        })
                      }
                      onClick={(e) =>
                        (e.currentTarget as HTMLInputElement).showPicker?.()
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">
                      Horário da Ida
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={formCarona.hora_ida_h}
                        onChange={(e) =>
                          setFormCarona({
                            ...formCarona,
                            hora_ida_h: e.target.value,
                          })
                        }
                        className="bg-slate-900 border border-slate-700 rounded p-2 text-white flex-1 cursor-pointer"
                      >
                        {HORAS_DISPONIVEIS.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="text-white self-center">:</span>
                      <select
                        value={formCarona.hora_ida_m}
                        onChange={(e) =>
                          setFormCarona({
                            ...formCarona,
                            hora_ida_m: e.target.value,
                          })
                        }
                        className="bg-slate-900 border border-slate-700 rounded p-2 text-white flex-1 cursor-pointer"
                      >
                        {MINUTOS_DISPONIVEIS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {formCarona.tipo_trajeto === 'ida_volta' && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/50">
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Data Retorno
                      </label>
                      <input
                        type="date"
                        required
                        value={formCarona.data_volta}
                        onChange={(e) =>
                          setFormCarona({
                            ...formCarona,
                            data_volta: e.target.value,
                          })
                        }
                        onClick={(e) =>
                          (e.currentTarget as HTMLInputElement).showPicker?.()
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Horário Retorno
                      </label>
                      <div className="flex gap-1">
                        <select
                          value={formCarona.hora_volta_h}
                          onChange={(e) =>
                            setFormCarona({
                              ...formCarona,
                              hora_volta_h: e.target.value,
                            })
                          }
                          className="bg-slate-900 border border-slate-700 rounded p-2 text-white flex-1 cursor-pointer"
                        >
                          {HORAS_DISPONIVEIS.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <span className="text-white self-center">:</span>
                        <select
                          value={formCarona.hora_volta_m}
                          onChange={(e) =>
                            setFormCarona({
                              ...formCarona,
                              hora_volta_m: e.target.value,
                            })
                          }
                          className="bg-slate-900 border border-slate-700 rounded p-2 text-white flex-1 cursor-pointer"
                        >
                          {MINUTOS_DISPONIVEIS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">
                      Vagas Totais
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      required
                      value={formCarona.vagas_totais}
                      onChange={(e) =>
                        setFormCarona({
                          ...formCarona,
                          vagas_totais: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">
                      WhatsApp (com DDD)
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      name="no-autofill-whatsapp"
                      placeholder="62999998888"
                      value={formCarona.whatsapp}
                      onChange={(e) =>
                        setFormCarona({
                          ...formCarona,
                          whatsapp: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    PIN de Segurança (4 números)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    autoComplete="new-password"
                    name="no-autofill-pin"
                    placeholder="Ex: 1234"
                    value={formCarona.pin}
                    onChange={(e) =>
                      setFormCarona({ ...formCarona, pin: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded font-semibold text-white cursor-pointer"
                  >
                    Salvar Carona
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalCarona(false)
                      setCaronaEmEdicao(null)
                    }}
                    className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-slate-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL RESERVAR VAGA */}
        {modalReserva && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm space-y-4 text-xs shadow-2xl">
              <h2 className="text-sm font-bold text-emerald-400">
                Reservar Vaga com {modalReserva.motorista}
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!modalReserva || !nomePassageiro.trim()) return

                  const res = await fetch('/api/caronas/reservar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: modalReserva.id,
                      passageiro: nomePassageiro.trim(),
                    }),
                  })

                  if (res.ok) {
                    const infoTrecho =
                      modalReserva.tipo_trajeto === 'somente_ida'
                        ? `para o dia (${formatarDataBR(modalReserva.data_ida)})`
                        : `de ${modalReserva.origem} para ${modalReserva.destino} (${formatarDataBR(
                            modalReserva.data_ida
                          )})`

                    const mensagem = encodeURIComponent(
                      `Olá ${modalReserva.motorista}, reservei minha vaga na sua carona ${infoTrecho}. Meu nome é ${nomePassageiro.trim()}!`
                    )
                    const foneLimpo = (modalReserva.whatsapp || '').replace(
                      /\D/g,
                      ''
                    )
                    const foneWa = foneLimpo.startsWith('55')
                      ? foneLimpo
                      : `55${foneLimpo}`
                    if (foneLimpo) {
                      window.open(
                        `https://wa.me/${foneWa}?text=${mensagem}`,
                        '_blank'
                      )
                    }
                    setModalReserva(null)
                    setNomePassageiro('')
                    carregarDados()
                  } else {
                    alert('Erro ao reservar vaga ou carona lotada.')
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-slate-400 block mb-1">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Digite seu nome (ou como prefere ser chamado)"
                    value={nomePassageiro}
                    onChange={(e) => setNomePassageiro(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Ao confirmar, a vaga será debitada automaticamente e você será
                  direcionado ao WhatsApp do motorista.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded font-semibold text-white cursor-pointer"
                  >
                    Confirmar Reserva
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalReserva(null)}
                    className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-slate-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Voo (usado pela Equipe de Logística para editar/adicionar) */}
        {modalVoo && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-base font-bold text-emerald-400">
                {vooEmEdicao
                  ? 'Editar Logística'
                  : 'Informar Voo & Hospedagem'}
              </h2>
              <form
                onSubmit={handleSalvarVoo}
                className="space-y-3 text-xs"
                autoComplete="off"
              >
                <div>
                  <label className="text-slate-400 block mb-1">
                    Nome do Amigo(a)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Digite o nome"
                    value={formVoo.amigo_nome}
                    onChange={(e) =>
                      setFormVoo({ ...formVoo, amigo_nome: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>

                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700 space-y-2">
                  <div className="font-semibold text-emerald-300">
                    🛫 Voo de IDA
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Data Ida
                      </label>
                      <input
                        type="date"
                        value={formVoo.data_ida}
                        onChange={(e) =>
                          setFormVoo({ ...formVoo, data_ida: e.target.value })
                        }
                        onClick={(e) =>
                          (e.currentTarget as HTMLInputElement).showPicker?.()
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">
                        N° Voo (Ida)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 3106"
                        value={formVoo.n_voo_ida}
                        onChange={(e) =>
                          setFormVoo({ ...formVoo, n_voo_ida: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Cia Aérea
                      </label>
                      <select
                        value={formVoo.ciaAereaIdaSelect}
                        onChange={(e) =>
                          setFormVoo({
                            ...formVoo,
                            ciaAereaIdaSelect: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      >
                        {CIA_AEREAS_OPCOES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Origem
                      </label>
                      <select
                        value={formVoo.aeroportoOrigemSelect}
                        onChange={(e) =>
                          setFormVoo({
                            ...formVoo,
                            aeroportoOrigemSelect: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      >
                        {AEROPORTOS_OPCOES.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Destino
                      </label>
                      <select
                        value={formVoo.aeroportoDestinoSelect}
                        onChange={(e) =>
                          setFormVoo({
                            ...formVoo,
                            aeroportoDestinoSelect: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      >
                        {AEROPORTOS_OPCOES.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {formVoo.ciaAereaIdaSelect === 'Outra' && (
                    <input
                      type="text"
                      placeholder="Outra Cia Ida"
                      value={formVoo.ciaAereaIdaOutra || ''}
                      onChange={(e) =>
                        setFormVoo({
                          ...formVoo,
                          ciaAereaIdaOutra: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                    />
                  )}
                  {formVoo.aeroportoOrigemSelect === 'Outro' && (
                    <input
                      type="text"
                      placeholder="Outro Aeroporto Origem"
                      value={formVoo.aeroportoOrigemOutro || ''}
                      onChange={(e) =>
                        setFormVoo({
                          ...formVoo,
                          aeroportoOrigemOutro: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                    />
                  )}
                  {formVoo.aeroportoDestinoSelect === 'Outro' && (
                    <input
                      type="text"
                      placeholder="Outro Aeroporto Destino"
                      value={formVoo.aeroportoDestinoOutro || ''}
                      onChange={(e) =>
                        setFormVoo({
                          ...formVoo,
                          aeroportoDestinoOutro: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                    />
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Partida
                      </label>
                      <div className="flex gap-1">
                        <select
                          value={formVoo.partida_ida_h}
                          onChange={(e) =>
                            setFormVoo({
                              ...formVoo,
                              partida_ida_h: e.target.value,
                            })
                          }
                          className="bg-slate-900 border border-slate-700 rounded p-1 text-white flex-1"
                        >
                          {HORAS_DISPONIVEIS.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <span>:</span>
                        <select
                          value={formVoo.partida_ida_m}
                          onChange={(e) =>
                            setFormVoo({
                              ...formVoo,
                              partida_ida_m: e.target.value,
                            })
                          }
                          className="bg-slate-900 border border-slate-700 rounded p-1 text-white flex-1"
                        >
                          {MINUTOS_DISPONIVEIS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Chegada
                      </label>
                      <div className="flex gap-1">
                        <select
                          value={formVoo.chegada_ida_h}
                          onChange={(e) =>
                            setFormVoo({
                              ...formVoo,
                              chegada_ida_h: e.target.value,
                            })
                          }
                          className="bg-slate-900 border border-slate-700 rounded p-1 text-white flex-1"
                        >
                          {HORAS_DISPONIVEIS.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <span>:</span>
                        <select
                          value={formVoo.chegada_ida_m}
                          onChange={(e) =>
                            setFormVoo({
                              ...formVoo,
                              chegada_ida_m: e.target.value,
                            })
                          }
                          className="bg-slate-900 border border-slate-700 rounded p-1 text-white flex-1"
                        >
                          {MINUTOS_DISPONIVEIS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700 space-y-2">
                  <div className="font-semibold text-amber-300">
                    🛬 Voo de VOLTA
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Data Volta
                      </label>
                      <input
                        type="date"
                        value={formVoo.data_volta}
                        onChange={(e) =>
                          setFormVoo({ ...formVoo, data_volta: e.target.value })
                        }
                        onClick={(e) =>
                          (e.currentTarget as HTMLInputElement).showPicker?.()
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">
                        N° Voo (Volta)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 3103"
                        value={formVoo.n_voo_volta}
                        onChange={(e) =>
                          setFormVoo({
                            ...formVoo,
                            n_voo_volta: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Cia Aérea
                      </label>
                      <select
                        value={formVoo.ciaAereaVoltaSelect}
                        onChange={(e) =>
                          setFormVoo({
                            ...formVoo,
                            ciaAereaVoltaSelect: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      >
                        {CIA_AEREAS_OPCOES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Origem (Volta)
                      </label>
                      <select
                        value={formVoo.aeroportoOrigemVoltaSelect}
                        onChange={(e) =>
                          setFormVoo({
                            ...formVoo,
                            aeroportoOrigemVoltaSelect: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      >
                        {AEROPORTOS_OPCOES.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">
                        Destino (Volta)
                      </label>
                      <select
                        value={formVoo.aeroportoDestinoVoltaSelect}
                        onChange={(e) =>
                          setFormVoo({
                            ...formVoo,
                            aeroportoDestinoVoltaSelect: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                      >
                        {AEROPORTOS_OPCOES.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {formVoo.ciaAereaVoltaSelect === 'Outra' && (
                    <input
                      type="text"
                      placeholder="Outra Cia Volta"
                      value={formVoo.ciaAereaVoltaOutra || ''}
                      onChange={(e) =>
                        setFormVoo({
                          ...formVoo,
                          ciaAereaVoltaOutra: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                    />
                  )}
                  {formVoo.aeroportoOrigemVoltaSelect === 'Outro' && (
                    <input
                      type="text"
                      placeholder="Outro Aeroporto Origem Volta"
                      value={formVoo.aeroportoOrigemVoltaOutro || ''}
                      onChange={(e) =>
                        setFormVoo({
                          ...formVoo,
                          aeroportoOrigemVoltaOutro: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                    />
                  )}
                  {formVoo.aeroportoDestinoVoltaSelect === 'Outro' && (
                    <input
                      type="text"
                      placeholder="Outro Aeroporto Destino Volta"
                      value={formVoo.aeroportoDestinoVoltaOutro || ''}
                      onChange={(e) =>
                        setFormVoo({
                          ...formVoo,
                          aeroportoDestinoVoltaOutro: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mt-1"
                    />
                  )}
                  <div>
                    <label className="text-slate-400 block mb-1">
                      Horário Partida (Volta)
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={formVoo.partida_volta_h}
                        onChange={(e) =>
                          setFormVoo({
                            ...formVoo,
                            partida_volta_h: e.target.value,
                          })
                        }
                        className="bg-slate-900 border border-slate-700 rounded p-1 text-white flex-1"
                      >
                        {HORAS_DISPONIVEIS.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span>:</span>
                      <select
                        value={formVoo.partida_volta_m}
                        onChange={(e) =>
                          setFormVoo({
                            ...formVoo,
                            partida_volta_m: e.target.value,
                          })
                        }
                        className="bg-slate-900 border border-slate-700 rounded p-1 text-white flex-1"
                      >
                        {MINUTOS_DISPONIVEIS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Hotel</label>
                  <select
                    value={formVoo.hotelSelect}
                    onChange={(e) =>
                      setFormVoo({ ...formVoo, hotelSelect: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  >
                    {HOTEIS_OPCOES.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                {formVoo.hotelSelect === 'Outro' && (
                  <input
                    type="text"
                    placeholder="Outro Hotel"
                    value={formVoo.hotelOutro || ''}
                    onChange={(e) =>
                      setFormVoo({ ...formVoo, hotelOutro: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                )}

                <div>
                  <label className="text-slate-400 block mb-1">
                    Responsável pela recepção (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Nome de quem vai cuidar/recepcionar"
                    value={formVoo.responsavel || ''}
                    onChange={(e) =>
                      setFormVoo({ ...formVoo, responsavel: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    Observações
                  </label>
                  <input
                    type="text"
                    placeholder="Obs"
                    value={formVoo.observacoes}
                    onChange={(e) =>
                      setFormVoo({ ...formVoo, observacoes: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded font-semibold text-white cursor-pointer"
                  >
                    Salvar Logística
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalVoo(false)}
                    className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-slate-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
