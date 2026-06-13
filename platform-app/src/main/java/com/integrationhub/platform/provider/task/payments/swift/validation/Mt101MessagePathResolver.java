package com.integrationhub.platform.provider.task.payments.swift.validation;

import com.integrationhub.platform.spi.payments.Mt101Message;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Navega paths declarativos sobre el modelo {@link Mt101Message} para las reglas
 * de perfil bancario cargadas desde BD ({@code payment_validation_rule}).
 *
 * <p>Gramatica:</p>
 * <pre>
 *   sequenceA.requestedExecutionDate        → valor unico (mensaje)
 *   envelope.uetr                           → valor unico (mensaje)
 *   transactions[].beneficiary.option       → un valor por transaccion
 *   transactions[].amount.currency          → un valor por transaccion
 * </pre>
 *
 * <p>Cada segmento se resuelve por reflexion sobre el accessor del record
 * ({@code sequenceA()}, {@code beneficiary()}, ...). Un eslabon {@code null}
 * produce valor {@code null} (no excepcion): las reglas REQUIRED lo marcan,
 * las FORBIDDEN lo ignoran. Esto desacopla los perfiles del shape exacto del
 * modelo: agregar un campo al record lo hace navegable sin tocar este resolver.</p>
 *
 * @trace spec 008-mensajeria-pagos RF-011 (perfiles por banco)
 * @trace ADR-009
 */
final class Mt101MessagePathResolver {

    private static final String TRANSACTIONS_PREFIX = "transactions[].";
    private static final Map<String, Method> ACCESSOR_CACHE = new ConcurrentHashMap<>();

    private Mt101MessagePathResolver() {
        // Utility class.
    }

    /** Valor resuelto: txRef nulo cuando el path es a nivel de mensaje. */
    record PathValue(String transactionReference, Object value) {
    }

    static List<PathValue> resolve(Mt101Message message, String path) {
        if (message == null || path == null || path.isBlank()) {
            return List.of();
        }
        if (path.startsWith(TRANSACTIONS_PREFIX)) {
            var rest = path.substring(TRANSACTIONS_PREFIX.length());
            var result = new ArrayList<PathValue>();
            for (var tx : message.transactions()) {
                result.add(new PathValue(tx.transactionReference(), navigate(tx, rest)));
            }
            return result;
        }
        return List.of(new PathValue(null, navigate(message, path)));
    }

    private static Object navigate(Object root, String path) {
        var current = root;
        for (var segment : path.split("\\.")) {
            if (current == null) {
                return null;
            }
            current = invokeAccessor(current, segment);
        }
        return current;
    }

    private static Object invokeAccessor(Object target, String accessorName) {
        var cacheKey = target.getClass().getName() + "#" + accessorName;
        var method = ACCESSOR_CACHE.computeIfAbsent(cacheKey, key -> {
            try {
                return target.getClass().getMethod(accessorName);
            } catch (NoSuchMethodException missing) {
                throw new IllegalArgumentException(
                        "Unknown path segment '" + accessorName + "' on " + target.getClass().getSimpleName()
                                + "; valid segments are the record component names of the MT101 model");
            }
        });
        try {
            return method.invoke(target);
        } catch (ReflectiveOperationException error) {
            throw new IllegalStateException(
                    "Cannot read path segment '" + accessorName + "' on " + target.getClass().getSimpleName(), error);
        }
    }

    /** Un valor "presente" para reglas REQUIRED/FORBIDDEN. */
    static boolean hasValue(Object value) {
        if (value == null) {
            return false;
        }
        if (value instanceof String text) {
            return !text.isBlank();
        }
        if (value instanceof List<?> list) {
            return !list.isEmpty();
        }
        if (value instanceof Mt101Message.Party party) {
            return (party.account() != null && !party.account().isBlank())
                    || (party.bic() != null && !party.bic().isBlank())
                    || (party.nameAndAddress() != null && !party.nameAndAddress().isEmpty());
        }
        return true;
    }
}
