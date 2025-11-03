/**
 * Contact form type definitions
 */

export interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: Date | string;
  status: "new" | "read" | "replied" | "archived";
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Contact form submission request payload
 */
export interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Contact form submission response
 */
export interface ContactFormResponse {
  id: string;
  message: string;
}
