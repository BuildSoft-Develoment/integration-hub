package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "payment_validation_rule")
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
