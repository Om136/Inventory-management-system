const { getPrisma } = require("db");

function prisma() {
  return getPrisma();
}

module.exports = { prisma };
