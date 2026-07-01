package com.integrationhub.platform.api.resource.plugin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.integrationhub.platform.entity.UiPluginCatalogEntry;
import com.integrationhub.platform.repository.UiPluginCatalogEntryRepository;
import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static com.integrationhub.platform.api.security.PlatformRoles.AUDITOR;
import static com.integrationhub.platform.api.security.PlatformRoles.INTEGRATION_ADMIN;
import static com.integrationhub.platform.api.security.PlatformRoles.OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PAYMENTS_OPERATOR;
import static com.integrationhub.platform.api.security.PlatformRoles.PLATFORM_ADMIN;

/**
 * Runtime-managed catalog of external frontend plugin manifests. The shell's boot-time
 * loader reads it (any authenticated user); only admins may add or remove entries.
 */
@Path("/api/plugins/ui-catalog")
@Produces(MediaType.APPLICATION_JSON)
public class UiPluginCatalogResource {

    private final UiPluginCatalogEntryRepository repository;
    private final ObjectMapper mapper;

    public UiPluginCatalogResource(UiPluginCatalogEntryRepository repository, ObjectMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public record UiPluginCatalogResponse(List<JsonNode> manifests) {
    }

    @GET
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, OPERATOR, PAYMENTS_OPERATOR, AUDITOR})
    public UiPluginCatalogResponse list() {
        var manifests = new ArrayList<JsonNode>();
        for (var entry : repository.listOrdered()) {
            try {
                manifests.add(mapper.readTree(entry.manifestJson));
            } catch (com.fasterxml.jackson.core.JsonProcessingException ignored) {
                // Skip a corrupt entry rather than failing the whole catalog.
            }
        }
        return new UiPluginCatalogResponse(manifests);
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public UiPluginCatalogResponse upsert(JsonNode manifest) {
        var idNode = manifest == null ? null : manifest.get("id");
        if (idNode == null || !idNode.isTextual() || idNode.asText().isBlank()) {
            throw new BadRequestException("Frontend plugin manifest requires a non-blank \"id\".");
        }
        var pluginId = idNode.asText().trim();
        String json;
        try {
            json = mapper.writeValueAsString(manifest);
        } catch (com.fasterxml.jackson.core.JsonProcessingException error) {
            throw new BadRequestException("Frontend plugin manifest is not serializable JSON.");
        }

        var entry = repository.findById(pluginId);
        if (entry == null) {
            entry = new UiPluginCatalogEntry();
            entry.pluginId = pluginId;
            entry.createdAt = LocalDateTime.now();
            entry.manifestJson = json;
            repository.persist(entry);
        } else {
            entry.manifestJson = json;
        }
        return list();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN})
    public UiPluginCatalogResponse remove(@PathParam("id") String id) {
        if (!repository.deleteById(id)) {
            throw new NotFoundException("Frontend plugin \"" + id + "\" is not in the catalog.");
        }
        return list();
    }
}
