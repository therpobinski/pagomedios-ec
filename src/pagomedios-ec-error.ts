
class PagoMediosErrorEc extends Error {
  static TYPE_UNKNOWN = 1
  static TYPE_TOKEN = 2
  static TYPE_CONNECTION = 3
  static TYPE_STATUS = 4
  static TYPE_BODY = 5
  static ID_REQUEST = 5
  static TAX_INCORRECT = 6
  static PATH_INCORRECT = 7
  static NOT_FOUND = 404
  private type: number
  constructor(msg: string, type: number) {
    super(msg)
    this.type = type
  }
}

export default PagoMediosErrorEc
