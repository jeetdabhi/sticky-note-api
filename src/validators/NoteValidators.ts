import { body, param } from "express-validator";

const noteValidators = {
  validateNoteCreation: [
    body("title").optional().trim().isString().withMessage("Title must be a string"),
    body("content").optional().trim().isString().withMessage("Content must be a string"),
    body("date").optional().isISO8601().withMessage("Date must be in ISO 8601 format"),
  ],

  validateNoteUpdate: [
    param("id").isMongoId().withMessage("Invalid note ID"),
    body("title").optional().trim().isString().withMessage("Title must be a string"),
    body("content").optional().trim().isString().withMessage("Content must be a string"),
    body("date").optional().isISO8601().withMessage("Date must be in ISO 8601 format"),
  ],

  validateNoteId: [
    param("id").isMongoId().withMessage("Invalid note ID"),
  ]
};

export default noteValidators;
