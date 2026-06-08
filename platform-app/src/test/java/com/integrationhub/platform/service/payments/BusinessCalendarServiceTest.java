package com.integrationhub.platform.service.payments;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * @covers spec 008-mensajeria-pagos T-025
 */
class BusinessCalendarServiceTest {

    private BusinessCalendarService service;

    @BeforeEach
    void setUp() {
        service = new BusinessCalendarService();
    }

    @Test
    void weekendsAreNeverBusinessDays() {
        // Sabado 2026-06-13 y domingo 2026-06-14.
        assertFalse(service.isBusinessDay(LocalDate.of(2026, 6, 13), "PE"));
        assertFalse(service.isBusinessDay(LocalDate.of(2026, 6, 14), "PE"));
        assertFalse(service.isBusinessDay(LocalDate.of(2026, 6, 13), "EU"));
        assertFalse(service.isBusinessDay(LocalDate.of(2026, 6, 13), "US"));
        assertFalse(service.isBusinessDay(LocalDate.of(2026, 6, 13), "*"));
        assertFalse(service.isBusinessDay(LocalDate.of(2026, 6, 13), null));
    }

    @Test
    void weekdaysAreBusinessDaysOnGenericCalendar() {
        // Lunes 2026-06-08 hasta viernes 2026-06-12.
        for (int day = 8; day <= 12; day++) {
            var date = LocalDate.of(2026, 6, day);
            assertTrue(service.isBusinessDay(date, "*"), "expected business day for " + date);
        }
    }

    @Test
    void peruIndependenceDayIsHoliday() {
        // 28 jul 2026 cae martes.
        var julio28 = LocalDate.of(2026, 7, 28);
        assertEquals(java.time.DayOfWeek.TUESDAY, julio28.getDayOfWeek());
        assertFalse(service.isBusinessDay(julio28, "PE"), "28 jul es feriado PE");
        // No es feriado en otros calendarios.
        assertTrue(service.isBusinessDay(julio28, "US"));
        assertTrue(service.isBusinessDay(julio28, "EU"));
        assertTrue(service.isBusinessDay(julio28, "*"));
    }

    @Test
    void peruChristmasIsHoliday() {
        // 25 dic 2026 cae viernes.
        var christmas = LocalDate.of(2026, 12, 25);
        assertFalse(service.isBusinessDay(christmas, "PE"));
        assertFalse(service.isBusinessDay(christmas, "US"));
    }

    @Test
    void usJulyFourthIsHoliday() {
        // 4 jul 2026 cae sabado, asi que probamos 2025 (viernes).
        var indep = LocalDate.of(2025, 7, 4);
        assertEquals(java.time.DayOfWeek.FRIDAY, indep.getDayOfWeek());
        assertFalse(service.isBusinessDay(indep, "US"));
        assertTrue(service.isBusinessDay(indep, "PE"));
    }

    @Test
    void addBusinessDaysSkipsWeekendsAndHolidays() {
        // Desde viernes 2026-07-24 (PE business day) + 3 business days saltando
        // sabado/domingo Y feriados 28-29 jul -> debe llegar a viernes 2026-07-31.
        var from = LocalDate.of(2026, 7, 24);
        var result = service.addBusinessDays(from, 3, "PE");
        assertEquals(LocalDate.of(2026, 7, 31), result);
    }

    @Test
    void addBusinessDaysZeroReturnsFromIfBusinessDayElseNext() {
        var monday = LocalDate.of(2026, 6, 8);
        assertEquals(monday, service.addBusinessDays(monday, 0, "*"));
        var saturday = LocalDate.of(2026, 6, 13);
        // 0 desde un weekend devuelve el mismo day (no avanza) - decision de la API.
        assertEquals(saturday, service.addBusinessDays(saturday, 0, "*"));
    }

    @Test
    void nextBusinessDayFromFridaySkipsWeekend() {
        var friday = LocalDate.of(2026, 6, 12);
        assertEquals(LocalDate.of(2026, 6, 15), service.nextBusinessDay(friday, "*"));
    }

    @Test
    void addBusinessDaysRejectsNegative() {
        var from = LocalDate.of(2026, 6, 8);
        assertThrows(IllegalArgumentException.class, () -> service.addBusinessDays(from, -1, "*"));
    }

    @Test
    void supportedCalendarsListsExpected() {
        var calendars = service.supportedCalendars();
        assertTrue(calendars.contains("PE"));
        assertTrue(calendars.contains("EU"));
        assertTrue(calendars.contains("US"));
        assertTrue(calendars.contains("*"));
    }

    @Test
    void unknownCalendarFallsBackToWeekendsOnly() {
        // Calendario "XX" no existe: trata como sin festivos, solo weekends.
        var julio28 = LocalDate.of(2026, 7, 28);
        assertTrue(service.isBusinessDay(julio28, "XX"));
    }
}
