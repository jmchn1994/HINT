export const BASE_PAY = 0.5;
export const PER_TASK_PAY = 0.5;
export const PER_TASK_BONUS = 0.5;
export const FINAL_BONUS = 1.5;

export const getTotalPay = (tasks:number) => {
  return BASE_PAY + (PER_TASK_PAY + PER_TASK_BONUS) * tasks + FINAL_BONUS;
}
