export const ensureSingleActive = async (Model, currentId = null) => {
  const query = { isActive: true };
  if (currentId) query._id = { $ne: currentId };
  await Model.updateMany(query, { $set: { isActive: false } });
};
