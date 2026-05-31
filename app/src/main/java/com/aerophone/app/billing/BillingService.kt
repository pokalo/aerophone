package com.aerophone.app.billing

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.util.Log
import com.aerophone.app.domain.model.PremiumConfig
import com.aerophone.app.domain.model.PremiumType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.withContext
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

sealed class BillingResult {
    data object Success : BillingResult()
    data class Error(val message: String) : BillingResult()
    data object Cancelled : BillingResult()
    data object NotAvailable : BillingResult()
}

class BillingService(private val context: Context) {

    companion object {
        private const val TAG = "AerophoneBilling"
        const val PRODUCT_ID = "premium_unlock"
    }

    private val _isPremium = MutableStateFlow(false)
    val isPremium: StateFlow<Boolean> = _isPremium

    val isAvailable: Boolean
        get() = try {
            context.packageManager.getPackageInfo("ru.store", 0)
            true
        } catch (e: Exception) {
            false
        }

    suspend fun initialize() {
        Log.d(TAG, "BillingService initialized")
    }

    fun isSubscriptionActive(type: PremiumType, expiryTimestamp: Long): Boolean {
        if (type == PremiumType.ONETIME) return true
        return System.currentTimeMillis() < expiryTimestamp
    }

    // --- RuStore (заглушка) ---

    suspend fun purchaseRuStore(activity: Activity, type: PremiumType): BillingResult {
        if (!isAvailable) return BillingResult.NotAvailable

        Log.d(TAG, "RuStore purchase: ${type.name}")

        return BillingResult.Success
    }

    // --- Telegram Stars ---

    private var currentPurchaseId: String? = null

    suspend fun createTelegramInvoice(type: PremiumType): Result<String> {
        return withContext(Dispatchers.IO) {
            try {
                val purchaseId = UUID.randomUUID().toString()
                currentPurchaseId = purchaseId

                val starsAmount = when (type) {
                    PremiumType.ONETIME -> PremiumConfig.STARS_ONETIME
                    PremiumType.MONTHLY -> PremiumConfig.STARS_MONTHLY
                    PremiumType.YEARLY -> PremiumConfig.STARS_YEARLY
                }

                val title = when (type) {
                    PremiumType.ONETIME -> "Aerophone Premium"
                    PremiumType.MONTHLY -> "Aerophone Premium (месяц)"
                    PremiumType.YEARLY -> "Aerophone Premium (год)"
                }
                val description = "Премиум-доступ: ${type.displayName}"

                val body = buildJson {
                    add("purchaseId", purchaseId)
                    add("title", title)
                    add("description", description)
                    add("starsAmount", starsAmount)
                }

                val url = URL("${PremiumConfig.TELEGRAM_SERVER_URL}/create-invoice")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                OutputStreamWriter(conn.outputStream).use { it.write(body) }

                val response = conn.inputStream.bufferedReader().readText()
                conn.disconnect()

                val json = parseJson(response)
                val link = json["link"] ?: throw Exception("No link in response")
                Result.success(link)
            } catch (e: Exception) {
                Log.e(TAG, "Telegram invoice error", e)
                Result.failure(e)
            }
        }
    }

    suspend fun checkTelegramPayment(): Boolean {
        val purchaseId = currentPurchaseId ?: return false
        return withContext(Dispatchers.IO) {
            try {
                val url = URL("${PremiumConfig.TELEGRAM_SERVER_URL}/check-payment/$purchaseId")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "GET"
                val response = conn.inputStream.bufferedReader().readText()
                conn.disconnect()

                val json = parseJson(response)
                json["status"] == "completed"
            } catch (e: Exception) {
                Log.e(TAG, "Check payment error", e)
                false
            }
        }
    }

    fun activatePremium() {
        _isPremium.value = true
    }

    fun deactivatePremium() {
        _isPremium.value = false
    }

    fun dispose() {
        _isPremium.value = false
    }

    fun handleActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        Log.d(TAG, "Activity result: requestCode=$requestCode, resultCode=$resultCode")
    }

    // --- JSON helpers ---

    private fun buildJson(build: JsonBuilder.() -> Unit): String {
        val b = JsonBuilder()
        b.build()
        return b.toString()
    }

    private fun parseJson(json: String): Map<String, String> {
        val map = mutableMapOf<String, String>()
        val trimmed = json.trim()
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            val content = trimmed.substring(1, trimmed.length - 1)
            // Simple parser for flat JSON strings
            val regex = "\"([^\"]+)\"\\s*:\\s*\"([^\"]*)\"".toRegex()
            for (match in regex.findAll(content)) {
                map[match.groupValues[1]] = match.groupValues[2]
            }
        }
        return map
    }

    private class JsonBuilder {
        private val parts = mutableListOf<String>()
        fun add(key: String, value: String) {
            parts.add("\"$key\":\"${value.replace("\"", "\\\"")}\"")
        }
        fun add(key: String, value: Int) {
            parts.add("\"$key\":$value")
        }
        override fun toString() = "{${
            parts.joinToString(",")
        }}"
    }
}
