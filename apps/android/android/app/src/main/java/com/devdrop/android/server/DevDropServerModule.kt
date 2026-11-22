package com.devdrop.android.server

import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Environment
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

class DevDropServerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ServerEventListener {

    private val tag = "DevDropServerModule"
    private var server: DevDropEmbeddedServer? = null

    override fun getName(): String = "DevDropServerModule"

    @ReactMethod
    fun startServer(port: Int, deviceName: String, promise: Promise) {
        try {
            if (server == null) {
                server = DevDropEmbeddedServer(reactContext.applicationContext, deviceName, this)
            } else {
                server?.deviceName = deviceName
            }

            val actualPort = server?.start(if (port > 0) port else 4545) ?: -1
            if (actualPort > 0) {
                val map = Arguments.createMap().apply {
                    putBoolean("success", true)
                    putInt("port", actualPort)
                    putBoolean("isRunning", true)
                }
                promise.resolve(map)
            } else {
                promise.reject("SERVER_START_FAILED", "Could not start server on any port")
            }
        } catch (e: Exception) {
            Log.e(tag, "Failed to start embedded server", e)
            promise.reject("SERVER_EXCEPTION", e.message, e)
        }
    }

    @ReactMethod
    fun stopServer(promise: Promise) {
        try {
            server?.stop()
            val map = Arguments.createMap().apply {
                putBoolean("success", true)
                putBoolean("isRunning", false)
            }
            promise.resolve(map)
        } catch (e: Exception) {
            Log.e(tag, "Failed to stop embedded server", e)
            promise.reject("SERVER_STOP_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        val isRunning = server?.isServerRunning() ?: false
        val port = server?.listeningPort ?: 0
        val map = Arguments.createMap().apply {
            putBoolean("isRunning", isRunning)
            putInt("port", port)
        }
        promise.resolve(map)
    }

    /**
     * Returns the canonical, user-visible DevDrop storage directory (e.g. /storage/emulated/0/Download/DevDrop)
     */
    @ReactMethod
    fun getPublicDevDropPath(promise: Promise) {
        try {
            val publicDownloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            val devDropDir = File(publicDownloads, "DevDrop").apply {
                if (!exists()) mkdirs()
            }
            promise.resolve(devDropDir.absolutePath)
        } catch (e: Exception) {
            try {
                val fallback = File(reactContext.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "DevDrop").apply {
                    if (!exists()) mkdirs()
                }
                promise.resolve(fallback.absolutePath)
            } catch (err: Exception) {
                promise.reject("FOLDER_ERROR", err.message, err)
            }
        }
    }

    /**
     * Saves a temporary downloaded file directly into the public Downloads/DevDrop folder
     * and registers it with the Android MediaStore scanner.
     */
    @ReactMethod
    fun saveDownloadedFile(tempUri: String, fileName: String, promise: Promise) {
        try {
            val cleanPath = if (tempUri.startsWith("file://")) tempUri.substring(7) else tempUri
            val sourceFile = File(cleanPath)
            if (!sourceFile.exists()) {
                promise.reject("FILE_NOT_FOUND", "Source file does not exist at $cleanPath")
                return
            }

            val publicDownloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            val devDropDir = File(publicDownloads, "DevDrop").apply {
                if (!exists()) mkdirs()
            }

            val sanitizedName = fileName.replace(Regex("[/\\\\?%*:|\"<>]"), "_")
            val destFile = File(devDropDir, sanitizedName)

            val input = FileInputStream(sourceFile)
            val output = FileOutputStream(destFile)
            val buf = ByteArray(65536)
            var len: Int
            while (input.read(buf).also { len = it } > 0) {
                output.write(buf, 0, len)
            }
            output.flush()
            output.close()
            input.close()

            // Delete temporary source file
            sourceFile.delete()

            // Scan into Media Store
            MediaScannerConnection.scanFile(
                reactContext,
                arrayOf(destFile.absolutePath),
                null
            ) { path, uri ->
                Log.i(tag, "MediaScanner indexed: $path -> $uri")
            }

            val map = Arguments.createMap().apply {
                putBoolean("success", true)
                putString("path", destFile.absolutePath)
                putString("fileName", sanitizedName)
                putDouble("size", destFile.length().toDouble())
            }
            promise.resolve(map)
        } catch (e: Exception) {
            Log.e(tag, "Error saving file to public downloads", e)
            promise.reject("SAVE_ERROR", e.message, e)
        }
    }

    /**
     * Index any file with Android Media Scanner
     */
    @ReactMethod
    fun scanMediaFile(path: String, promise: Promise) {
        try {
            MediaScannerConnection.scanFile(
                reactContext,
                arrayOf(path),
                null
            ) { scannedPath, uri ->
                val map = Arguments.createMap().apply {
                    putString("path", scannedPath)
                    putString("uri", uri?.toString() ?: "")
                }
                promise.resolve(map)
            }
        } catch (e: Exception) {
            promise.reject("SCAN_ERROR", e.message, e)
        }
    }

    /**
     * Installs an APK file directly using the Android Package Installer
     */
    @ReactMethod
    fun installApk(apkPath: String, promise: Promise) {
        try {
            val cleanPath = if (apkPath.startsWith("file://")) apkPath.substring(7) else apkPath
            val apkFile = File(cleanPath)
            if (!apkFile.exists()) {
                promise.reject("FILE_NOT_FOUND", "APK file not found at $cleanPath")
                return
            }

            val uri = androidx.core.content.FileProvider.getUriForFile(
                reactContext,
                "${reactContext.packageName}.provider",
                apkFile
            )

            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
                        android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
            }

            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(tag, "Failed to launch package installer for APK", e)
            promise.reject("INSTALL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    // --- ServerEventListener Callbacks ---

    override fun onFileReceived(fileName: String, filePath: String, fileSize: Long, senderName: String) {
        val params = Arguments.createMap().apply {
            putString("fileName", fileName)
            putString("filePath", filePath)
            putDouble("fileSize", fileSize.toDouble())
            putString("senderName", senderName)
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }
        sendEvent("onDirectFileReceived", params)
    }

    override fun onTextReceived(text: String, senderName: String) {
        val params = Arguments.createMap().apply {
            putString("text", text)
            putString("senderName", senderName)
            putDouble("timestamp", System.currentTimeMillis().toDouble())
        }
        sendEvent("onDirectTextReceived", params)
    }

    override fun onTransferProgress(bytesRead: Long, totalBytes: Long, percentage: Int) {
        val params = Arguments.createMap().apply {
            putDouble("bytesRead", bytesRead.toDouble())
            putDouble("totalBytes", totalBytes.toDouble())
            putInt("percentage", percentage)
        }
        sendEvent("onDirectTransferProgress", params)
    }

    override fun onServerError(error: String) {
        val params = Arguments.createMap().apply {
            putString("error", error)
        }
        sendEvent("onDirectServerError", params)
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }
}
