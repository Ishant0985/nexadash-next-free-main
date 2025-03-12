// app/api/send-notification/route.ts
import { NextResponse } from 'next/server'
import { admin } from '@/firebaseAdmin'

interface NotificationPayload {
  token: string
  title: string
  body: string
  data?: { [key: string]: string }
}

// This POST endpoint expects a JSON payload with the notification details
export async function POST(request: Request) {
  try {
    const payload: NotificationPayload = await request.json()

    const message = {
      token: payload.token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
    }

    const response = await admin.messaging().send(message)
    return NextResponse.json({ success: true, messageId: response })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.error()
  }
}
