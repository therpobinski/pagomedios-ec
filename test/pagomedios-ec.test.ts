
import generetePayment, {
  getStatusLinkPayment,
  reversePayment,
  getSettings,
  getPayment,
  Data,
} from '../src/pagomedios-ec'
import PagoMediosErrorEc from '../src/pagomedios-ec-error'

function makeBody ({ CIInc = false, bodyInc = false, taxInc = false }) {
  return {
    companyType: 'Persona Natural' as 'Persona Natural' | 'Empresa',
    document: !CIInc ? '1726834771' : '15856985',
    documentType: '01' as '01' | '02' | '03' | '06',
    fullName: 'Nombre Prueba Ecuadoriano',
    address: 'Quito - Ecuador',
    mobile: '+59399999999',
    email: !bodyInc ? 'ejemplo@ejm.com' : 'ejemplo  ',
    description: 'Solicitud de prueba unitaria',
    amount: 1.12,
    amountWithTax: 1,
    amountWithoutTax: 0,
    tax: !taxInc ? 0.12 : 0.5,
  }
}

function errorConnection(e: any) {
  expect(e).toBeInstanceOf(Error)
  expect(e.type).toBe(PagoMediosErrorEc.TYPE_CONNECTION)
  expect(typeof e.message).toEqual('string')
}

describe('obtener token de pago', () => {
  test('solicitud correcta con datos validados', async () => {
    try {
      const data: Data = makeBody({})
      const res = await generetePayment(data)
      expect(res.status).toBe(201)
      expect(res.success).toBe(true)
      expect(res.data).toHaveProperty('url')
      expect(res.data).toHaveProperty('token')
    } catch (e) { errorConnection(e) }
  })

  test('solicitud erronea, con calculos erroneos', async () => {
    try {
      const data: Data = makeBody({ taxInc: true })
      const res = await generetePayment(data)
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.TYPE_BODY)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('solicitud erronea con cédula incorrecta', async () => {
    try {
      const data: Data = makeBody({ CIInc: true })
      const res = await generetePayment(data)
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.TYPE_BODY)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('solicitud erronea, Data incorrecta', async () => {
    try {
      const data: Data = makeBody({ bodyInc: true })
      const res = await generetePayment(data)
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.TYPE_BODY)
      expect(typeof e.message).toEqual('string')
    }
  })
})

describe('obtener el estado de una transacción', () => {
  test('token existente y pago correcto', async () => {
    try {
      const res = await getStatusLinkPayment('cha_XAxITohqD4AQITLMx4X70492')
      expect(res.success).toBe(true)
      expect(res.status).toBe(200)
      expect(res.data).toHaveProperty('id')
      expect(res.data).toHaveProperty('authorizationCode')
      expect(res.data).toHaveProperty('cardNumber')
      expect(res.data).toHaveProperty('cardHolder')
      expect(res.data).toHaveProperty('status')
      expect(res.data.status).toBe('AUTORIZADA')
    } catch (e) { errorConnection(e) }
  })

  test('token-id no existe', async () => {
    try {
      const res = await getStatusLinkPayment('cha_vghUgBUvdXQwd_FsBb1k034K')
    } catch (e: any) { 
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.ID_REQUEST)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('token existente y pago incompleto', async () => {
    try {
      const res = await getStatusLinkPayment('cha_vghUgBUvdXQwd_FsBb1k0341')
      expect(res.success).toBe(true)
      expect(res.status).toBe(200)
      expect(res.data).toHaveProperty('id')
      expect(res.data).toHaveProperty('status')
      expect(res.data.status).toBe('PENDIENTE DE PAGO')
    } catch (e) { errorConnection(e) }
  })
})

describe('reversar un token pagado', () => {
  /**
   * No se podra hacer pruebas para reverso correcto, ya que será necesario 
   * hacer un pago por cada reverso, la generación de link de pago son
   * automáticos, pero el pago es manual que lo que no se puede generar un 
   * reverso automático.
   */
  // test('reversar pago existosamente', async () => {
  //   try {
  //     const res = await reversePayment('cha_QaK7nsrGv61OKphjMmta1809')
  //     expect(res.success).toBe(true)
  //     expect(res.status).toBe(200)
  //     expect(res.data).toHaveProperty('id')
  //     expect(res.data).toHaveProperty('msg')
  //   } catch (e) { errorConnection(e) }
  // })

  test('reversar pago inexistente', async () => {
    try {
      const res = await reversePayment('cha_XAxITohqD4AQITLMx4X7049E')
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.NOT_FOUND)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('pago reversado', async () => {
    try {
      const res = await getStatusLinkPayment('cha_hKyoiZTvdv58uOluOJnA5858')
      expect(res.success).toBe(true)
      expect(res.status).toBe(200)
      expect(res.data).toHaveProperty('id')
      expect(res.data).toHaveProperty('status')
      expect(res.data.status).toBe('REVERSADA')
    } catch (e) { errorConnection(e) }
  })

  test('pago no se puede reversar por falta de pago', async () => {
    try {
      const res = await reversePayment('cha_Egh3408DMoi3iIOaM0Ai8862')
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.NOT_FOUND)
      expect(typeof e.message).toEqual('string')
    }
  })
})

describe('Obtener pagos', () => {
  test('Obtener un solo pago', async () => {
    try {
      const res = await getPayment({ id: 'cha_XAxITohqD4AQITLMx4X70492' })
      expect(res.success).toBe(true)
      expect(res.status).toBe(200)
      expect(res).toHaveProperty('statusSchema')
      expect(typeof res.statusSchema ==='object').toBe(true)
      expect(res.data).toHaveProperty('id')
      expect(res.data).toHaveProperty('status')
      expect(res.data).toHaveProperty('reference')
      expect(res.data).toHaveProperty('url')
    } catch(e) { errorConnection(e) }
  })

  test('Obtener un pago inexistente', async () => {
    try {
      const res = await getPayment({ id: 'cha_XAxITohqD4AQITLMx4X7049E' })
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.NOT_FOUND)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('Obtener varios pagos', async () => {
    try {
      const res = await getPayment()
      expect(res.success).toBe(true)
      expect(res.status).toBe(200)
      expect(res).toHaveProperty('statusSchema')
      expect(typeof res.statusSchema ==='object').toBe(true)
      expect(typeof res.data === 'object').toBe(true)
    } catch(e) { errorConnection(e) }
  })
})

describe('Obtener configuraciones de tarjetas', () => {
  test('Obtiene las configuraciones de la cuenta prueba', async () => {
    try {
      const res = await getSettings()
      expect(res.success).toBe(true)
      expect(res.status).toBe(200)
      expect(typeof res.data === 'object').toBe(true)
    } catch (e) { errorConnection(e) }
  })
})
