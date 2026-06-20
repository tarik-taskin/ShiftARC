package com.shiftarc.api.execution;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

import com.shiftarc.api.execution.ExecutionRepository.ItemTarget;
import com.shiftarc.api.execution.ExecutionRepository.SessionTarget;
import com.shiftarc.api.workspace.LocalWorkspace;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExecutionService {
    private final ExecutionRepository repository;
    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    @Autowired
    ExecutionService(ExecutionRepository repository, JdbcTemplate jdbcTemplate) {
        this(repository, jdbcTemplate, Clock.systemUTC());
    }

    ExecutionService(ExecutionRepository repository, JdbcTemplate jdbcTemplate, Clock clock) {
        this.repository = repository; this.jdbcTemplate = jdbcTemplate; this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ExecutionStateResponse state() {
        Context context = context();
        return repository.state(LocalWorkspace.ID, context.date(), context.timezone(), Instant.now(clock));
    }

    @Transactional
    public ExecutionStateResponse start(ExecutionRequests.Start request) {
        Context context = context(); Instant startedAt = instant(request.startedAt());
        validateNotFuture(startedAt);
        ItemTarget item = repository.requireStartableTodayItem(LocalWorkspace.ID, request.dailyPlanItemId(), context.date());
        repository.start(LocalWorkspace.ID, item, startedAt);
        return repository.state(LocalWorkspace.ID, context.date(), context.timezone(), Instant.now(clock));
    }

    @Transactional
    public ExecutionStateResponse finish(ExecutionRequests.Finish request) {
        Context context = context(); Instant endedAt = instant(request.endedAt());
        SessionTarget session = repository.requireActiveSession(LocalWorkspace.ID, request.sessionId(), request.version());
        validateEnd(session, endedAt);
        repository.finish(LocalWorkspace.ID, session, endedAt, "FINISHED", null);
        return repository.state(LocalWorkspace.ID, context.date(), context.timezone(), Instant.now(clock));
    }

    @Transactional
    public ExecutionStateResponse transition(ExecutionRequests.Transition request) {
        Context context = context(); Instant occurredAt = instant(request.occurredAt());
        SessionTarget current = repository.requireActiveSession(LocalWorkspace.ID, request.sessionId(), request.version());
        validateEnd(current, occurredAt);
        ItemTarget next = repository.requireStartableTodayItem(LocalWorkspace.ID, request.nextDailyPlanItemId(), context.date());
        repository.finish(LocalWorkspace.ID, current, occurredAt, "TRANSITIONED", next.id());
        repository.start(LocalWorkspace.ID, next, occurredAt);
        return repository.state(LocalWorkspace.ID, context.date(), context.timezone(), Instant.now(clock));
    }

    private Context context() {
        String timezone = jdbcTemplate.queryForObject(
            "SELECT timezone FROM shiftarc.workspace_settings WHERE workspace_id = ?",
            String.class,
            LocalWorkspace.ID
        );
        return new Context(timezone, LocalDate.now(clock.withZone(ZoneId.of(timezone))));
    }

    private Instant instant(Instant requested) { return requested == null ? Instant.now(clock) : requested; }
    private void validateNotFuture(Instant value) { if (value.isAfter(Instant.now(clock).plusSeconds(5))) throw new ExecutionValidationException("Execution time cannot be in the future"); }
    private void validateEnd(SessionTarget session, Instant endedAt) { validateNotFuture(endedAt); if (!endedAt.isAfter(session.startedAt())) throw new ExecutionValidationException("Execution end must be after its start"); }
    private record Context(String timezone, LocalDate date) {}
}
