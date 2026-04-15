package com.integrationhub.platform.domain;
public enum ConnectionType {
    ORACLE,
    POSTGRESQL,
    SQLSERVER,
    MYSQL,
    MONGODB;
    public boolean isJdbc() {
        return this != MONGODB;
    }
}