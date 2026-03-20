import crypto from 'crypto'

export interface QRPayload {
  merchant_id: string
  timestamp: number
  signature: string
}

export function generateQRData(merchantId: string, secretKey: string): string {
  const timestamp = Math.floor(Date.now() / 60000) * 60000 // rounded to minute
  const dataToSign = `${merchantId}:${timestamp}`
  const signature = crypto.createHmac('sha256', secretKey).update(dataToSign).digest('hex')

  const payload: QRPayload = {
    merchant_id: merchantId,
    timestamp,
    signature,
  }

  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

export function validateQRData(base64Data: string, secretKey: string): { valid: boolean; merchantId?: string; error?: string } {
  try {
    const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8')
    const payload: QRPayload = JSON.parse(jsonString)

    const { merchant_id, timestamp, signature } = payload

    if (!merchant_id || !timestamp || !signature) {
      return { valid: false, error: 'Invalid payload structure' }
    }

    // Check freshness (± 90 seconds)
    const now = Date.now()
    if (Math.abs(now - timestamp) > 90000) {
      return { valid: false, error: 'QR code expired' }
    }

    // Validate signature
    const dataToSign = `${merchant_id}:${timestamp}`
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(dataToSign).digest('hex')

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' }
    }

    return { valid: true, merchantId: merchant_id }
  } catch (e) {
    return { valid: false, error: 'Failed to parse QR data' }
  }
}
