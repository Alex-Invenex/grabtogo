import { NextRequest, NextResponse } from 'next/server'
import { Server as NetServer } from 'http'
import { Server as ServerIO } from 'socket.io'
import { initializeSocket, NextApiResponseServerIO } from '@/lib/socket'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!global.io) {
    console.log('Initializing Socket.io server...')

    // Create a new HTTP server for Socket.io
    const httpServer: NetServer = (global as any).httpServer || new NetServer()
    global.httpServer = httpServer

    const io = new ServerIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    })

    // Initialize socket handlers
    initializeSocket(io)

    global.io = io

    console.log('Socket.io server initialized')
  }

  return NextResponse.json({
    message: 'Socket.io server is running',
    connected: global.io?.engine?.clientsCount || 0
  })
}

// Add global type for TypeScript
declare global {
  var io: ServerIO | undefined
  var httpServer: NetServer | undefined
}
