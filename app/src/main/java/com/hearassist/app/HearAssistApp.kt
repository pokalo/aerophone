package com.hearassist.app

import android.app.Application
import com.hearassist.app.di.appModule
import org.koin.android.ext.koin.androidContext
import org.koin.android.ext.koin.androidLogger
import org.koin.core.context.startKoin

class HearAssistApp : Application() {

    override fun onCreate() {
        super.onCreate()
        
        startKoin {
            androidLogger()
            androidContext(this@HearAssistApp)
            modules(appModule)
        }
    }
}
