package com.aerophone.app.presentation

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.material3.Surface
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aerophone.app.domain.model.Preset
import com.aerophone.app.domain.model.SleepTimerOption
import com.aerophone.app.domain.model.PremiumConfig
import com.aerophone.app.presentation.theme.Background
import com.aerophone.app.presentation.theme.Primary
import com.aerophone.app.presentation.theme.Surface
import com.aerophone.app.presentation.theme.SurfaceVariant
import com.aerophone.app.presentation.theme.VUMeterGreen
import com.aerophone.app.presentation.theme.VUMeterRed
import com.aerophone.app.presentation.theme.VUMeterYellow
import kotlin.math.roundToInt

@Composable
fun MainScreen(
    viewModel: MainViewModel,
    onRequestPermission: () -> Unit,
    onShowPremium: () -> Unit = {}
) {
    val state by viewModel.state.collectAsState()

    if (!state.isPremium) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
        ) {
            PremiumCard(onClick = onShowPremium)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Aerophone",
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = if (state.isRunning) "Работает" else "Остановлен",
            fontSize = 18.sp,
            color = if (state.isRunning) Primary else Color.Gray
        )

        Spacer(modifier = Modifier.height(32.dp))

        VUMeter(level = state.peakLevel)

        Spacer(modifier = Modifier.height(32.dp))

        PowerButton(
            isRunning = state.isRunning,
            onClick = onRequestPermission
        )

        Spacer(modifier = Modifier.height(16.dp))

        SettingsCard(state = state, viewModel = viewModel)

        Spacer(modifier = Modifier.height(16.dp))

        EqualizerCard(state = state, viewModel = viewModel)

        Spacer(modifier = Modifier.height(16.dp))

        SleepTimerCard(state = state, viewModel = viewModel)

        Spacer(modifier = Modifier.height(16.dp))

        AlertsCard(state = state, viewModel = viewModel)

        Spacer(modifier = Modifier.height(16.dp))

        InfoCard()
    }
}

@Composable
fun VUMeter(level: Float) {
    val segmentCount = 12
    val activeSegments = (level * segmentCount).roundToInt().coerceIn(0, segmentCount)

    Row(
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.semantics { contentDescription = "Индикатор громкости: ${(level * 100).toInt()}%" }
    ) {
        repeat(segmentCount) { index ->
            val isActive = index < activeSegments
            val color = when {
                index >= 10 -> VUMeterRed
                index >= 7 -> VUMeterYellow
                else -> VUMeterGreen
            }
            val animatedColor by animateColorAsState(
                targetValue = if (isActive) color else color.copy(alpha = 0.2f),
                label = "vu_color"
            )

            Box(
                modifier = Modifier
                    .width(20.dp)
                    .height(40.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(animatedColor)
            )
        }
    }
}

@Composable
fun PowerButton(
    isRunning: Boolean,
    onClick: () -> Unit
) {
    val buttonColor by animateColorAsState(
        targetValue = if (isRunning) Primary else SurfaceVariant,
        label = "button_color"
    )

    Button(
        onClick = onClick,
        modifier = Modifier
            .size(120.dp)
            .semantics {
                contentDescription = if (isRunning) "Остановить слуховой аппарат" else "Запустить слуховой аппарат"
            },
        shape = CircleShape,
        colors = ButtonDefaults.buttonColors(
            containerColor = buttonColor
        )
    ) {
        Text(
            text = if (isRunning) "СТОП" else "СТАРТ",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
    }
}

@Composable
fun SettingsCard(
    state: com.aerophone.app.domain.model.HearingAidState,
    viewModel: MainViewModel
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Surface),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            SliderSetting(
                label = "Громкость",
                value = state.audioSettings.volume,
                onValueChange = { viewModel.setVolume(it) },
                valueRange = 0f..2f,
                suffix = "%"
            )

            Spacer(modifier = Modifier.height(16.dp))

            SliderSetting(
                label = "Баланс",
                value = state.audioSettings.balance,
                onValueChange = { viewModel.setBalance(it) },
                valueRange = -1f..1f,
                formatValue = { 
                    when {
                        it < -0.05f -> "L ${(-it * 100).toInt()}%"
                        it > 0.05f -> "R ${(it * 100).toInt()}%"
                        else -> "Центр"
                    }
                }
            )

            Spacer(modifier = Modifier.height(20.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Защита слуха", color = Color.White)
                Switch(
                    checked = state.audioSettings.isLimiterEnabled,
                    onCheckedChange = { viewModel.toggleLimiter() },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Primary,
                        checkedTrackColor = Primary.copy(alpha = 0.5f)
                    )
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (state.isPremium) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Шумоподавление", color = Color.White)
                    Switch(
                        checked = state.isNoiseSuppressionEnabled,
                        onCheckedChange = { viewModel.toggleNoiseSuppression() },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Primary,
                            checkedTrackColor = Primary.copy(alpha = 0.5f)
                        )
                    )
                }
            } else {
                PremiumFeatureRow("Шумоподавление", "Премиум")
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Моно режим", color = Color.White)
                Switch(
                    checked = state.audioSettings.isMono,
                    onCheckedChange = { viewModel.toggleMono() },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Primary,
                        checkedTrackColor = Primary.copy(alpha = 0.5f)
                    )
                )
            }

            if (state.isHighVolumeWarning) {
                Spacer(modifier = Modifier.height(12.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = VUMeterRed.copy(alpha = 0.3f)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("⚠️", fontSize = 20.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Высокая громкость! Риск повреждения слуха.",
                            color = Color.White,
                            fontSize = 14.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text("Предустановки частот", color = Color.White, fontWeight = FontWeight.Medium)

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Preset.entries.forEach { preset ->
                    FilterChip(
                        selected = state.currentPreset == preset,
                        onClick = { viewModel.applyPreset(preset) },
                        label = { Text(preset.displayName) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Primary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun EqualizerCard(
    state: com.aerophone.app.domain.model.HearingAidState,
    viewModel: MainViewModel
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Surface),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Настройки частот",
                    color = Color.White,
                    fontWeight = FontWeight.Medium,
                    fontSize = 18.sp
                )
                Switch(
                    checked = state.equalizerSettings.isEnabled,
                    onCheckedChange = { viewModel.toggleEqualizer() },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Primary,
                        checkedTrackColor = Primary.copy(alpha = 0.5f)
                    )
                )
            }

            if (state.equalizerSettings.isEnabled) {
                Spacer(modifier = Modifier.height(16.dp))

                EqBandSlider(
                    label = "60 Hz",
                    value = state.equalizerSettings.band60Hz,
                    onValueChange = { viewModel.setEqualizerBand(0, it) }
                )

                EqBandSlider(
                    label = "250 Hz",
                    value = state.equalizerSettings.band250Hz,
                    onValueChange = { viewModel.setEqualizerBand(1, it) }
                )

                EqBandSlider(
                    label = "1 kHz",
                    value = state.equalizerSettings.band1kHz,
                    onValueChange = { viewModel.setEqualizerBand(2, it) }
                )

                EqBandSlider(
                    label = "4 kHz",
                    value = state.equalizerSettings.band4kHz,
                    onValueChange = { viewModel.setEqualizerBand(3, it) }
                )

                EqBandSlider(
                    label = "16 kHz",
                    value = state.equalizerSettings.band16kHz,
                    onValueChange = { viewModel.setEqualizerBand(4, it) }
                )
            }
        }
    }
}

@Composable
fun EqBandSlider(
    label: String,
    value: Float,
    onValueChange: (Float) -> Unit
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, color = Color.Gray, fontSize = 14.sp)
            Text(
                text = "${if (value >= 0) "+" else ""}${value.toInt()} dB",
                color = when {
                    value > 6 -> VUMeterRed
                    value > 3 -> VUMeterYellow
                    else -> Primary
                },
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )
        }
        
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = -12f..12f,
            colors = SliderDefaults.colors(
                thumbColor = Primary,
                activeTrackColor = Primary,
                inactiveTrackColor = SurfaceVariant
            )
        )
    }
}

@Composable
fun SliderSetting(
    label: String,
    value: Float,
    onValueChange: (Float) -> Unit,
    valueRange: ClosedFloatingPointRange<Float>,
    suffix: String = "",
    formatValue: ((Float) -> String)? = null
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, color = Color.White)
            Text(
                text = formatValue?.invoke(value) ?: "${(value * 100).toInt()}$suffix",
                color = Primary,
                fontWeight = FontWeight.Bold
            )
        }

        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = valueRange,
            colors = SliderDefaults.colors(
                thumbColor = Primary,
                activeTrackColor = Primary,
                inactiveTrackColor = SurfaceVariant
            )
        )
    }
}

@Composable
fun SleepTimerCard(
    state: com.aerophone.app.domain.model.HearingAidState,
    viewModel: MainViewModel
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Surface),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Таймер сна",
                    color = Color.White,
                    fontWeight = FontWeight.Medium,
                    fontSize = 18.sp
                )

                if (state.sleepTimerRemainingSeconds > 0) {
                    val minutes = state.sleepTimerRemainingSeconds / 60
                    val seconds = state.sleepTimerRemainingSeconds % 60
                    Text(
                        text = String.format("%02d:%02d", minutes, seconds),
                        color = Primary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SleepTimerOption.entries.forEach { option ->
                    FilterChip(
                        selected = state.sleepTimerMinutes == option.minutes,
                        onClick = { viewModel.setSleepTimer(option) },
                        label = { 
                            Text(
                                text = option.displayName,
                                fontSize = 12.sp
                            ) 
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Primary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun AlertsCard(
    state: com.aerophone.app.domain.model.HearingAidState,
    viewModel: MainViewModel
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Surface),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                text = "Оповещения о громких звуках",
                color = Color.White,
                fontWeight = FontWeight.Medium,
                fontSize = 18.sp
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Вибрация и вспышка при обнаружении громких звуков",
                color = Color.Gray,
                fontSize = 12.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Вибрация", color = Color.White)
                Switch(
                    checked = state.isVibrationAlertEnabled,
                    onCheckedChange = { viewModel.setVibrationAlertEnabled(it) },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Primary,
                        checkedTrackColor = Primary.copy(alpha = 0.5f)
                    )
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Вспышка экрана", color = Color.White)
                Switch(
                    checked = state.isFlashAlertEnabled,
                    onCheckedChange = { viewModel.setFlashAlertEnabled(it) },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Primary,
                        checkedTrackColor = Primary.copy(alpha = 0.5f)
                    )
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Порог: ${(state.flashAlertThreshold * 100).toInt()}%",
                color = Color.White,
                fontSize = 14.sp
            )

            Slider(
                value = state.flashAlertThreshold,
                onValueChange = { viewModel.setFlashThreshold(it) },
                valueRange = 0.5f..1f,
                colors = SliderDefaults.colors(
                    thumbColor = Primary,
                    activeTrackColor = Primary,
                    inactiveTrackColor = SurfaceVariant
                )
            )
        }
    }
}

@Composable
fun PremiumCard(onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .border(3.dp, Color.Yellow, RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        color = Color(0xFF4CAF50)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text("★ ПРЕМИУМ ★", color = Color.Yellow, fontWeight = FontWeight.Bold, fontSize = 22.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Text("Шумоподавление + усиление до 200%", color = Color.White, fontSize = 16.sp)
            Spacer(modifier = Modifier.height(12.dp))
            Text(">>> НАЖМИТЕ ЧТОБЫ РАЗБЛОКИРОВАТЬ <<<", color = Color.Yellow, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun InfoCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Surface),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                text = "О приложении",
                color = Color.White,
                fontWeight = FontWeight.Medium,
                fontSize = 18.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            InfoRow("Версия", "1.0.0")
            Spacer(modifier = Modifier.height(8.dp))
            InfoRow("Задержка", "~20-50 мс")
            Spacer(modifier = Modifier.height(8.dp))
            InfoRow("Частота дискр.", "44100 Гц")
            Spacer(modifier = Modifier.height(8.dp))
            InfoRow("Каналы", "Стерео (с балансом)")

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "⚠️ Это приложение не является медицинским прибором. Для подбора слухового аппарата обратитесь к специалисту.",
                color = Color.Gray,
                fontSize = 12.sp
            )
        }
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, color = Color.Gray, fontSize = 14.sp)
        Text(text = value, color = Color.White, fontSize = 14.sp)
    }
}

@Composable
fun PremiumFeatureRow(label: String, badge: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = Color.Gray)
        Text(
            text = badge,
            color = Primary,
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp
        )
    }
}
