package com.hearassist.app.data.audio

import android.annotation.SuppressLint
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import com.hearassist.app.domain.model.AudioSettings
import com.hearassist.app.domain.model.EqualizerSettings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.withContext
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

@SuppressLint("MissingPermission")
class AudioEngine {

    companion object {
        private const val SAMPLE_RATE = 44100
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        private const val BUFFER_SIZE_FACTOR = 2
    }

    private var audioRecord: AudioRecord? = null
    private var audioTrack: AudioTrack? = null
    private var isRunning = false

    private val _peakLevel = MutableStateFlow(0f)
    val peakLevel: StateFlow<Float> = _peakLevel.asStateFlow()

    private var volume = 1.0f
    private var balance = 0.0f
    private var isMono = false
    private var limiterEnabled = true
    private val limiterThreshold = 0.708f

    private var eqEnabled = true
    private val eqGains = floatArrayOf(0f, 0f, 0f, 0f, 0f)
    private val eqFrequencies = floatArrayOf(60f, 250f, 1000f, 4000f, 16000f)

    private var noiseSuppressionEnabled = true
    private val noiseFilterAlpha = 0.92f
    private var lastFilteredSample = 0f

    private val eqFilters = Array(5) { BiquadFilter() }

    private val bufferSize: Int by lazy {
        val minRecordBuffer = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        val minTrackBuffer = AudioTrack.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_OUT_STEREO,
            AUDIO_FORMAT
        )
        max(minRecordBuffer, minTrackBuffer) * BUFFER_SIZE_FACTOR
    }

    suspend fun start(settings: AudioSettings, eqSettings: EqualizerSettings, noiseSuppression: Boolean) = 
        withContext(Dispatchers.IO) {
        if (isRunning) return@withContext

        applySettings(settings, eqSettings, noiseSuppression)
        initEqualizerFilters()

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize
            )

            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()

            val audioFormat = AudioFormat.Builder()
                .setEncoding(AUDIO_FORMAT)
                .setSampleRate(SAMPLE_RATE)
                .setChannelMask(AudioFormat.CHANNEL_OUT_STEREO)
                .build()

            audioTrack = AudioTrack.Builder()
                .setAudioAttributes(audioAttributes)
                .setAudioFormat(audioFormat)
                .setBufferSizeInBytes(bufferSize)
                .setTransferMode(AudioTrack.MODE_STREAM)
                .setPerformanceMode(AudioTrack.PERFORMANCE_MODE_LOW_LATENCY)
                .build()

            audioRecord?.startRecording()
            audioTrack?.play()
            isRunning = true

            processAudioLoop()

        } catch (e: Exception) {
            stop()
            e.printStackTrace()
        }
    }

    private fun initEqualizerFilters() {
        for (i in eqFilters.indices) {
            eqFilters[i].setupPeakingEQ(eqFrequencies[i], SAMPLE_RATE.toFloat(), eqGains[i], 1.5f)
        }
    }

    private suspend fun processAudioLoop() = withContext(Dispatchers.IO) {
        val buffer = ShortArray(bufferSize / 2)
        val stereoBuffer = ShortArray(bufferSize)

        while (isActive && isRunning) {
            val readCount = audioRecord?.read(buffer, 0, buffer.size) ?: 0

            if (readCount > 0) {
                var maxSample = 0f

                for (i in 0 until readCount) {
                    var sample = buffer[i].toFloat() / 32768f

                    if (noiseSuppressionEnabled) {
                        sample = applyNoiseFilter(sample)
                    }

                    if (eqEnabled) {
                        for (filter in eqFilters) {
                            sample = filter.process(sample)
                        }
                    }

                    sample *= volume

                    if (limiterEnabled) {
                        sample = applyLimiter(sample)
                    }

                    val leftGain = if (balance >= 0) 1f else 1f + balance
                    val rightGain = if (balance <= 0) 1f else 1f - balance

                    val leftSample = (sample * leftGain * 32767f).toInt().coerceIn(-32768, 32767).toShort()
                    val rightSample = (sample * rightGain * 32767f).toInt().coerceIn(-32768, 32767).toShort()

                    stereoBuffer[i * 2] = leftSample
                    stereoBuffer[i * 2 + 1] = rightSample

                    val absSample = abs(sample)
                    if (absSample > maxSample) maxSample = absSample
                }

                audioTrack?.write(stereoBuffer, 0, readCount * 2)

                _peakLevel.value = maxSample
            }
        }
    }

    private fun applyNoiseFilter(sample: Float): Float {
        val filtered = noiseFilterAlpha * lastFilteredSample + (1 - noiseFilterAlpha) * sample
        lastFilteredSample = filtered
        return sample - filtered * 0.3f
    }

    private fun applyLimiter(sample: Float): Float {
        if (!limiterEnabled) return sample

        val threshold = limiterThreshold
        val absSample = abs(sample)

        if (absSample > threshold) {
            val excess = absSample - threshold
            val compressionRatio = 10f
            val compressed = threshold + excess / compressionRatio
            return sample.getSign() * min(compressed, 0.95f)
        }

        return sample
    }

    private fun Float.getSign(): Float = if (this >= 0) 1f else -1f

    fun stop() {
        isRunning = false
        try {
            audioRecord?.stop()
            audioRecord?.release()
            audioTrack?.stop()
            audioTrack?.release()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        audioRecord = null
        audioTrack = null
        _peakLevel.value = 0f
    }

    fun applySettings(settings: AudioSettings, eqSettings: EqualizerSettings, noiseSuppression: Boolean) {
        volume = settings.volume
        balance = settings.balance
        isMono = settings.isMono
        limiterEnabled = settings.isLimiterEnabled

        eqEnabled = eqSettings.isEnabled
        eqGains[0] = eqSettings.band60Hz
        eqGains[1] = eqSettings.band250Hz
        eqGains[2] = eqSettings.band1kHz
        eqGains[3] = eqSettings.band4kHz
        eqGains[4] = eqSettings.band16kHz

        noiseSuppressionEnabled = noiseSuppression

        initEqualizerFilters()
    }

    fun isActive(): Boolean = isRunning

    class BiquadFilter {
        private var b0 = 1f
        private var b1 = 0f
        private var b2 = 0f
        private var a1 = 0f
        private var a2 = 0f

        private var x1 = 0f
        private var x2 = 0f
        private var y1 = 0f
        private var y2 = 0f

        fun setupPeakingEQ(freq: Float, sampleRate: Float, gainDb: Float, q: Float) {
            val a = 10f.pow(gainDb / 40f)
            val omega = 2f * Math.PI.toFloat() * freq / sampleRate
            val sinOmega = sin(omega)
            val cosOmega = cos(omega)
            val alpha = sinOmega / (2f * q)

            b0 = 1f + alpha * a
            b1 = -2f * cosOmega
            b2 = 1f - alpha * a
            val a0 = 1f + alpha / a
            a1 = -2f * cosOmega
            a2 = 1f - alpha / a

            b0 /= a0
            b1 /= a0
            b2 /= a0
            this.a1 = a1 / a0
            this.a2 = a2 / a0
        }

        fun process(input: Float): Float {
            val output = b0 * input + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2

            x2 = x1
            x1 = input
            y2 = y1
            y1 = output

            return output
        }

        fun reset() {
            x1 = 0f
            x2 = 0f
            y1 = 0f
            y2 = 0f
        }
    }
}
