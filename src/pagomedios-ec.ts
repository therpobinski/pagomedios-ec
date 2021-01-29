
import { request } from 'https'
import { stringify } from 'querystring'
import PagoMediosErrorEc from './pagomedios-ec-error'

const ENDPOINT = 'cloud.abitmedia.com'
const tokenDev = '2y-13-tx-zsjtggeehkmygjbtsf-51z5-armmnw-ihbuspjufwubv4vxok6ery7wozao3wmggnxjgyg'

/**
 * Campos especificados en:
 * https://abitmedia.cloud/api-reference/index.php?path=/payments/create-payment-request&action=POST
 * El `amount` debera ser la suma de `amountWithTax` + `amountWithoutTax` + `tax`
 * `amountWithTax` debera ser el subtotal sin IVA
 * `amountWithoutTax` debera ser la sumatoria de productos que no tengan IVA
 * `tax` debera ser el IVA (12%)
*/
export interface Data {
  companyType: string,
  document: string,
  documentType: string,
  fullName: string,
  address: string,
  mobile: string,
  email: string,
  reference: string,
  description: string,
  amount: number,
  amountWithTax: number,
  amountWithoutTax: number,
  tax: number,
  notifyUrl?: string,
  gateway: number,
  generateInvoice?: number,
  customValue?: string,
  installmentsWithInterest?: string,
  installmentsWithoutInterest?: string,
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
  body?: Data,
  path: string,
  token?: string,
  method: 'GET' | 'POST',
  query?: { [key: string]: string },
}

export interface ResponseEc {
  code: number,
  status: number,
  message: string,
  [key: string]: any,
}

/**
 * Instancia de petición genérica con `https`, con el fin de usarla para todo
 * tipo de petición.
*/
async function instanceAxios (args: OptionsRequest): Promise<ResponseEc> {
  const body = args.body ? stringify(args.body as any) : undefined
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
  if (args.query) { options.path += `?${stringify(args.query)}` }
  return new Promise((resolve, reject) => {
    const req = request(options, function (res) {
      res.setEncoding('utf8')
      let responseBody = ''
      res.on('data', (value) => { responseBody += value })
      res.on('end', () => {
        try {
          const responseJson: ResponseEc = JSON.parse(responseBody)
          if (responseJson.status === 401 && responseJson.code === 0) {
            throw new PagoMediosErrorEc(
              responseJson.message,
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
export default async function (body: Data, token?: string) {
  const res = await instanceAxios({
    body,
    token,
    method: 'POST',
    path: '/api/payments/create-payment-request',
  })
  if (res.code === 0 && res.status === 422) {
    throw new PagoMediosErrorEc(
      `${res.message} - ${JSON.stringify(res.errors)}`,
      PagoMediosErrorEc.TYPE_BODY,
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
export async function getStatusLinkPayment (id: string, token?: string) {
  const res = await instanceAxios({
    token,
    method: 'GET',
    query: { token: id },
    path: '/api/payments/status-transaction',
  })
  if (res.code === 0 && res.status === 404) {
    throw new PagoMediosErrorEc(res.message, PagoMediosErrorEc.ID_REQUEST)
  }
  return res
}

/**
 * Reversa el pago realizado con el `token` del pago asigando
 * @param id TokenID de la transacción que fue pagada
*/
export async function reversePayment (id: string, token?: string) {
  const res = await instanceAxios({
    token,
    method: 'GET',
    query: { token: id },
    path: '/api/payments/reverse',
  })
  if (res.code === 0 && res.status === 404) {
    throw new PagoMediosErrorEc(res.message, PagoMediosErrorEc.ID_REQUEST)
  }
  return res
}
