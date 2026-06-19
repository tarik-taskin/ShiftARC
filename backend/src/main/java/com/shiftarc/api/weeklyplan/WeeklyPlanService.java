package com.shiftarc.api.weeklyplan;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.shiftarc.api.workspace.LocalWorkspace;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WeeklyPlanService {

    private final WeeklyPlanRepository repository;

    WeeklyPlanService(WeeklyPlanRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public WeeklyPlanResponse get() {
        return repository.find(LocalWorkspace.ID);
    }

    @Transactional
    public WeeklyPlanResponse replace(WeeklyPlanUpdateRequest request) {
        Set<Short> days = new HashSet<>();
        Set<UUID> checkedDayTypes = new HashSet<>();
        for (WeeklyPlanUpdateRequest.Assignment assignment : request.assignments()) {
            if (!days.add(assignment.dayOfWeek())) {
                throw new WeeklyPlanValidationException("Each weekday can only be assigned once");
            }
            if (checkedDayTypes.add(assignment.dayTypeId())
                && !repository.isActiveDayType(LocalWorkspace.ID, assignment.dayTypeId())) {
                throw new WeeklyPlanValidationException(
                    "Weekly plans can only use active day types from the local workspace"
                );
            }
        }
        List<WeeklyPlanUpdateRequest.Assignment> ordered = request.assignments().stream()
            .sorted((left, right) -> Short.compare(left.dayOfWeek(), right.dayOfWeek()))
            .toList();
        return repository.replace(LocalWorkspace.ID, request.version(), ordered);
    }
}
