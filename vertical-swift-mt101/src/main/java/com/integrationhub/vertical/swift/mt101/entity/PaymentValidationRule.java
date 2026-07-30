package com.integrationhub.vertical.swift.mt101.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * ADR-023: el schema se declara aqui explicitamente y no se deja al {@code search_path}.
 *
 * <p>El {@code search_path} de la conexion incluye ambos schemas, lo que basta para el SQL crudo —las
 * ~231 sentencias del vertical siguen resolviendo sus tablas sin cualificar— pero <b>no</b> para
 * Hibernate: su validacion de esquema inspecciona unicamente el schema por defecto, que es el primero
 * del {@code search_path} ({@code public}). Sin este {@code schema}, la aplicacion no arranca con
 * {@code Schema validation: missing table [payment_validation_rule]}.
 */
@Entity
@Table(name = "payment_validation_rule", schema = "vertical_mt101")
public class PaymentValidationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "rule_set", nullable = false, length = 50)
    public String ruleSet;

    @Column(nullable = false, length = 80)
    public String code;

    @Column(nullable = false, length = 20)
    public String standard;

    @Column(name = "applies_to", nullable = false, length = 50)
    public String appliesTo;

    @Column(nullable = false, length = 1)
    public String severity;

    @Column(name = "predicate_kind", nullable = false, length = 20)
    public String predicateKind;

    @Column(name = "predicate_body", nullable = false, columnDefinition = "text")
    public String predicateBody;

    @Column(nullable = false)
    public boolean active = true;
}
