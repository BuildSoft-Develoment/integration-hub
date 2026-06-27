package com.integrationhub.platform.api.resource.process;

import com.integrationhub.platform.api.response.process.ProcessScheduleResponse;
import com.integrationhub.platform.service.process.ProcessScheduleQueryService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

import static com.integrationhub.platform.api.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PAYMENTS_OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

@Path("/api/process-schedules")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProcessScheduleResource {

    private final ProcessScheduleQueryService processScheduleQueryService;

    public ProcessScheduleResource(ProcessScheduleQueryService processScheduleQueryService) {
        this.processScheduleQueryService = processScheduleQueryService;
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public List<ProcessScheduleResponse> list() {
        return processScheduleQueryService.listScheduled();
    }
}
