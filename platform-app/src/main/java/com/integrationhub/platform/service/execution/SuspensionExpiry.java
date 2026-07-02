package com.integrationhub.platform.service.execution;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Convenio entre providers suspendibles y el engine para auto-despertar:
 * si el {@code suspendedState} incluye la clave {@code _resumeAfterSeconds},
 * el engine fija {@code suspend_expires_at = now + N} y el
 * {@code SuspensionExpiryScheduler} reanuda la tarea cuando vence.
 *
 * <p>Sin la clave, la suspension espera indefinidamente un callback externo
 * (modo push puro).</p>
 *
 * @trace spec 003 T-017 (M-2 suspension engine), ADR-009
 */
public final class SuspensionExpiry {

    public static final String RESUME_AFTER_SECONDS_KEY = "_resumeAfterSeconds";

    private SuspensionExpiry() {
        // Utility class.
    }

    public static LocalDateTime expiresAt(Map<String, Object> suspendedState) {
        if (suspendedState == null) {
            return null;
        }
        var raw = suspendedState.get(RESUME_AFTER_SECONDS_KEY);
        if (raw == null || String.valueOf(raw).isBlank()) {
            return null;
        }
        long seconds;
        try {
            seconds = Long.parseLong(String.valueOf(raw));
        } catch (NumberFormatException invalid) {
            return null;
        }
        if (seconds <= 0) {
            return null;
        }
        return LocalDateTime.now().plusSeconds(seconds);
    }
}
