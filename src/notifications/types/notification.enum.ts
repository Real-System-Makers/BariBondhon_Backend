export enum NotificationType {
  RENT_GENERATED = 'Rent Generated',
  PAYMENT_DUE = 'Payment Due',
  PAYMENT_OVERDUE = 'Payment Overdue',
  PAYMENT_RECEIVED = 'Payment Received',
  LATE_FEE_APPLIED = 'Late Fee Applied',
  GENERAL = 'General',
}

export enum NotificationPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent',
}
