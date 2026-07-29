package com.integrationhub.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "source_definition")
public class SourceDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true, length = 120)
    public String name;

    @Column(name = "source_type", nullable = false, length = 40)
    public String sourceType;

    @Column(nullable = false)
    public boolean active = true;

    /**
     * ADR-021 (E): entregar a esta fuente MUEVE DINERO. Solo tiene sentido con direction OUTPUT/BOTH.
     *
     * <p>Es la contraparte de {@code TaskProvider.movesMoney()} para las tareas GENERICAS: FILE_DELIVER
     * acepta cualquier sinkRef de salida —el mismo mecanismo con el que MT101_PAY deja el archivo en el
     * banco—, asi que sin esta marca una entrega de pagos armada con el se re-encolaria a ciegas tras
     * una caida de nodo.</p>
     *
     * <p>Es una DECLARACION sobre que es la conexion, no algo derivado del uso: que sea un banco no
     * cambia porque cambie el proceso que la referencia.</p>
     */
    @Column(name = "money_critical", nullable = false)
    public boolean moneyCritical = false;

    @Column(name = "configuration_json", nullable = false, columnDefinition = "text")
    public String configurationJson;

    // ADR-016: sentido de la definicion. INPUT (leer, FILE_READ) | OUTPUT (escribir, FILE_DELIVER) | BOTH.
    @Column(nullable = false, length = 10)
    public String direction = "INPUT";
}


