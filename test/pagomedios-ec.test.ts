const token = process.env.TOKEN || 'error-sin-token'
import generetePayment, {
  getStatusLinkPayment,
  reversePayment,
  getSettings,
  getPayment,
  Data,
} from '../src/pagomedios-ec'
import PagoMediosErrorEc from '../src/pagomedios-ec-error'

function makeBody ({ CIInc = false, bodyInc = false, tax = 0.15 }) {
  return {
    companyType: 'Persona Natural' as 'Persona Natural' | 'Empresa',
    document: !CIInc ? '1726834771' : '15856985',
    documentType: '01' as '01' | '02' | '03' | '06',
    fullName: 'Nombré Prueba Ecuadoriano',
    address: 'Quito - Ecuador',
    mobile: '+59399999999',
    email: !bodyInc ? 'ejemplo@ejm.com' : 'ejemplo  ',
    description: 'Solicitud de prueba unitaria',
    amountWithTax: 1,
    amountWithoutTax: 0,
    tax: tax as 0.05 | 0.08 | 0.13 | 0.15,
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
      const data: Data = makeBody({ tax: 0.12 })
      const res = await generetePayment(data, token)
      expect(res.status).toBe(201)
      expect(res.success).toBe(true)
      expect(res.data).toHaveProperty('url')
      expect(res.data).toHaveProperty('token')
    } catch (e) { errorConnection(e) }
  })

  test('solicitud erronea, con impuestos erroneos', async () => {
    try {
      const data: Data = makeBody({ tax: 0.12 })
      const res = await generetePayment(data, token)
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.TAX_INCORRECT)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('solicitud erronea con cédula incorrecta', async () => {
    try {
      const data: Data = makeBody({ CIInc: true })
      const res = await generetePayment(data, token)
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.TYPE_BODY)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('solicitud erronea, Data incorrecta', async () => {
    try {
      const data: Data = makeBody({ bodyInc: true })
      const res = await generetePayment(data, token)
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
      const res = await getStatusLinkPayment('cha__wviPIw4Xae1WQCnheVz5179', token)
      expect(res.success).toBe(true)
      expect(res.status).toBe(200)
      expect(res.data).toHaveProperty('id')
      expect(res.data).toHaveProperty('authorizationCode')
      expect(res.data).toHaveProperty('cardNumber')
      expect(res.data).toHaveProperty('cardHolder')
      expect(res.data).toHaveProperty('transactionDate')
      expect(res.data).toHaveProperty('status')
      expect(res.data.status).toBe('Autorizada')
    } catch (e) { errorConnection(e) }
  })

  test('token-id no existe', async () => {
    try {
      const res = await getStatusLinkPayment('cha_vghUgBUvdXQwd_FsBb1k034K', token)
    } catch (e: any) { 
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.ID_REQUEST)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('token existente y pago incompleto', async () => {
    try {
      const res = await getStatusLinkPayment('cha_aRbp1W3Bt9XkFyEAsmUR4067', token)
      expect(res.success).toBe(true)
      expect(res.status).toBe(200)
      expect(res.data).toHaveProperty('id')
      expect(res.data).toHaveProperty('status')
      expect(res.data.status).toBe('Pendiente de pago')
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
  //     const res = await reversePayment('cha_2RjMhp1JtxLGW2zd6czA5765', token)
  //     expect(res.success).toBe(true)
  //     expect(res.status).toBe(200)
  //     expect(res.data).toHaveProperty('id')
  //     expect(res.data).toHaveProperty('msg')
  //   } catch (e) { errorConnection(e) }
  // })

  test('reversar pago inexistente', async () => {
    try {
      const res = await reversePayment('cha_aRbp1W3Bt9XkFyEAsmUR0000', token)
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.NOT_FOUND)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('pago reversado', async () => {
    try {
      const res = await getStatusLinkPayment('cha_2RjMhp1JtxLGW2zd6czA5765', token)
      expect(res.success).toBe(true)
      expect(res.status).toBe(200)
      expect(res.data).toHaveProperty('id')
      expect(res.data).toHaveProperty('status')
      expect(res.data.status).toBe('Reversada')
    } catch (e) { errorConnection(e) }
  })

  test('pago no se puede reversar por falta de pago', async () => {
    try {
      const res = await reversePayment('cha_aRbp1W3Bt9XkFyEAsmUR4067', token)
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
      const res = await getPayment(token, { id: 'cha_aRbp1W3Bt9XkFyEAsmUR4067' })
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
      const res = await getPayment(token, { id: 'cha_XAxITohqD4AQITLMx4X7049E' })
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.NOT_FOUND)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('Obtener varios pagos', async () => {
    try {
      const res = await getPayment(token)
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
      const res = await getSettings(token)
      expect(res.success).toBe(true)
      expect(res.status).toBe(200)
      expect(typeof res.data === 'object').toBe(true)
    } catch (e) { errorConnection(e) }
  })
})
