
import { request } from 'https'
import PagoMediosErrorEc from './pagomedios-ec-error'

const ENDPOINT = 'api.abitmedia.cloud'
const tokenDev = '6tyisfsa3abtoqtkfenmz7c0-fphjgt1k5mepyiyzixecti-u69wlup2emsi4scakgowl'

/**
 * Campos especificados en:
 * * El `documentType` determina el tipo de documento:
 *    '04': RUC
 *    '05': Cédula de identidad
 *    '06': Pasaporte
 *    '08': Identificación del exterior
 * El `amount` debera ser la suma de `amountWithTax` + `amountWithoutTax` + `tax`
 * `amountWithTax` debera ser el subtotal sin IVA
 * `amountWithoutTax` debera ser la sumatoria de productos que no tengan IVA
 * `tax` debera ser el IVA (12%)
*/
export interface Data {
  integration: boolean
  companyType: 'Individual' | 'Company'
  document: string
  documentType: '04' | '05' | '06' | '08'
  fullName: string
  address: string
  mobile: string
  email: string
  description: string
  amount: number
  amountWithTax: number
  amountWithoutTax: number
  tax: number
  notifyUrl?: string
  generateInvoice?: 0 | 1
  customValue?: string
  settings?: string[]
}

/**
 * Campos necesarios para la petición, son las `opcions` que solicita
 * la libreria nativa de nodejs `https`.
 * Para esto será necesario enviar parametros como:
 * @param path Continuación del `ENDPOINT` principal declarada
 * @param body El cuerpo de la petición. (No obligatorio)
 * @param token El Access-Token de usuario para autentificación, para hacer 
 * pruebas, no es necesari enviar este item, pues toma del token de pruebas
 * @param method Método de la petición (post, get)
 * @param query Parametros de la petición. (No obligatorio)
*/
export interface OptionsRequest {
  body?: any
  path: string
  token?: string
  method: 'GET' | 'POST'
  query?: { [key: string]: string }
}

export interface ResponseEc {
  success: boolean
  status: number
  message?: string
  data?: any
}

function formatBody(data: Data): Record<string, any> {
  return {
    integration: data.integration || true,
    third: {
      document: data.document,
      document_type: data.documentType,
      name: data.fullName,
      email: data.email,
      phones: data.mobile,
      address: data.address,
      type: data.companyType,
    },
    generate_invoice: data.generateInvoice || 0,
    description: data.description,
    amount: data.amount,
    amount_with_tax: data.amountWithTax,
    amount_without_tax: data.amountWithoutTax,
    tax_value: data.tax,
    settings: data.settings || [],
    notify_url: data.notifyUrl || null,
    custom_value: data.customValue || null,
  }
}

/**
 * Instancia de petición genérica con `https`, con el fin de usarla para todo
 * tipo de petición `application/json`.
*/
async function instanceAxios (args: OptionsRequest): Promise<ResponseEc> {
  const body = args.body ? JSON.stringify(args.body as any) : undefined
  const options = {
    host: ENDPOINT,
    path: args.path,
    method: args.method,
    headers: {
      Authorization: `Bearer ${args.token ? args.token : tokenDev}`,
      'Content-Length': body ? body.length : 0,
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  }
  if (args.query) {
    options.path += `?${new URLSearchParams(args.query).toString()}`
  }
  return new Promise((resolve, reject) => {
    const req = request(options, function (res) {
      res.setEncoding('utf8')
      let responseBody = ''
      res.on('data', (value) => { responseBody += value })
      res.on('end', () => {
        try {
          const responseJson: ResponseEc = JSON.parse(responseBody)
          if (responseJson.status === 401 && responseJson.success === false) {
            throw new PagoMediosErrorEc(
              responseJson.message || 'Error en petición de instancia lib-pagomedios-ec',
              PagoMediosErrorEc.TYPE_TOKEN,
            )
          }
          resolve(responseJson)
        } catch (err) {
          throw new PagoMediosErrorEc(
            'Es posible que el path ingresado no sea incorrecto',
            PagoMediosErrorEc.PATH_INCORRECT,
          )
        }
      })
    })
    req.on('error', (err) => {
      reject(new PagoMediosErrorEc(
        `Error desconocido ${err.message}`,
        PagoMediosErrorEc.TYPE_CONNECTION,
      ))
    })
    if (body) { req.write(body) }
    req.end()
  })
}

/*
 * Sera necesario enviar datos correctos y calculos precisos, caso contrario
 * no se ejecutara con normalidad la petición y saltará un error.
*/
export default async function (data: Data, token?: string) {
  const res = await instanceAxios({
    body: formatBody(data),
    token,
    method: 'POST',
    path: '/pagomedios/v2/payment-requests',
  })
  console.log(res)
  if (res.success === false && res.status >= 400) {
    let codeErr
    switch (res.status) {
      case 401:
        codeErr = PagoMediosErrorEc.TYPE_TOKEN
        break
      case 404:
        codeErr = PagoMediosErrorEc.NOT_FOUND
        break
      default:
        codeErr = PagoMediosErrorEc.TYPE_BODY
    }
    throw new PagoMediosErrorEc(
      res.data
        ? JSON.stringify(res.data)
        : 'Error en la creación de solicitud de pago.',
      codeErr,
    )
  }
  return res
}

/**
 * Obtiene el estado de la transacción
 * @param id TokenID de la transacción que es devuelta en la petición `defaul`
 * @param token Access-Token suministrado por PagomediosEc para validar
 * la autentificación del usuario
*/
// export async function getStatusLinkPayment (id: string, token?: string) {
//   const res = await instanceAxios({
//     token,
//     method: 'GET',
//     query: { token: id },
//     path: '/api/payments/status-transaction',
//   })
//   if (res.code === 0 && res.status === 404) {
//     throw new PagoMediosErrorEc(res.message, PagoMediosErrorEc.ID_REQUEST)
//   }
//   return res
// }

/**
 * Reversa el pago realizado con el `token` del pago asigando
 * @param id TokenID de la transacción que fue pagada
*/
// export async function reversePayment (id: string, token?: string) {
//   const res = await instanceAxios({
//     token,
//     method: 'GET',
//     query: { token: id },
//     path: '/api/payments/reverse',
//   })
//   if (res.code === 0 && res.status === 404) {
//     throw new PagoMediosErrorEc(res.message, PagoMediosErrorEc.ID_REQUEST)
//   }
//   return res
// }

/**
 * Busca uno o varios solicitudes de pago, en este metodo se puede filtrar
 * por la query.
 */

/**
 * Obtiene las configuración de la empresa en pagomedios, principalmente la
 * información de configuraciones de tarjetas y sus plazos configurados
 */