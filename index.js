require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("./generated/prisma");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { auth } = require("./middleware/auth");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  const users = await prisma.user.count();
  const clients = await prisma.client.count();
  res.json({ ok: true, users, clients });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "username and password required" });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

app.post("/api/clients", auth, async (req, res) => {
  const { fullName, phone, course, status, paymentStatus } = req.body;

  if (!fullName || !phone || !course) {
    return res
      .status(400)
      .json({ message: "fullName, phone, course required" });
  }

  const client = await prisma.client.create({
    data: {
      fullName,
      phone,
      course,
      status: status || "active",
      paymentStatus: paymentStatus || "unpaid",
    },
  });

  res.status(201).json(client);
});

app.get("/api/clients", auth, async (req, res) => {
  const {
    q = "",
    status,
    paymentStatus,
    page = "1",
    limit = "10",
    sort = "createdAt", // createdAt | fullName
    order = "desc", // asc | desc
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10), 1);
  const take = Math.min(Math.max(parseInt(limit, 10), 1), 50);
  const skip = (pageNum - 1) * take;

  const where = {
    AND: [
      q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
      status ? { status } : {},
      paymentStatus ? { paymentStatus } : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { [sort]: order },
      skip,
      take,
    }),
    prisma.client.count({ where }),
  ]);

  res.json({
    items,
    total,
    page: pageNum,
    limit: take,
    pages: Math.ceil(total / take),
  });
});

app.put("/api/clients/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  const { fullName, phone, course, status, paymentStatus } = req.body;

  try {
    const updated = await prisma.client.update({
      where: { id },
      data: { fullName, phone, course, status, paymentStatus },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ message: "Client not found" });
  }
});

app.delete("/api/clients/:id", auth, async (req, res) => {
  const id = Number(req.params.id);

  try {
    await prisma.client.delete({ where: { id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ message: "Client not found" });
  }
});

app.get("/api/stats/overview", auth, async (req, res) => {
  const [total, paid, unpaid, active] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { paymentStatus: "paid" } }),
    prisma.client.count({ where: { paymentStatus: "unpaid" } }),
    prisma.client.count({ where: { status: "active" } }),
  ]);

  res.json({ total, paid, unpaid, active });
});

app.listen(process.env.PORT || 4000, () => {
  console.log("✅ Server running on port", process.env.PORT || 4000);
});
