package com.hearassist.app.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hearassist.app.domain.model.PaymentMethod
import com.hearassist.app.domain.model.PremiumConfig
import com.hearassist.app.domain.model.PremiumType
import com.hearassist.app.presentation.theme.Primary
import com.hearassist.app.presentation.theme.Surface
import com.hearassist.app.presentation.theme.VUMeterYellow

@Composable
fun PremiumScreen(
    onPurchaseRuStore: (PremiumType) -> Unit,
    onPurchaseTelegramStars: (PremiumType) -> Unit,
    onDismiss: () -> Unit,
    isLoading: Boolean = false
) {
    var selectedType by remember { mutableStateOf(PremiumType.ONETIME) }
    var selectedMethod by remember { mutableStateOf(PaymentMethod.RUSTORE) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.92f)),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            colors = CardDefaults.cardColors(containerColor = Surface),
            shape = RoundedCornerShape(24.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = null,
                    tint = VUMeterYellow,
                    modifier = Modifier.size(56.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Разблокировать Премиум",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(20.dp))

                // --- Селектор срока подписки ---
                Text("Срок доступа", fontSize = 13.sp, color = Color.Gray)
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    PremiumType.entries.forEach { type ->
                        val selected = type == selectedType
                        val label = when (type) {
                            PremiumType.ONETIME -> "Навсегда"
                            PremiumType.MONTHLY -> "Месяц"
                            PremiumType.YEARLY -> "Год"
                        }
                        val price = when (type) {
                            PremiumType.ONETIME -> PremiumConfig.PRICE_ONETIME
                            PremiumType.MONTHLY -> PremiumConfig.PRICE_MONTHLY
                            PremiumType.YEARLY -> PremiumConfig.PRICE_YEARLY
                        }
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .background(
                                    if (selected) Primary.copy(alpha = 0.2f) else Color(0xFF2C2C2E),
                                    RoundedCornerShape(12.dp)
                                )
                                .clickable { selectedType = type }
                                .padding(vertical = 12.dp, horizontal = 8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = label,
                                fontSize = 14.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                color = if (selected) Primary else Color.Gray
                            )
                            Text(
                                text = price,
                                fontSize = 11.sp,
                                color = if (selected) Color.White else Color.Gray
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // --- Селектор способа оплаты ---
                Text("Способ оплаты", fontSize = 13.sp, color = Color.Gray)
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    PaymentMethod.entries.forEach { method ->
                        val selected = method == selectedMethod
                        Button(
                            onClick = { selectedMethod = method },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (selected) Primary else Color(0xFF2C2C2E)
                            ),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = method.displayName,
                                fontSize = 13.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // --- Сравнение функций ---
                Text(
                    text = "Бесплатно:",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color.Gray,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(4.dp))
                FeatureItem("Громкость до 100%", false)
                FeatureItem("3 полосы эквалайзера", false)
                FeatureItem("2 пресета", false)

                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Премиум:",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = VUMeterYellow,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(4.dp))
                FeatureItem("Громкость до 200%", true)
                FeatureItem("5 полос эквалайзера", true)
                FeatureItem("Все 4 пресета", true)
                FeatureItem("Шумоподавление", true)
                FeatureItem("Таймер сна", true)
                if (selectedType != PremiumType.ONETIME) {
                    FeatureItem("Автопродление не требуется", true)
                }

                Spacer(modifier = Modifier.height(20.dp))

                // --- Кнопка покупки ---
                val buttonPrice = when (selectedType) {
                    PremiumType.ONETIME -> PremiumConfig.PRICE_ONETIME
                    PremiumType.MONTHLY -> PremiumConfig.PRICE_MONTHLY
                    PremiumType.YEARLY -> PremiumConfig.PRICE_YEARLY
                }
                val starsIcon = if (selectedMethod == PaymentMethod.TELEGRAM_STARS) " ⭐" else ""

                Button(
                    onClick = {
                        when (selectedMethod) {
                            PaymentMethod.RUSTORE -> onPurchaseRuStore(selectedType)
                            PaymentMethod.TELEGRAM_STARS -> onPurchaseTelegramStars(selectedType)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    enabled = !isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = Primary),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(22.dp),
                            color = Color.White
                        )
                    } else {
                        Text(
                            text = "Купить за $buttonPrice$starsIcon",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                if (selectedType == PremiumType.ONETIME) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Одноразовая покупка навсегда",
                        fontSize = 12.sp,
                        color = Color.Gray,
                        textAlign = TextAlign.Center
                    )
                } else {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Подписка без автопродления",
                        fontSize = 12.sp,
                        color = Color.Gray,
                        textAlign = TextAlign.Center
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "Пропустить",
                    fontSize = 15.sp,
                    color = Color.Gray,
                    modifier = Modifier
                        .padding(8.dp)
                        .clickable { onDismiss() },
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
private fun FeatureItem(text: String, isPremium: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.Check,
            contentDescription = null,
            tint = if (isPremium) Primary else Color.Gray,
            modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            fontSize = 13.sp,
            color = if (isPremium) Color.White else Color.Gray
        )
    }
}
