package com.aerophone.app.di

import com.aerophone.app.billing.BillingService
import com.aerophone.app.data.repository.SettingsRepository
import com.aerophone.app.presentation.MainViewModel
import org.koin.android.ext.koin.androidContext
import org.koin.androidx.viewmodel.dsl.viewModel
import org.koin.dsl.module

val appModule = module {
    single { SettingsRepository(androidContext()) }
    single { BillingService(androidContext()) }
    viewModel { MainViewModel(get(), get(), get()) }
}
