package com.shiftarc.api.history;

class HistoryNotFoundException extends RuntimeException {
    HistoryNotFoundException() { super("No daily snapshot exists for this date"); }
}
