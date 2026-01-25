require("dotenv").config();
const bcrypt = require("bcrypt");
const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const password = "admin123";

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) {
    console.log("Admin already exists:", username);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { username, passwordHash, role: "admin" },
  });

  console.log("✅ Admin created");
  console.log("username:", username);
  console.log("password:", password);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
