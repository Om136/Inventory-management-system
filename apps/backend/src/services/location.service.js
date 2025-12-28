const { prisma } = require("../utils/prisma");

async function createLocation({ name }) {
  const db = prisma();
  return db.location.create({
    data: { name },
  });
}

async function listLocations() {
  const db = prisma();
  return db.location.findMany({ orderBy: { id: "asc" } });
}

module.exports = {
  createLocation,
  listLocations,
};
