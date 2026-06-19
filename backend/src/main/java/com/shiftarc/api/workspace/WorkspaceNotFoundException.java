package com.shiftarc.api.workspace;

class WorkspaceNotFoundException extends RuntimeException {

    WorkspaceNotFoundException() {
        super("The local workspace could not be found");
    }
}
