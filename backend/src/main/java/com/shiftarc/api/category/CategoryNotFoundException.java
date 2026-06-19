package com.shiftarc.api.category;

class CategoryNotFoundException extends RuntimeException {

    CategoryNotFoundException() {
        super("Category could not be found in the local workspace");
    }
}
