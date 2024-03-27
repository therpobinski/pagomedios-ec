# pagomedios-ec

[![npm version](https://badge.fury.io/js/pagomedios-ec.svg)](https://badge.fury.io/js/pagomedios-ec)
<!-- ![Testing](https://github.com/therpobinski/pagomedios-ec/workflows/Testing/badge.svg) -->

Es una libreria para facilitar la integración con 
[Pago Medios Ecuador](https://services.abitmedia.cloud/pagomedios-v2), la 
cual permitira un ágil cobro por medio de pagos electrónicos, como tarjetas 
de crédito.

## Funciones

Estas son las funciones que se encuentran integradas en la actual versión.
  - Creación de solicitud de pago.
  - Comprobación del estado de pago
  - Reversar un pago
  - Obtener pagos (uno o varios)
  - Obtener las configuraciones de la empresa

## Entornos integrados
  Es necesario solicitar el `token` tanto de pruebas como de `producción` para cada comercio que necesite integrarse.
  - **Producción y Pruebas:** Será necesario enviar el parámetro `access-token` proporcionado por PagoMediosEc.

## Instalación

```sh
$ npm install pagomedios-ec
```

## License

MIT

## Crear solicitud de pago
Este es un ejemplo simple para la creación de una solicitud de pago, para esto será necesario construir el `BODY` detallado a continuación en formato `JSON` (Parámetros POST).
El segundo parámetro es el `access-token`, el cual se envia en caso de querer hacerlo en producción o pruebas.
* El `amount` que se enviaba en versiones anteriores, ahora se calculará de manera automática, este se calcula de la siguiente manera:
`amount = amountWithoutTax + ((amountWithTax * tax) + amountWithTax)` y con 2 decimales que son solicitados por el SRI.

```js
import generetePayment from 'pagomedios-ec'

const access-token = '${TuTokenAccess-Proporcionado-por-PagoMediosEc}'
type body = { 
  integration: boolean
  companyType: 'Persona Natural' | 'Empresa'
  document: string
  documentType: '01' | '02' | '03' | '06'
  fullName: string
  address: string
  mobile: string
  email: string
  description: string
  amountWithTax: number
  amountWithoutTax: number
  tax: 0.05 | 0.08 | 0.13 | 0.15
  notifyUrl?: string
  generateInvoice?: 0 | 1
  customValue?: string
  settings?: string[]
}

Donde:
`companyType`:
  * 'Persona Natural': Persona natural
  * 'Empresa': Empresa
`documentType`:
  * '01': Cédula ecuatoriana
  * '02': RUC
  * '03': Identificación del exterior
  * '06': Pasaporte
`generateInvoice`:
  * 0: No generar factura electrónica
  * 1: Generar factura electrónica (Debe tener configurado su cuenta en FacturaSoft)
`settings`: Solo acepta un array de `string` los cuales son los IDs de las tarjetas configuradas en tu cuenta de Pago Medios.

const data = await generetePayment(body, access-token)
```

***Ejemplo de respuesta***
```json
{
  "success": true,
  "status": 201,
  "data": {
    "token": "cha_XAxITohqD4AQITLMx4X70492",
    "url": "https://payurl.link/9KG0492000"
  }
}
```

 ## Obtener el estado actual de la soliciud de pago
 
 Se envia como parámetros:
  * `id`: Es el `tokenID` que se obtiene en la `generatePayment`
  * `access-token`: En caso de ser en producción se envia el `token` proporcionado por pago medios.

```js
import { getStatusLinkPayment } from 'pagomedios-ec'
const access-token = '${TuTokenAccess-Proporcionado-por-PagoMediosEc}'
const data = await getStatusLinkPayment(id, access-token)
```

***Ejemplo de respuesta***
```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": "cha_XAxITohqD4AQITLMx4X70492",
    "status": "Autorizada",
    "authorizationCode": "478206",
    "cardNumber": "655732******1213",
    "cardHolder": "TOC SYSTEMS"
  }
}
```

## Obtener una o varias solicitudes de pagos
Se envia como parámetros:
  * `access-token`: En caso de ser en producción se envia el `token` proporcionado por pago medios.
  * `query`: Es un objeto, el cual será el filtro para obtener los pago que se necesiten. Este puede enviar un `id` con el `tokenID` del pago. No es obligación enviar este parámetro. Puede ser `undefined`

```js
import { getPayment } from 'pagomedios-ec'
const access-token = '${TuTokenAccess-Proporcionado-por-PagoMediosEc}'
const query = { id: 'cha_XAxITohqD4AQITLMx4X70492' }
const data = await getPayment(access-token, query)
```

***Ejemplo de respuesta***
### Obtener uno.
En caso de obtener uno solo, se envia en la `query` el `id` y se obtendrá un solo pago:

```json
{
  "success": true,
  "status": 200,
  "statusSchema": [
    { "id": 0, "description": "Pendiente de pago" },
    { "id": 1, "description": "Autorizada" },
    { "id": 2, "description": "Rechazada" },
    { "id": 3, "description": "Reversada" },
  ],
  "data": {
    "id": "cha_LfVziR4YH4AuK0IV3To41753",
    "status": 1,
    "reference": "PM-ryni1674061753",
    "description": "Pago de prueba TOC",
    ....
  }
}
```

### Obtener varios
En caso de obtener vario, no es necesario enviar la `query.id`, puede enviar otro parámetro dentro de la `query`: `{ status: 2 }` o simplemente no enviar la `query`.

```json
{
  "success": true,
  "status": 200,
  "statusSchema": [
    { "id": 0, "description": "Pendiente de pago" },
    { "id": 1, "description": "Autorizada" },
    { "id": 2, "description": "Rechazada" },
    { "id": 3, "description": "Reversada" },
  ],
  "data": [
    {
      "id": "cha_LfVziR4YH4AuK0IV3To125485",
      "status": 0,
      "reference": "PM-ryni1674061753",
      "description": "Pago de prueba TOC",
      ....
    },
    {
      "id": "cha_LfVziR4YH4AuK0IV3Tq12354",
      "status": 1,
      "reference": "PM-ryni1674014587",
      "description": "Pago de prueba TOC",
      ....
    }, ....
  ]
}
```

## Reversar un pago

Se envia como parámetro:
  * `id`: Es el `TokenID` que se generá en la creación de la solicitud de pago.
  * `access-token`: En caso de ser en producción se envia el `token` proporcionado por pago medios.

```js
import { reversePayment } from 'pagomedios-ec'
const access-token = '${TuTokenAccess-Proporcionado-por-PagoMediosEc}'
const data = await reversePayment(id, access-token)
```

***Ejemplo de respuesta***
```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": "cha_XAxITohqD4AQITLMx4X70492",
    "msg": "Reverso realizado"
  }
}
```

## Obtener configuraciones
Esta petición permite obtener las configuraciones realizadas en nuestra cuenta de pago medios.

```js
import { getSettings } from 'pagomedios-ec'
const access-token = '${TuTokenAccess-Proporcionado-por-PagoMediosEc}'
const data = await getSettings(access-token)
```

***Ejemplo de respuesta***
```json
{
  "success": true,
  "status": 200,
  "data": [
    {
      "id": "car_Wr179mz4TWGMCVFZhl325610",
      "name": "American Express",
      "type": "Diferido con intereses",
      "terms": [
      	3,
      	6,
      	9,
      	12
      ]
    },
    {
      "id": "car_dCeedN85lKRNsnPHQmsi9762",
      "name": "American Express",
      "type": "Corriente",
      "terms": []
    },
    ....
  ]
}
```

**Crear pago**

- `generetePayment(tokenPayment, accessToken)`

**Consultar estado**

- `getStatusLinkPayment(tokenPayment, accessToken)`

**Obtener estado**

- `getPayment(accessToken, query)`

**Revertir pago**

- `reversePayment(tokenPayment, accessToken)`

**Obtener configuraciones**

- `getSettings(accessToken)`
