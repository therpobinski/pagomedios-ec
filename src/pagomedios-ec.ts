
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
  integration?: boolean
  companyType: 'Persona Natural' | 'Empresa'
  document: string
  documentType: '01' | '02' | '03' | '06'
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
  query?: { [key: string]: any }
}

export interface ResponseEc {
  success: boolean
  status: number
  message?: string
  data?: Record<string, any> | Record<string, any>[]
}

function getDocumentType (code: string): string {
  switch (code) {
    case '01':
      return '05'
    case '02':
      return '04'
    case '03':
      return '08'
    default:
      return '06'
  }
}

function formatBody (data: Data): Record<string, any> {
  return {
    integration: data.integration || true,
    third: {
      document: data.document,
      document_type: getDocumentType(data.documentType),
      name: data.fullName,
      email: data.email,
      phones: data.mobile,
      address: data.address,
      type: data.companyType === 'Empresa' ? 'Company' : 'Individual',
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

function getCodeError (code: number) {
  switch (code) {
    case 401:
      return PagoMediosErrorEc.TYPE_TOKEN
    case 404:
      return PagoMediosErrorEc.NOT_FOUND
    default:
      return PagoMediosErrorEc.TYPE_BODY
  }
}

type StatusPayment = 0 | 1 | 2 | 3
const StatusPayment = [
  { id: 0, description: 'Pendiente de pago' },
  { id: 1, description: 'Autorizada' },
  { id: 2, description: 'Rechazada' },
  { id: 3, description: 'Reversada' },
]

/**
 * Instancia de petición genérica con `https`, con el fin de usarla para todo
 * tipo de petición `application/json`.
*/
async function instanceAxios (args: OptionsRequest): Promise<ResponseEc> {
  const options = {
    host: ENDPOINT,
    path: args.path,
    method: args.method,
    encoding: 'utf-8',
    headers: {
      Authorization: `Bearer ${args.token ? args.token : tokenDev}`,
      "Content-Type": "text/html; charset=utf-8"
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
        } catch (err: any) {
          reject(new PagoMediosErrorEc(
            err.message || 'Es posible que el path ingresado no sea incorrecto',
            PagoMediosErrorEc.PATH_INCORRECT,
          ))
        }
      })
    })
    req.on('error', (err) => {
      reject(new PagoMediosErrorEc(
        `Error desconocido ${err.message}`,
        PagoMediosErrorEc.TYPE_CONNECTION,
      ))
    })
    if (args.body) {
      req.write(JSON.stringify(args.body as any))
    }
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
  }) as ResponseEc
  if (res.success === false && res.status >= 400) {
    throw new PagoMediosErrorEc(
      res.data
        ? JSON.stringify(res.data)
        : 'Error en la creación de solicitud de pago.',
      getCodeError(res.status),
    )
  }
  return res
}

/**
 * Obtiene el estado de la transacción
 * @param id TokenID de la transacción que es devuelta en la petición `defauld`
 * @param token Access-Token suministrado por PagomediosEc para validar
 * la autentificación del usuario
*/
export async function getStatusLinkPayment (id: string, token?: string) {
  const res = await instanceAxios({
    token,
    method: 'GET',
    query: { id },
    path: '/pagomedios/v2/payment-requests',
  }) as ResponseEc
  if (res.success === false && res.status >= 400) {
    throw new PagoMediosErrorEc(
      res.message || 'Error en obtención de estado de pago.',
      getCodeError(res.status),
    )
  } else if (res.data?.length === 0) {
    throw new PagoMediosErrorEc(
      'El ID enviado no existe',
      PagoMediosErrorEc.ID_REQUEST,
    )
  }
  return {
    success: res.success,
    status: res.status,
    data: {
      id: (res.data as Record<string, any>[])[0].id,
      status: StatusPayment.find(st =>
          st.id === (res.data as Record<string, any>[])[0].status,
        )?.description,
      authorizationCode: (res.data as Record<string, any>[])[0].auth_code,
      cardNumber: (res.data as Record<string, any>[])[0].display_number,
      cardHolder: (res.data as Record<string, any>[])[0].cardholder,
      transactionDate: (res.data as Record<string, any>[])[0].payment_date,
    }
  }
}

/**
 * Reversa el pago realizado con el `token` del pago asigando
 * @param id `TokenID` de la transacción que fue pagada
 * @param token Access-Token suministrado por PagomediosEc para validar
 * la autentificación del usuario
*/
export async function reversePayment (id: string, token?: string) {
  const { data } = await getPayment({ id }, token)
  const reference = (data as Record<string, any>)?.reference
  const res = await instanceAxios({
    token,
    method: 'POST',
    body: { reference },
    path: '/pagomedios/v2/cards/reverse',
  }) as ResponseEc
  if (res.success === false && res.status >= 400) {
    throw new PagoMediosErrorEc(
      res.message || 'Error en revisión de un pago revertido',
      getCodeError(res.status),
    )
  }
  return res
}

/**
 * Busca uno o varios solicitudes de pago, en este metodo se puede filtrar
 * por la query.
 * @param query Es un objeto el cual se envia un filtro, en caso de enviar el
 * `id` en la query, se devolvera un solo registro como objeto, caso contrario
 * se enviará un array de objetos.
 * * @param token Access-Token suministrado por PagomediosEc para validar
 * la autentificación del usuario
 */
export async function getPayment (query?: Record<string, any>, token?: string) {
  const res = await instanceAxios({
    token,
    method: 'GET',
    query,
    path: '/pagomedios/v2/payment-requests',
  }) as ResponseEc
  if (res.success === false && res.status >= 400) {
    throw new PagoMediosErrorEc(
      res.message || 'Error en obtención del pago',
      getCodeError(res.status),
    )
  } else if (res.data?.length === 0 && query?.id) {
    throw new PagoMediosErrorEc(
      'El ID enviado no existe',
      PagoMediosErrorEc.NOT_FOUND,
    )
  } else if (res.data?.length === 1 && query?.id) {
    return {
      success: res.success,
      status: res.status,
      statusSchema: StatusPayment,
      data: (res.data as Record<string, any>[])[0],
    }
  }
  return { statusSchema: StatusPayment, ...res }
}

/**
 * Obtiene las configuración de la empresa en pagomedios, principalmente la
 * información de configuraciones de tarjetas y sus plazos configurados.
 * * @param token Access-Token suministrado por PagomediosEc para validar
 * la autentificación del usuario
 */
export async function getSettings (token?: string) {
  const res = await instanceAxios({
    token,
    method: 'GET',
    path: '/pagomedios/v2/settings',
  }) as ResponseEc
  if (res.success === false && res.status >= 400) {
    throw new PagoMediosErrorEc(
      res.message || 'Error en obtención de las configuraciones',
      getCodeError(res.status),
    )
  }
  return res
}
