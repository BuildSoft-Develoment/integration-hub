package com.integrationhub.platform.service.payments;

import jakarta.enterprise.context.ApplicationScoped;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.MonthDay;
import java.util.Map;
import java.util.Set;

/**
 * Servicio de calendario de business days para validacion de fechas en flujos
 * de pagos (T-025 spec 008).
 *
 * <p>Calendarios soportados (slice 3.1):</p>
 * <ul>
 *   <li>{@code PE}: feriados fijos de Peru (no movables) + lunes-viernes.</li>
 *   <li>{@code EU}: lunes-viernes (sin festivos nacionales; cada pais europeo
 *       tiene su propio set).</li>
 *   <li>{@code US}: festivos fijos federales aproximados (NYSE-like).</li>
 *   <li>{@code *} / {@code null}: solo weekends.</li>
 * </ul>
 *
 * <p>Festivos movibles (Pascua, Acción de Gracias) NO se calculan en esta version.
 * Para un calendario productivo completo, integrar con un servicio externo
 * (ej. nager.date) o cargar feriados desde tabla configurable.</p>
 *
 * @trace spec 008-mensajeria-pagos T-025, RF-002
 * @trace ADR-009
 */
@ApplicationScoped
public class BusinessCalendarService {

    /** Feriados fijos Peru (sin movibles). */
    private static final Set<MonthDay> PE_HOLIDAYS = Set.of(
            MonthDay.of(1, 1),    // Año Nuevo
            MonthDay.of(5, 1),    // Dia del Trabajo
            MonthDay.of(6, 7),    // Bandera (Batalla de Arica)
            MonthDay.of(6, 29),   // San Pedro y San Pablo
            MonthDay.of(7, 23),   // Fuerza Aerea (Batalla de La Concepcion)
            MonthDay.of(7, 28),   // Independencia
            MonthDay.of(7, 29),   // Independencia
            MonthDay.of(8, 6),    // Batalla de Junin
            MonthDay.of(8, 30),   // Santa Rosa de Lima
            MonthDay.of(10, 8),   // Combate de Angamos
            MonthDay.of(11, 1),   // Todos los Santos
            MonthDay.of(12, 8),   // Inmaculada Concepcion
            MonthDay.of(12, 9),   // Batalla de Ayacucho
            MonthDay.of(12, 25)   // Navidad
    );

    /** Feriados fijos federales US aproximados. */
    private static final Set<MonthDay> US_HOLIDAYS = Set.of(
            MonthDay.of(1, 1),    // New Year
            MonthDay.of(6, 19),   // Juneteenth
            MonthDay.of(7, 4),    // Independence Day
            MonthDay.of(11, 11),  // Veterans Day
            MonthDay.of(12, 25)   // Christmas
    );

    private static final Map<String, Set<MonthDay>> HOLIDAYS_BY_CALENDAR = Map.of(
            "PE", PE_HOLIDAYS,
            "US", US_HOLIDAYS,
            "EU", Set.of()
    );

    /**
     * Verifica si la fecha es business day en el calendario indicado.
     *
     * @param date fecha a evaluar.
     * @param calendar identificador del calendario ({@code PE}, {@code EU}, {@code US}).
     *                 {@code null}, vacio o {@code "*"} usa solo weekends.
     * @return true si es lunes-viernes y no festivo en ese calendario.
     */
    public boolean isBusinessDay(LocalDate date, String calendar) {
        if (date == null) {
            throw new IllegalArgumentException("date cannot be null");
        }
        var dayOfWeek = date.getDayOfWeek();
        if (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY) {
            return false;
        }
        var holidays = resolveHolidays(calendar);
        return !holidays.contains(MonthDay.of(date.getMonthValue(), date.getDayOfMonth()));
    }

    /**
     * Calcula la fecha N business days despues de {@code from} en el calendario
     * indicado. Si N=0 devuelve el siguiente business day &gt;= from (igual que
     * {@code nextBusinessDay} si {@code from} ya lo es).
     */
    public LocalDate addBusinessDays(LocalDate from, int businessDays, String calendar) {
        if (from == null) {
            throw new IllegalArgumentException("from cannot be null");
        }
        if (businessDays < 0) {
            throw new IllegalArgumentException("businessDays must be >= 0");
        }
        var current = from;
        int remaining = businessDays;
        while (remaining > 0) {
            current = current.plusDays(1);
            if (isBusinessDay(current, calendar)) {
                remaining--;
            }
        }
        return current;
    }

    /**
     * Siguiente business day estricto (excluye {@code from} aunque sea business day).
     * Equivalente a {@code addBusinessDays(from, 1, calendar)}.
     */
    public LocalDate nextBusinessDay(LocalDate from, String calendar) {
        return addBusinessDays(from, 1, calendar);
    }

    /** Lista de calendarios soportados (para UI/validacion). */
    public Set<String> supportedCalendars() {
        return Set.of("PE", "EU", "US", "*");
    }

    private Set<MonthDay> resolveHolidays(String calendar) {
        if (calendar == null || calendar.isBlank() || "*".equals(calendar)) {
            return Set.of();
        }
        return HOLIDAYS_BY_CALENDAR.getOrDefault(calendar.toUpperCase(), Set.of());
    }
}
