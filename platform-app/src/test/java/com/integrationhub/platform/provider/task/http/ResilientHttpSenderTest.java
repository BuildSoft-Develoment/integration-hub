package com.integrationhub.platform.provider.task.http;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class ResilientHttpSenderTest {

    @Test
    void promotes5xxToRemoteServerException() {
        RemoteServerException error =
                assertThrows(RemoteServerException.class, () -> ResilientHttpSender.throwIfServerError(503));
        assertEquals(503, error.statusCode());
    }

    @Test
    void doesNotPromoteClientErrors() {
        assertDoesNotThrow(() -> ResilientHttpSender.throwIfServerError(404));
        assertDoesNotThrow(() -> ResilientHttpSender.throwIfServerError(429));
    }

    @Test
    void doesNotPromoteSuccess() {
        assertDoesNotThrow(() -> ResilientHttpSender.throwIfServerError(200));
        assertDoesNotThrow(() -> ResilientHttpSender.throwIfServerError(204));
    }
}
