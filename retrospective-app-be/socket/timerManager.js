const sessionTimers = new Map();

const DEFAULT_DURATION_SECONDS = 5 * 60;
const MAX_DURATION_SECONDS = 3 * 60 * 60;

function clampDuration(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_DURATION_SECONDS;
  }

  return Math.min(MAX_DURATION_SECONDS, Math.max(1, Math.floor(parsed)));
}

function normalizeSoundUrl(value) {
  return typeof value === "string" ? value.trim() : "";
}

function nowMs() {
  return Date.now();
}

function getOrCreateTimer(sessionId) {
  if (!sessionTimers.has(sessionId)) {
    sessionTimers.set(sessionId, {
      durationSeconds: DEFAULT_DURATION_SECONDS,
      remainingSeconds: DEFAULT_DURATION_SECONDS,
      isRunning: false,
      isFinished: false,
      endsAt: null,
      alarmSoundUrl: "",
      backgroundSoundUrl: "",
      backgroundSoundStartedAt: null,
      backgroundSoundElapsedMs: 0,
      timeoutId: null,
      updatedAt: nowMs()
    });
  }

  return sessionTimers.get(sessionId);
}

function toPublicTimerState(timer) {
  return {
    durationSeconds: timer.durationSeconds,
    remainingSeconds: timer.remainingSeconds,
    isRunning: timer.isRunning,
    isFinished: timer.isFinished,
    endsAt: timer.endsAt,
    alarmSoundUrl: timer.alarmSoundUrl,
    backgroundSoundUrl: timer.backgroundSoundUrl,
    backgroundSoundStartedAt: timer.backgroundSoundStartedAt,
    updatedAt: timer.updatedAt
  };
}

function clearTimerTimeout(timer) {
  if (timer.timeoutId) {
    clearTimeout(timer.timeoutId);
    timer.timeoutId = null;
  }
}

function emitTimerUpdate(io, sessionId, command) {
  const timer = getOrCreateTimer(sessionId);
  io.to(sessionId).emit("timer:update", {
    sessionId,
    command,
    state: toPublicTimerState(timer)
  });
}

function scheduleTimerFinish(io, sessionId) {
  const timer = getOrCreateTimer(sessionId);
  clearTimerTimeout(timer);

  if (!timer.isRunning || !timer.endsAt) {
    return;
  }

  const msUntilFinish = Math.max(0, timer.endsAt - nowMs());

  timer.timeoutId = setTimeout(() => {
    const freshTimer = getOrCreateTimer(sessionId);
    freshTimer.isRunning = false;
    freshTimer.isFinished = true;
    freshTimer.remainingSeconds = 0;
    freshTimer.endsAt = null;
    freshTimer.updatedAt = nowMs();
    clearTimerTimeout(freshTimer);
    emitTimerUpdate(io, sessionId, "finish");
  }, msUntilFinish);
}

function getTimerSyncPayload(sessionId) {
  if (!sessionTimers.has(sessionId)) {
    return null;
  }

  const timer = getOrCreateTimer(sessionId);
  return {
    sessionId,
    state: toPublicTimerState(timer)
  };
}

function handleTimerCommand(io, commandData = {}) {
  const { sessionId, command, payload } = commandData;
  if (!sessionId || typeof command !== "string") {
    return;
  }

  const timer = getOrCreateTimer(sessionId);
  const nextPayload = payload || {};
  const nextSoundUrl = normalizeSoundUrl(nextPayload.alarmSoundUrl);
  const nextBackgroundSoundUrl = normalizeSoundUrl(nextPayload.backgroundSoundUrl);

  if (typeof nextPayload.alarmSoundUrl === "string") {
    timer.alarmSoundUrl = nextSoundUrl;
  }

  if (typeof nextPayload.backgroundSoundUrl === "string") {
    const didBackgroundTrackChange = timer.backgroundSoundUrl !== nextBackgroundSoundUrl;
    timer.backgroundSoundUrl = nextBackgroundSoundUrl;

    if (didBackgroundTrackChange) {
      timer.backgroundSoundElapsedMs = 0;
      timer.backgroundSoundStartedAt = timer.isRunning ? nowMs() : null;
    }
  }

  if (command === "configure") {
    const requestedDuration = Number(nextPayload.durationSeconds);
    const hasDurationUpdate = Number.isFinite(requestedDuration) && requestedDuration >= 1;

    if (!timer.isRunning && hasDurationUpdate) {
      timer.durationSeconds = clampDuration(requestedDuration);
      timer.remainingSeconds = timer.durationSeconds;
      timer.isFinished = false;
      timer.endsAt = null;
      timer.backgroundSoundStartedAt = null;
      timer.backgroundSoundElapsedMs = 0;
      clearTimerTimeout(timer);
    }
  }

  if (command === "start") {
    if (!timer.isRunning) {
      const requestedDuration = Number(nextPayload.durationSeconds);
      if (Number.isFinite(requestedDuration) && requestedDuration >= 1) {
        timer.durationSeconds = clampDuration(requestedDuration);
      }

      if (timer.remainingSeconds <= 0) {
        timer.remainingSeconds = timer.durationSeconds;
      }

      timer.isRunning = true;
      timer.isFinished = false;
      timer.endsAt = nowMs() + timer.remainingSeconds * 1000;
      const fallbackElapsedMs = Math.max(0, (timer.durationSeconds - timer.remainingSeconds) * 1000);
      const resumeElapsedMs = Math.max(0, Number(timer.backgroundSoundElapsedMs) || 0);
      const effectiveElapsedMs = resumeElapsedMs > 0 ? resumeElapsedMs : fallbackElapsedMs;
      timer.backgroundSoundStartedAt = nowMs() - effectiveElapsedMs;
      timer.backgroundSoundElapsedMs = effectiveElapsedMs;
      scheduleTimerFinish(io, sessionId);
    }
  }

  if (command === "pause") {
    if (timer.isRunning && timer.endsAt) {
      timer.remainingSeconds = Math.max(0, Math.ceil((timer.endsAt - nowMs()) / 1000));
      timer.isRunning = false;
      timer.endsAt = null;
      timer.isFinished = timer.remainingSeconds <= 0;
      if (timer.backgroundSoundStartedAt) {
        timer.backgroundSoundElapsedMs = Math.max(0, nowMs() - timer.backgroundSoundStartedAt);
      }
      timer.backgroundSoundStartedAt = null;
      clearTimerTimeout(timer);
    }
  }

  if (command === "reset") {
    const requestedDuration = Number(nextPayload.durationSeconds);
    if (Number.isFinite(requestedDuration) && requestedDuration >= 1) {
      timer.durationSeconds = clampDuration(requestedDuration);
    }

    timer.isRunning = false;
    timer.isFinished = false;
    timer.remainingSeconds = timer.durationSeconds;
    timer.endsAt = null;
    timer.backgroundSoundStartedAt = null;
    timer.backgroundSoundElapsedMs = 0;
    clearTimerTimeout(timer);
  }

  if (command === "stop-alarm") {
    // Intentionally do not mutate timer running/finished state.
    // This command only broadcasts a session-wide audio stop.
  }

  timer.updatedAt = nowMs();
  emitTimerUpdate(io, sessionId, command);
}

module.exports = {
  getTimerSyncPayload,
  handleTimerCommand
};
