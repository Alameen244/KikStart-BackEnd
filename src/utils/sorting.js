export const safeTimestamp = (date) => {
  const time = new Date(date).getTime();
  return Number.isNaN(time) ? 0 : time;
};

// `newestFirst = true` keeps the latest items on top, which is usually best for UI.
// `newestFirst = false` keeps the oldest items on top.


export const sortByCreatedAt = (items = [], newestFirst = true) => {
  return [...items].sort((a, b) => {
    const timeA = safeTimestamp(a.createdAt);
    const timeB = safeTimestamp(b.createdAt);

    return newestFirst ? timeB - timeA : timeA - timeB;
  });
};

export const sortByOrderAndCreatedAt = (items = [], newestFirst = true) => {
  return [...items].sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);

    if (orderDiff !== 0) {
      return orderDiff;
    }

    const timeA = safeTimestamp(a.createdAt);
    const timeB = safeTimestamp(b.createdAt);

    return newestFirst ? timeB - timeA : timeA - timeB;
  });
};
