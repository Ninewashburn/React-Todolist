// src/utils/validation.ts

// Utility functions for validating Todo data
// Note: ValidationResult is defined in src/types/index.ts

interface ValidationResult {
    valid: boolean;
    error?: string;
}

// Function to validate the title of a todo
export function validateTodoTitle(title: string): ValidationResult {
    // Check if title is provided and is a string
    if (!title || typeof title !== 'string') {
        // Title is required
        return { valid: false, error : 'Le titre est requis' };
    }

    // Trim whitespace from both ends
    const trimmed = title.trim();

    // Array of validation checks
    const validations = [
        { condition: trimmed.length === 0, message: 'Le titre ne peut pas être vide' }, // Title cannot be empty
        { condition: trimmed.length < 3, message: 'Le titre doit contenir au moins 3 caractères' }, // Title must be at least 3 characters long
        { condition: trimmed.length > 100, message: 'Le titre ne peut pas dépasser 100 caractères' }, // Title cannot exceed 100 characters
        { condition: /[^a-zA-ZÀ-ÿ0-9 \-_'.,!?]/.test(trimmed), message: 'Le titre contient des caractères non autorisés' } // Title contains invalid characters
    ];

    // Find the first failed validation
    const failedValidation = validations.find(v => v.condition);

    // Return the result based on validation checks
    if (failedValidation) {
        return { valid: false, error: failedValidation.message };
    }

    // All validations passed
    return { valid: true };
}