package com.integrationhub.platform.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class NumberAdderTest {

    private final NumberAdder numberAdder = new NumberAdder();

    @Test
    void addsTwoPositiveNumbers() {
        assertEquals(5, numberAdder.add(2, 3));
    }

    @Test
    void addsNegativeNumbersAndZero() {
        assertEquals(-2, numberAdder.add(-5, 3));
        assertEquals(7, numberAdder.add(7, 0));
    }
}
