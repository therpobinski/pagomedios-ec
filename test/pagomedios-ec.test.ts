
import generetePayment, {
  getStatusLinkPayment,
  reversePayment,
  Data,
} from '../src/pagomedios-ec'

function makeBody ({ CIInc = false, bodyInc = false, taxInc = false }) {
  return {
    companyType: 'Persona Natural',
    document: !CIInc ? '1726834771' : '15856985',
    documentType: '01',
    fullName: 'Nombre Prueba Ecuadoriano',
    address: 'Quito - Ecuador',
    mobile: '+59399999999',
    email: !bodyInc ? 'ejemplo@ejm.com' : 'ejemplo  ',
    reference: new Date().toString(),
    description: 'Solicitud de prueba unitaria',
    amount: 1.12,
    amountWithTax: 1,
    amountWithoutTax: 0,
    tax: !taxInc ? 0.12 : 0.5,
    gateway: 3,
  }
}

describe('obtener token de pago', () => {
  test('solicitud correcta con datos validados', async () => {
    try {
      const data: Data = makeBody({})
      const res = await generetePayment(data)
      expect(typeof res.message).toEqual('string')
      expect(res.status).toBe(200)
      expect(res.code).toBe(1)
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.TYPE_CONNECTION)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('solicitud erronea, con calculos erroneos', async () => {
    try {
      const data: Data = makeBody({ taxInc: true })
      const res = await generetePayment(data)
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.TYPE_BODY)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('solicitud erronea con cédula incorrecta', async () => {
    try {
      const data: Data = makeBody({ CIInc: true })
      const res = await generetePayment(data)
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.TYPE_BODY)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('solicitud erronea, Data incorrecta', async () => {
    try {
      const data: Data = makeBody({ bodyInc: true })
      const res = await generetePayment(data)
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.TYPE_BODY)
      expect(typeof e.message).toEqual('string')
    }
  })
})

// describe('obtener el estado de una transacción', () => {
//   test('token existente y correcta petición', async () => {
    
//   })

//   test('token no existe', async () => {
    
//   })

//   test('estado sin pago', async () => {
    
//   })

//   test('estado pagado', async () => {
    
//   })
// })
