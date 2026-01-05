-- CreateTable
CREATE TABLE "ViewedArsipedia" (
    "userId" TEXT NOT NULL,
    "arsipediaId" TEXT NOT NULL,
    "viewedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ViewedArsipedia_pkey" PRIMARY KEY ("userId","arsipediaId")
);

-- CreateTable
CREATE TABLE "ViewedArsitek" (
    "userId" TEXT NOT NULL,
    "architectId" TEXT NOT NULL,
    "viewedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ViewedArsitek_pkey" PRIMARY KEY ("userId","architectId")
);

-- CreateIndex
CREATE INDEX "ViewedArsipedia_arsipediaId_idx" ON "ViewedArsipedia"("arsipediaId");

-- CreateIndex
CREATE INDEX "ViewedArsitek_architectId_idx" ON "ViewedArsitek"("architectId");

-- AddForeignKey
ALTER TABLE "ViewedArsipedia" ADD CONSTRAINT "ViewedArsipedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewedArsipedia" ADD CONSTRAINT "ViewedArsipedia_arsipediaId_fkey" FOREIGN KEY ("arsipediaId") REFERENCES "arsipedia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewedArsitek" ADD CONSTRAINT "ViewedArsitek_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewedArsitek" ADD CONSTRAINT "ViewedArsitek_architectId_fkey" FOREIGN KEY ("architectId") REFERENCES "architects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arsipedia" ADD CONSTRAINT "arsipedia_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
