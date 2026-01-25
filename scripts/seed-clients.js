require("dotenv").config()
const { PrismaClient } = require("../generated/prisma")

const prisma = new PrismaClient()

const firstNames = [
  "Jahongir","Sardor","Aziz","Bekzod","Jasur","Farrux","Shoxrux","Asadbek","Oybek","Diyor",
  "Madina","Dilnoza","Sevara","Mohira","Malika","Zuhra","Nigora","Shahnoza","Gulnoza","Munisa"
]
const lastNames = [
  "Abdullayev","Karimov","Tursunov","Ergashev","Rasulov","Sodiqov","Ismoilov","Yo‘ldoshev","Qodirov","Rahmonov",
  "Norboyeva","Xolmatova","Toshpulatova","Eshonqulova","Yusupova","Hamidova","Ruzmetova","To‘xtayeva","Shukurova","Qo‘chqorova"
]

const courses = [
  "Frontend (React)","Backend (Node.js)","Python (FastAPI)","UI/UX Design","SMM","Ingliz tili",
  "Rus tili","Matematika","Grafik dizayn","IELTS Prep","QA Manual","Kompyuter savodxonligi"
]

const notes = [
  "Telegramdan yozgan, demo so‘radi",
  "Do‘stining tavsiyasi bilan keldi",
  "Kechki guruhga qiziqyapti",
  "2 oyda natija qilishni xohlaydi",
  "Imtihonga tayyorlanadi",
  "Chegirma so‘radi 🙂",
  "Trial darsga yozildi",
  "Faqat weekend guruh kerak dedi",
  "Online format bo‘lsa yaxshi dedi",
  "Namangandan, masofadan o‘qimoqchi"
]

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function phoneUZ() {
  const codes = ["90","91","93","94","95","97","98","99","88","33"]
  const code = rand(codes)
  const n = () => Math.floor(Math.random() * 10)
  return `+998${code}${n()}${n()}${n()}${n()}${n()}${n()}${n()}`
}

async function main() {
  const COUNT = Number(process.argv[2] || 80)

  // clients’ni tozalash (xohlamasang kommentga ol)
  await prisma.client.deleteMany()

  const data = Array.from({ length: COUNT }).map(() => {
    const fullName = `${rand(firstNames)} ${rand(lastNames)}`
    const status = Math.random() < 0.85 ? "active" : "inactive"
    const paymentStatus = Math.random() < 0.55 ? "paid" : "unpaid"

    // so‘nggi 120 kun ichida random sana
    const daysAgo = Math.floor(Math.random() * 120)
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

    return {
      fullName,
      phone: phoneUZ(),
      course: rand(courses),
      status,
      paymentStatus,
      createdAt,
      // agar schema’da note yo‘q bo‘lsa, pastdagini qo‘shmaysan
      // note: rand(notes),
    }
  })

  await prisma.client.createMany({ data })
  console.log(`✅ Seed done: ${COUNT} clients inserted`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
