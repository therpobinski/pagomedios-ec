
import axios from 'axios'
import FormData from 'form-data'
import errs from 'restify-errors'

const ENDPOINT = 'https://cloud.abitmedia.com/api'
const tokenDev = '2y-13-tx-zsjtggeehkmygjbtsf-51z5-armmnw-ihbuspjufwubv4vxok6ery7wozao3wmggnxjgyg'

/**
 * Campos especificados en:
 * https://abitmedia.cloud/api-reference/index.php?path=/payments/create-payment-request&action=POST
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
 * @param token El token de usuario que proporciona PagoMedios
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

export async function getStatusLinkPayment (id: string) {
  try {
    
  } catch (err) {
    
  }
}

export default async function (data: Data) {
  try {
    
  } catch (err) {
    
  }
}
