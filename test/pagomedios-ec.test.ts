
import generetePayment, {
  getStatusLinkPayment,
  reversePayment,
  Data,
} from '../src/pagomedios-ec'
import PagoMediosErrorEc from '../src/pagomedios-ec-error'

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
      expect(typeof res.message).toEqual('string')
      expect(res.status).toBe(200)
      expect(res.code).toBe(1)
    } catch (e) { errorConnection(e) }
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

describe('obtener el estado de una transacción', () => {
  test('token existente y pago correcto', async () => {
    try {
      const tokenId = '2y-13-wszng9xc0u1-swkvxexnaesxbcqin1mvjr55ye2seepjmpbuxmwge'
      const res = await getStatusLinkPayment(tokenId)
      expect(typeof res.message).toEqual('string')
      expect(res.status).toBe(200)
      expect(res.code).toBe(1)
    } catch (e) { errorConnection(e) }
  })

  test('token-id no existe', async () => {
    try {
      const res = await getStatusLinkPayment('2y-13-sdfhsbdfkjd-sdfbd')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.ID_REQUEST)
      expect(typeof e.message).toEqual('string')
    }
  })

  test('estado sin pago', async () => {
    try {
      const tokenId = '2y-13--z-jqowebjbq7wj2fvklpufzvpe2nixw1sb28fsqdgt-xr1zeql7u'
      const res = await getStatusLinkPayment(tokenId)
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect(e.type).toBe(PagoMediosErrorEc.ID_REQUEST)
      expect(typeof e.message).toEqual('string')
    }
  })
})

// describe('reversar un token pagado', () => {
//   test('token existente y correcto reverso', async () => {
    
//   })

//   test('token no existe', async () => {
    
//   })
// })
