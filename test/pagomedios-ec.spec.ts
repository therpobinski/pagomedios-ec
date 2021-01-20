import { info } from 'restify-errors'
import generetePayment, {
  getStatusLinkPayment,
  Data,
} from '@/src/pagomedios-ec.ts'

function makeCI (length: number) {
  let result = ''
  const characters = '0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

describe('obtener token de pago', () => {
  test('solicitud correcta con datos validados', async () => {
    
  })

  test('solicitud erronea, con calculos erroneos', async () => {
    
  })

  test('solicitud erronea con cédula incorrecta', async () => {
    
  })

  test('solicitud erronea, Data incorrecta', async () => {
    
  })
})

describe('obtener el estado de una transacción', () => {
  test('token existente y correcta petición', async () => {
    
  })

  test('token no existe', async () => {
    
  })

  test('estado sin pago', async () => {
    
  })

  test('estado pagado', async () => {
    
  })
})
