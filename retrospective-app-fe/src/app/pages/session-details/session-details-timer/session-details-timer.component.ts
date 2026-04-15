import {
  Component, EventEmitter, Input, OnInit, OnDestroy, OnChanges, Output, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SessionTimerState, SocketService, TimerCommand } from '../../../services/socket.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-session-details-timer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-details-timer.component.html',
  styleUrl: './session-details-timer.component.scss'
})
export class SessionDetailsTimerComponent implements OnInit, OnDestroy, OnChanges {

  @Input() sessionId: string = '';
  @Input() isSessionCreator: boolean = false;
  @Output() timerFinishedChange = new EventEmitter<boolean>();

  timerDurationMinutes: number = 5;
  timerDurationSeconds: number = 0;
  remainingSeconds: number = 300;
  isTimerRunning: boolean = false;
  isTimerFinished: boolean = false;
  timerError: string = '';

  private timerEndsAt: number | null = null;
  private alarmAudio: HTMLAudioElement | null = null;
  private backgroundAudio: HTMLAudioElement | null = null;
  private hasPlayedFinishAlarm: boolean = false;
  private readonly defaultAlarmSoundPath: string = 'assets/sounds/3dabrar-funny-alarm-317531.mp3';
  private readonly defaultBackgroundSoundPath: string = 'assets/sounds/alexgrohl-sweet-life-luxury-chill-438146.mp3';

  private socketSubs: Subscription[] = [];
  private realtimeTimer?: ReturnType<typeof setInterval>;

  constructor(
    private socketService: SocketService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.initSocketListeners();
    this.timerFinishedChange.emit(this.isTimerFinished);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessionId'] && !changes['sessionId'].firstChange) {
      this.socketSubs.forEach(s => s.unsubscribe());
      this.socketSubs = [];
      this.initSocketListeners();
    }
  }

  ngOnDestroy(): void {
    this.socketSubs.forEach(s => s.unsubscribe());
    this.stopRealtimeTicker();
    this.stopTimerAlarm();
    this.stopBackgroundMusic();
  }

  get timerDisplay(): string {
    const safeSeconds = Math.max(0, this.remainingSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  get progressPercent(): number {
    const total = this.timerDurationMinutes * 60 + this.timerDurationSeconds;
    if (total === 0) return 0;
    return Math.max(0, Math.min(100, (this.remainingSeconds / total) * 100));
  }

  get isUrgent(): boolean {
    return this.remainingSeconds <= 30 && this.isTimerRunning;
  }

  onTimerMinutesChange(value: number | string): void {
    if (this.isTimerRunning) return;
    const parsed = Number(value);
    this.timerDurationMinutes = Number.isFinite(parsed)
      ? Math.min(180, Math.max(0, Math.floor(parsed))) : 0;
    this.pushTimerConfiguration();
  }

  onTimerSecondsChange(value: number | string): void {
    if (this.isTimerRunning) return;
    const parsed = Number(value);
    this.timerDurationSeconds = Number.isFinite(parsed)
      ? Math.min(59, Math.max(0, Math.floor(parsed))) : 0;
    this.pushTimerConfiguration();
  }

  startFeedbackTimer(): void {
    if (this.isTimerRunning || !this.isSessionCreator) return;
    const durationSeconds = this.getDurationInputSeconds();
    if (durationSeconds < 1) {
      this.timerError = 'Set at least 1 second for the timer.';
      return;
    }
    this.timerError = '';
    this.hasPlayedFinishAlarm = false;
    this.socketService.emitTimerCommand(this.sessionId, 'start', { durationSeconds });
  }

  pauseFeedbackTimer(): void {
    if (!this.isTimerRunning || !this.isSessionCreator) return;
    this.socketService.emitTimerCommand(this.sessionId, 'pause');
  }

  stopFeedbackAlarm(): void {
    if (!this.isSessionCreator) return;

    this.stopTimerAlarm();
    this.stopBackgroundMusic();
    this.hasPlayedFinishAlarm = false;
    this.timerError = '';

    const durationSeconds = this.getDurationInputSeconds();
    this.socketService.emitTimerCommand(this.sessionId, 'reset', { durationSeconds });
  }

  resetFeedbackTimer(): void {
    if (!this.isSessionCreator) return;
    const durationSeconds = this.getDurationInputSeconds();
    this.socketService.emitTimerCommand(this.sessionId, 'reset', { durationSeconds });
    this.stopTimerAlarm();
    this.stopBackgroundMusic();
    this.timerError = '';
    this.hasPlayedFinishAlarm = false;
  }

  private initSocketListeners(): void {
    this.socketSubs.push(
      this.socketService.onTimerSynced().subscribe(({ sessionId, state }) => {
        if (sessionId !== this.sessionId) return;
        this.applyTimerState(state);
      })
    );

    this.socketSubs.push(
      this.socketService.onTimerUpdated().subscribe(({ sessionId, state, command }) => {
        if (sessionId !== this.sessionId) return;
        this.applyTimerState(state, command);
      })
    );
  }

  private applyTimerState(state: SessionTimerState, command?: TimerCommand): void {
    const wasFinished = this.isTimerFinished;

    this.remainingSeconds = Math.max(0, Math.floor(state.remainingSeconds || 0));
    this.isTimerRunning = !!state.isRunning;
    this.isTimerFinished = !!state.isFinished;
    this.timerFinishedChange.emit(this.isTimerFinished);
    this.timerEndsAt = state.endsAt ?? null;
    this.syncDurationInputs(state.durationSeconds);

    if (this.isTimerRunning) {
      this.startRealtimeTicker();
    } else {
      this.stopRealtimeTicker();
    }

    this.syncBackgroundMusicPlayback();

    if (!wasFinished && this.isTimerFinished && command === 'finish' && !this.hasPlayedFinishAlarm) {
      this.hasPlayedFinishAlarm = true;
      this.notification.error('Time\'s Up', 'Feedback submissions are now closed.');
      this.playTimerAlarm();
    }

    if (!this.isTimerFinished) {
      this.hasPlayedFinishAlarm = false;
      this.stopTimerAlarm();
    }
  }

  private startRealtimeTicker(): void {
    if (this.realtimeTimer || !this.timerEndsAt) return;
    this.realtimeTimer = setInterval(() => {
      if (!this.isTimerRunning || !this.timerEndsAt) {
        this.stopRealtimeTicker();
        return;
      }
      this.remainingSeconds = Math.max(0, Math.ceil((this.timerEndsAt - Date.now()) / 1000));
    }, 250);
  }

  private stopRealtimeTicker(): void {
    if (this.realtimeTimer) {
      clearInterval(this.realtimeTimer);
      this.realtimeTimer = undefined;
    }
  }

  private getDurationInputSeconds(): number {
    const minutes = Math.min(180, Math.max(0, Math.floor(Number(this.timerDurationMinutes) || 0)));
    const seconds = Math.min(59, Math.max(0, Math.floor(Number(this.timerDurationSeconds) || 0)));
    return Math.min(180 * 60, minutes * 60 + seconds);
  }

  private syncDurationInputs(totalSeconds: number): void {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    this.timerDurationMinutes = Math.floor(safeSeconds / 60);
    this.timerDurationSeconds = safeSeconds % 60;
  }

  private pushTimerConfiguration(): void {
    if (!this.isSessionCreator || this.isTimerRunning) return;
    const durationSeconds = this.getDurationInputSeconds();
    if (durationSeconds < 1) {
      this.timerError = 'Set at least 1 second for the timer.';
      return;
    }
    this.timerError = '';
    this.socketService.emitTimerCommand(this.sessionId, 'configure', { durationSeconds });
  }

  private playTimerAlarm(): void {
    this.alarmAudio = new Audio(this.defaultAlarmSoundPath);
    this.alarmAudio.loop = true;
    this.alarmAudio.volume = 1;
    this.alarmAudio.play().catch(() => {
      this.alarmAudio = null;
      this.playFallbackAlarm();
    });
  }

  private syncBackgroundMusicPlayback(): void {
    const shouldPlayBackground = this.isTimerRunning && !this.isTimerFinished;
    if (shouldPlayBackground) {
      this.playBackgroundMusic();
      return;
    }

    this.stopBackgroundMusic();
  }

  private playBackgroundMusic(): void {
    if (this.backgroundAudio) {
      return;
    }

    const audio = new Audio(this.defaultBackgroundSoundPath);
    audio.loop = true;
    audio.volume = 0.2;
    audio.play().catch(() => {
      this.backgroundAudio = null;
    });
    this.backgroundAudio = audio;
  }

  private stopBackgroundMusic(): void {
    if (!this.backgroundAudio) {
      return;
    }

    this.backgroundAudio.pause();
    this.backgroundAudio.currentTime = 0;
    this.backgroundAudio = null;
  }

  private stopTimerAlarm(): void {
    if (this.alarmAudio) {
      this.alarmAudio.pause();
      this.alarmAudio.currentTime = 0;
      this.alarmAudio = null;
    }
  }

  private playFallbackAlarm(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextRef = window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextRef) return;

      const audioContext = new AudioContextRef();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.9);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.9);
      oscillator.onended = () => audioContext.close().catch(() => undefined);
    } catch {
      // Silently ignore audio errors
    }
  }
}