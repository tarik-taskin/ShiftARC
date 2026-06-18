package com.shiftarc.api.system;

public record SystemStatusResponse(
    String service,
    String version,
    SystemComponentStatus status,
    SystemComponentStatus database
) {
}
