package com.shiftarc.api.weeklyplan;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/weekly-plan")
public class WeeklyPlanController {

    private final WeeklyPlanService service;

    WeeklyPlanController(WeeklyPlanService service) {
        this.service = service;
    }

    @GetMapping
    WeeklyPlanResponse get() {
        return service.get();
    }

    @PutMapping
    WeeklyPlanResponse replace(@Valid @RequestBody WeeklyPlanUpdateRequest request) {
        return service.replace(request);
    }
}
