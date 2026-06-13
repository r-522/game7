// AudioSystem.ts — procedural Web Audio sound system for 喧嘩番長7
// No external audio files. All sounds synthesised from oscillators and noise.
// Safe to call any method before init(); they no-op until AudioContext is live.

export type BgmType = 'roam' | 'fight' | 'boss' | 'menchi'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Fill a Float32Array with white noise in [-1, 1] */
function fillNoise(buf: Float32Array): void {
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.random() * 2 - 1
  }
}

/**
 * Create a one-shot noise burst routed through a bandpass filter.
 * Returns the GainNode tail so the caller can fade it if needed.
 */
function noiseBurst(
  ctx: AudioContext,
  dest: AudioNode,
  freqHz: number,
  durationSec: number,
  peakGain = 0.6,
  Q = 8,
): GainNode {
  const bufLen = Math.ceil(ctx.sampleRate * durationSec)
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
  fillNoise(buf.getChannelData(0))

  const src = ctx.createBufferSource()
  src.buffer = buf

  const filt = ctx.createBiquadFilter()
  filt.type = 'bandpass'
  filt.frequency.value = freqHz
  filt.Q.value = Q

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(peakGain, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec)

  src.connect(filt)
  filt.connect(gain)
  gain.connect(dest)
  src.start()
  src.stop(ctx.currentTime + durationSec + 0.05)

  return gain
}

/** Create a short oscillator tone with an exponential decay envelope. */
function tone(
  ctx: AudioContext,
  dest: AudioNode,
  type: OscillatorType,
  freqHz: number,
  durationSec: number,
  peakGain = 0.4,
  freqEnd?: number,
): void {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freqHz, ctx.currentTime)
  if (freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + durationSec)
  }

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(peakGain, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec)

  osc.connect(gain)
  gain.connect(dest)
  osc.start()
  osc.stop(ctx.currentTime + durationSec + 0.05)
}

// ---------------------------------------------------------------------------
// BGM engine — simple step-sequencer using oscillator scheduling
// ---------------------------------------------------------------------------

interface BgmState {
  stopped: boolean
  gainNode: GainNode
  intervalId: ReturnType<typeof setInterval> | null
}

// Note frequencies (equal temperament, A4 = 440 Hz)
const NOTE: Record<string, number> = {
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61,
  G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23,
  G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
}

type StepEvent =
  | { kind: 'osc'; type: OscillatorType; freq: number; dur: number; gain: number }
  | { kind: 'noise'; freq: number; dur: number; gain: number; Q?: number }

type BgmPattern = { bpm: number; stepsPerBar: number; bars: StepEvent[][] }

function makeBgmPatterns(): Record<BgmType, BgmPattern> {
  // roam: slow, minor 80bpm, 8 steps / bar
  const roamBar: StepEvent[][] = [
    [{ kind: 'osc', type: 'sine', freq: NOTE['C3'], dur: 0.3, gain: 0.18 }],          // 0
    [],                                                                                  // 1
    [{ kind: 'osc', type: 'triangle', freq: NOTE['Eb3'], dur: 0.2, gain: 0.12 }],     // 2
    [],                                                                                  // 3
    [{ kind: 'osc', type: 'sine', freq: NOTE['G3'], dur: 0.3, gain: 0.15 }],          // 4
    [],                                                                                  // 5
    [{ kind: 'osc', type: 'triangle', freq: NOTE['Bb3'], dur: 0.2, gain: 0.10 }],     // 6
    [{ kind: 'noise', freq: 120, dur: 0.05, gain: 0.05, Q: 4 }],                      // 7 (soft kick)
  ]

  // fight: fast, energetic, 140bpm, 16 steps / bar
  const fightBar: StepEvent[][] = [
    [{ kind: 'noise', freq: 90, dur: 0.08, gain: 0.35, Q: 3 }],                       // kick 0
    [{ kind: 'noise', freq: 6000, dur: 0.04, gain: 0.18, Q: 10 }],                    // hihat
    [{ kind: 'osc', type: 'sawtooth', freq: NOTE['A3'], dur: 0.07, gain: 0.20 }],     // bass
    [{ kind: 'noise', freq: 6000, dur: 0.04, gain: 0.12, Q: 10 }],
    [{ kind: 'noise', freq: 200, dur: 0.1, gain: 0.25, Q: 5 }],                       // snare 4
    [{ kind: 'noise', freq: 6000, dur: 0.04, gain: 0.18, Q: 10 }],
    [{ kind: 'osc', type: 'sawtooth', freq: NOTE['E3'], dur: 0.07, gain: 0.18 }],
    [{ kind: 'noise', freq: 6000, dur: 0.04, gain: 0.14, Q: 10 }],
    [{ kind: 'noise', freq: 90, dur: 0.08, gain: 0.35, Q: 3 }],                       // kick 8
    [{ kind: 'noise', freq: 6000, dur: 0.04, gain: 0.16, Q: 10 }],
    [{ kind: 'osc', type: 'sawtooth', freq: NOTE['A3'], dur: 0.07, gain: 0.22 }],
    [{ kind: 'noise', freq: 6000, dur: 0.04, gain: 0.14, Q: 10 }],
    [{ kind: 'noise', freq: 200, dur: 0.1, gain: 0.28, Q: 5 }],                       // snare 12
    [{ kind: 'noise', freq: 6000, dur: 0.04, gain: 0.18, Q: 10 }],
    [{ kind: 'osc', type: 'sawtooth', freq: NOTE['D3'], dur: 0.07, gain: 0.20 }],
    [{ kind: 'noise', freq: 6000, dur: 0.04, gain: 0.14, Q: 10 }],
  ]

  // boss: tense, ominous, irregular 100bpm 12 steps / bar
  const bossBar: StepEvent[][] = [
    [{ kind: 'noise', freq: 80, dur: 0.12, gain: 0.40, Q: 2 }],
    [],
    [{ kind: 'osc', type: 'sawtooth', freq: NOTE['Ab3'], dur: 0.15, gain: 0.22 }],
    [{ kind: 'noise', freq: 200, dur: 0.08, gain: 0.20, Q: 6 }],
    [],
    [{ kind: 'osc', type: 'sawtooth', freq: NOTE['Eb3'], dur: 0.12, gain: 0.18 }],
    [{ kind: 'noise', freq: 80, dur: 0.10, gain: 0.30, Q: 2 }],
    [{ kind: 'noise', freq: 200, dur: 0.08, gain: 0.22, Q: 6 }],
    [],
    [{ kind: 'osc', type: 'sawtooth', freq: NOTE['B3'], dur: 0.15, gain: 0.20 }],
    [],
    [{ kind: 'noise', freq: 4000, dur: 0.04, gain: 0.12, Q: 12 }],
  ]

  // menchi: dramatic buildup, 120bpm, 8 steps / bar
  const menchiBar: StepEvent[][] = [
    [{ kind: 'osc', type: 'sine', freq: NOTE['D4'], dur: 0.2, gain: 0.22 }],
    [],
    [{ kind: 'osc', type: 'sine', freq: NOTE['F4'], dur: 0.15, gain: 0.18 }],
    [{ kind: 'noise', freq: 300, dur: 0.06, gain: 0.12, Q: 5 }],
    [{ kind: 'osc', type: 'sine', freq: NOTE['A4'], dur: 0.2, gain: 0.25 }],
    [],
    [{ kind: 'osc', type: 'sine', freq: NOTE['C5'], dur: 0.15, gain: 0.20 }],
    [{ kind: 'noise', freq: 300, dur: 0.08, gain: 0.18, Q: 5 }],
  ]

  return {
    roam:   { bpm: 80,  stepsPerBar: 8,  bars: roamBar },
    fight:  { bpm: 140, stepsPerBar: 16, bars: fightBar },
    boss:   { bpm: 100, stepsPerBar: 12, bars: bossBar },
    menchi: { bpm: 120, stepsPerBar: 8,  bars: menchiBar },
  }
}

// ---------------------------------------------------------------------------
// AudioSystemClass
// ---------------------------------------------------------------------------

class AudioSystemClass {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private bgm: BgmState | null = null
  private bgmPatterns: Record<BgmType, BgmPattern> | null = null

  // -------------------------------------------------------------------------
  // Initialisation
  // -------------------------------------------------------------------------

  /** Called on the first user interaction to create the AudioContext. */
  init(): void {
    if (this.ctx) return

    this.ctx = new AudioContext()
    this.compressor = this.ctx.createDynamicsCompressor()
    this.compressor.threshold.value = -12
    this.compressor.knee.value = 6
    this.compressor.ratio.value = 4
    this.compressor.attack.value = 0.003
    this.compressor.release.value = 0.25

    this.master = this.ctx.createGain()
    this.master.gain.value = 0.85

    this.master.connect(this.compressor)
    this.compressor.connect(this.ctx.destination)

    this.bgmPatterns = makeBgmPatterns()
  }

  /** Resume a suspended context (needed after browser autoplay policy). */
  private ensure(): AudioContext | null {
    if (!this.ctx) return null
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  private get dest(): AudioNode | null {
    return this.master
  }

  // -------------------------------------------------------------------------
  // SFX — hits
  // -------------------------------------------------------------------------

  playHitLight(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    noiseBurst(ctx, this.dest, 800, 0.10, 0.5, 10)
  }

  playHitHeavy(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    noiseBurst(ctx, this.dest, 300, 0.15, 0.65, 7)
    tone(ctx, this.dest, 'sine', 80, 0.15, 0.5)
  }

  playHitCrit(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    // Heavy layer
    noiseBurst(ctx, this.dest, 300, 0.15, 0.65, 7)
    tone(ctx, this.dest, 'sine', 80, 0.15, 0.5)
    // High-freq ping on top
    tone(ctx, this.dest, 'sine', 2200, 0.18, 0.3)
  }

  // -------------------------------------------------------------------------
  // SFX — actions
  // -------------------------------------------------------------------------

  playSpecial(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    // Low-to-high sweep
    tone(ctx, this.dest, 'sawtooth', 80, 0.5, 0.35, 1200)
    // Bass impact timed to sweep peak
    const impactAt = 0.45
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 60
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, ctx.currentTime)
    g.gain.setValueAtTime(0.7, ctx.currentTime + impactAt)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + impactAt + 0.25)
    osc.connect(g)
    g.connect(this.dest)
    osc.start()
    osc.stop(ctx.currentTime + impactAt + 0.3)
  }

  playDodge(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    // Whoosh: high-to-low filtered noise sweep
    const bufLen = Math.ceil(ctx.sampleRate * 0.2)
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    fillNoise(buf.getChannelData(0))
    const src = ctx.createBufferSource()
    src.buffer = buf

    const filt = ctx.createBiquadFilter()
    filt.type = 'bandpass'
    filt.frequency.setValueAtTime(3000, ctx.currentTime)
    filt.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2)
    filt.Q.value = 5

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)

    src.connect(filt)
    filt.connect(gain)
    gain.connect(this.dest)
    src.start()
    src.stop(ctx.currentTime + 0.25)
  }

  playBlock(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    // Metallic clang: two short sines with fast decay
    tone(ctx, this.dest, 'sine', 1400, 0.1, 0.55)
    tone(ctx, this.dest, 'sine', 2100, 0.08, 0.25)
  }

  playKO(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    // Heavy bass drop
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(120, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.8)

    const g = ctx.createGain()
    g.gain.setValueAtTime(0.8, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0)

    osc.connect(g)
    g.connect(this.dest)
    osc.start()
    osc.stop(ctx.currentTime + 1.05)

    // Reverb-like noise tail
    noiseBurst(ctx, this.dest, 200, 1.0, 0.3, 4)
  }

  // -------------------------------------------------------------------------
  // SFX — encounter / UI
  // -------------------------------------------------------------------------

  playMenchiBeam(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    // Rising sine wave "laser charge"
    tone(ctx, this.dest, 'sine', 300, 0.3, 0.4, 1800)
  }

  playTankaCorrect(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    // Major triad C5-E5-G5, staggered for arpeggio feel
    const freqs = [NOTE['C5'], NOTE['E5'], NOTE['G5']]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const g = ctx.createGain()
      const startAt = ctx.currentTime + i * 0.05
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.gain.setValueAtTime(0.28, startAt)
      g.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.5)
      osc.connect(g)
      if (this.dest) g.connect(this.dest)
      osc.start(startAt)
      osc.stop(startAt + 0.55)
    })
  }

  playTankaWrong(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    // Descending chromatic: C4 B3 Bb3 A3
    const freqs = [NOTE['C4'], NOTE['B3'], NOTE['Bb3'], NOTE['A3']]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = freq
      const g = ctx.createGain()
      const startAt = ctx.currentTime + i * 0.075
      const dur = 0.08
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.gain.setValueAtTime(0.25, startAt)
      g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur)
      osc.connect(g)
      if (this.dest) g.connect(this.dest)
      osc.start(startAt)
      osc.stop(startAt + dur + 0.05)
    })
  }

  playComboUp(comboLevel: number): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    const freq = 400 + comboLevel * 50
    tone(ctx, this.dest, 'triangle', freq, 0.08, 0.35)
  }

  playVictory(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    // Bright major arpeggio: C5 E5 G5 C6
    const freqs = [NOTE['C5'], NOTE['E5'], NOTE['G5'], NOTE['C5'] * 2]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const g = ctx.createGain()
      const startAt = ctx.currentTime + i * 0.2
      const dur = 0.35
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.gain.setValueAtTime(0.32, startAt)
      g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur)
      osc.connect(g)
      if (this.dest) g.connect(this.dest)
      osc.start(startAt)
      osc.stop(startAt + dur + 0.05)
    })
  }

  playDefeat(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    // Slow descending minor: A4 G4 F4 E4
    const freqs = [NOTE['A4'], NOTE['G4'], NOTE['F4'], NOTE['E4']]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      const g = ctx.createGain()
      const startAt = ctx.currentTime + i * 0.35
      const dur = 0.4
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.gain.setValueAtTime(0.28, startAt)
      g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur)
      osc.connect(g)
      if (this.dest) g.connect(this.dest)
      osc.start(startAt)
      osc.stop(startAt + dur + 0.05)
    })
  }

  playUIClick(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    tone(ctx, this.dest, 'sine', 440, 0.05, 0.25)
  }

  playUIConfirm(): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest) return
    tone(ctx, this.dest, 'sine', NOTE['C5'], 0.12, 0.28)
    tone(ctx, this.dest, 'sine', NOTE['E5'], 0.12, 0.22)
  }

  // -------------------------------------------------------------------------
  // BGM
  // -------------------------------------------------------------------------

  startBGM(type: BgmType): void {
    const ctx = this.ensure()
    if (!ctx || !this.dest || !this.bgmPatterns) return

    this.stopBGM()

    const pattern = this.bgmPatterns[type]
    // step duration in ms: (60s / bpm) = one beat; one bar = 4 beats; step = bar / stepsPerBar
    const stepDurationMs = (60 / pattern.bpm / pattern.stepsPerBar) * 4 * 1000
    let stepIndex = 0

    const bgmGain = ctx.createGain()
    bgmGain.gain.setValueAtTime(0, ctx.currentTime)
    bgmGain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.5)
    bgmGain.connect(this.dest)

    const state: BgmState = {
      stopped: false,
      gainNode: bgmGain,
      intervalId: null,
    }
    this.bgm = state

    const tick = (): void => {
      if (state.stopped) return
      const ctx2 = this.ctx
      if (!ctx2) return

      const events = pattern.bars[stepIndex % pattern.bars.length]
      for (const ev of events) {
        if (ev.kind === 'osc') {
          const osc = ctx2.createOscillator()
          osc.type = ev.type
          osc.frequency.value = ev.freq
          const g = ctx2.createGain()
          g.gain.setValueAtTime(ev.gain, ctx2.currentTime)
          g.gain.exponentialRampToValueAtTime(0.0001, ctx2.currentTime + ev.dur)
          osc.connect(g)
          g.connect(bgmGain)
          osc.start()
          osc.stop(ctx2.currentTime + ev.dur + 0.05)
        } else {
          const bufLen = Math.ceil(ctx2.sampleRate * ev.dur)
          const buf = ctx2.createBuffer(1, bufLen, ctx2.sampleRate)
          fillNoise(buf.getChannelData(0))
          const src = ctx2.createBufferSource()
          src.buffer = buf
          const filt = ctx2.createBiquadFilter()
          filt.type = 'bandpass'
          filt.frequency.value = ev.freq
          filt.Q.value = ev.Q ?? 6
          const g = ctx2.createGain()
          g.gain.setValueAtTime(ev.gain, ctx2.currentTime)
          g.gain.exponentialRampToValueAtTime(0.0001, ctx2.currentTime + ev.dur)
          src.connect(filt)
          filt.connect(g)
          g.connect(bgmGain)
          src.start()
          src.stop(ctx2.currentTime + ev.dur + 0.05)
        }
      }
      stepIndex++
    }

    tick()
    state.intervalId = setInterval(tick, stepDurationMs)
  }

  stopBGM(): void {
    if (!this.bgm) return
    const ctx = this.ctx
    const state = this.bgm
    state.stopped = true

    if (state.intervalId !== null) {
      clearInterval(state.intervalId)
      state.intervalId = null
    }

    if (ctx) {
      const gain = state.gainNode
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
      // Disconnect after fade completes
      setTimeout(() => {
        try { gain.disconnect() } catch { /* already disconnected */ }
      }, 500)
    }

    this.bgm = null
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const AudioSystem = new AudioSystemClass()
