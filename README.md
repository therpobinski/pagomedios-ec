# pagomedios-ec

[![npm version](https://badge.fury.io/js/pagomedios-ec.svg)](https://badge.fury.io/js/pagomedios-ec)
![Testing](https://github.com/therpobinski/pagomedios-ec/workflows/Testing/badge.svg)

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

  - **Prueba:** En este caso, no sera necesario enviar en cada método a llamar el token proporcionado por PagoMediosEc.
  - **Producción:** Será necesario enviar como segundo parámetro el token proporcionado por PagoMediosEc.

## Instalación

```sh
$ npm install pagomedios-ec
```

## License

MIT

## Crear solicitud de pago
Este es un ejemplo simple para la creación de una solicitud de pago, para esto será necesario construir el `BODY` detallado a continuación en formato `JSON` (Parámetros POST).
El segundo parámetro es el `token`, el cual se envia en caso de querer hacerlo en producción, y si no se envia se tomará el `token` de pruebas.

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
  amount: number
  amountWithTax: number
  amountWithoutTax: number
  tax: number
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
  * `token`: En caso de ser en producción se envia el `token` proporcionado por pago medios, caso contrario no se envia nada; por defecto toma el `token` de pruebas.

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
    "status": "AUTORIZADA",
    "authorizationCode": "478206",
    "cardNumber": "655732******1213",
    "cardHolder": "TOC SYSTEMS"
  }
}
```

## Obtener una o varias solicitudes de pagos
Se envia como parámetros:
  * `query`: Es un objeto, el cual será el filtro para obtener los pago que se necesiten. Este puede enviar un `id` con el `tokenID` del pago. NO es obligación enviar este parámetro. Puede ser `undefined`
  * `token`: En caso de ser en producción se envia el `token` proporcionado por pago medios, caso contrario no se envia nada; por defecto toma el `token` de pruebas.

```js
import { getPayment } from 'pagomedios-ec'
const access-token = '${TuTokenAccess-Proporcionado-por-PagoMediosEc}'
const query = { id: 'cha_XAxITohqD4AQITLMx4X70492' }
const data = await getPayment(query, access-token)
```

***Ejemplo de respuesta***
### Obtener uno.
En caso de obtener uno solo, se envia en la `query` el `id` y se obtendrá un solo pago:

```json
{
  "success": true,
  "status": 200,
  "statusSchema": [
    { "id": 0, "description": "PENDIENTE DE PAGO" },
    { "id": 1, "description": "AUTORIZADA" },
    { "id": 2, "description": "RECHAZADA" },
    { "id": 3, "description": "REVERSADA" },
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
    { "id": 0, "description": "PENDIENTE DE PAGO" },
    { "id": 1, "description": "AUTORIZADA" },
    { "id": 2, "description": "RECHAZADA" },
    { "id": 3, "description": "REVERSADA" },
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
  * `token`: En caso de ser en producción se envia el `token` proporcionado por pago medios, caso contrario no se envia nada; por defecto toma el `token` de pruebas.

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
    ...
  ]
}
```

**Crear pago**

- Pruebas: `generetePayment(tokenPayment)`
- Producción: `generetePayment(tokenPayment, accessToken)`

**Consultar estado**

- Pruebas: `getStatusLinkPayment(tokenPayment)`
- Producción: `getStatusLinkPayment(tokenPayment, accessToken)`

**Obtener estado**

- Pruebas: `getPayment(query)`
- Producción: `getPayment(query, accessToken)`

**Revertir pago**

- Pruebas: `reversePayment(tokenPayment)`
- Producción: `reversePayment(tokenPayment, accessToken)`

**Obtener configuraciones**

- Pruebas: `getSettings()`
- Producción: `getSettings(accessToken)`
