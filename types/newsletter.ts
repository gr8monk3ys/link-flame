/**
 * Newsletter subscription type definitions
 */

export interface Newsletter {
  id: string;
  email: string;
  subscribedAt: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Newsletter subscription request payload
 */
export interface NewsletterSubscribeRequest {
  email: string;
}

/**
 * Newsletter subscription response
 */
export interface NewsletterSubscribeResponse {
  email: string;
  subscriptionId?: string;
  alreadySubscribed?: boolean;
}
