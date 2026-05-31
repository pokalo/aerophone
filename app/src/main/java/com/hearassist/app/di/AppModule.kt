package com.hearassist.app.di

import com.hearassist.app.billing.BillingService
import com.hearassist.app.data.repository.SettingsRepository
import com.hearassist.app.presentation.MainViewModel
import org.koin.android.ext.koin.androidContext
import org.koin.androidx.viewmodel.dsl.viewModel
import org.koin.dsl.module

val appModule = module {
    single { SettingsRepository(androidContext()) }
    single { BillingService(androidContext()) }
    viewModel { MainViewModel(get(), get(), get()) }
}
