package com.integrationhub.platform.provider.task.filewrite;

// @trace ADR-016 / ADR-004 (FILE_WRITE: expresiones por columna de detalle)

import org.apache.commons.jexl3.JexlArithmetic;
import org.apache.commons.jexl3.JexlBuilder;
import org.apache.commons.jexl3.JexlEngine;
import org.apache.commons.jexl3.JexlException;
import org.apache.commons.jexl3.JexlExpression;
import org.apache.commons.jexl3.MapContext;

import java.math.BigDecimal;
import java.math.MathContext;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.regex.Pattern;

/**
 * ADR-016 / ADR-004: evalua una expresion JEXL por registro para computar el valor de una columna de detalle de
 * {@code FILE_WRITE}. Sigue el patron PLANO de {@code Mt101RouteTaskProvider} (native-proven en el nativo desplegado):
 * {@link MapContext} con los campos del registro como variables + {@code createExpression} — SIN namespace de funciones
 * (que requeriria reflection en native). El type/format/rounding de la columna se aplica DESPUES (FieldValueFormatter),
 * asi que la expresion solo produce el valor CRUDO.
 *
 * <p>Guardarraíles money-path:</p>
 * <ul>
 *   <li><b>fail-loud</b>: {@code strict(true).silent(false)} — una variable indefinida (typo) o un error de tipo lanza,
 *       no produce una celda incorrecta en silencio (a diferencia de MT101_ROUTE, que es null-tolerant para rutear).</li>
 *   <li><b>BigDecimal</b>: {@link FileWriteArithmetic} hace {@code + - * /} en BigDecimal cuando ambos operandos son
 *       numericos, evitando la imprecision de double y el gotcha de JEXL de concatenar strings numericas en {@code +}.</li>
 *   <li><b>determinismo</b>: sin funciones -> sin {@code now()}/{@code uuid()}/random; misma entrada = misma salida
 *       (requisito para el re-run correctivo byte-identico).</li>
 * </ul>
 */
public final class FileWriteExpressionEvaluator {

    private static final JexlEngine JEXL = new JexlBuilder()
            .strict(true)
            .silent(false)
            .arithmetic(new FileWriteArithmetic(MathContext.DECIMAL128))
            .cache(256)
            .create();

    private static final ConcurrentMap<String, JexlExpression> CACHE = new ConcurrentHashMap<>();

    /**
     * Evalua {@code expression} con los campos de {@code recordValues} (+ {@code metadata}: {@code _processExecutionId},
     * {@code _taskDefinitionId}) como variables. Fail-loud con contexto de columna/expresion.
     */
    public Object evaluate(String expression, String columnField, Map<String, Object> recordValues, Map<String, Object> metadata) {
        try {
            var compiled = CACHE.computeIfAbsent(expression, JEXL::createExpression);
            var context = new MapContext();
            recordValues.forEach(context::set);
            if (metadata != null) {
                metadata.forEach(context::set);
            }
            return compiled.evaluate(context);
        } catch (JexlException error) {
            throw new IllegalStateException("FILE_WRITE column '" + columnField + "' expression failed: "
                    + expression + " -> " + error.getMessage(), error);
        }
    }

    /**
     * Aritmetica BigDecimal para money-safety. {@code + - * /} usan BigDecimal cuando AMBOS operandos son numericos
     * (Number o String estrictamente numerica); si alguno no lo es se delega a la aritmetica base (para {@code +} eso
     * es concatenacion de strings, p.ej. {@code first + ' ' + last}). Nota: {@code +} de dos strings numericas SUMA
     * (no concatena) — decision deliberada de money-safety.
     */
    static final class FileWriteArithmetic extends JexlArithmetic {

        private static final Pattern NUMERIC = Pattern.compile("-?\\d+(\\.\\d+)?");
        private final MathContext mc;

        FileWriteArithmetic(MathContext mc) {
            super(true);
            this.mc = mc;
        }

        @Override
        public MathContext getMathContext() {
            return mc;
        }

        @Override
        public Object add(Object left, Object right) {
            var l = toBig(left);
            var r = toBig(right);
            return (l != null && r != null) ? l.add(r, mc) : super.add(left, right);
        }

        @Override
        public Object subtract(Object left, Object right) {
            var l = toBig(left);
            var r = toBig(right);
            return (l != null && r != null) ? l.subtract(r, mc) : super.subtract(left, right);
        }

        @Override
        public Object multiply(Object left, Object right) {
            var l = toBig(left);
            var r = toBig(right);
            return (l != null && r != null) ? l.multiply(r, mc) : super.multiply(left, right);
        }

        @Override
        public Object divide(Object left, Object right) {
            var l = toBig(left);
            var r = toBig(right);
            if (l != null && r != null) {
                if (r.signum() == 0) {
                    throw new ArithmeticException("division by zero");
                }
                return l.divide(r, mc);
            }
            return super.divide(left, right);
        }

        private static BigDecimal toBig(Object value) {
            if (value instanceof BigDecimal big) {
                return big;
            }
            if (value instanceof Number number) {
                return new BigDecimal(number.toString());
            }
            if (value instanceof String text && NUMERIC.matcher(text.trim()).matches()) {
                return new BigDecimal(text.trim());
            }
            return null;
        }
    }
}
