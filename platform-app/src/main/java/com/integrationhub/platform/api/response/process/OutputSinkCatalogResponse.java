package com.integrationhub.platform.api.response.process;

import java.util.List;

/**
 * Tipos de fuente entregables hoy (los que tienen {@code OutputSink}). El front lo cruza con el
 * {@code sourceType} de cada fuente para no ofrecer destinos que no se sabrian escribir.
 */
public record OutputSinkCatalogResponse(List<String> deliverableTypes) {
}
