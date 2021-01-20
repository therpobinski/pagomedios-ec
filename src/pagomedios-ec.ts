
import axios from 'axios'
import FormData from 'form-data'
import { ConflictError } from 'restify-errors'

const ENDPOINT = 'https://cloud.abitmedia.com/api'
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
 * Instancia de petición genérica con axios, con el fin de usarla para todo
 * tipo de petición. Para esto será necesario enviar parametros como:
 * @param kid Continuación del `ENDPOINT` principal declarada
 * @param body El cuerpo de la petición. (No obligatorio)
 * @param token El Access-Token de usuario para autentificación
 * @param method Método de la petición (post, get)
 * @param query Parametros de la petición. (No obligatorio)
 */
async function instanceAxios (args: {
  kid: string,
  body?: Data,
  token?: string,
  method: 'get' | 'post',
  query?: { [key: string]: string },
}) {
  let headersValues = { Authorization: `Bearer ${args.token | tokenDev}` }
  let form = undefined
  if (args.body) {
    form = new FormData()
    Object.keys(args.body).forEach((key) => {
      form.append(key, args.body[key])
    })
    headersValues = { ...headersValues, ...form.getHeaders() }
  }
  return axios({
    url: args.kid,
    baseURL: ENDPOINT,
    data: form,
    method: args.method,
    headers: headersValues,
    params: args.query,
    paramsSerializer: params => {
      return qs.stringify(params)
    },
  }).then(function (res) {
    return res.data
  })
}

/**
 * Obtiene el estado de la transacción
 * @param id TokenID de la transacción que es devuelta en la petición `defaul`
 * @throws {ConflictError} No se pudo consultar el estado de la transacción
*/
export async function getStatusLinkPayment (id: string) {
  try {
    const status = await instanceAxios({
      method: 'get', kid: '/payments/status-transaction',
      query: { token: id },
    })
    return status
  } catch (err) {
    throw new ConflictError({
      info: { typeCode: 'PagoMediosCreateLink' }
    }, `Error inesperado al consultar estado el link de pago, \
intentelo nuevamente, error: ${e.message}`)
  }
}

/*
 * Sera necesario enviar datos correctos y calculos precisos, caso contrario
 * no se ejecutara con normalidad la petición y saltará un error.
*/
export default async function (body: Data) {
  try {
    const link = await instanceAxios({
      method: 'post', kid: '/payments/create-payment-request', body,
    })
    if (link.code === 0 && link.status !== 200) {
      throw new ConflictError({
        info: { typeCode: link.code }
      }, `Se recomienda revisar que sus datos personales estén correctos.
Estado: ${link.status}, Código: ${link.code}`)
    }
    return link.data
  } catch (err) {
    throw new ConflictError({
      info: { typeCode: 'PagoMediosCreateLink' }
    }, `Error al crear el link de pago: ${e.message}`)
  }
}
