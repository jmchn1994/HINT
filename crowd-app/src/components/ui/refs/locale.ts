export const LOCALE_WEEK_TIME = {
  weekday: 'short',
  year: undefined,
  month: undefined,
  day: undefined,
  hour: 'numeric',
  minute: 'numeric',
  hour12: true,
  second: undefined,
  timeZoneName: undefined,
};

export const LOCALE_SHORT_DATE = {
  weekday: 'short',
  year: undefined,
  month: 'numeric',
  day: 'numeric',
  hour: undefined,
  minute: undefined,
  hour12: undefined,
  second: undefined,
  timeZoneName: undefined,
};

export const LOCALE_LONG_TIME = {
  weekday: 'short',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hour12: true,
  second: undefined,
  timeZoneName: undefined,
};

export const LOCALE_WEEK_START = 0;

export const getLocalWeek = (date:Date):Date => {
  const offsetDays = (date.getDay() - LOCALE_WEEK_START) % 7;
  return new Date(date.getFullYear(),
    date.getMonth(),
    date.getDate() - offsetDays,
    0, 0, 0, 0);
};

export const isSameWeek = (ref:Date, alt:Date):boolean => {
  return getLocalWeek(ref).getTime() === getLocalWeek(alt).getTime();
};
