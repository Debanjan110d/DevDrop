package com.devdrop.android.server

import android.content.Context
import android.media.MediaScannerConnection
import android.os.Environment
import android.util.Log
import org.json.JSONObject
import java.io.*
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

interface ServerEventListener {
    fun onFileReceived(fileName: String, filePath: String, fileSize: Long, senderName: String)
    fun onTextReceived(text: String, senderName: String)
    fun onTransferProgress(bytesRead: Long, totalBytes: Long, percentage: Int)
    fun onServerError(error: String)
}

class DevDropEmbeddedServer(
    private val context: Context,
    var deviceName: String,
    private val listener: ServerEventListener
) {
    private val tag = "DevDropServer"
    private var serverSocket: ServerSocket? = null
    private var executor: ExecutorService? = null
    private val isRunning = AtomicBoolean(false)
    var listeningPort: Int = 4545
        private set

    fun getDevDropDirectory(): File {
        // Try public Download/DevDrop directory first so files are user-visible in Downloads app
        val publicDownloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        val devDropFolder = File(publicDownloads, "DevDrop")
        if (devDropFolder.exists() || devDropFolder.mkdirs()) {
            return devDropFolder
        }
        // Fallback to app external files dir if public Downloads is restricted
        val externalFiles = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
        val fallbackFolder = File(externalFiles, "DevDrop")
        if (!fallbackFolder.exists()) {
            fallbackFolder.mkdirs()
        }
        return fallbackFolder
    }

    fun start(preferredPort: Int = 4545): Int {
        if (isRunning.get()) {
            return listeningPort
        }

        val candidatePorts = intArrayOf(preferredPort, 4546, 4547, 8080, 0)
        var bound = false

        for (p in candidatePorts) {
            try {
                serverSocket = ServerSocket()
                serverSocket?.reuseAddress = true
                serverSocket?.bind(InetSocketAddress(p))
                listeningPort = serverSocket?.localPort ?: p
                bound = true
                Log.i(tag, "DevDrop Embedded Server started on port $listeningPort")
                break
            } catch (e: Exception) {
                Log.w(tag, "Port $p not available, trying next...", e)
                try { serverSocket?.close() } catch (_: Exception) {}
            }
        }

        if (!bound || serverSocket == null) {
            listener.onServerError("Failed to bind embedded server to any port")
            return -1
        }

        isRunning.set(true)
        executor = Executors.newCachedThreadPool()

        Thread {
            while (isRunning.get()) {
                try {
                    val clientSocket = serverSocket?.accept() ?: break
                    executor?.submit { handleClient(clientSocket) }
                } catch (e: Exception) {
                    if (isRunning.get()) {
                        Log.e(tag, "Error accepting connection", e)
                    }
                }
            }
        }.start()

        return listeningPort
    }

    fun stop() {
        if (!isRunning.getAndSet(false)) return
        try {
            serverSocket?.close()
        } catch (e: Exception) {
            Log.e(tag, "Error closing server socket", e)
        }
        executor?.shutdownNow()
        executor = null
        serverSocket = null
        Log.i(tag, "DevDrop Embedded Server stopped")
    }

    fun isServerRunning(): Boolean = isRunning.get()

    private fun handleClient(socket: Socket) {
        try {
            socket.soTimeout = 30000
            val rawInput = socket.getInputStream()
            val rawOutput = socket.getOutputStream()

            val headerReader = BufferedReader(InputStreamReader(rawInput, StandardCharsets.UTF_8))
            val requestLine = headerReader.readLine() ?: return
            val requestParts = requestLine.split(" ")
            if (requestParts.size < 2) return

            val method = requestParts[0].uppercase()
            val fullPath = requestParts[1]
            val path = if (fullPath.contains("?")) fullPath.substringBefore("?") else fullPath

            val headers = mutableMapOf<String, String>()
            var line: String? = headerReader.readLine()
            while (!line.isNullOrEmpty()) {
                val colonIdx = line.indexOf(':')
                if (colonIdx > 0) {
                    val key = line.substring(0, colonIdx).trim().lowercase()
                    val value = line.substring(colonIdx + 1).trim()
                    headers[key] = value
                }
                line = headerReader.readLine()
            }

            if (method == "OPTIONS") {
                sendResponse(rawOutput, 204, "No Content", "application/json", ByteArray(0))
                return
            }

            when {
                path == "/health" || path == "/api/health" -> {
                    val res = JSONObject().apply {
                        put("success", true)
                        put("ok", true)
                        put("nodeType", "android-peer")
                        put("deviceName", deviceName)
                        put("port", listeningPort)
                        put("version", "1.0.0")
                    }
                    sendJsonResponse(rawOutput, 200, res.toString())
                }

                path == "/api/devices" -> {
                    val selfObj = JSONObject().apply {
                        put("id", "self-peer")
                        put("name", deviceName)
                        put("platform", "android")
                        put("status", "online")
                        put("isSelf", true)
                    }
                    val res = JSONObject().apply {
                        put("success", true)
                        put("data", org.json.JSONArray().put(selfObj))
                    }
                    sendJsonResponse(rawOutput, 200, res.toString())
                }

                path == "/api/text/direct-drop" && method == "POST" -> {
                    val contentLength = headers["content-length"]?.toIntOrNull() ?: 0
                    val bodyChars = CharArray(contentLength)
                    var read = 0
                    while (read < contentLength) {
                        val r = headerReader.read(bodyChars, read, contentLength - read)
                        if (r == -1) break
                        read += r
                    }
                    val body = String(bodyChars, 0, read)
                    var textContent = body
                    var sender = headers["x-sender-name"] ?: "Nearby Device"

                    try {
                        val json = JSONObject(body)
                        if (json.has("text")) textContent = json.getString("text")
                        if (json.has("senderName")) sender = json.getString("senderName")
                    } catch (_: Exception) {}

                    listener.onTextReceived(textContent, sender)

                    val res = JSONObject().apply {
                        put("success", true)
                        put("message", "Text received")
                    }
                    sendJsonResponse(rawOutput, 200, res.toString())
                }

                (path == "/api/transfers/direct-drop" || path.startsWith("/api/transfers/upload")) && method == "POST" -> {
                    val contentLength = headers["content-length"]?.toLongOrNull() ?: 0L
                    var rawFileName = headers["x-file-name"] ?: "devdrop_file_${System.currentTimeMillis()}.bin"
                    try {
                        rawFileName = URLDecoder.decode(rawFileName, "UTF-8")
                    } catch (_: Exception) {}
                    val sanitizedName = rawFileName.replace(Regex("[/\\\\?%*:|\"<>]"), "_")
                    val senderName = headers["x-sender-name"] ?: "Nearby Device"

                    val baseDir = getDevDropDirectory()
                    val destFile = File(baseDir, sanitizedName)
                    val fos = FileOutputStream(destFile)

                    var bytesReceived = 0L
                    val buffer = ByteArray(65536)
                    var lastProgressTime = System.currentTimeMillis()

                    while (bytesReceived < contentLength) {
                        val toRead = Math.min(buffer.size.toLong(), contentLength - bytesReceived).toInt()
                        val r = rawInput.read(buffer, 0, toRead)
                        if (r == -1) break
                        fos.write(buffer, 0, r)
                        bytesReceived += r

                        val now = System.currentTimeMillis()
                        if (now - lastProgressTime > 150 || bytesReceived == contentLength) {
                            lastProgressTime = now
                            val pct = if (contentLength > 0) ((bytesReceived * 100) / contentLength).toInt() else 0
                            listener.onTransferProgress(bytesReceived, contentLength, pct)
                        }
                    }
                    fos.flush()
                    fos.close()

                    // Index in Android Media Store so it appears immediately in Files/Downloads/Gallery
                    try {
                        MediaScannerConnection.scanFile(
                            context,
                            arrayOf(destFile.absolutePath),
                            null
                        ) { pathScanned, uri ->
                            Log.i(tag, "Scanned file into media store: $pathScanned -> $uri")
                        }
                    } catch (scanErr: Exception) {
                        Log.w(tag, "MediaScanner note: ${scanErr.message}")
                    }

                    listener.onFileReceived(
                        sanitizedName,
                        destFile.absolutePath,
                        destFile.length(),
                        senderName
                    )

                    val res = JSONObject().apply {
                        put("success", true)
                        put("fileName", sanitizedName)
                        put("bytes", bytesReceived)
                        put("path", destFile.absolutePath)
                    }
                    sendJsonResponse(rawOutput, 200, res.toString())
                }

                path == "/" -> {
                    val html = """
                        <!DOCTYPE html>
                        <html>
                        <head><title>DevDrop Peer</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>
                        <body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:24px;text-align:center;">
                          <h2 style="color:#818cf8;">DevDrop Mobile Peer</h2>
                          <p><strong>Device:</strong> $deviceName</p>
                          <p>Storage: Downloads/DevDrop</p>
                          <p>Status: Ready to receive files & text over local Wi-Fi.</p>
                        </body>
                        </html>
                    """.trimIndent()
                    sendResponse(rawOutput, 200, "OK", "text/html; charset=utf-8", html.toByteArray(StandardCharsets.UTF_8))
                }

                else -> {
                    val notFound = JSONObject().apply {
                        put("success", false)
                        put("error", "Route not found")
                    }
                    sendJsonResponse(rawOutput, 404, notFound.toString())
                }
            }
        } catch (e: Exception) {
            Log.e(tag, "Client handler exception", e)
        } finally {
            try { socket.close() } catch (_: Exception) {}
        }
    }

    private fun sendJsonResponse(out: OutputStream, code: Int, json: String) {
        val bytes = json.toByteArray(StandardCharsets.UTF_8)
        sendResponse(out, code, if (code == 200) "OK" else "Error", "application/json", bytes)
    }

    private fun sendResponse(
        out: OutputStream,
        statusCode: Int,
        statusText: String,
        contentType: String,
        body: ByteArray
    ) {
        val header = StringBuilder().apply {
            append("HTTP/1.1 $statusCode $statusText\r\n")
            append("Server: DevDrop-Android-Peer/1.0\r\n")
            append("Content-Type: $contentType\r\n")
            append("Content-Length: ${body.size}\r\n")
            append("Access-Control-Allow-Origin: *\r\n")
            append("Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n")
            append("Access-Control-Allow-Headers: *\r\n")
            append("Connection: close\r\n")
            append("\r\n")
        }.toString()

        out.write(header.toByteArray(StandardCharsets.UTF_8))
        if (body.isNotEmpty()) {
            out.write(body)
        }
        out.flush()
    }
}
