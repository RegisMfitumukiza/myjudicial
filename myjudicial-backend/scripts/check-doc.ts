import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const doc = await prisma.document.findFirst({
    where: { objectKey: "experts/f069faa7-7e1f-4ca7-8fdb-fbd166799bfd/certificates/2c7b96fc-8752-46e5-851d-28d600229190.enc" }
  });
  console.log("Document:", doc);
}
main().finally(() => prisma.$disconnect());
