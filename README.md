# pagomedios-ec

Es una libreria para facilitar la integración con 
[Pago Medios Ecuadorc](https://abitmedia.cloud/api-reference/index.php), la 
cual permitira un ágil cobro por medio de pagos electrónicos, como tarjetas 
de crédito.

## Funciones

Estas son las funciones que se encuentran integradas en la actual versión.
  - Creación de link de pago.
  - Comprobación del estado de pago
  - Reversar un pago

## Entornos integrados

  - **Prueba:** En este caso, no sera necesario enviar en cada método a llamar el token proporcionado por PagoMediosEc.
  - **Producción:** Será necesario enviar como parámetro el token proporcionado por PagoMediosEc.

## Instalación

```sh
$ npm install pagomedios-ec
```

## License

MIT

## Ejemplos de integración

Este es un ejemplo simple para la creación de un link de pago, para esto será 
necesario construir el 
[Body](https://abitmedia.cloud/api-reference/index.php?path=/payments/create-payment-request&action=POST) 
a enviar con formato `JSON` (Parámetros POST).

**Prueba**

```js
import generetePayment from 'pagomedios-ec'

const body = { 
  companyType: 'Persona Natural',
  document: '1758698558',
  ...,
  ...,
}
const data = await generetePayment(body)
```

**Producción**

```js
import generetePayment from 'pagomedios-ec'

const access-token = '${TuTokenAccess-Proporcionado-por-PagoMediosEc}'
const body = { 
  companyType: 'Persona Natural',
  document: '1758698558',
  ...,
  ...,
}
const data = await generetePayment(body, access-token)
```

***Ejemplo de respuesta***
```json
{
  "message": "Solicitud generada exitosamente",
  "code": 1,
  "status": 200,
  "data": {
    "url": "https://cloud.abitmedia.com/pagos/solicitudes/?t=2y-13-o8d1lt3uafoxut-v3r9rb-mng-jv-khfjpkx4tfdpjpjcks8twbvg",
    "token": "2y-13-o8d1lt3uafoxut-v3r9rb-mng-jv-khfjpkx4tfdpjpjcks8twbvg"
  }
}
```
