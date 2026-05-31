package com.hearassist.app.presentation

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.hearassist.app.billing.BillingResult
import com.hearassist.app.domain.model.PremiumType
import com.hearassist.app.presentation.theme.Background
import com.hearassist.app.presentation.theme.HearAssistTheme
import com.hearassist.app.presentation.theme.VUMeterRed
import org.koin.androidx.viewmodel.ext.android.viewModel

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModel()
    private var originalBackgroundColor: Int = android.graphics.Color.TRANSPARENT
    private val handler = Handler(Looper.getMainLooper())

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val audioGranted = permissions[Manifest.permission.RECORD_AUDIO] == true
        if (audioGranted) {
            viewModel.toggleHearingAid()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.statusBarColor = android.graphics.Color.parseColor("#121212")
        window.navigationBarColor = android.graphics.Color.parseColor("#121212")

        viewModel.registerFlashCallback { flashScreen() }

        setContent {
            HearAssistTheme {
                val state by viewModel.state.collectAsState()
                val purchaseResult by viewModel.purchaseResult.collectAsState()
                var showPremium by remember { mutableStateOf(false) }
                var isPurchasing by remember { mutableStateOf(false) }

                // Слушаем ссылки на Telegram Stars
                LaunchedEffect(Unit) {
                    viewModel.openTelegramInvoice.collect { link ->
                        isPurchasing = true
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(link))
                        startActivity(intent)
                    }
                }

                purchaseResult?.let { result ->
                    when (result) {
                        is BillingResult.Success -> {
                            showPremium = false
                            isPurchasing = false
                            Toast.makeText(this, "Премиум активирован!", Toast.LENGTH_SHORT).show()
                            viewModel.clearPurchaseResult()
                        }
                        is BillingResult.Error -> {
                            Toast.makeText(this, "Ошибка: ${result.message}", Toast.LENGTH_SHORT).show()
                            isPurchasing = false
                            viewModel.clearPurchaseResult()
                        }
                        is BillingResult.Cancelled -> {
                            isPurchasing = false
                            viewModel.clearPurchaseResult()
                        }
                        is BillingResult.NotAvailable -> {
                            Toast.makeText(this, "Покупка недоступна", Toast.LENGTH_SHORT).show()
                            isPurchasing = false
                            viewModel.clearPurchaseResult()
                        }
                    }
                }

                if (showPremium && !state.isPremium) {
                    PremiumScreen(
                        onPurchaseRuStore = { type ->
                            isPurchasing = true
                            viewModel.purchaseRuStore(this@MainActivity, type)
                        },
                        onPurchaseTelegramStars = { type ->
                            viewModel.purchaseTelegramStars(type)
                        },
                        onDismiss = { showPremium = false },
                        isLoading = isPurchasing
                    )
                } else {
                    MainScreenWithAlert(
                        state = state,
                        viewModel = viewModel,
                        onRequestPermission = { requestAudioPermission() },
                        onShowPremium = { showPremium = true }
                    )
                }
            }
        }
    }

    fun flashScreen() {
        handler.post {
            val decorView = window.decorView
            originalBackgroundColor = (decorView.parent as? android.view.ViewGroup)?.getChildAt(0)?.let {
                android.graphics.Color.TRANSPARENT
            } ?: android.graphics.Color.parseColor("#121212")

            window.addFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE)

            window.statusBarColor = android.graphics.Color.parseColor("#FF4444")
            window.navigationBarColor = android.graphics.Color.parseColor("#FF4444")
            decorView.setBackgroundColor(android.graphics.Color.parseColor("#FF4444"))

            handler.postDelayed({
                window.statusBarColor = android.graphics.Color.parseColor("#121212")
                window.navigationBarColor = android.graphics.Color.parseColor("#121212")
                decorView.setBackgroundColor(android.graphics.Color.parseColor("#121212"))
                window.clearFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE)
            }, 150)
        }
    }

    private fun requestAudioPermission() {
        val permissions = mutableListOf(Manifest.permission.RECORD_AUDIO)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val allGranted = permissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }

        if (allGranted) {
            viewModel.toggleHearingAid()
        } else {
            permissionLauncher.launch(permissions.toTypedArray())
        }
    }
}

@Composable
fun MainScreenWithAlert(
    state: com.hearassist.app.domain.model.HearingAidState,
    viewModel: MainViewModel,
    onRequestPermission: () -> Unit,
    onShowPremium: () -> Unit
) {
    val backgroundColor = if (state.isLoudSoundAlert) {
        VUMeterRed
    } else {
        Background
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundColor)
    ) {
        MainScreen(
            viewModel = viewModel,
            onRequestPermission = onRequestPermission,
            onShowPremium = onShowPremium
        )
    }
}
